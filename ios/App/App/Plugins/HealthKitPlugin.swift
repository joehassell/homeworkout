import Foundation
import Capacitor
import HealthKit
import ActivityKit

// MARK: - Live Activity Attributes

@available(iOS 16.2, *)
struct WorkoutActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var exerciseName: String
        var phase: String
        var remaining: Int
        var elapsed: Int
        var exerciseIndex: Int
        var exerciseCount: Int
        var countdownDate: Date
    }

    var workoutType: String
}

// MARK: - HealthKit Plugin

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthKitPlugin"
    public let jsName = "HealthKitPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startWorkout", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endWorkout", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "discardWorkout", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getBodyWeight", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDateOfBirth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateLiveActivity", returnType: CAPPluginReturnPromise),
    ]

    private let healthStore = HKHealthStore()
    private var activeSessionStart: Date?
    private var activeWorkoutType: HKWorkoutActivityType = .functionalStrengthTraining
    private var activeWorkoutTypeString: String = ""
    var watchOwnsSession = false

    // Live Activity (stored as Any to avoid availability issues at the property level)
    private var currentActivityRef: Any?

    // MARK: - MET values for calorie estimation

    private static let metValues: [String: Double] = [
        "strength": 5.0,
        "hiit": 8.0,
        "conditioning": 6.0,
        "functional": 5.0,
    ]

    // MARK: - Workout type mapping

    private func mapWorkoutType(_ type: String) -> HKWorkoutActivityType {
        switch type {
        case "strength": return .traditionalStrengthTraining
        case "hiit": return .highIntensityIntervalTraining
        case "conditioning": return .crossTraining
        case "functional": return .functionalStrengthTraining
        default: return .functionalStrengthTraining
        }
    }

    // MARK: - Plugin Methods

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["granted": false])
            return
        }

        let writeTypes: Set<HKSampleType> = [
            HKObjectType.workoutType(),
            HKQuantityType(.activeEnergyBurned),
        ]

        let readTypes: Set<HKObjectType> = [
            HKObjectType.workoutType(),
            HKQuantityType(.heartRate),
            HKQuantityType(.activeEnergyBurned),
            HKQuantityType(.bodyMass),
            HKCharacteristicType(.dateOfBirth),
        ]

        healthStore.requestAuthorization(toShare: writeTypes, read: readTypes) { success, error in
            if let error = error {
                NSLog("HealthKit authorization error: \(error.localizedDescription)")
            }
            call.resolve(["granted": success])
        }
    }

    @objc func startWorkout(_ call: CAPPluginCall) {
        guard let type = call.getString("type") else {
            call.reject("Missing workout type")
            return
        }

        activeWorkoutType = mapWorkoutType(type)
        activeWorkoutTypeString = type
        activeSessionStart = Date()
        watchOwnsSession = false

        // Start Live Activity (iOS 16.2+, Pro only)
        let isPro = call.getBool("isPro") ?? false
        if #available(iOS 16.2, *), isPro {
            startLiveActivity(
                workoutType: type,
                exerciseName: call.getString("exerciseName") ?? "",
                remaining: call.getInt("remaining") ?? 0,
                phase: call.getString("phase") ?? "warmup",
                exerciseIndex: call.getInt("exerciseIndex") ?? 0,
                exerciseCount: call.getInt("exerciseCount") ?? 0
            )
        }

        call.resolve(["sessionId": UUID().uuidString])
    }

    @objc func endWorkout(_ call: CAPPluginCall) {
        // End Live Activity
        if #available(iOS 16.2, *) {
            endLiveActivity()
        }

        guard let startDate = activeSessionStart else {
            call.resolve(["success": false, "reason": "no active session"])
            return
        }

        if watchOwnsSession {
            activeSessionStart = nil
            call.resolve(["success": true, "savedBy": "watch"])
            return
        }

        guard HKHealthStore.isHealthDataAvailable() else {
            activeSessionStart = nil
            call.resolve(["success": false, "reason": "HealthKit unavailable"])
            return
        }

        let endDate = Date()
        let duration = endDate.timeIntervalSince(startDate)

        // Calorie estimation: MET * weight_kg * duration_hours
        let weightKg = call.getDouble("weightKg") ?? 70.0
        let met = HealthKitPlugin.metValues[activeWorkoutTypeString] ?? 5.0
        let durationHours = duration / 3600.0
        let totalEnergy = met * weightKg * durationHours
        let energyBurned = HKQuantity(unit: .kilocalorie(), doubleValue: totalEnergy)

        let exerciseCount = call.getInt("exerciseCount") ?? 0

        var metadata: [String: Any] = [
            HKMetadataKeyIndoorWorkout: true,
            "SimpleWorkoutGenType": activeWorkoutTypeString,
        ]
        if exerciseCount > 0 {
            metadata["SimpleWorkoutGenExerciseCount"] = exerciseCount
        }

        let workout = HKWorkout(
            activityType: activeWorkoutType,
            start: startDate,
            end: endDate,
            duration: duration,
            totalEnergyBurned: energyBurned,
            totalDistance: nil,
            metadata: metadata
        )

        healthStore.save(workout) { success, error in
            if let error = error {
                NSLog("HealthKit save error: \(error.localizedDescription)")
            }
            DispatchQueue.main.async {
                self.activeSessionStart = nil
            }
            call.resolve(["success": success])
        }
    }

    @objc func discardWorkout(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            endLiveActivity()
        }
        activeSessionStart = nil
        call.resolve(["success": true])
    }

    @objc func getBodyWeight(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["available": false])
            return
        }

        let bodyMassType = HKQuantityType(.bodyMass)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(
            sampleType: bodyMassType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [sortDescriptor]
        ) { _, results, error in
            if let error = error {
                NSLog("HealthKit body weight query error: \(error.localizedDescription)")
                call.resolve(["available": false])
                return
            }

            guard let sample = results?.first as? HKQuantitySample else {
                call.resolve(["available": false])
                return
            }

            let kg = sample.quantity.doubleValue(for: .gramUnit(with: .kilo))
            call.resolve([
                "available": true,
                "weightKg": kg,
                "date": ISO8601DateFormatter().string(from: sample.startDate),
            ])
        }

        healthStore.execute(query)
    }

    @objc func getDateOfBirth(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["available": false])
            return
        }
        do {
            let dob = try healthStore.dateOfBirthComponents()
            let year = dob.year ?? 0
            let currentYear = Calendar.current.component(.year, from: Date())
            let age = currentYear - year
            call.resolve(["available": true, "age": age, "year": year])
        } catch {
            call.resolve(["available": false])
        }
    }

    // MARK: - Live Activity (iOS 16.1+)

    @available(iOS 16.2, *)
    private func startLiveActivity(
        workoutType: String,
        exerciseName: String,
        remaining: Int,
        phase: String,
        exerciseIndex: Int,
        exerciseCount: Int
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            NSLog("Live Activities not enabled")
            return
        }

        let attributes = WorkoutActivityAttributes(workoutType: workoutType)
        let state = WorkoutActivityAttributes.ContentState(
            exerciseName: exerciseName,
            phase: phase,
            remaining: remaining,
            elapsed: 0,
            exerciseIndex: exerciseIndex,
            exerciseCount: exerciseCount,
            countdownDate: Date().addingTimeInterval(TimeInterval(remaining))
        )

        do {
            let content = ActivityContent(state: state, staleDate: nil)
            let activity = try Activity.request(
                attributes: attributes,
                content: content,
                pushType: nil
            )
            currentActivityRef = activity
        } catch {
            NSLog("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }

    @objc func updateLiveActivity(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve(["updated": false])
            return
        }
        _updateLiveActivity(
            exerciseName: call.getString("exerciseName") ?? "",
            remaining: call.getInt("remaining") ?? 0,
            phase: call.getString("phase") ?? "work",
            elapsed: call.getInt("elapsed") ?? 0,
            exerciseIndex: call.getInt("exerciseIndex") ?? 0,
            exerciseCount: call.getInt("exerciseCount") ?? 0
        )
        call.resolve(["updated": true])
    }

    @available(iOS 16.2, *)
    private func _updateLiveActivity(
        exerciseName: String,
        remaining: Int,
        phase: String,
        elapsed: Int,
        exerciseIndex: Int,
        exerciseCount: Int
    ) {
        guard let activity = currentActivityRef as? Activity<WorkoutActivityAttributes> else { return }

        let state = WorkoutActivityAttributes.ContentState(
            exerciseName: exerciseName,
            phase: phase,
            remaining: remaining,
            elapsed: elapsed,
            exerciseIndex: exerciseIndex,
            exerciseCount: exerciseCount,
            countdownDate: Date().addingTimeInterval(TimeInterval(remaining))
        )

        Task {
            await activity.update(ActivityContent(state: state, staleDate: nil))
        }
    }

    @available(iOS 16.2, *)
    private func endLiveActivity() {
        guard let activity = currentActivityRef as? Activity<WorkoutActivityAttributes> else { return }

        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        currentActivityRef = nil
    }
}
