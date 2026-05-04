import Foundation
import Capacitor
import MediaPlayer
import AVFoundation

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
        CAPPluginMethod(name: "seek", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getVolume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setVolume", returnType: CAPPluginReturnPromise),
    ]

    private let player = MPMusicPlayerController.systemMusicPlayer

    public override func load() {
        super.load()
        NotificationCenter.default.addObserver(
            self, selector: #selector(nowPlayingChanged),
            name: .MPMusicPlayerControllerNowPlayingItemDidChange, object: player
        )
        NotificationCenter.default.addObserver(
            self, selector: #selector(playbackStateChanged),
            name: .MPMusicPlayerControllerPlaybackStateDidChange, object: player
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
        let status = MPMediaLibrary.authorizationStatus()
        if status == .notDetermined {
            MPMediaLibrary.requestAuthorization { [weak self] newStatus in
                let authorized = newStatus == .authorized
                call.resolve(["available": authorized, "authorized": authorized])
                // After auth granted, immediately send current state
                if authorized, let self = self {
                    DispatchQueue.main.async {
                        self.player.beginGeneratingPlaybackNotifications()
                        self.notifyListeners("musicStateChanged", data: self.buildStateDict())
                    }
                }
            }
        } else {
            call.resolve([
                "available": status == .authorized,
                "authorized": status == .authorized,
            ])
        }
    }

    @objc func getNowPlaying(_ call: CAPPluginCall) {
        call.resolve(buildStateDict())
    }

    @objc func play(_ call: CAPPluginCall) {
        // If nothing is queued, try to play the user's entire library
        if player.nowPlayingItem == nil {
            let query = MPMediaQuery.songs()
            if let items = query.items, !items.isEmpty {
                let collection = MPMediaItemCollection(items: items)
                player.setQueue(with: collection)
                player.shuffleMode = .songs
            }
        }
        player.play()
        // Check if playback actually started after a brief delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            let isPlaying = self.player.playbackState == .playing
            if !isPlaying {
                self.notifyListeners("musicError", data: [
                    "error": "No music available. Open Apple Music and play a song first.",
                ])
            }
        }
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

    @objc func seek(_ call: CAPPluginCall) {
        guard let time = call.getDouble("time") else {
            call.reject("Missing time parameter")
            return
        }
        player.currentPlaybackTime = time
        call.resolve(["success": true])
    }

    @objc func getVolume(_ call: CAPPluginCall) {
        let volume = AVAudioSession.sharedInstance().outputVolume
        call.resolve(["volume": volume])
    }

    @objc func setVolume(_ call: CAPPluginCall) {
        // System volume can only be changed via MPVolumeView (hardware slider)
        // or by using the deprecated MPMusicPlayerController.volume.
        // We return the current volume and let the JS layer use the native slider.
        let volume = AVAudioSession.sharedInstance().outputVolume
        call.resolve(["volume": volume])
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

            // Album art as base64 data URI (thumbnail for web display)
            if let artwork = item.artwork {
                let size = CGSize(width: 200, height: 200)
                if let image = artwork.image(at: size),
                   let data = image.jpegData(compressionQuality: 0.6) {
                    dict["artworkBase64"] = "data:image/jpeg;base64," + data.base64EncodedString()
                }
            }
        }

        return dict
    }
}
