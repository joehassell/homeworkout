import SwiftUI

struct ActiveWorkoutView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    var body: some View {
        VStack(spacing: 6) {
            // Phase + progress
            HStack {
                Text(phaseLabel)
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .textCase(.uppercase)
                    .foregroundStyle(phaseColor)

                Spacer()

                if manager.exerciseCount > 0 {
                    Text("\(manager.exerciseIndex + 1)/\(manager.exerciseCount)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                if !manager.isPhoneReachable {
                    Image(systemName: "iphone.slash")
                        .font(.caption2)
                        .foregroundStyle(.red)
                }
            }

            // Exercise name
            Text(manager.exerciseName)
                .font(.system(.title3, design: .rounded))
                .fontWeight(.bold)
                .lineLimit(2)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Countdown timer
            Text(formatTime(manager.remaining))
                .font(.system(size: 42, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(phaseColor)
                .frame(maxWidth: .infinity)

            // Heart rate + calories
            if manager.heartRate > 0 {
                HeartRateView(bpm: manager.heartRate)
                HStack(spacing: 12) {
                    if manager.activeCalories > 0 {
                        Label("\(Int(manager.activeCalories)) kcal", systemImage: "flame.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(.orange)
                    }
                    if manager.avgHeartRate > 0 {
                        Text("avg \(Int(manager.avgHeartRate))")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                    }
                    if manager.peakHeartRate > 0 {
                        Text("peak \(Int(manager.peakHeartRate))")
                            .font(.system(size: 11))
                            .foregroundStyle(.red.opacity(0.7))
                    }
                }
            }

            // Next exercise
            if !manager.nextExerciseName.isEmpty {
                HStack(spacing: 4) {
                    Text("Next:")
                        .foregroundStyle(.secondary)
                    Text(manager.nextExerciseName)
                        .lineLimit(1)
                }
                .font(.caption)
            }

            Spacer(minLength: 0)

            // Music mini-player (only when music is playing)
            if !manager.musicTitle.isEmpty {
                WatchMusicView()
            }

            // Controls
            WorkoutControlsView()
        }
        .padding(.horizontal, 4)
    }

    private var phaseLabel: String {
        switch manager.phase {
        case "work": return "Working"
        case "rest": return "Rest"
        case "warmup": return "Warm-up"
        case "cooldown": return "Cooldown"
        default: return manager.phase
        }
    }

    private var phaseColor: Color {
        switch manager.phase {
        case "work": return .green
        case "rest": return .blue
        case "warmup": return .orange
        case "cooldown": return .purple
        default: return .white
        }
    }

    private func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}
