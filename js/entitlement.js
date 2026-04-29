/**
 * Entitlement — single source of truth for free/pro tier.
 *
 * Cached in localStorage under 'swg.entitlement.v1'.
 * Re-validated from StoreKit on every app foreground (native only).
 *
 * Usage:
 *   Entitlement.isPro()          // boolean
 *   Entitlement.isFounder()      // boolean
 *   Entitlement.get()            // {tier, source, expiresAt, isFounder}
 *   Entitlement.set(obj)         // update + persist + notify
 *   Entitlement.onChange(fn)     // subscribe
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'swg.entitlement.v1';

  var FREE_STATE = {
    tier: 'free',
    source: null,
    expiresAt: null,
    isFounder: false,
  };

  var _state = Object.assign({}, FREE_STATE);
  var _listeners = [];

  // ── Persistence ────────────────────────────────────────
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.tier) {
          _state = {
            tier: parsed.tier === 'pro' ? 'pro' : 'free',
            source: parsed.source || null,
            expiresAt: parsed.expiresAt || null,
            isFounder: !!parsed.isFounder,
          };
        }
      }
    } catch (e) { /* corrupt cache — stay free */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    } catch (e) {}
  }

  // ── Public API ─────────────────────────────────────────
  function get() {
    return Object.assign({}, _state);
  }

  function set(obj) {
    _state = {
      tier: (obj && obj.tier === 'pro') ? 'pro' : 'free',
      source: (obj && obj.source) || null,
      expiresAt: (obj && obj.expiresAt) || null,
      isFounder: !!(obj && obj.isFounder),
    };
    save();
    _notify();
  }

  function isPro() {
    if (_state.tier !== 'pro') return false;
    // Check expiration for subscriptions (lifetime has no expiresAt)
    if (_state.expiresAt) {
      return new Date(_state.expiresAt) > new Date();
    }
    return true;
  }

  function isFounder() {
    return _state.isFounder === true;
  }

  function onChange(fn) {
    if (typeof fn === 'function') _listeners.push(fn);
  }

  function _notify() {
    var snapshot = get();
    for (var i = 0; i < _listeners.length; i++) {
      try { _listeners[i](snapshot); } catch (e) {}
    }
  }

  // ── Feature gates ──────────────────────────────────────
  // These return true if the user is ALLOWED to use the feature.
  var FREE_EQUIPMENT = new Set(['bodyweight', 'mat']);
  var FREE_THEMES = new Set(['dark', 'light']);
  var HISTORY_DAYS_FREE = 14;

  function canUseEquipment(name) {
    if (isPro()) return true;
    return FREE_EQUIPMENT.has(name);
  }

  function canUseTheme(name) {
    if (isPro()) return true;
    return FREE_THEMES.has(name);
  }

  function canUseFullHistory() {
    return isPro();
  }

  function historyDayLimit() {
    return isPro() ? Infinity : HISTORY_DAYS_FREE;
  }

  function canUseFocusBoost() {
    // Free: include / exclude only.  Pro: include / boost / exclude.
    return isPro();
  }

  function canUseWeightTracking() {
    return isPro();
  }

  function canUseBackup() {
    return isPro();
  }

  function canUseFontScale() {
    return isPro();
  }

  // ── Init ───────────────────────────────────────────────
  load();

  window.Entitlement = {
    get: get,
    set: set,
    isPro: isPro,
    isFounder: isFounder,
    onChange: onChange,
    // Feature gates
    canUseEquipment: canUseEquipment,
    canUseTheme: canUseTheme,
    canUseFullHistory: canUseFullHistory,
    historyDayLimit: historyDayLimit,
    canUseFocusBoost: canUseFocusBoost,
    canUseWeightTracking: canUseWeightTracking,
    canUseBackup: canUseBackup,
    canUseFontScale: canUseFontScale,
    // Constants
    FREE_EQUIPMENT: FREE_EQUIPMENT,
    FREE_THEMES: FREE_THEMES,
    HISTORY_DAYS_FREE: HISTORY_DAYS_FREE,
  };
})();
