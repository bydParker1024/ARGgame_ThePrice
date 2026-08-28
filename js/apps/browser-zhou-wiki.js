(function () {
  'use strict';
  var original = window.ARG_BROWSER;
  if (!original) return;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[c]; }); }
  function wikiHtml(page) {
    var a = page.achievements || [], r = page.relationships || [], n = page.charityNews || {};
    return '<section class="arg-wiki"><header class="arg-wiki-top"><b>百度百科</b><span>首页　秒懂百科　特色百科　知识专题　加入百科　百科团队</span></header><div class="arg-wiki-hero"><h1>' + esc(page.title) + '</h1><p>' + esc(page.subtitle) + '</p><div class="arg-wiki-media"><div class="arg-wiki-empty">人物图像<br><small>资料暂缺</small></div><div class="arg-wiki-empty">相关视频<br><small>资料暂缺</small></div></div></div><main class="arg-wiki-main"><article><h2>人物简介</h2><p>' + esc(page.intro) + '</p><h2>个人事迹</h2>' + a.map(function (item) { return '<section class="arg-wiki-entry"><h3>' + esc(item.year) + '　' + esc(item.title) + '</h3><p>' + esc(item.content) + '</p></section>'; }).join('') + '<section class="arg-wiki-relations"><h2>人物关系</h2>' + r.map(function (item) { return '<div><span class="arg-wiki-person">' + esc(item.name).slice(0, 1) + '</span><b>' + esc(item.name) + '</b><small>' + esc(item.role) + '</small></div>'; }).join('') + '</section><h2>人物资料</h2><table><tr><th>中文名</th><td>' + esc(page.title) + '</td><th>职业</th><td>企业经营者</td></tr><tr><th>出生地</th><td>江州市</td><th>所属企业</th><td>远博实业集团</td></tr></table></article><aside><div class="arg-wiki-portrait">人物图片<br><small>暂未收录</small></div><section class="arg-wiki-charity"><h3>相关资讯</h3><div class="arg-wiki-news-image">报道图片<br><small>暂未收录</small></div><b>' + esc(n.title) + '</b><p>' + esc(n.content) + '</p><small>' + esc(n.source) + ' · ' + esc(n.date) + '</small></section></aside></main></section>';
  }
  window.ARG_BROWSER = { renderApp: function (container, deps) {
    original.renderApp(container, deps);
    deps.loadJson(deps.app.source + 'index.json').then(function (data) {
      var pages = data.pages || {};
      var wiki = Object.keys(pages).map(function (id) { return pages[id]; }).find(function (page) { return page.layout === 'wiki'; });
      if (!wiki || container.dataset.zhouWikiBound) return;
      container.dataset.zhouWikiBound = 'true';
      container.addEventListener('click', function (event) {
        if (window.ARG_BROWSER_ZHOU_DETAIL) return;
        var title = event.target.closest('.arg-profile-card h1');
        if (!title || title.textContent.trim() !== wiki.title) return;
        event.preventDefault();
        window.showBrowserPage({ html: wikiHtml(wiki), url: wiki.url || 'https://baike.baidu.com/item/' + encodeURIComponent(wiki.title) });
      });
      function refreshExperience() {
        var experience = container.querySelector('.arg-profile-columns section:nth-child(2) p');
        if (experience && wiki.earlyExperience && experience.textContent !== wiki.earlyExperience) experience.textContent = wiki.earlyExperience;
      }
      refreshExperience();
    });
  }};
}());
