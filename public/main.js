/* Castra — site behaviour. Plain ES2017, no dependencies. */
(function () {
  'use strict';

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function gbp(n, d) { return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function param(name) {
    try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
  }

  /* ---------- Mobile menu: close on link, outside click, Escape ---------- */
  function initMenu() {
    var menu = $('.nav-mobile');
    if (!menu) return;
    $all('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { menu.removeAttribute('open'); });
    });
    document.addEventListener('click', function (e) {
      if (menu.hasAttribute('open') && !menu.contains(e.target)) menu.removeAttribute('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.hasAttribute('open')) {
        menu.removeAttribute('open');
        var s = $('summary', menu);
        if (s) s.focus();
      }
    });
    // Close the sheet if the viewport grows past the mobile breakpoint.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) menu.removeAttribute('open');
    });
  }

  /* ---------- Hero command panel (illustrative data) ---------- */
  function initDashboard() {
    var cellsEl = $('[data-cells]');
    if (!cellsEl) return;
    var barsEl = $('[data-bars]');
    var logEl = $('[data-log]');
    var checksEl = $('[data-checks]');
    var holdingEl = $('[data-holding]');
    var watchedEl = $('[data-watched]');

    var cells = [];
    for (var i = 0; i < 48; i++) {
      var c = document.createElement('div');
      c.className = 'cell';
      cellsEl.appendChild(c);
      cells.push(c);
    }
    if (barsEl) {
      for (var k = 0; k < 30; k++) {
        var b = document.createElement('div');
        if (k === 11) b.className = 'warn';
        if (k === 23) b.className = 'bad';
        barsEl.appendChild(b);
      }
    }

    var warnSets = [[6, 29, 41], [6, 30, 41], [7, 29, 33], [6, 29, 41]];
    var badSets = [[17], [17], [], [22]];
    var pool = [
      { unit: 'Vigiles', msg: 'api-eu-west latency back to normal' },
      { unit: 'Signifer', msg: 'alert sent to #ops-oncall' },
      { unit: 'Testudo', msg: 'nightly snapshot complete, 14 databases' },
      { unit: 'Aquila', msg: 'status page updated: investigating' },
      { unit: 'Praetorian', msg: 'SSO sign-in from new device approved' },
      { unit: 'Vigiles', msg: 'TLS cert for app.yourco.com renews in 21d' }
    ];
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function clock(totalMin) {
      var m = ((totalMin % 1440) + 1440) % 1440;
      return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
    }

    var tick = 0;
    function render() {
      var warn = warnSets[tick % 4], bad = badSets[tick % 4];
      cells.forEach(function (cell, idx) {
        cell.className = 'cell' + (bad.indexOf(idx) > -1 ? ' bad' : (warn.indexOf(idx) > -1 ? ' warn' : ''));
      });
      var watched = warn.length + bad.length;
      if (holdingEl) holdingEl.textContent = String(48 - watched);
      if (watchedEl) watchedEl.textContent = String(watched);
      if (checksEl) checksEl.textContent = (1284320 + tick * 3172).toLocaleString('en-GB');
      if (logEl) {
        // Newest first; the newest entry is always the newest pool item.
        var rows = [];
        for (var j = 0; j < 3; j++) {
          var p = pool[(tick - j + pool.length * 1000) % pool.length];
          var t = clock(6 * 60 + 42 + tick * 3 - j * 9);
          rows.push('<div><span class="t">' + t + '</span><span><span class="u">' + p.unit + '</span> · ' + p.msg + '</span></div>');
        }
        logEl.innerHTML = rows.join('');
      }
    }
    render();

    if (reduceMotion) return;
    var timer = null;
    function start() { if (!timer) timer = setInterval(function () { tick++; render(); }, 2400); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if (!document.hidden) start();
  }

  /* ---------- Muster calculator ---------- */
  var TIERS = [
    { name: 'Contubernium', days: 30, price: 490, cap: 50 },
    { name: 'Cohort', days: 90, price: 1190, cap: 250 },
    { name: 'Legion', days: 365, price: 3490, cap: Infinity }
  ];

  // Slider position 0–60 maps onto three even segments, so the
  // 10 / 50 / 250 / 600+ scale labels sit where their values are.
  function servicesAt(pos) {
    pos = Math.max(0, Math.min(60, pos));
    if (pos <= 20) return 10 + pos * 2;
    if (pos <= 40) return 50 + (pos - 20) * 10;
    return Math.round((250 + (pos - 40) * 17.5) / 10) * 10;
  }

  function initMuster() {
    var range = $('#svc-range');
    if (!range) return;
    var out = $('[data-svc-out]');
    var buttons = $all('[data-term]');
    var term = 90;

    function set(key, val) { $all('[data-rec="' + key + '"]').forEach(function (el) { el.textContent = val; }); }

    function update() {
      var pos = Number(range.value);
      var services = servicesAt(pos);
      var label = pos >= 60 ? '600+' : String(services);
      out.textContent = label;
      range.setAttribute('aria-valuetext', label + ' services');

      var bySize = services <= 50 ? 0 : (services <= 250 ? 1 : 2);
      var byTerm = term === 30 ? 0 : (term === 90 ? 1 : 2);
      var idx = Math.max(bySize, byTerm);
      var t = TIERS[idx];
      var note;
      if (bySize > byTerm) {
        note = label + ' services outgrows the ' + TIERS[byTerm].name + ' cap of ' + TIERS[byTerm].cap +
          ', so you march as ' + t.name + ' and get ' + t.days + ' days of cover for it.';
      } else if (idx === 2) {
        note = 'A full year, unlimited services, the SLA and a named account manager. The lowest cost per day of any term.';
      } else {
        note = 'Fits comfortably: ' + services + ' of ' + t.cap + ' services used, leaving room for ' +
          (t.cap - services) + ' more before you need a larger term.';
      }
      set('name', t.name);
      set('days', String(t.days));
      set('cap', t.cap === Infinity ? 'UNLIMITED' : String(t.cap));
      set('price', gbp(t.price, 0));
      set('perDay', gbp(t.price / t.days, 2));
      set('perSvc', gbp(t.price / t.days / services, 3));
      set('note', note);
      var link = $('a[data-rec="href"]');
      if (link) link.setAttribute('href', '/enlist?term=' + t.days + '&services=' + services);

      buttons.forEach(function (b) { b.setAttribute('aria-pressed', Number(b.dataset.term) === term ? 'true' : 'false'); });
    }

    range.addEventListener('input', update);
    range.addEventListener('change', update);
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { term = Number(b.dataset.term); update(); });
    });
    update();
  }

  /* ---------- Enlist page ---------- */
  function initEnlist() {
    var form = $('form[name="enlist"]');
    if (!form) return;
    var termSel = $('#term', form);
    var svc = $('#services', form);
    var summaryName = $('[data-sum="name"]');
    var summaryPrice = $('[data-sum="price"]');
    var cardBtn = $('[data-card-checkout]');
    var cardNote = $('[data-card-note]');
    var poFields = $('[data-po-fields]');

    var t = param('term');
    if (t && termSel.querySelector('option[value="' + t + '"]')) termSel.value = t;
    var s = Number(param('services'));
    if (svc && s > 0 && s <= 100000) svc.value = String(Math.round(s));

    function tierFor(days) {
      for (var i = 0; i < TIERS.length; i++) if (String(TIERS[i].days) === String(days)) return TIERS[i];
      return TIERS[1];
    }
    function refresh() {
      var tier = tierFor(termSel.value);
      if (summaryName) summaryName.textContent = tier.name + ' · ' + tier.days + ' days';
      if (summaryPrice) summaryPrice.textContent = gbp(tier.price, 0) + ' excl. VAT';
      var method = (form.querySelector('input[name="payment"]:checked') || {}).value;
      if (poFields) poFields.classList.toggle('hidden', method !== 'invoice');
    }
    termSel.addEventListener('change', refresh);
    $all('input[name="payment"]', form).forEach(function (r) { r.addEventListener('change', refresh); });
    refresh();

    // Card checkout via Paddle overlay, only when configured in /config.js.
    var cfg = (window.CASTRA_CONFIG && window.CASTRA_CONFIG.paddle) || {};
    var ready = cfg.clientToken && cfg.prices && cfg.prices['30'] && cfg.prices['90'] && cfg.prices['365'];
    if (!cardBtn) return;
    if (!ready) {
      cardBtn.classList.add('hidden');
      if (cardNote) cardNote.classList.remove('hidden');
      return;
    }
    var loaded = null;
    function loadPaddle() {
      if (loaded) return loaded;
      loaded = new Promise(function (resolve, reject) {
        var el = document.createElement('script');
        el.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        el.onload = function () {
          try {
            if (cfg.environment === 'sandbox') window.Paddle.Environment.set('sandbox');
            window.Paddle.Initialize({ token: cfg.clientToken });
            resolve(window.Paddle);
          } catch (err) { reject(err); }
        };
        el.onerror = function () { loaded = null; reject(new Error('Paddle failed to load')); };
        document.head.appendChild(el);
      });
      return loaded;
    }
    cardBtn.addEventListener('click', function () {
      var email = ($('#email', form) || {}).value || undefined;
      cardBtn.setAttribute('aria-busy', 'true');
      loadPaddle().then(function (Paddle) {
        Paddle.Checkout.open({
          items: [{ priceId: cfg.prices[termSel.value], quantity: 1 }],
          customer: email ? { email: email } : undefined,
          customData: { term_days: termSel.value, services: svc ? svc.value : '' },
          settings: { successUrl: window.location.origin + '/thanks?paid=1' }
        });
      }).catch(function () {
        if (cardNote) {
          cardNote.textContent = 'Card checkout could not load. Send the form below and we will email a payment link.';
          cardNote.classList.remove('hidden');
        }
      }).then(function () { cardBtn.removeAttribute('aria-busy'); });
    });
  }

  /* ---------- Contact page ---------- */
  function initContact() {
    var topic = $('form[name="contact"] #topic');
    if (!topic) return;
    var t = param('topic');
    if (t && topic.querySelector('option[value="' + t + '"]')) topic.value = t;
  }

  function init() { initMenu(); initDashboard(); initMuster(); initEnlist(); initContact(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
