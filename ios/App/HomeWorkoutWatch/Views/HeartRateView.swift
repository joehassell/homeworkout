import SwiftUI

struct HeartRateView: View {
    let bpm: Double

    @State private var isAnimating = false

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "heart.fill")
                .foregroundStyle(.red)
                .scaleEffect(isAnimating ? 1.15 : 1.0)
                .animation(
                    .easeInOut(duration: 0.5)
                    .repeatForever(autoreverses: true),
                    value: isAnimating
                )
                .onAppear { isAnimating = true }

            Text("\(Int(bpm))")
                .fontWeight(.semibold)
                .monospacedDigit()

            Text("BPM")
                .foregroundStyle(.secondary)
        }
        .font(.caption)
    }
}
