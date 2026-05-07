import XCTest

/// Tests that the app launches, WKWebView loads, and the Capacitor bridge initialises.
final class AppLaunchTests: XCTestCase {
    var app: XCUIApplication!
    var web: WebViewHelper!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
        web = WebViewHelper(app: app)
    }

    override func tearDownWithError() throws {
        app.terminate()
    }

    func testAppLaunchesWithoutCrash() throws {
        // If we get here, the app didn't crash on launch
        XCTAssertTrue(app.state == .runningForeground)
    }

    func testWebViewLoads() throws {
        web.waitForWebView(timeout: 15)
        XCTAssertTrue(app.webViews.firstMatch.exists, "WKWebView should exist")
    }

    func testSetupScreenIsInitialScreen() throws {
        web.waitForWebView()
        // The setup screen should have workout type pills visible
        // Look for common text that appears on the setup screen
        let hasContent = web.waitForText("Strength", timeout: 10)
            || web.waitForText("HIIT", timeout: 3)
            || web.waitForText("Generate Workout", timeout: 3)
        XCTAssertTrue(hasContent, "Setup screen content should be visible on launch")
    }

    func testBottomNavigationVisible() throws {
        web.waitForWebView()
        // Bottom nav items: Build, History, Library, Settings
        let hasBuild = web.elementExists(withLabel: "Build", timeout: 10)
        let hasHistory = web.elementExists(withLabel: "History")
        let hasLibrary = web.elementExists(withLabel: "Library")
        let hasSettings = web.elementExists(withLabel: "Settings")
        XCTAssertTrue(hasBuild || hasHistory || hasLibrary || hasSettings,
                      "At least one bottom nav item should be visible")
    }

    func testCanNavigateBetweenTabs() throws {
        web.waitForWebView()
        // Tap Settings
        if web.elementExists(withLabel: "Settings", timeout: 10) {
            web.tapElement(withLabel: "Settings")
            // Settings screen should show profile-related content
            let hasSettingsContent = web.waitForText("Profile", timeout: 5)
                || web.waitForText("Age", timeout: 3)
                || web.waitForText("Sound", timeout: 3)
            XCTAssertTrue(hasSettingsContent, "Settings screen should show settings content")
        }
    }
}
