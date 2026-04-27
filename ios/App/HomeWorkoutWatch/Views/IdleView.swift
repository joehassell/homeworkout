import SwiftUI

struct IdleView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    var body: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "figure.run")
                .font(.system(size: 36))
                .foregroundStyle(.blue)

            Text("SimpleWorkoutGen")
                .font(.headline)

            Text("Start a workout on your iPhone to begin")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Spacer()

            if manager.isPhoneReachable {
                Label("iPhone connected", systemImage: "iphone")
                    .font(.caption2)
                    .foregroundStyle(.green)
            } else {
                Label("iPhone not connected", systemImage: "iphone.slash")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
    }
}
