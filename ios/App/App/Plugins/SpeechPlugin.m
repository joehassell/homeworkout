#import <Capacitor/Capacitor.h>

CAP_PLUGIN(SpeechPlugin, "SpeechPlugin",
    CAP_PLUGIN_METHOD(speak, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stop, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getVoices, CAPPluginReturnPromise);
)
