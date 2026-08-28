(function () {
  'use strict';
  var config, loading;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function load() { if (config) return Promise.resolve(config); if (loading) return loading; return loading = fetch('./data/darkweb/index.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw Error('load'); return r.json(); }).then(function (data) { config = data; return data; }); }
  function page(id) {
    return load().then(function (data) {
      var state = window.ARG_DARKWEB_STATE.read();
      if (id === 'darkweb.home' && !state.member.authenticated) id = 'darkweb.gate';
      if (id === 'darkweb.home') return { url: data.entry.hiddenUrl, html: '<section class="darkweb-app darkweb-shell"><header class="darkweb-header"><b>' + esc(data.entry.title) + '</b><span>内部合作项目</span></header><nav class="darkweb-nav"><button type="button">项目说明</button><button type="button">申请登记</button><button type="button">我的申请</button><button type="button">内部管理</button></nav><main><section class="darkweb-panel darkweb-hero"><p>合作项目概览</p><div class="darkweb-media-placeholder">媒体区域待补充</div></section><section class="darkweb-panel"><h1>内部合作项目</h1><p>相关功能将在后续阶段开放。</p></section></main></section>' };
      return { url: data.entry.hiddenUrl, html: '<section class="darkweb-app darkweb-gate"><div class="darkweb-panel"><p class="darkweb-kicker">内部合作项目</p><h1>' + esc(data.entry.title) + '</h1><h2>' + esc(data.memberAccess.title) + '</h2><p>本平台仅向已登记合作人员开放。</p><form data-darkweb-gate><label>' + esc(data.memberAccess.label) + '<input name="code" autocomplete="off" placeholder="' + esc(data.memberAccess.placeholder) + '"></label><p class="darkweb-message" aria-live="polite">' + esc(data.memberAccess.helperText) + '</p><button type="submit">' + esc(data.memberAccess.submitLabel) + '</button></form></div></section>', enhance: function (root) { var form = root.querySelector('[data-darkweb-gate]'), input = form.elements.code, message = root.querySelector('.darkweb-message'); input.addEventListener('input', function () { message.textContent = data.memberAccess.helperText; message.classList.remove('is-error'); }); form.addEventListener('submit', function (event) { event.preventDefault(); var entered = input.value.trim(), allowed = String(data.memberAccess.code || ''); if (!allowed || entered !== allowed) { window.ARG_DARKWEB_STATE.update(function (s) { s.member.failedAttempts += 1; }); message.textContent = data.memberAccess.invalidMessage; message.classList.add('is-error'); return; } window.ARG_DARKWEB_STATE.update(function (s) { s.member.authenticated = true; }); window.openBrowserPageById('darkweb.home'); }); } };
    });
  }
  window.registerBrowserPage('darkweb.gate', function () { return page('darkweb.gate'); });
  window.ARG_DARKWEB = { open: function () { window.openBrowserPageById(window.ARG_DARKWEB_STATE.read().member.authenticated ? 'darkweb.home' : 'darkweb.gate'); } };
}());
