import Foundation
import Capacitor
import WatchConnectivity

@objc(WatchConnectivityPlugin)
public class WatchConnectivityPlugin: CAPPlugin, CAPBridgedPlugin, WCSessionDelegate {
    public let identifier = "WatchConnectivityPlugin"
    public let jsName = "WatchConnectivityPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isWatchAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendWorkoutState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendCommand", returnType: CAPPluginReturnPromise),
    ]

    private var session: WCSession?

    public override func load() {
        super.load()
        activateSession()
    }

    func activateSession() {
        guard WCSession.isSupported() else { return }
        session = WCSession.default
        session?.delegate = self
        session?.activate()
    }

    // MARK: - Plugin Methods

    @objc func isWatchAvailable(_ call: CAPPluginCall) {
        guard WCSession.isSupported(), let s = session else {
            call.resolve(["supported": false, "paired": false, "reachable": false, "installed": false])
            return
        }
        call.resolve([
            "supported": true,
            "paired": s.isPaired,
            "reachable": s.isReachable,
            "installed": s.isWatchAppInstalled,
        ])
    }

    @objc func sendWorkoutState(_ call: CAPPluginCall) {
        guard let s = session, s.activationState == .activated else {
            call.resolve(["sent": false])
            return
        }

        var state: [String: Any] = [:]
        if let v = call.getString("exerciseName") { state["exerciseName"] = v }
        if let v = call.getString("phase") { state["phase"] = v }
        if let v = call.getInt("remaining") { state["remaining"] = v }
        if let v = call.getString("section") { state["section"] = v }
        if let v = call.getString("nextExerciseName") { state["nextExerciseName"] = v }
        if let v = call.getInt("exerciseIndex") { state["exerciseIndex"] = v }
        if let v = call.getInt("exerciseCount") { state["exerciseCount"] = v }
        if let v = call.getInt("totalRemaining") { state["totalRemaining"] = v }
        if let v = call.getBool("isPaused") { state["isPaused"] = v }
        if let v = call.getString("workoutType") { state["workoutType"] = v }
        state["timestamp"] = Date().timeIntervalSince1970

        // Use applicationContext — latest-value-wins, works in background
        do {
            try s.updateApplicationContext(state)
            call.resolve(["sent": true])
        } catch {
            NSLog("WatchConnectivity: failed to update context: \(error.localizedDescription)")
            call.resolve(["sent": false])
        }
    }

    @objc func sendCommand(_ call: CAPPluginCall) {
        guard let s = session, s.isReachable else {
            call.resolve(["sent": false, "reason": "not reachable"])
            return
        }

        var command: [String: Any] = ["type": call.getString("type") ?? "unknown"]
        if let data = call.getObject("data") {
            for (k, v) in data { command[k] = v }
        }

        s.sendMessage(command, replyHandler: { reply in
            call.resolve(["sent": true, "reply": reply])
        }, errorHandler: { error in
            NSLog("WatchConnectivity: sendMessage error: \(error.localizedDescription)")
            // Fall back to transferUserInfo for reliability
            s.transferUserInfo(command)
            call.resolve(["sent": true, "fallback": "transferUserInfo"])
        })
    }

    // MARK: - WCSessionDelegate

    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            NSLog("WatchConnectivity: activation failed: \(error.localizedDescription)")
        }
    }

    public func sessionDidBecomeInactive(_ session: WCSession) {}

    public func sessionDidDeactivate(_ session: WCSession) {
        // Re-activate after handoff
        session.activate()
    }

    public func sessionReachabilityDidChange(_ session: WCSession) {
        notifyListeners("watchReachability", data: [
            "reachable": session.isReachable,
        ])
    }

    public func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleIncomingMessage(message)
    }

    public func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        handleIncomingMessage(message)
        replyHandler(["received": true])
    }

    public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        handleIncomingMessage(userInfo)
    }

    private func handleIncomingMessage(_ message: [String: Any]) {
        guard let type = message["type"] as? String else { return }

        switch type {
        case "heartRate":
            let bpm = message["bpm"] as? Double ?? 0
            let timestamp = message["timestamp"] as? Double ?? Date().timeIntervalSince1970
            notifyListeners("watchHeartRate", data: [
                "bpm": bpm,
                "timestamp": timestamp,
            ])

        case "control":
            let action = message["action"] as? String ?? ""
            notifyListeners("watchControl", data: [
                "action": action,
            ])

        case "workoutSessionStarted":
            // Tell HealthKit plugin the watch owns this session
            notifyListeners("watchSessionOwnership", data: [
                "watchOwns": true,
            ])
            // Set on main thread to avoid data race with plugin calls
            DispatchQueue.main.async {
                if let hkPlugin = self.bridge?.plugin(withName: "HealthKitPlugin") as? HealthKitPlugin {
                    hkPlugin.watchOwnsSession = true
                }
            }

        case "workoutSessionEnded":
            notifyListeners("watchSessionOwnership", data: [
                "watchOwns": false,
            ])
            DispatchQueue.main.async {
                if let hkPlugin = self.bridge?.plugin(withName: "HealthKitPlugin") as? HealthKitPlugin {
                    hkPlugin.watchOwnsSession = false
                }
            }

        default:
            notifyListeners("watchMessage", data: message as? [String: JSValue] ?? [:])
        }
    }
}
