import SwiftUI

struct WorkoutControlsView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    var body: some View {
        HStack(spacing: 12) {
            // Pause / Resume
            Button {
                manager.sendControl(manager.isPaused ? "resume" : "pause")
            } label: {
                Image(systemName: manager.isPaused ? "play.fill" : "pause.fill")
                    .font(.title3)
                    .frame(maxWidth: .infinity, minHeight: 36)
            }
            .buttonStyle(.borderedProminent)
            .tint(manager.isPaused ? .green : .orange)

            // Skip
            Button {
                manager.sendControl("skip")
            } label: {
                Image(systemName: "forward.fill")
                    .font(.title3)
                    .frame(maxWidth: .infinity, minHeight: 36)
            }
            .buttonStyle(.bordered)
        }
    }
}
