import Foundation
import Capacitor
import AVFoundation

/// Native AVSpeechSynthesizer bridge for higher-quality TTS than Web Speech API.
@objc(SpeechPlugin)
public class SpeechPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SpeechPlugin"
    public let jsName = "SpeechPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getVoices", returnType: CAPPluginReturnPromise),
    ]

    private let synthesizer = AVSpeechSynthesizer()

    @objc func speak(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.resolve(["success": false])
            return
        }

        let rate = call.getFloat("rate") ?? 0.50
        let pitch = call.getFloat("pitch") ?? 1.0
        let voiceId = call.getString("voiceId")

        let utterance = AVSpeechUtterance(string: text)
        utterance.rate = rate
        utterance.pitchMultiplier = pitch
        utterance.volume = 1.0
        utterance.preUtteranceDelay = 0
        utterance.postUtteranceDelay = 0

        // Select voice: prefer specified ID, then quality-based selection
        let quality = call.getString("quality") ?? "best"
        if let voiceId = voiceId, let voice = AVSpeechSynthesisVoice(identifier: voiceId) {
            utterance.voice = voice
        } else if quality == "default" {
            utterance.voice = defaultVoice()
        } else {
            utterance.voice = bestAvailableVoice()
        }

        // Cancel any in-progress speech before speaking new text
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }

        synthesizer.speak(utterance)
        call.resolve(["success": true])
    }

    @objc func stop(_ call: CAPPluginCall) {
        synthesizer.stopSpeaking(at: .immediate)
        call.resolve(["success": true])
    }

    @objc func getVoices(_ call: CAPPluginCall) {
        let voices = AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.hasPrefix("en") }
            .map { voice -> [String: Any] in
                return [
                    "id": voice.identifier,
                    "name": voice.name,
                    "language": voice.language,
                    "quality": qualityLabel(voice.quality),
                ]
            }
        call.resolve(["voices": voices])
    }

    // MARK: - Helpers

    private func defaultVoice() -> AVSpeechSynthesisVoice? {
        // Return the basic system voice for the user's locale
        let langTag = Locale.current.identifier.replacingOccurrences(of: "_", with: "-")
        let allVoices = AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language == langTag || $0.language.hasPrefix("en") }
            .sorted { v1, v2 in v1.quality.rawValue < v2.quality.rawValue }
        return allVoices.first ?? AVSpeechSynthesisVoice(language: "en-US")
    }

    private func bestAvailableVoice() -> AVSpeechSynthesisVoice? {
        let langTag = Locale.current.identifier.replacingOccurrences(of: "_", with: "-")

        // Get all English voices sorted by quality (premium > enhanced > default)
        let allVoices = AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language == langTag || $0.language.hasPrefix("en") }
            .sorted { v1, v2 in v1.quality.rawValue > v2.quality.rawValue }

        // Pick the best quality voice, but ensure it's different from default
        let defaultV = defaultVoice()
        if let best = allVoices.first, best.identifier != defaultV?.identifier {
            return best
        }
        // If best == default (no premium downloaded), pick a different voice by name
        if allVoices.count > 1 {
            return allVoices.first { $0.identifier != defaultV?.identifier } ?? allVoices.first
        }
        return allVoices.first ?? AVSpeechSynthesisVoice(language: "en-US")
    }

    private func qualityLabel(_ quality: AVSpeechSynthesisVoiceQuality) -> String {
        switch quality.rawValue {
        case 3: return "premium"
        case 2: return "enhanced"
        default: return "default"
        }
    }
}
