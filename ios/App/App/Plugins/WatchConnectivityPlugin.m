#import <Capacitor/Capacitor.h>

CAP_PLUGIN(WatchConnectivityPlugin, "WatchConnectivityPlugin",
    CAP_PLUGIN_METHOD(isWatchAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(sendWorkoutState, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(sendCommand, CAPPluginReturnPromise);
)
