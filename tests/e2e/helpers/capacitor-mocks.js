/**
 * Capacitor plugin mocks — injected via page.addInitScript() before the app loads.
 * Each plugin method records calls for later assertion and returns sensible defaults.
 */
function installCapacitorMocks() {
  window.__capMockCalls = {};

  function record(plugin, method, args) {
    const key = `${plugin}.${method}`;
    if (!window.__capMockCalls[key]) window.__capMockCalls[key] = [];
    window.__capMockCalls[key].push({ args, ts: Date.now() });
  }

  function mock(plugin, methods) {
    const obj = { _listeners: {} };
    obj.addListener = (event, fn) => {
      if (!obj._listeners[event]) obj._listeners[event] = [];
      obj._listeners[event].push(fn);
      record(plugin, 'addListener', { event });
      return { remove: () => {} };
    };
    obj._emit = (event, data) => {
      (obj._listeners[event] || []).forEach(fn => fn(data));
    };
    for (const [name, defaultReturn] of Object.entries(methods)) {
      obj[name] = async (...args) => {
        record(plugin, name, args);
        return typeof defaultReturn === 'function' ? defaultReturn(...args) : defaultReturn;
      };
    }
    return obj;
  }

  window.Capacitor = {
    isNativePlatform: () => false,
    isPluginAvailable: () => true,
    Plugins: {
      HealthKitPlugin: mock('HealthKitPlugin', {
        isAvailable: { available: true },
        requestAuthorization: { granted: true },
        checkAuthorizationStatus: { status: 'authorized' },
        getHealthKitStatus: { authorized: true },
        startWorkout: { sessionId: 'mock-session-1' },
        endWorkout: { saved: true },
        discardWorkout: {},
        updateLiveActivity: {},
        getBodyWeight: { kg: 75 },
        getDateOfBirth: { age: 30 },
      }),
      WatchConnectivityPlugin: mock('WatchConnectivityPlugin', {
        isWatchAvailable: { supported: false, paired: false, reachable: false, installed: false },
        sendWorkoutState: {},
        sendCommand: {},
        launchWatchApp: {},
      }),
      IAPPlugin: mock('IAPPlugin', {
        getProducts: { products: [] },
        purchase: { success: false },
        restore: { restored: false },
        getEntitlement: { tier: 'pro', source: 'test', expiresAt: null, isFounder: false },
        getFoundersStatus: { remaining: 999, available: true },
      }),
      iCloudSyncPlugin: mock('iCloudSyncPlugin', {
        syncToCloud: {},
      }),
      SpeechPlugin: mock('SpeechPlugin', {
        speak: {},
        stop: {},
        getVoices: { voices: [{ id: 'mock-voice', name: 'Mock', language: 'en-US', quality: 'default' }] },
      }),
      MusicPlugin: mock('MusicPlugin', {
        isAvailable: { available: false },
        getNowPlaying: { title: '', artist: '', isPlaying: false },
        play: {},
        pause: {},
        togglePlayPause: {},
        next: {},
        previous: {},
        seek: {},
        startRadio: {},
        openAppleMusic: {},
      }),
      Haptics: mock('Haptics', {
        impact: {},
        notification: {},
        selectionStart: {},
        selectionChanged: {},
        selectionEnd: {},
      }),
      StatusBar: mock('StatusBar', {
        setStyle: {},
        setBackgroundColor: {},
        setOverlaysWebView: {},
      }),
      Keyboard: mock('Keyboard', {
        setStyle: {},
        setResizeMode: {},
      }),
      App: mock('App', {
        openUrl: {},
      }),
    },
  };
}

module.exports = { installCapacitorMocks };
