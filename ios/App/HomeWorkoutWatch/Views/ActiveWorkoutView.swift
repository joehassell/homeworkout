import SwiftUI

struct ActiveWorkoutView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    var body: some View {
        TabView {
            WorkoutPageView()
            WatchMusicView()
            HeartRateZoneView()
        }
        .tabViewStyle(.verticalPage)
        .environmentObject(manager)
    }
}

// MARK: - Workout Page (Page 1)

struct WorkoutPageView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

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

// MARK: - Watch Music View (Page 2)

struct WatchMusicView: View {
    @EnvironmentObject var manager: WorkoutSessionManager
    @State private var crownVolume: Double = 0.5

    var body: some View {
        VStack(spacing: 8) {
            Text("NOW PLAYING")
                .font(.caption2)
                .fontWeight(.bold)
                .textCase(.uppercase)
                .foregroundStyle(.secondary)

            Spacer(minLength: 4)

            if manager.musicTitle.isEmpty {
                Image(systemName: "music.note")
                    .font(.title2)
                    .foregroundStyle(.secondary)
                Text("No music playing")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Image(systemName: "music.note")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(manager.musicTitle)
                    .font(.system(.body, design: .rounded))
                    .fontWeight(.semibold)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                if !manager.musicArtist.isEmpty {
                    Text(manager.musicArtist)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer(minLength: 4)

            // Transport controls
            HStack(spacing: 20) {
                Button { manager.sendMusicControl("previous") } label: {
                    Image(systemName: "backward.fill")
                        .font(.title3)
                }
                .buttonStyle(.plain)

                Button {
                    manager.sendMusicControl(manager.musicIsPlaying ? "pause" : "play")
                } label: {
                    Image(systemName: manager.musicIsPlaying ? "pause.fill" : "play.fill")
                        .font(.title2)
                }
                .buttonStyle(.plain)

                Button { manager.sendMusicControl("next") } label: {
                    Image(systemName: "forward.fill")
                        .font(.title3)
                }
                .buttonStyle(.plain)
            }
            .foregroundStyle(.primary)

            Spacer(minLength: 4)

            // Volume via Digital Crown
            HStack(spacing: 6) {
                Image(systemName: "speaker.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 4)
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.white)
                            .frame(width: geo.size.width * crownVolume, height: 4)
                    }
                }
                .frame(height: 4)
                Image(systemName: "speaker.wave.3.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 8)
        }
        .focusable()
        .digitalCrownRotation($crownVolume, from: 0.0, through: 1.0, sensitivity: .low, isContinuous: false, isHapticFeedbackEnabled: true)
    }
}
