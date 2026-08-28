(function () {
  'use strict';

  var root = document.getElementById('app-root');
  if (!document.querySelector('link[data-browser-window-default-style]')) {
    var browserWindowStyle = document.createElement('link');
    browserWindowStyle.rel = 'stylesheet';
    browserWindowStyle.href = './styles/browser-window-default.css?v=20260825a';
    browserWindowStyle.dataset.browserWindowDefaultStyle = 'true';
    document.head.appendChild(browserWindowStyle);
  }

  function getApps() {
    var catalog = (window.ARG_LOCAL_DATA && window.ARG_LOCAL_DATA.apps) || [];
    var config = window.ARG_DESKTOP_CONFIG || {};
    var hidden = config.hiddenApps || [];
    var labels = config.labels || {};
    var icons = config.icons || {};
    return catalog.filter(function (app) {
      return !hidden.includes(app.id);
    }).map(function (app) {
      return Object.assign({}, app, {
        label: labels[app.id] || app.name,
        customIcon: icons[app.id] || ''
      });
    });
  }

  function icon(app) {
    return '<span class="win-app-icon" style="--app-color:' + app.color + '">' + (app.customIcon || app.icon) + '</span>';
  }

  function updateWechatBadge() {
    var unread = {};
    try { unread = JSON.parse(localStorage.getItem('arg-wechat-unread-v1') || '{}'); } catch (error) {}
    var hasUnread = Object.keys(unread).some(function (id) { return unread[id]; });
    root.querySelectorAll('[data-app="chat"]').forEach(function (button) {
      var old = button.querySelector('.win-wechat-badge'); if (old) old.remove();
      if (hasUnread) button.insertAdjacentHTML('beforeend', '<i class="win-wechat-badge" aria-label="微信有未读消息"></i>');
    });
  }

  function render() {
    var device = root.querySelector('.device');
    if (!device || device.dataset.windowsDesktop === 'true') return;
    device.dataset.windowsDesktop = 'true';

    var apps = getApps();
    device.innerHTML =
      '<section class="win-desktop">' +
        '<div class="win-desktop-icons">' +
          apps.map(function (app) {
            return '<button class="win-desktop-app" data-app="' + app.id + '">' +
              icon(app) + '<span>' + app.label + '</span></button>';
          }).join('') +
        '</div>' +
        '<section class="win-window-layer" aria-live="polite"></section>' +
        '<footer class="win-taskbar">' +
          '<div class="win-taskbar-apps">' +
            '<button class="win-start" type="button" aria-label="开始菜单"><i></i><i></i><i></i><i></i></button>' +
            apps.map(function (app) {
              return '<button class="win-taskbar-app" data-app="' + app.id + '" aria-label="' + app.label + '">' + icon(app) + '</button>';
            }).join('') +
          '</div>' +
          '<div class="win-system-tray"><span class="win-network">⌁</span><span class="win-volume">◖</span><time></time></div>' +
        '</footer>' +
      '</section>';

    device.querySelector('.win-desktop-icons').onclick = onAppClick;
    device.querySelector('.win-taskbar-apps').onclick = onAppClick;
    updateTime(device);
    updateWechatBadge();
    window.clearInterval(window.argWindowsClock);
    window.argWindowsClock = window.setInterval(function () { updateTime(device); }, 30000);
  }

  function onAppClick(event) {
    var button = event.target.closest('[data-app]');
    if (button) openApp(button.dataset.app);
  }

  function updateTime(device) {
    var time = device.querySelector('time');
    if (time) time.textContent = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  }

  var nextWindowZ = 10;

  function bringToFront(host) { host.style.zIndex = String(++nextWindowZ); }

  function openApp(id) {
    var app = getApps().find(function (item) { return item.id === id; });
    var layer = root.querySelector('.win-window-layer');
    if (!app || !layer) return;
    var host = layer.querySelector('.win-app-host[data-app-id="' + id + '"]');
    if (host) {
      host.classList.remove('is-minimized');
      bringToFront(host);
      return;
    }
    host = document.createElement('section');
    host.className = 'win-app-host';
    host.dataset.appId = id;
    if (id === 'browser') host.classList.add('win-app-host--browser');
    layer.appendChild(host);
    bringToFront(host);
    host.addEventListener('pointerdown', function () { bringToFront(host); });
    if (id === 'chat' && window.ARG_WECHAT) {
      window.ARG_WECHAT.open(host);
      return;
    }
    host.innerHTML =
      '<article class="win-window">' +
        '<header class="win-window-title">' + icon(app) + '<span>' + app.label + '</span><div class="win-window-controls"><button data-window-action="minimize" aria-label="最小化">—</button><button data-window-action="maximize" aria-label="最大化">□</button><button data-window-action="close" class="win-close" aria-label="关闭">×</button></div></header>' +
        '<div class="win-window-content"><div class="win-loading">正在打开…</div></div>' +
      '</article>';
    enableWindowInteractions(host);
    loadApp(app, host.querySelector('.win-window-content'));
  }

  function enableWindowInteractions(host) {
    var win = host.querySelector('.win-window');
    var titleBar = host.querySelector('.win-window-title');
    var restoreStyle = '';
    if (!win || !titleBar) return;
    enableResize(win, host, 520, 360);

    function toggleMaximize() {
      var button = host.querySelector('[data-window-action="maximize"]');
      if (!win.classList.contains('is-maximized')) {
        restoreStyle = win.getAttribute('style') || '';
        win.classList.add('is-maximized');
      } else {
        win.classList.remove('is-maximized');
        if (restoreStyle) win.setAttribute('style', restoreStyle); else win.removeAttribute('style');
      }
      if (button) {
        var maximized = win.classList.contains('is-maximized');
        button.textContent = maximized ? '❐' : '□';
        button.setAttribute('aria-label', maximized ? '还原' : '最大化');
      }
    }

    titleBar.addEventListener('dblclick', function (event) {
      if (!event.target.closest('button')) toggleMaximize();
    });
    titleBar.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || event.target.closest('button') || win.classList.contains('is-maximized')) return;
      var winRect = win.getBoundingClientRect();
      var layerRect = host.getBoundingClientRect();
      var offsetX = event.clientX - winRect.left;
      var offsetY = event.clientY - winRect.top;
      win.style.position = 'absolute';
      win.style.left = (winRect.left - layerRect.left) + 'px';
      win.style.top = (winRect.top - layerRect.top) + 'px';
      win.style.margin = '0';
      titleBar.setPointerCapture(event.pointerId);
      function move(moveEvent) {
        var currentLayer = host.getBoundingClientRect();
        var maxLeft = Math.max(0, currentLayer.width - win.offsetWidth);
        var maxTop = Math.max(0, currentLayer.height - win.offsetHeight);
        win.style.left = Math.max(0, Math.min(maxLeft, moveEvent.clientX - currentLayer.left - offsetX)) + 'px';
        win.style.top = Math.max(0, Math.min(maxTop, moveEvent.clientY - currentLayer.top - offsetY)) + 'px';
      }
      function finish() {
        titleBar.removeEventListener('pointermove', move);
        titleBar.removeEventListener('pointerup', finish);
        titleBar.removeEventListener('pointercancel', finish);
      }
      titleBar.addEventListener('pointermove', move);
      titleBar.addEventListener('pointerup', finish);
      titleBar.addEventListener('pointercancel', finish);
      event.preventDefault();
    });
    host.querySelector('.win-window-controls').onclick = function (event) {
      var button = event.target.closest('[data-window-action]');
      if (!button) return;
      if (button.dataset.windowAction === 'minimize') host.classList.add('is-minimized');
      if (button.dataset.windowAction === 'maximize') toggleMaximize();
      if (button.dataset.windowAction === 'close') {
        host.remove();
      }
    };
  }

  function enableResize(win, layer, minWidth, minHeight) {
    ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'].forEach(function (edge) {
      var handle = document.createElement('span');
      handle.className = 'win-resize-handle win-resize-' + edge;
      handle.dataset.edge = edge;
      win.appendChild(handle);
      handle.addEventListener('pointerdown', function (event) {
        if (event.button !== 0 || win.classList.contains('is-maximized')) return;
        var rect = win.getBoundingClientRect(), bounds = layer.getBoundingClientRect();
        var start = { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height, pointerX: event.clientX, pointerY: event.clientY };
        win.style.position = 'absolute';
        win.style.left = start.x + 'px'; win.style.top = start.y + 'px';
        win.style.width = start.width + 'px'; win.style.height = start.height + 'px';
        win.style.maxWidth = 'none'; win.style.maxHeight = 'none'; win.style.margin = '0';
        handle.setPointerCapture(event.pointerId);
        function move(moveEvent) {
          var dx = moveEvent.clientX - start.pointerX, dy = moveEvent.clientY - start.pointerY;
          var left = start.x, top = start.y, width = start.width, height = start.height;
          if (edge.indexOf('e') >= 0) width = Math.max(minWidth, Math.min(bounds.width - left, start.width + dx));
          if (edge.indexOf('s') >= 0) height = Math.max(minHeight, Math.min(bounds.height - top, start.height + dy));
          if (edge.indexOf('w') >= 0) { left = Math.max(0, Math.min(start.x + start.width - minWidth, start.x + dx)); width = start.width + start.x - left; }
          if (edge.indexOf('n') >= 0) { top = Math.max(0, Math.min(start.y + start.height - minHeight, start.y + dy)); height = start.height + start.y - top; }
          win.style.left = left + 'px'; win.style.top = top + 'px'; win.style.width = width + 'px'; win.style.height = height + 'px';
        }
        function finish() { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', finish); handle.removeEventListener('pointercancel', finish); }
        handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', finish); handle.addEventListener('pointercancel', finish);
        event.preventDefault(); event.stopPropagation();
      });
    });
  }

  function loadApp(app, content) {
    if (app.id === 'files') {
      if (window.ARG_FILES && typeof window.ARG_FILES.renderApp === 'function') {
        window.ARG_FILES.renderApp(content, { app: app, loadJson: loadAppJson, escapeHtml: escapeHtml });
        return;
      }
      import('./apps/files.js').then(function (module) {
        return module.renderApp(content, { app: app, loadJson: loadAppJson, escapeHtml: escapeHtml });
      }).catch(function () { content.innerHTML = '<div class="win-empty"><strong>档案库暂不可用</strong><span>请检查档案数据文件。</span></div>'; });
      return;
    }
    if (app.id === 'browser') {
      if (window.ARG_BROWSER && typeof window.ARG_BROWSER.renderApp === 'function') {
        window.ARG_BROWSER.renderApp(content, { app: app, loadJson: loadAppJson, escapeHtml: escapeHtml });
        return;
      }
      import('./apps/browser.js').then(function (module) {
        return module.renderApp(content, { app: app, loadJson: loadAppJson, escapeHtml: escapeHtml });
      }).catch(function () { content.innerHTML = '<div class="win-empty"><strong>浏览器暂不可用</strong><span>请检查浏览器数据文件。</span></div>'; });
      return;
    }
    var localRecords = (window.ARG_LOCAL_DATA && window.ARG_LOCAL_DATA.records && window.ARG_LOCAL_DATA.records[app.id]) || [];
    if (location.protocol === 'file:') {
      showRecords(app, localRecords, content);
      return;
    }
    fetch(app.source + 'index.json')
      .then(function (response) { if (!response.ok) throw new Error('load'); return response.json(); })
      .then(function (records) { showRecords(app, records, content); })
      .catch(function () { showRecords(app, [], content); });
  }

  function loadAppJson(path) {
    if (location.protocol === 'file:') {
      var file = path.split('/').pop();
      var records = (window.ARG_LOCAL_DATA && window.ARG_LOCAL_DATA.records && window.ARG_LOCAL_DATA.records.files) || [];
      if (file === 'index.json') return Promise.resolve(records);
      var found = records.find(function (record) { return record.file === file; });
      return Promise.resolve(found && found.data ? found.data : {});
    }
    return fetch(path, { cache: 'no-store' }).then(function (response) { if (!response.ok) throw new Error('load'); return response.json(); });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character];
    });
  }

  function showRecords(app, records, content) {
    if (!records.length) {
      content.innerHTML = '<div class="win-empty"><strong>' + app.label + '</strong><span>暂无可用资料。</span></div>';
      return;
    }
    content.innerHTML = '<nav class="win-record-list">' + records.map(function (record) {
      return '<button>' + (record.title || record.name || record.subject) + '</button>';
    }).join('') + '</nav><main class="win-record-preview">请选择一条记录查看。</main>';
  }

  root.addEventListener('click', function (event) {
    var button = event.target.closest('[data-app]');
    if (button && root.contains(button)) openApp(button.dataset.app);
  });

  window.ARG_DESKTOP = { openApp: openApp };
  window.addEventListener('arg:wechat-unread', updateWechatBadge);
  new MutationObserver(render).observe(root, { childList: true, subtree: true });
  render();
}());
