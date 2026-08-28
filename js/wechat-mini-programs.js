(function () {
  'use strict';
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]; }); }
  function listHtml(apps) { return '<header class="wx-mini-title">\u5c0f\u7a0b\u5e8f</header><section class="wx-mini-list">' + apps.map(function (app) { return '<button class="wx-mini-card" data-mini-program="' + esc(app.id) + '"><span class="wx-mini-icon">\ud83c\udfa3</span><span><strong>' + esc(app.name) + '</strong><small>' + esc(app.description || '\u672c\u5730\u5c0f\u7a0b\u5e8f') + '</small></span><b>\u203a</b></button>'; }).join('') + '</section>'; }
  function fishing(app, mount, onBack) {
    var config = app.fishing || {}, minWait = Number(config.waitMinMs) || 1800, maxWait = Number(config.waitMaxMs) || 4200, reaction = Number(config.reactionMs) || 1100, biteTimer, missTimer, state = 'ready', caught = null, pendingCatchReport = false, progressKey = 'arg-fishing-progress-v1', progress = loadProgress();
    function loadProgress() { try { return Object.assign({ version: 1, successfulCatchCount: 0 }, JSON.parse(localStorage.getItem(progressKey) || '{}') || {}); } catch (error) { return { version: 1, successfulCatchCount: 0 }; } }
    function saveProgress() { localStorage.setItem(progressKey, JSON.stringify(progress)); }
    function mentorAllCasesArchived() { try { var wechat = JSON.parse(localStorage.getItem('arg-wechat-progress-v1') || '{}') || {}; return !!(wechat.triggered && wechat.triggered['mentor-all-cases-archived']); } catch (error) { return false; } }
    function reportSuccessfulCatch() { if (window.ARG_STORY && typeof window.ARG_STORY.reportEvent === 'function') window.ARG_STORY.reportEvent('fishing-catch-success', { successfulCatchCount: progress.successfulCatchCount, mentorAllCasesArchived: mentorAllCasesArchived() }); }
    function stop() { clearTimeout(biteTimer); clearTimeout(missTimer); }
    function catchOne() { var items = (config.items || []).filter(function (item) { return item && item.name; }); return items.length ? items[Math.floor(Math.random() * items.length)] : { name: '\u795e\u79d8\u6c34\u82b1' }; }
    function resultHtml() {
      if (!caught) return '';
      return '<div class="wx-fishing-result-layer" role="dialog" aria-modal="true" aria-label="\u9493\u9c7c\u7ed3\u679c"><section class="wx-fishing-result"><p class="wx-fishing-result-title">Cheems \u6536\u7aff\u6210\u529f</p>' +
        (caught.imageUrl ? '<img src="' + esc(caught.imageUrl) + '" alt="' + esc(caught.name) + '">' : '<div class="wx-fishing-result-placeholder">?</div>') +
        '<strong>' + esc(caught.name) + '</strong><p class="wx-fishing-result-note">' + esc(caught.note || '\u6682\u672a\u586b\u5199\u5907\u6ce8') + '</p><button type="button" data-fishing-confirm>\u786e\u5b9a</button></section></div>';
    }
    function connectFishingLine() {
      var stage = mount.querySelector('.wx-fishing-stage'), rod = mount.querySelector('.wx-fishing-rod'), bobber = mount.querySelector('[data-fishing-bobber]');
      if (!stage || !rod || !bobber) return;
      var tip = document.createElement('span'), svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tip.className = 'wx-fishing-rod-tip'; rod.appendChild(tip);
      svg.setAttribute('class', 'wx-fishing-svg-line'); svg.setAttribute('aria-hidden', 'true'); svg.appendChild(path); stage.appendChild(svg);
      var until = Date.now() + 750;
      function update() {
        var stageBox = stage.getBoundingClientRect(), tipBox = tip.getBoundingClientRect(), bobberBox = bobber.getBoundingClientRect();
        var x1 = tipBox.left + tipBox.width / 2 - stageBox.left, y1 = tipBox.top + tipBox.height / 2 - stageBox.top, x2 = bobberBox.left + bobberBox.width / 2 - stageBox.left, y2 = bobberBox.top + bobberBox.height / 2 - stageBox.top;
        path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' Q ' + ((x1 + x2) / 2) + ' ' + (Math.max(y1, y2) - 18) + ' ' + x2 + ' ' + y2);
        if (Date.now() < until) requestAnimationFrame(update);
      }
      update();
    }
    function draw(message) {
      mount.innerHTML = '<section class="wx-fishing-game" data-state="' + state + '"><header class="wx-fishing-top"><button type="button" data-fishing-back>\u2039 \u8fd4\u56de\u5c0f\u7a0b\u5e8f</button><strong>' + esc(app.name || '\u9493\u9c7c') + '</strong><span>Cheems \u5782\u9493\u4e2d</span></header><div class="wx-fishing-stage"><div class="wx-fishing-sun"></div><div class="wx-fishing-bank"><div class="wx-fishing-cheems"></div><div class="wx-fishing-rod" aria-hidden="true"></div><div class="wx-fishing-line" aria-hidden="true"></div></div><button class="wx-fishing-bobber" type="button" data-fishing-bobber aria-label="\u70b9\u51fb\u6d6e\u6f02"><i>' + (state === 'bite' ? '!' : '') + '</i></button><div class="wx-fishing-water"></div></div><section class="wx-fishing-panel"><p>' + esc(message) + '</p><button type="button" class="wx-fishing-cast" data-fishing-cast' + (state === 'waiting' || state === 'bite' ? ' disabled' : '') + '>' + (state === 'waiting' ? '\u8010\u5fc3\u7b49\u5f85\u2026' : state === 'bite' ? '\u5feb\u70b9\u51fb\u6d6e\u6f02\uff01' : '\u629b\u7aff') + '</button></section>' + resultHtml() + '</section>';
      connectFishingLine();
      mount.querySelector('[data-fishing-back]').onclick = function () { stop(); onBack(); };
      mount.querySelector('[data-fishing-cast]').onclick = cast;
      mount.querySelector('[data-fishing-bobber]').onclick = hook;
      var confirm = mount.querySelector('[data-fishing-confirm]');
      if (confirm) confirm.onclick = function () { var report = pendingCatchReport; pendingCatchReport = false; caught = null; state = 'ready'; draw('\u6536\u83b7\u5df2\u653e\u8fdb\u80cc\u5305\uff0c\u7ee7\u7eed\u8bd5\u8bd5\u5427\u3002'); if (report) reportSuccessfulCatch(); };
    }
    function cast() { if (state === 'waiting' || state === 'bite') return; stop(); caught = null; state = 'waiting'; draw('Cheems \u5df2\u629b\u7aff\uff0c\u9759\u5019\u6c34\u9762\u52a8\u9759\u2026\u2026'); biteTimer = setTimeout(function () { state = 'bite'; draw('\u6709\u4e1c\u897f\u54ac\u94a9\u4e86\uff01\u7acb\u523b\u70b9\u51fb\u6c34\u9762\u7684\u6d6e\u6f02\uff01'); missTimer = setTimeout(function () { if (state === 'bite') { state = 'missed'; draw('\u6162\u4e86\u4e00\u6b65\uff0c\u5b83\u6e9c\u56de\u6c34\u91cc\u4e86\u3002'); } }, reaction); }, minWait + Math.random() * Math.max(0, maxWait - minWait)); }
    function hook() { if (state !== 'bite') return; stop(); caught = catchOne(); progress.successfulCatchCount += 1; saveProgress(); pendingCatchReport = true; state = 'caught'; draw('Cheems \u6b63\u5728\u6536\u7aff\u2026\u2026'); }
    draw('\u4eca\u5929\u6c34\u91cc\u4f1a\u6709\u4ec0\u4e48\uff1f\u8ba9 Cheems \u6765\u8bd5\u8bd5\u3002');
  }
  window.ARG_WECHAT_MINI_PROGRAMS = { listHtml: listHtml, open: function (app, mount, onBack) { if (app && app.type === 'fishing') fishing(app, mount, onBack); } };
  document.addEventListener('click', function (event) { if (event.target.closest('[data-a="restart"],[data-dev="reset"]')) localStorage.removeItem('arg-fishing-progress-v1'); }, true);
}());
