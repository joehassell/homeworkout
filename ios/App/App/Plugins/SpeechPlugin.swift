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

        // Select voice: prefer specified ID, then premium, then enhanced, then default
        if let voiceId = voiceId, let voice = AVSpeechSynthesisVoice(identifier: voiceId) {
            utterance.voice = voice
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

    private func bestAvailableVoice() -> AVSpeechSynthesisVoice? {
        let lang = Locale.current.language.languageCode?.identifier ?? "en"
        let region = Locale.current.region?.identifier ?? "US"
        let langTag = "\(lang)-\(region)"

        // Try premium first, then enhanced, then default
        let allVoices = AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language == langTag || $0.language.hasPrefix(lang) }
            .sorted { v1, v2 in v1.quality.rawValue > v2.quality.rawValue }

        return allVoices.first ?? AVSpeechSynthesisVoice(language: "en-US")
    }

    private func qualityLabel(_ quality: AVSpeechSynthesisVoice.Quality) -> String {
        switch quality {
        case .premium: return "premium"
        case .enhanced: return "enhanced"
        default: return "default"
        }
    }
}
