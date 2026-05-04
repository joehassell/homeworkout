#import <Capacitor/Capacitor.h>

CAP_PLUGIN(HealthKitPlugin, "HealthKitPlugin",
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(requestAuthorization, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(checkAuthorizationStatus, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startWorkout, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(endWorkout, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(discardWorkout, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getBodyWeight, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getDateOfBirth, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateLiveActivity, CAPPluginReturnPromise);
)
