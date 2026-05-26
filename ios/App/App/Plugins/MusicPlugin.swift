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
        CAPPluginMethod(name: "openAppleMusic", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openPodcasts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSource", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getActiveSource", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "skip", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startRadio", returnType: CAPPluginReturnPromise),
    ]

    private let player = MPMusicPlayerController.systemMusicPlayer
    // "music" → MPMusicPlayerController (Apple Music). "podcasts" → external app launcher only;
    // iOS has no public API to read or control Apple Podcasts playback from another app.
    private var source: String = "music"

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
        // Detect external audio (Apple Podcasts etc.) starting/stopping
        NotificationCenter.default.addObserver(
            self, selector: #selector(audioSessionChanged),
            name: AVAudioSession.silenceSecondaryAudioHintNotification, object: nil
        )
        player.beginGeneratingPlaybackNotifications()
    }

    @objc private func audioSessionChanged() {
        notifyListeners("musicSourceChanged", data: [:])
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

    @objc func openAppleMusic(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let url = URL(string: "music://") {
                UIApplication.shared.open(url)
            }
        }
        call.resolve(["success": true])
    }

    @objc func openPodcasts(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Apple Podcasts is registered for the "podcasts://" scheme.
            if let url = URL(string: "podcasts://") {
                UIApplication.shared.open(url)
            }
        }
        call.resolve(["success": true])
    }

    @objc func setSource(_ call: CAPPluginCall) {
        let value = call.getString("source") ?? "music"
        source = (value == "podcasts") ? "podcasts" : "music"
        call.resolve(["source": source])
    }

    // Best-effort auto-detection. Apple gives no public API to read another app's
    // playback, so we infer from:
    //   - MPMusicPlayerController.systemMusicPlayer.nowPlayingItem (Music app)
    //   - AVAudioSession.isOtherAudioPlaying (anything else owning audio focus)
    @objc func getActiveSource(_ call: CAPPluginCall) {
        let item = player.nowPlayingItem
        let mediaType: MPMediaType = item?.mediaType ?? []
        let isPodcastInMusicApp = mediaType.contains(.podcast) || mediaType.contains(.audioBook)
        let session = AVAudioSession.sharedInstance()
        let otherPlaying = session.isOtherAudioPlaying

        var detected = "music"
        var external = false
        if item != nil {
            detected = isPodcastInMusicApp ? "podcasts" : "music"
        } else if otherPlaying {
            // External audio app has focus — Apple Podcasts, Spotify, etc.
            // We can't read its metadata, but we can show podcasts-style UI.
            detected = "podcasts"
            external = true
        }
        source = detected
        call.resolve([
            "source": detected,
            "external": external,
            "isPlaying": player.playbackState == .playing || (external && otherPlaying),
        ])
    }

    // Skip forward/back by seconds. Only works for media owned by the Music app
    // (Apple Music tracks + iTunes-library podcasts). External Podcasts app is
    // out of reach — JS falls back to launching Podcasts in that case.
    @objc func skip(_ call: CAPPluginCall) {
        let delta = call.getDouble("seconds") ?? 10
        guard player.nowPlayingItem != nil else {
            call.resolve(["skipped": false, "reason": "no item"])
            return
        }
        let next = max(0, player.currentPlaybackTime + delta)
        player.currentPlaybackTime = next
        call.resolve(["skipped": true, "time": next])
    }

    @objc func startRadio(_ call: CAPPluginCall) {
        // Set queue to the user's library shuffled as a radio-like experience
        let query = MPMediaQuery.songs()
        if let items = query.items, !items.isEmpty {
            let collection = MPMediaItemCollection(items: items)
            player.setQueue(with: collection)
            player.shuffleMode = .songs
            player.play()
        }
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
