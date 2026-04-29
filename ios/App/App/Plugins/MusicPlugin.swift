import Foundation
import Capacitor
import MediaPlayer

@objc(MusicPlugin)
public class MusicPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MusicPlugin"
    public let jsName = "MusicPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getNowPlaying", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "next", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "previous", returnType: CAPPluginReturnPromise),
    ]

    private let player = MPMusicPlayerController.systemMusicPlayer

    public override func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(nowPlayingChanged),
            name: .MPMusicPlayerControllerNowPlayingItemDidChange,
            object: player
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playbackStateChanged),
            name: .MPMusicPlayerControllerPlaybackStateDidChange,
            object: player
        )
        player.beginGeneratingPlaybackNotifications()
    }

    deinit {
        player.endGeneratingPlaybackNotifications()
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - Notification Handlers

    @objc private func nowPlayingChanged() {
        notifyListeners("musicStateChanged", data: buildStateDict())
    }

    @objc private func playbackStateChanged() {
        notifyListeners("musicStateChanged", data: buildStateDict())
    }

    // MARK: - Plugin Methods

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": true])
    }

    @objc func getNowPlaying(_ call: CAPPluginCall) {
        call.resolve(buildStateDict())
    }

    @objc func play(_ call: CAPPluginCall) {
        player.play()
        call.resolve(["success": true])
    }

    @objc func pause(_ call: CAPPluginCall) {
        player.pause()
        call.resolve(["success": true])
    }

    @objc func next(_ call: CAPPluginCall) {
        player.skipToNextItem()
        call.resolve(["success": true])
    }

    @objc func previous(_ call: CAPPluginCall) {
        player.skipToPreviousItem()
        call.resolve(["success": true])
    }

    // MARK: - Helpers

    private func buildStateDict() -> [String: Any] {
        let item = player.nowPlayingItem
        let isPlaying = player.playbackState == .playing
        var dict: [String: Any] = ["isPlaying": isPlaying]

        if let item = item {
            dict["title"] = item.title ?? ""
            dict["artist"] = item.artist ?? ""
            dict["album"] = item.albumTitle ?? ""
            dict["playbackTime"] = player.currentPlaybackTime
            dict["duration"] = item.playbackDuration
        }

        return dict
    }
}
