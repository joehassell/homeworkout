import SwiftUI

struct WorkoutControlsView: View {
    @EnvironmentObject var manager: WorkoutSessionManager
    @State private var showEndConfirm = false

    var body: some View {
        VStack(spacing: 6) {
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

            // End Workout (saves progress on phone, ends HK session here)
            Button(role: .destructive) {
                showEndConfirm = true
            } label: {
                Label("End Workout", systemImage: "checkmark.circle.fill")
                    .font(.caption)
                    .frame(maxWidth: .infinity, minHeight: 32)
            }
            .buttonStyle(.bordered)
            .tint(.red)
            .confirmationDialog(
                "End workout?",
                isPresented: $showEndConfirm,
                titleVisibility: .visible
            ) {
                Button("End & Save", role: .destructive) {
                    manager.sendControl("end")
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Your progress so far will be saved.")
            }
        }
    }
}
