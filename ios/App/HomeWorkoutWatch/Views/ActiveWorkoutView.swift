import SwiftUI

struct ActiveWorkoutView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    var body: some View {
        TabView {
            WorkoutPageView()
            WatchMusicView()
            HeartRateZoneView()
        }
        .tabViewStyle(.page)
        .environmentObject(manager)
    }
}

// MARK: - Workout Page (Page 1)

struct WorkoutPageView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    private let zoneNames = ["", "Rest", "Fat Burn", "Cardio", "Tempo", "Peak"]
    private let zoneColors: [Color] = [.clear, .blue, .green, .yellow, .orange, .red]

    var body: some View {
        ScrollView {
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

                // Work/rest duration context
                if manager.workSec > 0 || manager.restSec > 0 {
                    Text("Work \(manager.workSec)s \u{2192} Rest \(manager.restSec)s")
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
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

                // Heart rate + zone pill + calories
                if manager.heartRate > 0 {
                    HeartRateView(bpm: manager.heartRate)

                    // Compact HR zone pill
                    if manager.currentZone > 0 && manager.currentZone <= 5 {
                        Text("Z\(manager.currentZone) \(zoneNames[manager.currentZone])")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(zoneColors[manager.currentZone].opacity(0.2))
                            .foregroundStyle(zoneColors[manager.currentZone])
                            .clipShape(Capsule())
                    }

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

                // Controls
                WorkoutControlsView()
            }
            .padding(.horizontal, 4)
        }
        .focusable()
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

// MARK: - Watch Music View (Page 2) — Apple Fitness Style

struct WatchMusicView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    var body: some View {
        VStack(spacing: 10) {
            Spacer(minLength: 4)

            // Album art placeholder (rounded square with gradient)
            RoundedRectangle(cornerRadius: 12)
                .fill(
                    LinearGradient(
                        colors: [.purple.opacity(0.6), .blue.opacity(0.4)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 80, height: 80)
                .overlay(
                    Image(systemName: "music.note")
                        .font(.title)
                        .foregroundStyle(.white.opacity(0.7))
                )

            // Song info
            if !manager.musicTitle.isEmpty {
                Text(manager.musicTitle)
                    .font(.system(.footnote, design: .rounded))
                    .fontWeight(.semibold)
                    .lineLimit(1)
                if !manager.musicArtist.isEmpty {
                    Text(manager.musicArtist)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            } else {
                Text("Not Playing")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            // Transport: prev | PLAY | next
            HStack(spacing: 24) {
                Button { manager.sendMusicControl("previous") } label: {
                    Image(systemName: "backward.fill")
                        .font(.body)
                }
                .buttonStyle(.plain)

                Button {
                    manager.sendMusicControl(manager.musicIsPlaying ? "pause" : "play")
                } label: {
                    Image(systemName: manager.musicIsPlaying ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 36))
                }
                .buttonStyle(.plain)

                Button { manager.sendMusicControl("next") } label: {
                    Image(systemName: "forward.fill")
                        .font(.body)
                }
                .buttonStyle(.plain)
            }
            .foregroundStyle(.primary)

            // AirPlay indicator
            Image(systemName: "airplayaudio")
                .font(.caption)
                .foregroundStyle(.secondary)

            Spacer(minLength: 4)
        }
        .focusable()
    }
}
