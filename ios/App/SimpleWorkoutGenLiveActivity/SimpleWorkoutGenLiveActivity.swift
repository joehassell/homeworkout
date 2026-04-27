import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Lock Screen / Dynamic Island Widget

struct SimpleWorkoutGenLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            // Lock Screen Banner
            lockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded
                DynamicIslandExpandedRegion(.leading) {
                    Label(phaseLabel(context.state.phase), systemImage: phaseIcon(context.state.phase))
                        .font(.caption)
                        .foregroundStyle(phaseColor(context.state.phase))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.exerciseIndex + 1)/\(context.state.exerciseCount)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 4) {
                        Text(context.state.exerciseName)
                            .font(.headline)
                            .lineLimit(1)
                        Text(timerInterval: Date()...context.state.countdownDate, countsDown: true)
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .foregroundStyle(phaseColor(context.state.phase))
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.attributes.workoutType.uppercased())
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            } compactLeading: {
                // Compact leading: phase icon
                Image(systemName: phaseIcon(context.state.phase))
                    .foregroundStyle(phaseColor(context.state.phase))
            } compactTrailing: {
                // Compact trailing: countdown
                Text(timerInterval: Date()...context.state.countdownDate, countsDown: true)
                    .monospacedDigit()
                    .font(.caption)
                    .frame(width: 44)
            } minimal: {
                // Minimal: just the countdown
                Text(timerInterval: Date()...context.state.countdownDate, countsDown: true)
                    .monospacedDigit()
                    .font(.caption)
            }
        }
    }

    // MARK: - Lock Screen View

    @ViewBuilder
    private func lockScreenView(context: ActivityViewContext<WorkoutActivityAttributes>) -> some View {
        HStack(spacing: 16) {
            // Phase indicator
            VStack(alignment: .leading, spacing: 4) {
                Label(phaseLabel(context.state.phase), systemImage: phaseIcon(context.state.phase))
                    .font(.caption)
                    .foregroundStyle(phaseColor(context.state.phase))

                Text(context.state.exerciseName)
                    .font(.headline)
                    .lineLimit(2)

                Text("\(context.state.exerciseIndex + 1) of \(context.state.exerciseCount)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            // Timer countdown
            VStack(spacing: 2) {
                Text(timerInterval: Date()...context.state.countdownDate, countsDown: true)
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(phaseColor(context.state.phase))

                Text(context.attributes.workoutType.uppercased())
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .activityBackgroundTint(.black.opacity(0.8))
    }

    // MARK: - Helpers

    private func phaseLabel(_ phase: String) -> String {
        switch phase {
        case "work": return "Working"
        case "rest": return "Rest"
        case "warmup": return "Warm-up"
        case "cooldown": return "Cooldown"
        default: return phase.capitalized
        }
    }

    private func phaseIcon(_ phase: String) -> String {
        switch phase {
        case "work": return "flame.fill"
        case "rest": return "pause.circle.fill"
        case "warmup": return "sun.max.fill"
        case "cooldown": return "snowflake"
        default: return "figure.run"
        }
    }

    private func phaseColor(_ phase: String) -> Color {
        switch phase {
        case "work": return .green
        case "rest": return .blue
        case "warmup": return .orange
        case "cooldown": return .purple
        default: return .white
        }
    }
}
