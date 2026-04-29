import Capacitor
import StoreKit
import CloudKit

/// StoreKit 2 In-App Purchase bridge for Capacitor.
/// Handles subscriptions (monthly, yearly) and non-consumables (lifetime, founders).
@objc(IAPPlugin)
public class IAPPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "IAPPlugin"
    public let jsName = "IAPPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getFoundersStatus", returnType: CAPPluginReturnPromise),
    ]

    // Product IDs
    private static let productIDs: Set<String> = [
        "com.nomaen.homeworkout.pro.monthly",
        "com.nomaen.homeworkout.pro.yearly",
        "com.nomaen.homeworkout.pro.lifetime",
        "com.nomaen.homeworkout.pro.lifetime.founders",
    ]

    // CloudKit container for founders counter
    private static let cloudContainer = CKContainer(identifier: "iCloud.com.nomaen.homeworkout")
    private static let foundersRecordID = CKRecord.ID(recordName: "foundersCounter", zoneID: .default)
    private static let foundersCap = 1000

    // Cache
    private var cachedProducts: [Product] = []
    private var transactionTask: Task<Void, Never>?

    // ── Lifecycle ────────────────────────────────────────

    public override func load() {
        super.load()
        // Start listening for transaction updates
        transactionTask = Task {
            for await result in Transaction.updates {
                if case .verified(let transaction) = result {
                    await transaction.finish()
                    await refreshEntitlementAndNotify()
                }
            }
        }
    }

    deinit {
        transactionTask?.cancel()
    }

    // ── getProducts ─────────────────────────────────────

    @objc func getProducts(_ call: CAPPluginCall) {
        Task {
            do {
                let products = try await Product.products(for: IAPPlugin.productIDs)
                self.cachedProducts = products

                let mapped = products.map { p -> [String: Any] in
                    var period = "lifetime"
                    if let sub = p.subscription {
                        switch sub.subscriptionPeriod.unit {
                        case .month: period = "monthly"
                        case .year: period = "yearly"
                        default: period = "other"
                        }
                    }
                    return [
                        "id": p.id,
                        "title": p.displayName,
                        "price": NSDecimalNumber(decimal: p.price).doubleValue,
                        "priceString": p.displayPrice,
                        "period": period,
                    ]
                }
                call.resolve(["products": mapped])
            } catch {
                NSLog("[IAP] getProducts error: %@", error.localizedDescription)
                call.resolve(["products": []])
            }
        }
    }

    // ── purchase ─────────────────────────────────────────

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }

        Task {
            // Find the product
            let product: Product
            if let cached = cachedProducts.first(where: { $0.id == productId }) {
                product = cached
            } else {
                // Fetch fresh
                let products = try? await Product.products(for: [productId])
                guard let found = products?.first else {
                    call.resolve(["success": false, "error": "Product not found"])
                    return
                }
                product = found
            }

            do {
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        // If founders purchase, increment CloudKit counter
                        if transaction.productID.contains("founders") {
                            await incrementFoundersCounter()
                        }
                        await refreshEntitlementAndNotify()
                        call.resolve([
                            "success": true,
                            "transactionId": String(transaction.id),
                            "productId": transaction.productID,
                        ])
                    case .unverified(_, let error):
                        call.resolve(["success": false, "error": "Verification failed: \(error.localizedDescription)"])
                    }
                case .userCancelled:
                    call.resolve(["success": false, "error": "cancelled"])
                case .pending:
                    call.resolve(["success": false, "error": "pending"])
                @unknown default:
                    call.resolve(["success": false, "error": "unknown"])
                }
            } catch {
                NSLog("[IAP] purchase error: %@", error.localizedDescription)
                call.resolve(["success": false, "error": error.localizedDescription])
            }
        }
    }

    // ── restore ──────────────────────────────────────────

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            var transactions: [[String: Any]] = []
            for await result in Transaction.currentEntitlements {
                if case .verified(let transaction) = result {
                    transactions.append([
                        "productId": transaction.productID,
                        "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate),
                    ])
                }
            }
            // Update entitlement
            await refreshEntitlementAndNotify()
            call.resolve(["transactions": transactions])
        }
    }

    // ── getEntitlement ────────────────────────────────────

    @objc func getEntitlement(_ call: CAPPluginCall) {
        Task {
            let ent = await computeEntitlement()
            call.resolve(ent)
        }
    }

    private func computeEntitlement() async -> [String: Any] {
        var tier = "free"
        var source: String? = nil
        var expiresAt: String? = nil
        var isFounder = false

        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }

            // Any valid entitlement = pro
            tier = "pro"

            if transaction.productID.contains("founders") {
                source = "lifetime"
                isFounder = true
                expiresAt = nil
                break // Founder supersedes everything
            } else if transaction.productID.contains("lifetime") {
                source = "lifetime"
                expiresAt = nil
            } else if transaction.productID.contains("yearly") {
                if source != "lifetime" {
                    source = "yearly"
                    if let expires = transaction.expirationDate {
                        expiresAt = ISO8601DateFormatter().string(from: expires)
                    }
                }
            } else if transaction.productID.contains("monthly") {
                if source == nil {
                    source = "monthly"
                    if let expires = transaction.expirationDate {
                        expiresAt = ISO8601DateFormatter().string(from: expires)
                    }
                }
            }
        }

        var result: [String: Any] = [
            "tier": tier,
            "isFounder": isFounder,
        ]
        if let s = source { result["source"] = s }
        if let e = expiresAt { result["expiresAt"] = e }
        return result
    }

    private func refreshEntitlementAndNotify() async {
        let ent = await computeEntitlement()
        notifyListeners("entitlementChanged", data: ent)
    }

    // ── Founders counter (CloudKit) ──────────────────────

    @objc func getFoundersStatus(_ call: CAPPluginCall) {
        Task {
            let status = await fetchFoundersStatus()
            call.resolve(status)
        }
    }

    private func fetchFoundersStatus() async -> [String: Any] {
        do {
            let db = IAPPlugin.cloudContainer.publicCloudDatabase
            let record = try await db.record(for: IAPPlugin.foundersRecordID)
            let count = record["count"] as? Int ?? 0
            let remaining = max(0, IAPPlugin.foundersCap - count)
            return ["remaining": remaining, "available": remaining > 0]
        } catch {
            NSLog("[IAP] CloudKit founders fetch failed: %@, allowing purchase", error.localizedDescription)
            // Fallback: allow purchase if CloudKit unavailable
            return ["remaining": IAPPlugin.foundersCap, "available": true]
        }
    }

    private func incrementFoundersCounter() async {
        let db = IAPPlugin.cloudContainer.publicCloudDatabase
        // Retry loop for optimistic locking — handles concurrent purchases
        for attempt in 1...3 {
            do {
                let record: CKRecord
                do {
                    record = try await db.record(for: IAPPlugin.foundersRecordID)
                } catch {
                    // Record doesn't exist yet — create it
                    let newRecord = CKRecord(recordType: "FoundersCounter", recordID: IAPPlugin.foundersRecordID)
                    newRecord["count"] = 1
                    _ = try await db.save(newRecord)
                    return
                }
                let current = record["count"] as? Int ?? 0
                record["count"] = current + 1
                // Use CKModifyRecordsOperation for optimistic locking
                let op = CKModifyRecordsOperation(recordsToSave: [record], recordIDsToDelete: nil)
                op.savePolicy = .changedKeys
                op.qualityOfService = .userInitiated
                return try await withCheckedThrowingContinuation { continuation in
                    op.modifyRecordsResultBlock = { result in
                        switch result {
                        case .success:
                            continuation.resume()
                        case .failure(let error):
                            continuation.resume(throwing: error)
                        }
                    }
                    db.add(op)
                }
            } catch let error as CKError where error.code == .serverRecordChanged {
                // Conflict — another purchase incremented first. Retry with fresh record.
                NSLog("[IAP] CloudKit founders conflict on attempt %d, retrying", attempt)
                continue
            } catch {
                NSLog("[IAP] CloudKit founders increment failed: %@", error.localizedDescription)
                return
            }
        }
        NSLog("[IAP] CloudKit founders increment failed after 3 retries")
    }
}
