import SwiftUI

struct HeartRateZoneView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    private let zoneNames = ["Rest", "Fat Burn", "Cardio", "Tempo", "Peak"]
    private let zoneColors: [Color] = [.blue, .green, .yellow, .orange, .red]

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                Text("HR ZONES")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .textCase(.uppercase)
                    .foregroundStyle(.secondary)

                // Current HR
                HStack(spacing: 4) {
                    Image(systemName: "heart.fill")
                        .foregroundStyle(.red)
                    Text("\(Int(manager.heartRate))")
                        .font(.system(.title2, design: .rounded))
                        .fontWeight(.bold)
                        .monospacedDigit()
                    Text("BPM")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                // Current zone bar
                if manager.currentZone > 0 {
                    HStack(spacing: 2) {
                        ForEach(1...5, id: \.self) { zone in
                            RoundedRectangle(cornerRadius: 2)
                                .fill(zone <= manager.currentZone ? zoneColors[zone - 1] : Color.gray.opacity(0.3))
                                .frame(height: 6)
                        }
                    }
                    Text("Zone \(manager.currentZone)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(zoneColors[manager.currentZone - 1])
                }

                // Zone list
                ForEach(1...5, id: \.self) { zone in
                    let isCurrent = zone == manager.currentZone
                    HStack(spacing: 6) {
                        Text("Z\(zone)")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(zoneColors[zone - 1])
                            .frame(width: 22)
                        Text(zoneNames[zone - 1])
                            .font(.system(size: 11))
                            .foregroundStyle(isCurrent ? .primary : .secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Text(formatZoneTime(manager.zoneHistory[zone] ?? 0))
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 2)
                    .padding(.horizontal, 6)
                    .background(isCurrent ? zoneColors[zone - 1].opacity(0.15) : .clear)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                }

                Divider()

                // Stats
                HStack(spacing: 16) {
                    VStack(spacing: 2) {
                        Text("\(Int(manager.avgHeartRate))")
                            .font(.caption)
                            .fontWeight(.semibold)
                        Text("Avg")
                            .font(.system(size: 9))
                            .foregroundStyle(.secondary)
                    }
                    VStack(spacing: 2) {
                        Text("\(Int(manager.peakHeartRate))")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(.red)
                        Text("Peak")
                            .font(.system(size: 9))
                            .foregroundStyle(.secondary)
                    }
                    VStack(spacing: 2) {
                        Text(formatZoneTime(manager.timeInCurrentZone))
                            .font(.caption)
                            .fontWeight(.semibold)
                        Text("In Zone")
                            .font(.system(size: 9))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }

    private func formatZoneTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}
