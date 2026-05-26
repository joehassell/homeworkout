import Foundation
import HealthKit
import WatchConnectivity
import WatchKit
import Combine

@MainActor
class WorkoutSessionManager: NSObject, ObservableObject {
    // MARK: - Published UI State

    @Published var isActive = false
    @Published var exerciseName = ""
    @Published var phase = "work"
    @Published var remaining = 0
    @Published var section = "main"
    @Published var nextExerciseName = ""
    @Published var exerciseIndex = 0
    @Published var exerciseCount = 0
    @Published var totalRemaining = 0
    @Published var isPaused = false
    @Published var heartRate: Double = 0
    @Published var peakHeartRate: Double = 0
    @Published var avgHeartRate: Double = 0
    @Published var activeCalories: Double = 0
    @Published var isPhoneReachable = false
    @Published var workoutType = ""

    // Music state (forwarded from phone)
    @Published var musicTitle = ""
    @Published var musicArtist = ""
    @Published var musicIsPlaying = false

    // Work/rest durations (sent from phone)
    @Published var workSec: Int = 0
    @Published var restSec: Int = 0

    // Heart rate zone tracking
    @Published var currentZone: Int = 0  // 1-5
    @Published var timeInCurrentZone: Int = 0  // seconds
    @Published var zoneHistory: [Int: Int] = [1: 0, 2: 0, 3: 0, 4: 0, 5: 0]

    // MARK: - Internal

    private let healthStore = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var localTimer: Timer?
    private var zoneTimer: Timer?
    private var lastSyncTimestamp: Date?

    // MARK: - Init

    override init() {
        super.init()
        activateWCSession()
    }

    private func activateWCSession() {
        guard WCSession.isSupported() else { return }
        let s = WCSession.default
        s.delegate = self
        s.activate()
    }

    // MARK: - HealthKit Workout Session

