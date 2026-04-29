#import <Capacitor/Capacitor.h>

CAP_PLUGIN(iCloudSyncPlugin, "iCloudSyncPlugin",
    CAP_PLUGIN_METHOD(syncToCloud, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(loadFromCloud, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(syncAllToCloud, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(loadAllFromCloud, CAPPluginReturnPromise);
)
