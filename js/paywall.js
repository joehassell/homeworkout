/**
 * Paywall — modal rendering and purchase flow.
 *
 * Shows a full-screen modal with 3 product cards (monthly, yearly, lifetime).
 * Founders tier replaces lifetime when available and slots remain.
 *
 * Paywall surfaces (6):
 *   1. Equipment selector — locked equipment tapped
 *   2. Apple Watch settings — watch toggle tapped
 *   3. History view — heatmap/stats tapped when limited
 *   4. Theme picker — locked theme tapped
 *   5. After 5th workout — soft prompt (capped weekly)
 *   6. Settings → Upgrade — always visible
 */
(function () {
  'use strict';

  var _products = null;          // cached products from store
  var _foundersStatus = null;    // {remaining, available}
  var _selectedProductId = null; // currently highlighted card
  var _isOpen = false;

  // ── Paywall surface contexts ───────────────────────────
  var SURFACE_MESSAGES = {
    equipment:  'Unlock kettlebell workouts and 7 more equipment types with Pro',
    watch:      'The Watch companion is part of Pro',
    history:    'See your full history, heatmap, and stats with Pro',
    theme:      'Unlock all 5 themes with Pro',
    completion: 'Enjoying your workouts? Go Pro for the full experience',
    settings:   'Upgrade to Pro',
  };

  // ── Render ─────────────────────────────────────────────
  function _buildModal(surface) {
    var msg = SURFACE_MESSAGES[surface] || SURFACE_MESSAGES.settings;
    var products = _products || [];

    var monthly  = products.find(function (p) { return p.period === 'monthly'; });
    var yearly   = products.find(function (p) { return p.period === 'yearly' && p.id.indexOf('lifetime') === -1; });
    var lifetime = null;
    var founders = null;

    // Determine which lifetime to show
    if (_foundersStatus && _foundersStatus.available) {
      founders = products.find(function (p) { return p.id.indexOf('founders') !== -1; });
      lifetime = products.find(function (p) { return p.id.indexOf('lifetime') !== -1 && p.id.indexOf('founders') === -1; });
    } else {
      lifetime = products.find(function (p) { return p.id.indexOf('lifetime') !== -1 && p.id.indexOf('founders') === -1; });
    }

    // Default selection: yearly (hero product)
    _selectedProductId = yearly ? yearly.id : (lifetime ? lifetime.id : null);

    var html = '<div class="paywall-overlay" id="paywall-overlay" onclick="Paywall.closeIfBg(event)">';
    html += '<div class="paywall-modal">';

    // Close button
    html += '<button class="paywall-close" onclick="Paywall.close()" aria-label="Close">&times;</button>';

    // Header
    html += '<div class="paywall-header">';
    html += '<div class="paywall-icon">&#x2B50;</div>';
    html += '<h2 class="paywall-title">SimpleWorkoutGen Pro</h2>';
    html += '<p class="paywall-subtitle">' + _esc(msg) + '</p>';
    html += '</div>';

    // Feature list
    html += '<ul class="paywall-features">';
    html += '<li>All 9 equipment types</li>';
    html += '<li>Apple Watch companion</li>';
    html += '<li>Full workout history &amp; heatmap</li>';
    html += '<li>All 5 themes &amp; font scaling</li>';
    html += '<li>Smart warm-up &amp; cooldown</li>';
    html += '<li>Weight tracking &amp; PR detection</li>';
    html += '<li>JSON export &amp; import</li>';
    html += '</ul>';

    // Product cards
    html += '<div class="paywall-cards">';

    if (monthly) {
      html += _cardHtml(monthly, 'monthly', false, null);
    }
    if (yearly) {
      var trialTag = '7-DAY FREE TRIAL';
      var saveTag = 'Save 60% vs monthly';
      html += _cardHtml(yearly, 'yearly', true, trialTag + '<br><span class="paywall-card-save">' + saveTag + '</span>');
    }
    if (founders) {
      var remaining = (_foundersStatus && _foundersStatus.remaining) || '?';
      var foundersTag = 'FOUNDERS — Only ' + remaining + ' of 1,000 left';
      html += _cardHtml(founders, 'lifetime', false, foundersTag);
    } else if (lifetime) {
      html += _cardHtml(lifetime, 'lifetime', false, 'Pay once, own forever');
    }

    html += '</div>'; // .paywall-cards

    // CTA button
    html += '<button class="btn btn-primary btn-full paywall-cta" id="paywall-cta" onclick="Paywall.purchaseSelected()">Continue</button>';

    // Restore + legal
    html += '<div class="paywall-footer">';
    html += '<button class="paywall-restore" onclick="Paywall.restorePurchases()">Restore Purchases</button>';
    html += '<div class="paywall-legal">';
    html += '<a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener">Terms</a>';
    html += ' · ';
    html += '<a href="https://joehassell.com/privacy" target="_blank" rel="noopener">Privacy</a>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // .paywall-modal
    html += '</div>'; // .paywall-overlay

    return html;
  }

  function _cardHtml(product, period, isHero, tagline) {
    var selected = product.id === _selectedProductId;
    var cls = 'paywall-card';
    if (selected) cls += ' selected';
    if (isHero) cls += ' hero';

    var html = '<div class="' + cls + '" data-product-id="' + product.id + '" onclick="Paywall.selectCard(\'' + product.id + '\')">';

    if (isHero) {
      html += '<div class="paywall-card-badge">BEST VALUE</div>';
    }

    var periodLabel = period === 'monthly' ? '/month' : (period === 'yearly' ? '/year' : '');
    html += '<div class="paywall-card-price">' + _esc(product.priceString) + '</div>';
    if (periodLabel && product.priceString.indexOf('/') === -1) {
      html += '<div class="paywall-card-period">' + periodLabel + '</div>';
    }

    if (tagline) {
      html += '<div class="paywall-card-tagline">' + tagline + '</div>';
    }

    html += '</div>';
    return html;
  }

  // ── Open / Close ───────────────────────────────────────
  async function open(surface) {
    if (_isOpen) return;
    if (window.Entitlement && window.Entitlement.isPro()) return; // already pro

    // Load products and founders status
    if (!_products) {
      _products = await window.IAP.getProducts();
    }
    if (!_foundersStatus) {
      _foundersStatus = await window.IAP.getFoundersStatus();
    }

    surface = surface || 'settings';
    _trackPaywallShown(surface);

    var html = _buildModal(surface);
    var container = document.getElementById('paywall-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'paywall-container';
      document.body.appendChild(container);
    }
    container.innerHTML = html;
    _isOpen = true;

    // Animate in
    requestAnimationFrame(function () {
      var overlay = document.getElementById('paywall-overlay');
      if (overlay) overlay.classList.add('visible');
    });
  }

  function close() {
    _isOpen = false;
    var overlay = document.getElementById('paywall-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(function () {
        var container = document.getElementById('paywall-container');
        if (container) container.innerHTML = '';
      }, 300);
    }
  }

  function closeIfBg(event) {
    if (event.target.classList.contains('paywall-overlay')) {
      close();
    }
  }

  // ── Card selection ─────────────────────────────────────
  function selectCard(productId) {
    _selectedProductId = productId;
    document.querySelectorAll('.paywall-card').forEach(function (card) {
      card.classList.toggle('selected', card.dataset.productId === productId);
    });
    // Update CTA text
    var cta = document.getElementById('paywall-cta');
    if (cta) {
      var product = (_products || []).find(function (p) { return p.id === productId; });
      if (product && product.period === 'yearly') {
        cta.textContent = 'Start Free Trial';
      } else {
        cta.textContent = 'Continue';
      }
    }
  }

  // ── Purchase ───────────────────────────────────────────
  async function purchaseSelected() {
    if (!_selectedProductId) return;

    var cta = document.getElementById('paywall-cta');
    if (cta) {
      cta.textContent = 'Processing...';
      cta.disabled = true;
    }

    var result = await window.IAP.purchase(_selectedProductId);

    if (result.success) {
      close();
      _showToast('Welcome to Pro!');
      _applyProUI();
    } else {
      if (cta) {
        cta.textContent = 'Continue';
        cta.disabled = false;
      }
      if (result.error && result.error !== 'cancelled' && result.error !== 'User cancelled') {
        _showToast('Purchase failed: ' + result.error);
      }
    }
  }

  async function restorePurchases() {
    var restoreBtn = document.querySelector('.paywall-restore');
    if (restoreBtn) restoreBtn.textContent = 'Restoring...';

    var transactions = await window.IAP.restore();

    if (window.Entitlement && window.Entitlement.isPro()) {
      close();
      _showToast('Pro restored \u2014 welcome back.');
      _applyProUI();
    } else {
      if (restoreBtn) restoreBtn.textContent = 'Restore Purchases';
      if (transactions.length === 0) {
        _showToast('No previous purchases found.');
      }
    }
  }

  // ── Post-workout soft prompt (surface 5) ───────────────
  var COMPLETION_PAYWALL_INTERVAL = 5; // every 5th workout
  var COMPLETION_PAYWALL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // weekly cap

  function maybeShowCompletionPaywall() {
    if (window.Entitlement && window.Entitlement.isPro()) return;

    var count = 0;
    try { count = parseInt(localStorage.getItem('swg.workout_count') || '0'); } catch (e) {}
    count++;
    try { localStorage.setItem('swg.workout_count', String(count)); } catch (e) {}

    if (count % COMPLETION_PAYWALL_INTERVAL !== 0) return;

    // Weekly cooldown
    var lastShown = 0;
    try { lastShown = parseInt(localStorage.getItem('swg.paywall.completion.last') || '0'); } catch (e) {}
    if (Date.now() - lastShown < COMPLETION_PAYWALL_COOLDOWN_MS) return;

    // Delay slightly so done screen renders first
    setTimeout(function () { open('completion'); }, 1500);
  }

  // ── Helpers ────────────────────────────────────────────
  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _trackPaywallShown(surface) {
    try {
      localStorage.setItem('swg.paywall.' + surface + '.last', String(Date.now()));
    } catch (e) {}
  }

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

  function _applyProUI() {
    // Remove all lock badges and re-enable locked features
    document.querySelectorAll('.pro-lock').forEach(function (el) {
      el.classList.remove('pro-lock');
    });
    document.querySelectorAll('.pro-badge').forEach(function (el) {
      el.style.display = 'none';
    });
    // Refresh equipment pills
    if (typeof syncEquipmentPillUI === 'function') syncEquipmentPillUI();
    // Refresh theme swatches
    if (typeof applyTheme === 'function') applyTheme(currentTheme);
    // Refresh history
    if (window.history_view) window.history_view.refresh();
    // Hide upgrade row in settings
    var upgradeRow = document.getElementById('settings-upgrade-row');
    if (upgradeRow) upgradeRow.style.display = 'none';
  }

  // ── Expose ─────────────────────────────────────────────
  window.Paywall = {
    open: open,
    close: close,
    closeIfBg: closeIfBg,
    selectCard: selectCard,
    purchaseSelected: purchaseSelected,
    restorePurchases: restorePurchases,
    maybeShowCompletionPaywall: maybeShowCompletionPaywall,
  };
})();