    private func startHealthKitSession() {
        guard HKHealthStore.isHealthDataAvailable() else { return }

        let config = HKWorkoutConfiguration()
        config.activityType = mapWorkoutType(workoutType)
        config.locationType = .indoor

        do {
            session = try HKWorkoutSession(healthStore: healthStore, configuration: config)
            builder = session?.associatedWorkoutBuilder()
            builder?.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: config)

            session?.delegate = self
            builder?.delegate = self

            let startDate = Date()
            session?.startActivity(with: startDate)
            builder?.beginCollection(withStart: startDate) { success, error in
                if let error = error {
                    NSLog("Watch: beginCollection error: \(error.localizedDescription)")
                }
            }

            startZoneTimer()

            // Notify phone that watch owns the HK session
            sendToPhone(["type": "workoutSessionStarted"])
        } catch {
            NSLog("Watch: failed to start HK session: \(error.localizedDescription)")
        }
    }

    private func endHealthKitSession() {
        guard let session = session, let builder = builder else { return }

        session.end()
        let localBuilder = builder
        localBuilder.endCollection(withEnd: Date()) { success, error in
            if success {
                localBuilder.finishWorkout { workout, error in
                    if let error = error {
                        NSLog("Watch: finishWorkout error: \(error.localizedDescription)")
                    }
                }
            }
        }

        stopZoneTimer()

        // Notify phone
        sendToPhone(["type": "workoutSessionEnded"])
        // Nil out after capturing builder in closure above
        self.session = nil
        self.builder = nil
    }

    // MARK: - Local Countdown Fallback

    private func startLocalCountdown() {
        stopLocalCountdown()
        localTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self = self, self.isActive, !self.isPaused else { return }
                if self.remaining > 0 {
                    self.remaining -= 1
                }
                if self.totalRemaining > 0 {
                    self.totalRemaining -= 1
                }
            }
        }
    }

    private func stopLocalCountdown() {
        localTimer?.invalidate()
        localTimer = nil
    }

    // MARK: - Phone Communication

    private func sendToPhone(_ message: [String: Any]) {
        guard WCSession.isSupported(),
              WCSession.default.activationState == .activated else { return }
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(message, replyHandler: nil) { error in
                NSLog("Watch: sendMessage error: \(error.localizedDescription)")
                // Fallback to queued delivery
                WCSession.default.transferUserInfo(message)
            }
        } else {
            // Queue via transferUserInfo for reliable delivery
            WCSession.default.transferUserInfo(message)
        }
    }

    func sendMusicControl(_ action: String) {
        sendToPhone(["type": "musicControl", "action": action])
        // Optimistic UI
        if action == "pause" { musicIsPlaying = false }
        if action == "play" { musicIsPlaying = true }
    }

    func sendControl(_ action: String) {
        sendToPhone(["type": "control", "action": action])

        // Optimistic UI update
        switch action {
        case "pause":
            isPaused = true
        case "resume":
            isPaused = false
        case "end":
            // End locally now so the UI returns to idle even if the phone is
            // unreachable or doesn't ack. The phone will independently call
            // finishWorkout() and may re-send workoutEnd (idempotent here).
            endHealthKitSession()
            stopLocalCountdown()
            isActive = false
            fireHaptic(for: "done")
        default:
            break
        }
    }

    // MARK: - Haptics

    private func fireHaptic(for cue: String) {
        let device = WKInterfaceDevice.current()
        switch cue {
        case "countdown":
            device.play(.click)
        case "phaseChange":
            device.play(.notification)
        case "switchSides":
            device.play(.directionUp)
        case "done":
            device.play(.success)
        default:
            device.play(.click)
        }
    }

    // MARK: - Heart Rate Zone Tracking

    private func computeZone(bpm: Double) -> Int {
        // Estimated max HR = 220 - age (default 30 → 190)
        let maxHR = 190.0
        let pct = bpm / maxHR
        if pct < 0.50 { return 0 }       // Below zone 1
        else if pct < 0.60 { return 1 }  // Z1: 50-60% Rest
        else if pct < 0.70 { return 2 }  // Z2: 60-70% Fat Burn
        else if pct < 0.80 { return 3 }  // Z3: 70-80% Cardio
        else if pct < 0.90 { return 4 }  // Z4: 80-90% Tempo
        else { return 5 }                 // Z5: 90-100% Peak
    }

    private func updateZone() {
        let zone = computeZone(bpm: heartRate)
        if zone != currentZone {
            currentZone = zone
            timeInCurrentZone = 0
        } else {
            timeInCurrentZone += 1
        }
        if zone > 0 {
            zoneHistory[zone, default: 0] += 1
        }
    }

    private func startZoneTimer() {
        stopZoneTimer()
        zoneTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self = self, self.isActive else { return }
                self.updateZone()
            }
        }
    }

    private func stopZoneTimer() {
        zoneTimer?.invalidate()
        zoneTimer = nil
    }

    // MARK: - Helpers

    private func mapWorkoutType(_ type: String) -> HKWorkoutActivityType {
        switch type {
        case "strength": return .traditionalStrengthTraining
        case "hiit": return .highIntensityIntervalTraining
        case "conditioning": return .crossTraining
        case "functional": return .functionalStrengthTraining
        case "isohiit": return .highIntensityIntervalTraining
        default: return .functionalStrengthTraining
        }
    }

    private var lastAppliedTimestamp: Double = 0

    private func applyState(_ state: [String: Any]) {
        // Reject stale updates (timestamp must be newer)
        if let ts = state["timestamp"] as? Double, ts <= lastAppliedTimestamp {
            return
        }
        if let ts = state["timestamp"] as? Double { lastAppliedTimestamp = ts }

        if let v = state["exerciseName"] as? String { exerciseName = v }
        if let v = state["phase"] as? String {
            let oldPhase = phase
            phase = v
            if v != oldPhase { fireHaptic(for: "phaseChange") }
        }
        if let v = state["remaining"] as? Int { remaining = v }
        if let v = state["section"] as? String { section = v }
        if let v = state["nextExerciseName"] as? String { nextExerciseName = v }
        if let v = state["exerciseIndex"] as? Int { exerciseIndex = v }
        if let v = state["exerciseCount"] as? Int { exerciseCount = v }
        if let v = state["totalRemaining"] as? Int { totalRemaining = v }
        if let v = state["isPaused"] as? Bool { isPaused = v }
        if let v = state["workoutType"] as? String { workoutType = v }
        if let v = state["workSec"] as? Int { workSec = v }
        if let v = state["restSec"] as? Int { restSec = v }

        // Music state (if included)
        if let v = state["musicTitle"] as? String { musicTitle = v }
        if let v = state["musicArtist"] as? String { musicArtist = v }
        if let v = state["musicIsPlaying"] as? Bool { musicIsPlaying = v }

        lastSyncTimestamp = Date()

        // If we were using local countdown, re-sync
        if localTimer != nil {
            stopLocalCountdown()
        }
    }
}

