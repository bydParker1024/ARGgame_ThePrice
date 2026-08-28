(function () {
  'use strict';
  var unlockKey = 'darkweb.logUnlocked';
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function renderMarkdown(value) { return String(value == null ? '' : value).split(/\r?\n\s*\r?\n/).map(function (paragraph) { return '<p>' + escapeHtml(paragraph).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\r?\n/g, '<br>') + '</p>'; }).join(''); }
  function load() { return fetch('./data/darkweb/logs.json', { cache: 'no-store' }).then(function (response) { if (!response.ok) throw Error('日志数据读取失败'); return response.json(); }).then(function (data) { if (!data || !Array.isArray(data.logs)) throw Error('日志数据格式无效'); return data.logs.slice().sort(function (a, b) { return Number(a.order) - Number(b.order); }); }); }
  function unlocked() { try { return JSON.parse(localStorage.getItem(unlockKey) || '{}'); } catch (error) { return {}; } }
  function isUnlocked(log) { var saved = unlocked()[log.id]; return !log.locked || !!(saved && saved.version === log.lockVersion); }
  function saveUnlock(log) { var saved = unlocked(); saved[log.id] = { version: log.lockVersion }; localStorage.setItem(unlockKey, JSON.stringify(saved)); }
  function shell(body) { return window.ARG_DARKWEB_ADMIN.shell('logs', '日志', body).replace('darkweb-admin-shell', 'darkweb-admin-shell darkweb-log-shell'); }
  function bindShell(root) { window.ARG_DARKWEB_ADMIN.bindShell(root, 'logs'); }
  function guarded() { var state = window.ARG_DARKWEB_STATE.read(); if (!state.member.authenticated) { window.openBrowserPageById('darkweb.gate'); return false; } if (!state.admin.loggedIn) { window.openBrowserPageById('darkweb.admin.auth'); return false; } return true; }
  var selectedId = '';
  function openList() { window.openBrowserPageById('darkweb.admin.logs'); }
  window.bindDarkwebLogsView = function (root) { if (!root || !root.querySelector('.darkweb-log-shell')) return; bindShell(root); root.querySelectorAll('[data-log-id]').forEach(function (button) { button.onclick = function () { selectedId = button.dataset.logId; window.openBrowserPageById('darkweb.admin.log'); }; }); };
  window.registerBrowserPage('darkweb.admin.logs', function () {
    if (!guarded()) return null;
    return load().then(function (logs) {
      return { url: 'https://wenlian-charity.local/admin/logs/', html: shell('<section class="darkweb-logs"><p class="darkweb-logs__intro">私密记录</p><div class="darkweb-logs__list">' + logs.map(function (log) { var locked = log.locked && !isUnlocked(log); return '<button type="button" class="darkweb-log-item' + (locked ? ' is-locked' : '') + '" data-log-id="' + escapeHtml(log.id) + '"><span>' + escapeHtml(log.title) + '</span><small>' + (locked ? '锁定' : log.locked ? '已验证' : '记录') + '</small></button>'; }).join('') + '</div></section>'), enhance: window.bindDarkwebLogsView };
    }).catch(function (error) { console.error('[ARG Darkweb Logs]', error); return { url: 'https://wenlian-charity.local/admin/logs/', html: shell('<p class="darkweb-logs__error">日志数据读取失败</p>'), enhance: bindShell }; });
  });
  window.registerBrowserPage('darkweb.admin.log', function () { return detail(selectedId); });
  function detail(id) {
    if (!guarded()) return null;
    return load().then(function (logs) { var log = logs.filter(function (item) { return item.id === id; })[0]; return log ? pageFor(log) : null; });
  }
  function pageFor(log) {
    var locked = log.locked && !isUnlocked(log);
    function reportRead() {
      if (log.id === 'log-6' && window.ARG_STORY && typeof window.ARG_STORY.reportEvent === 'function') window.ARG_STORY.reportEvent('final-log-read', { logId: log.id });
    }
    var body = locked ? '<section class="darkweb-log-lock"><p>访问受限</p><h2>' + escapeHtml(log.title) + '</h2><form data-log-unlock><label>凭证<input name="password" type="password" autocomplete="off"></label>' + (log.lockHint ? '<small>' + escapeHtml(log.lockHint) + '</small>' : '') + '<p aria-live="polite"></p><button type="submit">确认</button><button type="button" data-log-return>返回日志</button></form></section>' : '<article class="darkweb-log-entry"><p class="darkweb-logs__intro">内部记录</p><h2>' + escapeHtml(log.title) + '</h2><div class="darkweb-log-entry__content">' + (log.content ? renderMarkdown(log.content) : '<p>暂无记录</p>') + '</div><button type="button" data-log-return>返回日志</button></article>';
    return { url: 'https://wenlian-charity.local/admin/logs/' + encodeURIComponent(log.id) + '/', html: shell(body), enhance: function (root) { bindShell(root); if (!locked) reportRead(); var back = root.querySelector('[data-log-return]'); if (back) back.onclick = openList; var form = root.querySelector('[data-log-unlock]'); if (form) form.onsubmit = function (event) { event.preventDefault(); if (form.elements.password.value !== log.password) { form.querySelector('p').textContent = '验证失败'; return; } saveUnlock(log); selectedId = log.id; window.openBrowserPageById('darkweb.admin.log'); }; } };
  }
}());
