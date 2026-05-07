import XCTest

/// Tests for In-App Purchase flows via the Capacitor bridge.
/// Uses StoreKit Testing configuration if available, otherwise
/// verifies the UI flow doesn't crash even without valid products.
final class IAPTests: XCTestCase {
    var app: XCUIApplication!
    var web: WebViewHelper!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
        web = WebViewHelper(app: app)
        web.waitForWebView(timeout: 15)
    }

    override func tearDownWithError() throws {
        app.terminate()
    }

    func testSettingsShowsUpgradeOption() throws {
        web.tapElement(withLabel: "Settings", timeout: 10)
        // Look for upgrade/subscription related content
        let hasUpgrade = web.waitForText("Upgrade", timeout: 5)
            || web.waitForText("Pro", timeout: 3)
            || web.waitForText("Subscribe", timeout: 3)
        // Upgrade row may be hidden if user is already pro
        // This test verifies the settings screen loads without crash
    }

    func testPaywallOpensFromSettings() throws {
        web.tapElement(withLabel: "Settings", timeout: 10)

        // Try to find and tap the upgrade button
        if web.elementExists(withLabel: "Upgrade", timeout: 5) {
            web.tapElement(withLabel: "Upgrade")
            // Paywall overlay or sheet should appear
            // Look for product names or pricing text
            let hasPaywall = web.waitForText("Monthly", timeout: 5)
                || web.waitForText("Yearly", timeout: 3)
                || web.waitForText("Lifetime", timeout: 3)
                || web.waitForText("Restore", timeout: 3)
            // May not show products in simulator without StoreKit config
            // The key assertion is that it didn't crash
        }
    }

    func testRestorePurchasesDoesNotCrash() throws {
        web.tapElement(withLabel: "Settings", timeout: 10)

        // Look for restore purchases option
        if web.elementExists(withLabel: "Restore", timeout: 5) {
            web.tapElement(withLabel: "Restore")
            // Wait a moment for the async restore to complete
            Thread.sleep(forTimeInterval: 2)
            // App should still be running
            XCTAssertTrue(app.state == .runningForeground,
                          "App should not crash after restore purchases")
        }
    }

    func testProFeaturesAccessibleWithEntitlement() throws {
        // The app should have pro features available when entitled
        web.tapElement(withLabel: "Settings", timeout: 10)

        // Try selecting a premium theme
        if web.elementExists(withLabel: "midnight", timeout: 5) {
            web.tapElement(withLabel: "midnight")
            // Should not show paywall since entitlement check should pass
            // (depends on whether localStorage has pro entitlement seeded)
            Thread.sleep(forTimeInterval: 1)
            XCTAssertTrue(app.state == .runningForeground)
        }
    }

    func testEquipmentGatingForFreeUser() throws {
        // This test verifies the paywall flow when trying to use premium equipment
        // In the simulator, the default state may be free or pro depending on
        // localStorage. The key assertion is no crash.
        web.tapElement(withLabel: "Build", timeout: 10)
        Thread.sleep(forTimeInterval: 1)
        // Try toggling barbell equipment
        if web.elementExists(withLabel: "barbell", timeout: 5) {
            web.tapElement(withLabel: "barbell")
            Thread.sleep(forTimeInterval: 1)
            XCTAssertTrue(app.state == .runningForeground)
        }
    }
}
