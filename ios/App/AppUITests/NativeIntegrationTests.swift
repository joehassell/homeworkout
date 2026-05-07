import XCTest

/// Tests for native iOS integration: status bar, keyboard, haptics, speech.
/// These verify that Capacitor plugin calls don't crash and that native
/// UI elements respond correctly.
final class NativeIntegrationTests: XCTestCase {
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

    func testStatusBarIsPresent() throws {
        // The status bar should be visible (not hidden) on the setup screen
        let statusBar = app.statusBars.firstMatch
        XCTAssertTrue(statusBar.exists, "Status bar should be present")
    }

    func testKeyboardAppearsOnInput() throws {
        web.tapElement(withLabel: "Settings", timeout: 10)

        // Find a numeric input (height or weight)
        let textFields = app.webViews.textFields
        if textFields.firstMatch.waitForExistence(timeout: 5) {
            textFields.firstMatch.tap()
            // Keyboard should appear
            let keyboard = app.keyboards.firstMatch
            let keyboardAppeared = keyboard.waitForExistence(timeout: 3)
            XCTAssertTrue(keyboardAppeared, "Keyboard should appear when tapping an input field")

            // Dismiss keyboard by tapping outside
            app.webViews.firstMatch.tap()
            Thread.sleep(forTimeInterval: 0.5)
        }
    }

    func testWorkoutTimerDoesNotCrashWithSpeech() throws {
        // Generate and start a workout with voice enabled
        // Speech synthesis should fire without crashing

        web.tapElement(withLabel: "HIIT", timeout: 10)
        let generateExists = web.waitForText("Generate Workout", timeout: 5)
        guard generateExists else { return }

        web.tapElement(withLabel: "Generate Workout")
        let startExists = web.waitForText("Start", timeout: 8)
        guard startExists else { return }

        web.tapElement(withLabel: "Start")

        // Wait for timer
        _ = web.waitForText("WORK", timeout: 5)

        // Give the speech plugin time to fire
        Thread.sleep(forTimeInterval: 3)

        // App should still be running
        XCTAssertTrue(app.state == .runningForeground,
                      "App should not crash with speech synthesis active")
    }

    func testAppSurvivesBackgrounding() throws {
        // Background and foreground the app
        XCUIDevice.shared.press(.home)
        Thread.sleep(forTimeInterval: 2)
        app.activate()
        Thread.sleep(forTimeInterval: 1)

        XCTAssertTrue(app.state == .runningForeground,
                      "App should resume after backgrounding")

        // Web view should still be interactive
        web.waitForWebView(timeout: 10)
    }

    func testOrientationChangeDoesNotCrash() throws {
        // Rotate device
        XCUIDevice.shared.orientation = .landscapeLeft
        Thread.sleep(forTimeInterval: 1)

        XCTAssertTrue(app.state == .runningForeground,
                      "App should not crash on landscape rotation")

        // Rotate back
        XCUIDevice.shared.orientation = .portrait
        Thread.sleep(forTimeInterval: 1)

        XCTAssertTrue(app.state == .runningForeground,
                      "App should not crash on portrait rotation")
    }
}
