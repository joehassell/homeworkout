import Capacitor

class BridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(HealthKitPlugin())
        bridge?.registerPluginInstance(MusicPlugin())
        bridge?.registerPluginInstance(WatchConnectivityPlugin())
        bridge?.registerPluginInstance(iCloudSyncPlugin())
        bridge?.registerPluginInstance(IAPPlugin())
        bridge?.registerPluginInstance(SpeechPlugin())
    }
}