// MARK: - WCSessionDelegate

extension WorkoutSessionManager: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            NSLog("Watch WC: activation error: \(error.localizedDescription)")
        }
        Task { @MainActor in
            self.isPhoneReachable = session.isReachable
        }
    }

    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        Task { @MainActor in
            self.isPhoneReachable = session.isReachable
            if !session.isReachable && self.isActive {
                self.startLocalCountdown()
            }
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        Task { @MainActor in
            self.applyState(applicationContext)
            if !self.isActive && applicationContext["exerciseName"] != nil {
                self.isActive = true
                self.startHealthKitSession()
            }
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleMessage(message)
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        handleMessage(message)
        replyHandler(["received": true])
    }

    nonisolated func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        handleMessage(userInfo)
    }

    private nonisolated func handleMessage(_ message: [String: Any]) {
        guard let type = message["type"] as? String else { return }

        Task { @MainActor in
            switch type {
            case "workoutStart":
                self.isActive = true
                if let wt = message["workoutType"] as? String { self.workoutType = wt }
                self.applyState(message)
                self.startHealthKitSession()

            case "workoutEnd":
                self.isActive = false
                self.endHealthKitSession()
                self.stopLocalCountdown()
                self.fireHaptic(for: "done")

            case "hapticCue":
                let style = message["style"] as? String ?? "click"
                self.fireHaptic(for: style)

            case "stateUpdate":
                self.applyState(message)
                if !self.isActive && message["exerciseName"] != nil {
                    self.isActive = true
                    self.startHealthKitSession()
                }

            case "musicUpdate":
                if let t = message["title"] as? String { self.musicTitle = t }
                if let a = message["artist"] as? String { self.musicArtist = a }
                if let p = message["isPlaying"] as? Bool { self.musicIsPlaying = p }

            default:
                break
            }
        }
    }
}

// MARK: - HKWorkoutSessionDelegate

extension WorkoutSessionManager: HKWorkoutSessionDelegate {
    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        NSLog("Watch HK session state: \(fromState.rawValue) -> \(toState.rawValue)")
    }

    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        NSLog("Watch HK session error: \(error.localizedDescription)")
    }
}

// MARK: - HKLiveWorkoutBuilderDelegate

extension WorkoutSessionManager: HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    nonisolated func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        for type in collectedTypes {
            guard let quantityType = type as? HKQuantityType else { continue }

            if quantityType == HKQuantityType(.heartRate) {
                let stats = workoutBuilder.statistics(for: quantityType)
                guard let mostRecent = stats?.mostRecentQuantity() else { continue }

                let bpm = mostRecent.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                let peak = stats?.maximumQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: .minute())) ?? bpm
                let avg = stats?.averageQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: .minute())) ?? bpm

                Task { @MainActor in
                    self.heartRate = bpm
                    self.peakHeartRate = peak
                    self.avgHeartRate = avg
                }

                // Send HR to phone — sendMessage for low latency, applicationContext as
                // reliable fallback so the latest BPM survives reachability flapping or
                // brief watch-app suspension.
                let payload: [String: Any] = [
                    "type": "heartRate",
                    "bpm": bpm,
                    "timestamp": Date().timeIntervalSince1970,
                ]
                let wc = WCSession.default
                if wc.activationState == .activated {
                    if wc.isReachable {
                        wc.sendMessage(payload, replyHandler: nil) { _ in
                            // sendMessage failed — fall through to context update below
                            try? wc.updateApplicationContext([
                                "latestHeartRate": bpm,
                                "heartRateTimestamp": Date().timeIntervalSince1970,
                            ])
                        }
                    } else {
                        try? wc.updateApplicationContext([
                            "latestHeartRate": bpm,
                            "heartRateTimestamp": Date().timeIntervalSince1970,
                        ])
                    }
                }
            }

            if quantityType == HKQuantityType(.activeEnergyBurned) {
                let stats = workoutBuilder.statistics(for: quantityType)
                let cals = stats?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0

                Task { @MainActor in
                    self.activeCalories = cals
                }
            }
        }
    }
}
