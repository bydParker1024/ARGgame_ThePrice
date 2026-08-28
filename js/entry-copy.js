(function () {
  'use strict';

  var root = document.getElementById('app-root');
  var synopsis = '你是警察局的新人，一天晚上你的师傅在接了医院的电话以后，急匆匆地出了门，临走前和你说把他桌上堆积的档案给整理一下录入警局系统更新。你在整理档案时，发现这些案子并非毫无关联，真相的冰山一角渐渐被你给揭开。';
  var resumeKey = 'arg-investigation-save-v1';
  var legacyTargets = ['desktop', 'terminal', 'workspace', 'investigation-desktop'];

  function writeArchiveResume() {
    try { localStorage.setItem(resumeKey, JSON.stringify({ version: 2, openApps: ['files'], activeApp: 'files', savedAt: new Date().toISOString() })); } catch (error) {}
  }

  function migrateLegacyResume() {
    try {
      var saved = JSON.parse(localStorage.getItem(resumeKey) || 'null');
      var targets = saved && [saved.activeApp].concat(Array.isArray(saved.openApps) ? saved.openApps : []);
      if (targets && targets.some(function (target) { return legacyTargets.includes(target); })) writeArchiveResume();
    } catch (error) {}
  }

  function resumeArchives(event) {
    var button = event.target.closest('[data-a="continue"]');
    if (!button || !root.contains(button)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (window.ARG_STORY && typeof window.ARG_STORY.resumePending === 'function') window.ARG_STORY.resumePending();
    writeArchiveResume();
    root.innerHTML = '<section class="device-wrap"><div class="device"></div></section>';
    window.requestAnimationFrame(function () {
      if (window.ARG_DESKTOP && typeof window.ARG_DESKTOP.openApp === 'function') window.ARG_DESKTOP.openApp('files');
    });
  }

  function updateEntry() {
    var card = root.querySelector('.entry-card');
    if (!card || card.dataset.policeCopy === 'true') return;

    card.dataset.policeCopy = 'true';
    card.querySelector('.eyebrow').remove();
    card.querySelector('h1').textContent = '《一念之间》';
    card.querySelector('p').textContent = synopsis;
    card.querySelector('.entry-meta').innerHTML =
      '<span>工号：实习民警-01</span><span>状态：值班中</span><span>身份：警察局新人</span>';

    card.querySelector('.entry-meta').innerHTML =
      '<span>本游戏为网页解密游戏，微恐。</span>';

    var continueButton = card.querySelector('[data-a="continue"]');
    var startButton = card.querySelector('[data-a="start"]');
    var developerButton = card.querySelector('[data-a="dev"]');
    if (continueButton) continueButton.textContent = '继续整理档案';
    if (startButton) startButton.textContent = '进入警局系统';
    if (developerButton) developerButton.remove();
    card.querySelector('.entry-footer').textContent = 'POLICE ARCHIVE SYSTEM · 双击或网页部署均可运行';
  }

  document.addEventListener('click', resumeArchives, true);
  new MutationObserver(updateEntry).observe(root, { childList: true, subtree: true });
  migrateLegacyResume();
  updateEntry();
}());
