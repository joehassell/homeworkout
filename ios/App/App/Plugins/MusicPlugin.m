#import <Capacitor/Capacitor.h>

CAP_PLUGIN(MusicPlugin, "MusicPlugin",
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getNowPlaying, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(play, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(pause, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(next, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(previous, CAPPluginReturnPromise);
)
