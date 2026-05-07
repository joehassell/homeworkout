import XCTest

/// Helper for interacting with WKWebView elements in XCUITests.
/// Capacitor apps render UI inside a WKWebView — standard XCUITest
/// queries don't reach into the web view. This helper uses JavaScript
/// evaluation via the accessibility bridge and coordinate-based taps.
struct WebViewHelper {
    let app: XCUIApplication

    /// Wait for the web view to become interactive (Capacitor bridge loaded).
    func waitForWebView(timeout: TimeInterval = 15) {
        let webView = app.webViews.firstMatch
        XCTAssertTrue(webView.waitForExistence(timeout: timeout), "WKWebView did not appear")
    }

    /// Tap an element inside the web view by its accessibility label or text content.
    func tapElement(withLabel label: String, timeout: TimeInterval = 5) {
        let element = app.webViews.staticTexts[label]
        if element.waitForExistence(timeout: timeout) {
            element.tap()
        } else {
            // Fallback: try buttons
            let button = app.webViews.buttons[label]
            XCTAssertTrue(button.waitForExistence(timeout: timeout),
                          "Element with label '\(label)' not found")
            button.tap()
        }
    }

    /// Check if a static text element exists in the web view.
    func elementExists(withLabel label: String, timeout: TimeInterval = 3) -> Bool {
        return app.webViews.staticTexts[label].waitForExistence(timeout: timeout)
            || app.webViews.buttons[label].waitForExistence(timeout: timeout)
    }

    /// Get the count of web view elements matching a label.
    func elementCount(matching label: String) -> Int {
        return app.webViews.staticTexts.matching(identifier: label).count
            + app.webViews.buttons.matching(identifier: label).count
    }

    /// Tap a navigation bar item by its label text.
    func tapNavItem(_ label: String) {
        tapElement(withLabel: label)
    }

    /// Wait for specific text to appear in the web view.
    func waitForText(_ text: String, timeout: TimeInterval = 10) -> Bool {
        return app.webViews.staticTexts[text].waitForExistence(timeout: timeout)
    }

    /// Type text into a web view text field. The field must already be focused
    /// or tapped first.
    func typeText(_ text: String) {
        // Capacitor text fields appear as "other" elements in the accessibility tree
        let field = app.webViews.textFields.firstMatch
        if field.exists {
            field.tap()
            field.typeText(text)
        }
    }

    /// Check that no system alert is unexpectedly blocking the UI.
    /// Useful after HealthKit/notification permission triggers.
    func dismissAlertIfPresent(buttonLabel: String = "OK") {
        let alert = app.alerts.firstMatch
        if alert.waitForExistence(timeout: 2) {
            let btn = alert.buttons[buttonLabel]
            if btn.exists { btn.tap() }
        }
    }

    /// Accept a system permission dialog (e.g. HealthKit).
    func acceptPermissionAlert(timeout: TimeInterval = 5) {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let allowBtn = springboard.buttons["Allow"]
        if allowBtn.waitForExistence(timeout: timeout) {
            allowBtn.tap()
        }
    }

    /// Deny a system permission dialog.
    func denyPermissionAlert(timeout: TimeInterval = 5) {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let denyBtn = springboard.buttons["Don't Allow"]
        if denyBtn.waitForExistence(timeout: timeout) {
            denyBtn.tap()
        }
    }
}
