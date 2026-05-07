/**
 * Promo Code — flag-gated Pro unlock for testing.
 *
 * Set PROMO_CODE_ENABLED to false to hide the input entirely.
 */
(function () {
  'use strict';

  // ── Feature flag ───────────────────────────────────
  var PROMO_CODE_ENABLED = true;

  // ── Config ─────────────────────────────────────────
  var VALID_CODE = 'SWGPRO2026';
  var STORAGE_KEY = 'swg.promo_code_used';

  // ── DOM refs ───────────────────────────────────────
  var row = document.getElementById('promo-code-row');
  var input = document.getElementById('promo-code-input');
  var btn = document.getElementById('promo-code-btn');

  if (!row || !input || !btn) return;

  // ── Visibility logic ──────────────────────────────
  function updateVisibility() {
    var show = PROMO_CODE_ENABLED && !Entitlement.isPro();
    row.style.display = show ? 'flex' : 'none';
  }

  // ── Redeem ────────────────────────────────────────
  function redeem() {
    var code = (input.value || '').trim().toUpperCase();
    if (code !== VALID_CODE) {
      input.style.borderColor = '#e74c3c';
      input.value = '';
      input.placeholder = 'Invalid code';
      setTimeout(function () {
        input.style.borderColor = '';
        input.placeholder = 'Enter promo code';
      }, 2000);
      return;
    }

    // Unlock Pro
    Entitlement.set({ tier: 'pro', source: 'promo_code', expiresAt: null, isFounder: false });

    // Persist that the code was used (survives cache clears of entitlement)
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}

    // Toast
    _showToast('Pro unlocked!');

    // Hide promo row and upgrade row
    updateVisibility();
    var upgradeRow = document.getElementById('settings-upgrade-row');
    if (upgradeRow) upgradeRow.style.display = 'none';

    // Force full UI refresh so all Pro-gated elements update immediately
    setTimeout(function () {
      // Re-trigger entitlement change listeners
      if (typeof Entitlement !== 'undefined' && typeof Entitlement.set === 'function') {
        Entitlement.set(Entitlement.get());
      }
      // Refresh settings UI if available
      if (typeof syncVoiceEngineUI === 'function') syncVoiceEngineUI();
      if (typeof rebuildBuildEquipment === 'function') rebuildBuildEquipment();
    }, 100);
  }

  // ── Toast (self-contained) ────────────────────────
  function _showToast(msg) {
    var existing = document.querySelector('.paywall-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'paywall-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('visible'); });
    setTimeout(function () {
      toast.classList.remove('visible');
      setTimeout(function () { toast.remove(); }, 400);
    }, 3000);
  }

  // ── Event listeners ───────────────────────────────
  btn.addEventListener('click', redeem);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') redeem();
  });

  // Re-check visibility when entitlement changes
  Entitlement.onChange(updateVisibility);

  // Initial visibility
  updateVisibility();
})();
