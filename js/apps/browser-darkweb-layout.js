(function () {
  'use strict';
  if (!document.querySelector('link[data-darkweb-observations-style]')) {
    var observationStyle = document.createElement('link');
    observationStyle.rel = 'stylesheet';
    observationStyle.href = './styles/browser-darkweb-observations.css?v=' + window.ARG_BUILD_VERSION;
    observationStyle.dataset.darkwebObservationsStyle = 'true';
    document.head.appendChild(observationStyle);
  }
  if (!document.querySelector('link[data-darkweb-observations-redesign-style]')) {
    var observationRedesignStyle = document.createElement('link');
    observationRedesignStyle.rel = 'stylesheet';
    observationRedesignStyle.href = './styles/browser-darkweb-observations-redesign.css?v=' + window.ARG_BUILD_VERSION;
    observationRedesignStyle.dataset.darkwebObservationsRedesignStyle = 'true';
    document.head.appendChild(observationRedesignStyle);
  }
  if (!document.querySelector('link[data-darkweb-observation-eyes-style]')) {
    var observationEyesStyle = document.createElement('link');
    observationEyesStyle.rel = 'stylesheet';
    observationEyesStyle.href = './styles/browser-darkweb-observation-eyes.css?v=' + window.ARG_BUILD_VERSION;
    observationEyesStyle.dataset.darkwebObservationEyesStyle = 'true';
    document.head.appendChild(observationEyesStyle);
  }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]; }); }
  function state() { return window.ARG_DARKWEB_STATE.read(); }
  function guard() { if (!state().member.authenticated) { window.openBrowserPageById('darkweb.gate'); return false; } return true; }
  function adminGuard() { if (!guard()) return false; if (!state().admin.loggedIn) { window.openBrowserPageById('darkweb.admin.auth'); return false; } return true; }
  function enhance(root) {
    if (!root || root.dataset.layoutReady) return;
    root.dataset.layoutReady = 'true';
    ['contract', 'request', 'records'].forEach(function (name) { var section = root.querySelector('#' + name); if (section) section.id = 'darkweb-' + name; });
    if (!root.querySelector('.darkweb-side-ornament')) root.insertAdjacentHTML('afterbegin', '<aside class="darkweb-side-ornament darkweb-side-ornament--left" aria-hidden="true">因有所求　故有所偿<br>血脉相承　所愿有价<br>一念既起　代价随行<br>文莲记　因果相承</aside>');
    root.querySelectorAll('[data-admin-entry]').forEach(function (button) { button.onclick = function () { window.openBrowserPageById('darkweb.admin.auth'); }; });
  }
  function mountObservationEyes(root) {
    var page = root.querySelector('.darkweb-observations');
    if (!page || page.dataset.eyesMounted) return function () {};
    page.dataset.eyesMounted = 'true';
    var assets = {
      a: { open: './assets/eyes/processed/eyes1_Open_alpha.png', closed: './assets/eyes/processed/eyes1_Closed_alpha.png' },
      b: { open: './assets/eyes/processed/eyes2Open_alpha.png', closed: './assets/eyes/processed/eyes2_Closed_alpha.png' }
    };
    var plans = {
      '2020': ['static', 'static', 'static', 'static', 'static', 'static', 'static', 'static', 'static', 'blink'],
      '2021': ['static', 'static', 'static', 'static', 'static', 'static', 'static', 'static', 'static', 'blink', 'blink'],
      '2022': ['static', 'static', 'static', 'static', 'static', 'static', 'static', 'static', 'static', 'static', 'blink', 'blink', 'blink', 'blink'],
      '2023': ['static', 'static', 'static', 'static', 'static', 'static', 'static', 'static', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink'],
      '2024': ['static', 'static', 'static', 'static', 'static', 'static', 'static', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink'],
      '2025': ['static', 'static', 'static', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink'],
      '2026': ['blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink', 'blink']
    };
    var blinkTiming = {
      '2020': { initial: [3000, 10000], next: [8000, 16000], double: .03 },
      '2021': { initial: [2500, 8000], next: [7000, 14000], double: .03 },
      '2022': { initial: [2000, 6000], next: [6000, 12000], double: .03 },
      '2023': { initial: [1500, 5000], next: [5000, 10000], double: .05 },
      '2024': { initial: [1000, 4000], next: [4000, 8000], double: .05 },
      '2025': { initial: [500, 3000], next: [3000, 6000], double: .08 },
      '2026': { initial: [0, 1800], next: [1800, 4500], double: .11 }
    };
    var seeds = [{ x: 8, y: 8, r: -8 }, { x: 92, y: 13, r: 6 }, { x: 17, y: 27, r: 4 }, { x: 84, y: 33, r: -6 }, { x: 6, y: 45, r: 7 }, { x: 94, y: 54, r: -4 }, { x: 16, y: 63, r: -3 }, { x: 83, y: 70, r: 5 }, { x: 10, y: 82, r: -5 }, { x: 91, y: 91, r: 4 }, { x: 19, y: 12, r: -2 }, { x: 81, y: 23, r: 8 }, { x: 14, y: 38, r: 3 }, { x: 87, y: 47, r: -7 }, { x: 18, y: 76, r: 6 }, { x: 82, y: 86, r: -3 }];
    var layer = document.createElement('div');
    layer.className = 'darkweb-observation-image-eyes';
    layer.setAttribute('aria-hidden', 'true');
    page.appendChild(layer);
    var timeline = page.querySelector('.darkweb-observations__timeline');
    var placedEyes = [];
    var alive = true, frozen = false, timers = [], activeTimers = [], freezeObserver;
    function clearTimers() { timers.concat(activeTimers).forEach(clearTimeout); timers = []; activeTimers = []; }
    function destroy() {
      if (!alive) return;
      alive = false;
      clearTimers();
      observer.disconnect();
      if (freezeObserver) freezeObserver.disconnect();
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      delete page.dataset.eyesMounted;
    }
    var observer = new MutationObserver(function () {
      if (!root.querySelector('.darkweb-observations')) destroy();
    });
    observer.observe(root, { childList: true });
    function freezeObservationEyes() { if (frozen) return; frozen = true; timers.forEach(clearTimeout); timers = []; if (freezeObserver) freezeObserver.disconnect(); }
    Promise.all([assets.a.open, assets.a.closed, assets.b.open, assets.b.closed].map(function (src) {
        return new Promise(function (resolve) { var image = new Image(); image.onload = image.onerror = resolve; image.src = src; });
    })).then(function () {
      if (!alive) return;
      Array.prototype.forEach.call(page.querySelectorAll('[data-observation-year]'), function (zone, yearIndex) {
        var types = plans[zone.dataset.observationYear] || [];
        var zoneTop = (timeline ? timeline.offsetTop : 0) + zone.offsetTop, zoneHeight = zone.offsetHeight;
        types.forEach(function (type, index) {
        var seed = seeds[(index * 3 + yearIndex * 2) % seeds.length];
        var asset = assets[(index + yearIndex) % 2 ? 'a' : 'b'];
        var instance = document.createElement('div');
        var sizeRoll = (index * 37 + yearIndex * 19) % 100;
        var width = sizeRoll < 45 ? 90 + Math.random() * 35 : sizeRoll < 85 ? 135 + Math.random() * 40 : 185 + Math.random() * 40;
        var rotation = seed.r + Math.random() * 3 - 1.5;
        var lanes = [[5, 20], [20, 34], [66, 80], [80, 95]], selected, x, y, height, boxWidth, boxHeight, padding, placed = false, attempt = 0;
        while (attempt < 120) {
          selected = lanes[(index + yearIndex + attempt) % lanes.length];
          if (attempt === 24) width *= .86;
          if (attempt === 48) width *= .76;
          if (attempt === 72) width *= .68;
          if (attempt === 96) width *= .58;
          height = width / 2.5;
          boxWidth = Math.abs(width * Math.cos(rotation * Math.PI / 180)) + Math.abs(height * Math.sin(rotation * Math.PI / 180));
          boxHeight = Math.abs(width * Math.sin(rotation * Math.PI / 180)) + Math.abs(height * Math.cos(rotation * Math.PI / 180));
          x = selected[0] + Math.random() * (selected[1] - selected[0]);
          y = zoneTop + boxHeight / 2 + Math.random() * Math.max(1, zoneHeight - boxHeight);
          padding = 2 + Math.random() * 8;
          if (!placedEyes.some(function (eye) { return Math.abs(x * page.clientWidth / 100 - eye.x) < boxWidth / 2 + eye.width / 2 + padding && Math.abs(y - eye.y) < boxHeight / 2 + eye.height / 2 + padding; })) { placed = true; break; }
          attempt += 1;
        }
        if (!placed) return;
        placedEyes.push({ x: x * page.clientWidth / 100, y: y, width: boxWidth, height: boxHeight });
        instance.className = 'darkweb-observation-image-eye darkweb-observation-image-eye--' + (width < 130 ? 'small' : width < 180 ? 'medium' : 'large');
        instance.style.setProperty('--eye-x', x + '%');
        instance.style.setProperty('--eye-y', y + 'px');
        instance.style.setProperty('--eye-width', width + 'px');
        instance.style.setProperty('--eye-opacity', Math.min(.65, .08 + yearIndex * .065 + (index % 5) * .055));
        instance.style.setProperty('--eye-rotate', rotation + 'deg');
        instance.style.setProperty('--eye-mirror', (index + yearIndex) % 3 === 0 ? '-1' : '1');
        instance.style.setProperty('--eye-blur', width < 130 ? (Math.random() * .8).toFixed(2) + 'px' : '0px');
        instance.style.setProperty('--eye-layer', String((index + yearIndex) % 3));
        instance.innerHTML = '<img class="darkweb-observation-image-eye__open" src="' + asset.open + '" alt=""><img class="darkweb-observation-image-eye__closed" src="' + asset.closed + '" alt="">';
        layer.appendChild(instance);
        function wait(delay, callback, active) { var pool = active ? activeTimers : timers; var timer = setTimeout(function () { var timerIndex = pool.indexOf(timer); if (timerIndex !== -1) pool.splice(timerIndex, 1); if (alive && (!frozen || active)) callback(); }, delay); pool.push(timer); }
        function change(closed, duration) {
          instance.style.setProperty('--eye-fade-duration', duration + 'ms');
          instance.classList.toggle('is-closed', closed);
        }
        function normalBlink(done) {
            var closeDuration = 80 + Math.random() * 60, closedPause = 70 + Math.random() * 60;
            change(true, closeDuration);
            wait(closeDuration + closedPause, function () {
              var openDuration = 80 + Math.random() * 60;
              change(false, openDuration);
              wait(openDuration, done, true);
            }, true);
        }
        var timing = blinkTiming[zone.dataset.observationYear] || { initial: [2000, 6000], next: [6000, 12000], double: .03 };
        function randomDelay(range) { return range[0] + Math.random() * (range[1] - range[0]); }
        function scheduleBlink(initial) { if (frozen) return; wait(randomDelay(initial ? timing.initial : timing.next), function () { normalBlink(function () { if (Math.random() < timing.double) wait(100 + Math.random() * 120, function () { normalBlink(function () { scheduleBlink(false); }); }, true); else scheduleBlink(false); }); }); }
        if (type === 'blink') scheduleBlink(true);
        });
      });
      var sentinel = page.querySelector('[data-observation-freeze]');
      if (sentinel) { freezeObserver = new IntersectionObserver(function (entries) { if (entries.some(function (entry) { return entry.isIntersecting; })) freezeObservationEyes(); }, { threshold: .2 }); freezeObserver.observe(sentinel); }
    });
    return destroy;
  }
  function sectionPage(section) { return section === 'logs' ? 'darkweb.admin.logs' : 'darkweb.admin.trades'; }
  function shell(section, title, body) { var observations = body.indexOf('darkweb-observations') !== -1; return '<section class="darkweb-app darkweb-admin-shell' + (observations ? ' darkweb-admin-shell--observations' : '') + '"><header><small>内部资料</small><button type="button" data-admin-exit>退出管理</button></header><nav class="darkweb-admin-nav"><button type="button" data-admin-go="darkweb.admin.trades"' + (section === 'observation' ? ' class="is-active"' : '') + '>观测记录</button><button type="button" data-admin-go="darkweb.admin.logs"' + (section === 'logs' ? ' class="is-active"' : '') + '>日志</button></nav><main>' + (observations ? '' : '<h1>' + escapeHtml(title) + '</h1>') + body + '</main></section>'; }
  function bindShell(root, section) { window.ARG_DARKWEB_STATE.update(function (nextState) { nextState.admin.lastSection = section; }); root.querySelectorAll('[data-admin-go]').forEach(function (button) { button.onclick = function () { window.openBrowserPageById(button.dataset.adminGo); }; }); root.querySelector('[data-admin-exit]').onclick = function () { window.ARG_DARKWEB_STATE.update(function (nextState) { nextState.admin.loggedIn = false; }); window.openBrowserPageById('darkweb.home'); }; }
  window.ARG_DARKWEB_ADMIN = { shell: shell, bindShell: bindShell, sectionPage: sectionPage };
  window.bindDarkwebAdminView = function (root) { if (root && root.querySelector('.darkweb-observations')) { bindShell(root, 'observation'); mountObservationEyes(root); } };
  window.registerBrowserPage('darkweb.admin.home', function () { if (!adminGuard()) return null; window.openBrowserPageById(sectionPage(state().admin.lastSection)); return null; });
  window.registerBrowserPage('darkweb.admin.trades', function () {
    if (!adminGuard()) return null;
    return fetch('./data/darkweb/observations.json', { cache: 'no-store' }).then(function (response) { return response.json(); }).then(function (records) {
      var grouped = records.reduce(function (groups, record) { (groups[record.year] || (groups[record.year] = [])).push(record); return groups; }, {});
      var entries = Object.keys(grouped).map(function (year) { return '<section class="darkweb-observation-year-zone" data-observation-year="' + escapeHtml(year) + '"><div class="darkweb-observation-year"><b>' + escapeHtml(year) + '</b></div>' + grouped[year].map(function (record) {
        var fields = [['日期', record.time], ['所求', record.wish], ['牺牲关系', record.relation], ['血缘', record.blood], ['亲缘', record.kinship], ['对象数量', record.count], ['结果', record.result]].map(function (field) { return '<div class="darkweb-observation__field"><b>' + field[0] + '</b><span>' + escapeHtml(field[1]) + '</span></div>'; }).join('');
        return '<article class="darkweb-observation' + (record.kind ? ' darkweb-observation--origin' : '') + (record.year === '2026' ? ' darkweb-observation--final' : '') + '"><div class="darkweb-observation__top"><b class="darkweb-observation__id">' + escapeHtml(record.id) + '</b><span class="darkweb-observation__status">' + escapeHtml(record.kind || record.status) + '</span></div><div class="darkweb-observation__fields">' + fields + '</div></article>';
      }).join('') + '</section>'; }).join('') + '<div data-observation-freeze aria-hidden="true"></div>';
      return {
        url: 'https://wenlian-charity.local/admin/observations/',
        html: shell('observation', '观测记录', '<section class="darkweb-observations"><div class="darkweb-observations__header"><div><small>WL · INTERNAL OBSERVATION ARCHIVE</small><h1>观测记录</h1></div><span class="darkweb-observations__count">' + String(records.length).padStart(3, '0') + ' / ARCHIVED</span></div><div class="darkweb-observations__timeline">' + entries + '</div></section>'),
        enhance: function (root) {
          bindShell(root, 'observation');
          mountObservationEyes(root);
        }
      };
    });
  });
  window.registerBrowserPage('darkweb.admin.auth', function () {
    if (!guard()) return null;
    if (state().admin.loggedIn) { window.openBrowserPageById(sectionPage(state().admin.lastSection)); return null; }
    return fetch('./data/darkweb/index.json', { cache: 'no-store' }).then(function (response) { return response.json(); }).then(function (data) {
      return { url: 'https://wenlian-charity.local/admin/auth/', html: '<section class="darkweb-app darkweb-home"><div class="darkweb-admin-modal"><form data-admin-auth><small>内部验证</small><label>账号<input name="username" autocomplete="username"></label><label>密码<input name="password" type="password" autocomplete="current-password"></label><p data-admin-error aria-live="polite"></p><button type="submit">进入</button><button type="button" data-admin-cancel>返回</button></form></div></section>', enhance: function (root) {
        var form = root.querySelector('[data-admin-auth]');
        var error = root.querySelector('[data-admin-error]');
        form.onsubmit = function (event) {
          event.preventDefault();
          if (!data.admin.username || !data.admin.password || form.elements.username.value !== data.admin.username || form.elements.password.value !== data.admin.password) { error.textContent = '内部验证未通过。'; return; }
          window.ARG_DARKWEB_STATE.update(function (nextState) { nextState.admin.loggedIn = true; nextState.admin.lastSection = 'observation'; });
          window.openBrowserPageById('darkweb.admin.trades');
        };
        root.querySelector('[data-admin-cancel]').onclick = function () { window.openBrowserPageById('darkweb.home'); };
      } };
    });
  });
  document.addEventListener('click', function (event) {
    var button = event.target.closest('.darkweb-home [data-go]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var root = button.closest('.darkweb-home');
    var view = root.closest('.arg-browser-view');
    var target = root.querySelector('#darkweb-' + button.dataset.go);
    if (view && target) view.scrollTo({ top: target.getBoundingClientRect().top - view.getBoundingClientRect().top + view.scrollTop - 16, behavior: 'smooth' });
  }, true);
  new MutationObserver(function () { document.querySelectorAll('.darkweb-home').forEach(enhance); }).observe(document.documentElement, { childList: true, subtree: true });
}());
