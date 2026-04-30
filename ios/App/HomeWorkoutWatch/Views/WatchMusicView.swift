import SwiftUI

struct WatchMusicView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    var body: some View {
        VStack(spacing: 4) {
            // Divider
            Rectangle()
                .fill(.secondary.opacity(0.3))
                .frame(height: 1)
                .padding(.horizontal, -4)

            // Song info
            HStack(spacing: 6) {
                Image(systemName: "music.note")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                VStack(alignment: .leading, spacing: 0) {
                    Text(manager.musicTitle)
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .lineLimit(1)
                    if !manager.musicArtist.isEmpty {
                        Text(manager.musicArtist)
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
            }

            // Controls
            HStack(spacing: 16) {
                Button { manager.sendMusicControl("previous") } label: {
                    Image(systemName: "backward.fill")
                        .font(.caption)
                }
                .buttonStyle(.plain)

                Button {
                    manager.sendMusicControl(manager.musicIsPlaying ? "pause" : "play")
                } label: {
                    Image(systemName: manager.musicIsPlaying ? "pause.fill" : "play.fill")
                        .font(.callout)
                }
                .buttonStyle(.plain)

                Button { manager.sendMusicControl("next") } label: {
                    Image(systemName: "forward.fill")
                        .font(.caption)
                }
                .buttonStyle(.plain)
            }
            .foregroundStyle(.primary)
        }
    }
}
