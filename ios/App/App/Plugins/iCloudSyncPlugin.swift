import Foundation
import Capacitor

@objc(iCloudSyncPlugin)
public class iCloudSyncPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "iCloudSyncPlugin"
    public let jsName = "iCloudSyncPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "syncToCloud", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadFromCloud", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncAllToCloud", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadAllFromCloud", returnType: CAPPluginReturnPromise),
    ]

    private let store = NSUbiquitousKeyValueStore.default

    public override func load() {
        super.load()

        // Sync with iCloud on launch
        store.synchronize()

        // Listen for remote changes from other devices
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(cloudStoreDidChange(_:)),
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: store
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - Plugin Methods

    @objc func syncToCloud(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing key")
            return
        }
        guard let value = call.getString("value") else {
            call.reject("Missing value")
            return
        }

        store.set(value, forKey: key)
        store.synchronize()
        call.resolve(["success": true])
    }

    @objc func loadFromCloud(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing key")
            return
        }

        store.synchronize()
        let value = store.string(forKey: key)
        call.resolve([
            "key": key,
            "value": value as Any,
            "found": value != nil,
        ])
    }

    @objc func syncAllToCloud(_ call: CAPPluginCall) {
        guard let pairs = call.getArray("pairs") as? [[String: String]] else {
            call.reject("Missing or invalid pairs array")
            return
        }

        for pair in pairs {
            guard let key = pair["key"], let value = pair["value"] else { continue }
            store.set(value, forKey: key)
        }
        store.synchronize()
        call.resolve(["success": true, "count": pairs.count])
    }

    @objc func loadAllFromCloud(_ call: CAPPluginCall) {
        guard let keys = call.getArray("keys", String.self) else {
            call.reject("Missing or invalid keys array")
            return
        }

        store.synchronize()

        var results: [[String: Any]] = []
        for key in keys {
            let value = store.string(forKey: key)
            results.append([
                "key": key,
                "value": value as Any,
            ])
        }

        call.resolve(["pairs": results])
    }

    // MARK: - Remote Change Notification

    @objc private func cloudStoreDidChange(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reason = userInfo[NSUbiquitousKeyValueStoreChangeReasonKey] as? Int else {
            return
        }

        // Only act on server changes or initial sync, not quota violations
        guard reason == NSUbiquitousKeyValueStoreServerChange ||
              reason == NSUbiquitousKeyValueStoreInitialSyncChange else {
            return
        }

        guard let changedKeys = userInfo[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String] else {
            return
        }

        for key in changedKeys {
            let value = store.string(forKey: key)
            notifyListeners("cloudSync", data: [
                "key": key,
                "value": value as Any,
            ])
        }
    }
}
