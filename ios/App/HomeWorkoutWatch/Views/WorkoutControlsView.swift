import SwiftUI

struct WorkoutControlsView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    var body: some View {
        HStack(spacing: 8) {
            // Restart
            Button {
                manager.sendControl("restart")
            } label: {
                Image(systemName: "arrow.counterclockwise")
                    .font(.body)
                    .frame(maxWidth: .infinity, minHeight: 36)
            }
            .buttonStyle(.bordered)

            // Pause / Resume
            Button {
                manager.sendControl(manager.isPaused ? "resume" : "pause")
            } label: {
                Image(systemName: manager.isPaused ? "play.fill" : "pause.fill")
                    .font(.body)
                    .frame(maxWidth: .infinity, minHeight: 36)
            }
            .buttonStyle(.borderedProminent)
            .tint(manager.isPaused ? .green : .orange)

            // Skip
            Button {
                manager.sendControl("skip")
            } label: {
                Image(systemName: "forward.fill")
                    .font(.body)
                    .frame(maxWidth: .infinity, minHeight: 36)
            }
            .buttonStyle(.bordered)
        }
    }
}
