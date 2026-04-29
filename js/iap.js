/**
 * IAP — JavaScript wrapper for StoreKit 2 via Capacitor bridge.
 *
 * On web (PWA), all methods resolve with sensible defaults so the
 * paywall can render price strings from hard-coded fallbacks.
 *
 * On native iOS, calls go through IAPPlugin (Swift / StoreKit 2).
 */
(function () {
  'use strict';

  // ── Product IDs ────────────────────────────────────────
  var PRODUCTS = {
    MONTHLY:  'com.nomaen.homeworkout.pro.monthly',
    YEARLY:   'com.nomaen.homeworkout.pro.yearly',
    LIFETIME: 'com.nomaen.homeworkout.pro.lifetime',
    FOUNDERS: 'com.nomaen.homeworkout.pro.lifetime.founders',
  };

  // Fallback prices (NZ locale) shown if StoreKit is unavailable
  var FALLBACK_PRODUCTS = [
    { id: PRODUCTS.MONTHLY,  title: 'Pro Monthly',            price: 5.99,  priceString: '$5.99/mo',  period: 'monthly' },
    { id: PRODUCTS.YEARLY,   title: 'Pro Yearly',             price: 29.00, priceString: '$29/yr',    period: 'yearly' },
    { id: PRODUCTS.LIFETIME, title: 'Pro Lifetime',           price: 59.00, priceString: '$59',       period: 'lifetime' },
    { id: PRODUCTS.FOUNDERS, title: 'Founders Lifetime',      price: 39.00, priceString: '$39',       period: 'lifetime' },
  ];

  // ── Native bridge helper ───────────────────────────────
  function _native() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.IAPPlugin) {
        return window.Capacitor.Plugins.IAPPlugin;
      }
    } catch (e) {}
    return null;
  }

  // ── Public API ─────────────────────────────────────────

  /**
   * Fetch available products from the App Store.
   * Returns [{id, title, price, priceString, period}]
   */
  async function getProducts() {
    var bridge = _native();
    if (bridge) {
      try {
        var result = await bridge.getProducts();
        return result.products || FALLBACK_PRODUCTS;
      } catch (e) {
        console.warn('[IAP] getProducts failed, using fallbacks', e);
      }
    }
    return FALLBACK_PRODUCTS;
  }

  /**
   * Purchase a product by ID.
   * Returns {success, transactionId, productId} or {success:false, error}
   */
  async function purchase(productId) {
    var bridge = _native();
    if (!bridge) {
      return { success: false, error: 'Not running on iOS' };
    }
    try {
      var result = await bridge.purchase({ productId: productId });
      if (result.success) {
        // Update entitlement immediately
        await refreshEntitlement();
      }
      return result;
    } catch (e) {
      return { success: false, error: e.message || 'Purchase failed' };
    }
  }

  /**
   * Restore previous purchases.
   * Returns [{productId, purchaseDate}]
   */
  async function restore() {
    var bridge = _native();
    if (!bridge) {
      return [];
    }
    try {
      var result = await bridge.restore();
      await refreshEntitlement();
      return result.transactions || [];
    } catch (e) {
      console.warn('[IAP] restore failed', e);
      return [];
    }
  }

  /**
   * Query current entitlement from StoreKit and push to Entitlement module.
   */
  async function refreshEntitlement() {
    var bridge = _native();
    if (!bridge) return;
    try {
      var ent = await bridge.getEntitlement();
      if (ent && window.Entitlement) {
        window.Entitlement.set(ent);
      }
    } catch (e) {
      console.warn('[IAP] refreshEntitlement failed', e);
    }
  }

  /**
   * Get remaining founders slots.
   * Returns {remaining: number, available: boolean}
   */
  async function getFoundersStatus() {
    var bridge = _native();
    if (!bridge) {
      return { remaining: 1000, available: true };
    }
    try {
      var result = await bridge.getFoundersStatus();
      return result;
    } catch (e) {
      return { remaining: 1000, available: true }; // fallback: allow
    }
  }

  /**
   * Observe entitlement changes (StoreKit transaction updates).
   * Calls fn(entitlement) whenever entitlement changes.
   */
  function observeEntitlement(fn) {
    if (window.Entitlement) {
      window.Entitlement.onChange(fn);
    }
  }

  // ── Foreground re-validation ───────────────────────────
  // Re-check entitlement every time the app comes to foreground
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      refreshEntitlement();
    }
  });

  // ── Init ───────────────────────────────────────────────
  // Do an initial entitlement refresh on load (deferred)
  setTimeout(function () { refreshEntitlement(); }, 100);

  window.IAP = {
    PRODUCTS: PRODUCTS,
    getProducts: getProducts,
    purchase: purchase,
    restore: restore,
    refreshEntitlement: refreshEntitlement,
    getFoundersStatus: getFoundersStatus,
    observeEntitlement: observeEntitlement,
  };
})();
