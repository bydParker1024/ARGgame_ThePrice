(function () {
  'use strict';
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[c]; }); }
  function hit(text, query) { return esc(text).split(esc(query)).join('<em>' + esc(query) + '</em>'); }
  var AD_POOL = {
    jobs: { ad: true, source: '91同城', title: '找工作，就找91同城', url: 'https://www.91tongcheng.local/jobs', snippet: '海量本地招聘岗位实时更新，附近工作快速查看，求职招聘更方便。' },
    'used-phone': { ad: true, source: '赚赚二手', title: '换手机，就找赚赚', url: 'https://www.zhuanzhuan-local.local/phone', snippet: '二手手机回收、在线估价和换新服务，闲置旧机也能卖个好价钱。' },
    moving: { ad: true, source: '速达搬家', title: '搬家太麻烦？速达搬家上门帮你搬', url: 'https://www.suda-moving.local/', snippet: '江州市同城搬家、家具运输、打包服务，在线预约附近搬家师傅。' },
    housing: { ad: true, source: '好住家', title: '江州市租房，就上好住家', url: 'https://www.haozhujia.local/jiangzhou', snippet: '整租、合租和附近房源信息查询，快速寻找适合你的房子。' },
    food: { ad: true, source: '吃了么', title: '附近美食外卖，最快30分钟送达', url: 'https://www.chileme.local/', snippet: '查看附近餐厅和优惠活动，午餐、夜宵、饮品在线下单。' },
    travel: { ad: true, source: '飞马旅行', title: '酒店机票一站预订', url: 'https://www.feima-travel.local/', snippet: '国内酒店、机票和出行服务在线查询，提前预订享更多优惠。' },
    'huaqiang-usedcar': { ad: true, source: '华强二手车店', title: '这瓜绝对包熟，买二手车就上华强二手车店', url: 'https://www.huaqiang-usedcar.local/', snippet: '江州市本地二手车买卖、旧车置换和车辆估价服务，多种车型到店可看。' },
    'xin-service': { ad: true, source: 'X信服务', title: '你知道吗 现在x信支付改成x信服务了，最高可贷20w，来，兄弟，把你手机给我，我帮你升舱', url: 'https://www.xin-service.local/upgrade', snippet: '额度升级、账户服务等信息请以平台页面为准，谨防陌生人员索要手机及账户信息。' }
  };
  function resolveResults(items) { return (items || []).map(function (item) { return item.adId ? AD_POOL[item.adId] : item; }).filter(Boolean); }
  function resultHtml(item) { return '<article><p class="arg-result-source">' + (item.ad ? '广告 · ' : '') + esc(item.source) + (item.time ? ' · ' + esc(item.time) : '') + '</p><h2>' + (item.pageId ? '<button type="button" class="arg-web-result-title is-link" data-page-id="' + esc(item.pageId) + '">' : '<span class="arg-web-result-title is-static">') + esc(item.title) + (item.pageId ? '</button>' : '</span>') + '</h2><small>' + esc(item.url) + '</small><p>' + esc(item.snippet) + '</p></article>'; }
  window.resolveChandlerSearchResults = resolveResults;
  var HISTORY_KEY = 'arg_browser_search_history', HISTORY_LIMIT = 10, boundSearchForms = new WeakSet(), activeHistory = null, globalHistoryEventsBound = false;
  function readHistory() { try { var items = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(items) ? items.filter(function (item) { return typeof item === 'string' && item.trim(); }).slice(0, HISTORY_LIMIT) : []; } catch (error) { return []; } }
  function saveHistory(items) { try { window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT))); } catch (error) {} }
  if (typeof window.registerBrowserReset === 'function') window.registerBrowserReset(function () { try { window.localStorage.removeItem(HISTORY_KEY); } catch (error) {} hideHistory(); });
  function rememberQuery(value) { var query = String(value || '').trim(); if (!query) return; var lower = query.toLocaleLowerCase('zh-CN'); saveHistory([query].concat(readHistory().filter(function (item) { return item.toLocaleLowerCase('zh-CN') !== lower; }))); }
  function hideHistory() { if (!activeHistory) return; activeHistory.panel.hidden = true; activeHistory = null; }
  function runFormSearch(form) { if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
  function renderHistory(form, forceShow) {
    var host = form.parentNode, panel = host.querySelector(':scope > .arg-search-history'), input = form.querySelector('input');
    if (!panel || !input) return;
    var query = input.value.trim().toLocaleLowerCase('zh-CN'), items = readHistory().filter(function (item) { return !query || item.toLocaleLowerCase('zh-CN').indexOf(query) !== -1; });
    panel.replaceChildren();
    if (!items.length || (!forceShow && document.activeElement !== input)) { panel.hidden = true; return; }
    var title = document.createElement('div'); title.className = 'arg-search-history-title'; title.textContent = '最近搜索';
    var clear = document.createElement('button'); clear.type = 'button'; clear.className = 'arg-search-history-clear'; clear.textContent = '清除全部'; clear.addEventListener('click', function () { try { window.localStorage.removeItem(HISTORY_KEY); } catch (error) {} hideHistory(); }); title.appendChild(clear); panel.appendChild(title);
    items.forEach(function (item) {
      var row = document.createElement('div'); row.className = 'arg-search-history-item';
      var use = document.createElement('button'); use.type = 'button'; use.className = 'arg-search-history-query';
      var clock = document.createElement('span'); clock.className = 'arg-search-history-clock'; clock.setAttribute('aria-hidden', 'true'); clock.textContent = '◷';
      var text = document.createElement('span'); text.textContent = item; use.appendChild(clock); use.appendChild(text);
      use.addEventListener('click', function () { input.value = item; rememberQuery(item); hideHistory(); runFormSearch(form); });
      var remove = document.createElement('button'); remove.type = 'button'; remove.className = 'arg-search-history-remove'; remove.setAttribute('aria-label', '删除“' + item + '”'); remove.textContent = '×'; remove.addEventListener('click', function () { saveHistory(readHistory().filter(function (saved) { return saved !== item; })); renderHistory(form, true); });
      row.appendChild(use); row.appendChild(remove); panel.appendChild(row);
    });
    panel.hidden = false; activeHistory = { host: host, panel: panel };
  }
  function bindSearchForm(form, search) {
    if (boundSearchForms.has(form)) return; boundSearchForms.add(form);
    var input = form.querySelector('input'); if (!input) return;
    var host = form.parentNode;
    if (!host.classList.contains('arg-search-history-host')) { var wrapper = document.createElement('div'); wrapper.className = 'arg-search-history-host'; form.parentNode.insertBefore(wrapper, form); wrapper.appendChild(form); host = wrapper; }
    var panel = host.querySelector(':scope > .arg-search-history');
    if (!panel) { panel = document.createElement('div'); panel.className = 'arg-search-history'; panel.hidden = true; host.appendChild(panel); }
    form.addEventListener('submit', function () { rememberQuery(input.value); hideHistory(); });
    input.addEventListener('focus', function () { renderHistory(form, true); }); input.addEventListener('input', function () { renderHistory(form, true); });
    form.onsubmit = function (event) { event.preventDefault(); search(input.value); };
  }
  function bindSearchView(root) {
    if (!root || typeof root.__argBrowserSearch !== 'function') return;
    root.querySelectorAll('form.arg-browser-form, form.arg-search-query').forEach(function (form) { bindSearchForm(form, root.__argBrowserSearch); });
    root.querySelectorAll('[data-q],[data-related]').forEach(function (button) { if (button.__argBrowserSearchBound) return; button.__argBrowserSearchBound = true; button.onclick = function () { root.__argBrowserSearch(button.dataset.q || button.dataset.related); }; });
    if (globalHistoryEventsBound) return; globalHistoryEventsBound = true;
    document.addEventListener('pointerdown', function (event) { if (activeHistory && !activeHistory.host.contains(event.target)) hideHistory(); }); document.addEventListener('keydown', function (event) { if (event.key === 'Escape') hideHistory(); });
  }
  window.bindBrowserSearchView = bindSearchView;
  function pageHtml(page) {
    if (page.webResults) {
      return '<section class="arg-search-page"><header class="arg-search-header"><span class="arg-search-mark"></span><div><b>Microsoft Chandler</b><small>国内版　国际版</small></div></header><form class="arg-search-query"><span>⌕</span><input value="' + esc(page.query || '') + '" aria-label="搜索"><button type="submit">搜索</button></form><nav class="arg-search-nav">网页　　图片　　视频　　学术　　词典　　地图</nav><main class="arg-search-grid"><div class="arg-web-results"><p class="arg-result-count">' + esc(page.resultCount || '') + '</p>' + resolveResults(page.webResults).map(resultHtml).join('') + '</div><aside><h2>相关搜索</h2>' + (page.related || []).map(function (item) { return '<button type="button" data-related="' + esc(item) + '">⌕　' + esc(item) + '</button>'; }).join('') + '</aside></main></section>';
    }
    var p = page.profile || {}, query = page.query || '', ads = resolveResults((page.adIds || []).map(function (adId) { return { adId: adId }; }));
    if (ads.length) return '<section class="arg-search-page"><header class="arg-search-header"><span class="arg-search-mark"></span><div><b>Microsoft Chandler</b><small>国内版　国际版</small></div></header><form class="arg-search-query"><span>⌕</span><input value="' + esc(query) + '" aria-label="搜索"><button type="submit">搜索</button></form><nav class="arg-search-nav">网页　　图片　　视频　　学术　　词典　　地图</nav><main class="arg-search-grid"><div><p class="arg-result-count">' + esc(page.resultCount || '') + '</p><article class="arg-profile-card"><p class="arg-result-source">百科 · 人物资料</p><h1 class="arg-profile-title is-link">' + hit(p.name || query, query) + '</h1><p class="arg-profile-summary">' + esc(p.summary || '') + '</p><div class="arg-profile-columns"><section><h2>概览　›</h2>' + (p.facts || []).map(function (fact) { return '<p>' + esc(fact) + '</p>'; }).join('') + '</section><section><h2>早年经历　›</h2><p>公开报道提及，周涛早年从事供应链与设备贸易，后参与组建远博实业。其个人履历中有数段经历尚未找到可交叉验证的公开来源。</p></section></div></article><section class="arg-web-results">' + resultHtml(ads[0]) + '</section><section class="arg-news"><h2>资讯　›</h2>' + (page.news || []).map(function (item) { return '<article><p>' + esc(item.source) + ' · ' + esc(item.time) + '</p><h3>' + hit(item.title, query) + '</h3><div>' + esc(item.snippet) + '</div></article>'; }).join('') + '</section>' + (ads.length > 1 ? '<section class="arg-web-results">' + ads.slice(1).map(resultHtml).join('') + '</section>' : '') + '</div><aside><h2>深入了解 <em>' + esc(query) + '</em></h2>' + (page.related || []).map(function (item) { return '<button type="button" data-related="' + esc(item) + '">⌕　' + hit(item, query) + '</button>'; }).join('') + '</aside></main></section>';
    return '<section class="arg-search-page"><header class="arg-search-header"><span class="arg-search-mark"></span><div><b>Microsoft Chandler</b><small>\u56fd\u5185\u7248　 \u56fd\u9645\u7248</small></div></header><form class="arg-search-query"><span>⌕</span><input value="' + esc(query) + '" aria-label="\u641c\u7d22"><button type="submit">\u641c\u7d22</button></form><nav class="arg-search-nav">\u7f51\u9875　　\u56fe\u7247　　\u89c6\u9891　　\u5b66\u672f　　\u8bcd\u5178　　\u5730\u56fe</nav><main class="arg-search-grid"><div><p class="arg-result-count">' + esc(page.resultCount || '') + '</p><article class="arg-profile-card"><p class="arg-result-source">百科 · 人物资料</p><h1>' + hit(p.name || query, query) + '</h1><p class="arg-profile-summary">' + esc(p.summary || '') + '</p><div class="arg-profile-columns"><section><h2>概览　›</h2>' + (p.facts || []).map(function (fact) { return '<p>' + esc(fact) + '</p>'; }).join('') + '</section><section><h2>早年经历　›</h2><p>公开报道提及，周涛早年从事供应链与设备贸易，后参与组建远博实业。其个人履历中有数段经历尚未找到可交叉验证的公开来源。</p></section></div></article><section class="arg-news"><h2>资讯　›</h2>' + (page.news || []).map(function (item) { return '<article><p>' + esc(item.source) + ' · ' + esc(item.time) + '</p><h3>' + hit(item.title, query) + '</h3><div>' + esc(item.snippet) + '</div></article>'; }).join('') + '</section></div><aside><h2>深入了解 <em>' + esc(query) + '</em></h2>' + (page.related || []).map(function (item) { return '<button type="button" data-related="' + esc(item) + '">⌕　' + hit(item, query) + '</button>'; }).join('') + '</aside></main></section>';
  }
  var base = window.ARG_BROWSER;
  if (!base) return;
  window.ARG_BROWSER = { renderApp: function (container, deps) {
    deps.loadJson(deps.app.source + 'index.json').then(function (data) {
      container.classList.add('arg-browser-container');
      container.innerHTML = '<div class="arg-browser-toolbar"><button type="button" data-home aria-label="\u4e3b\u9875">⌂</button><span>\u5185\u7f51\u6d4f\u89c8\u5668</span><div class="arg-browser-address">arg://search</div></div><main class="arg-browser-view"></main>';
      var view = container.querySelector('.arg-browser-view');
      function home() { view.innerHTML = '<section class="arg-browser-home"><div class="arg-browser-brand"><i></i><b>Microsoft</b> Chandler</div><div class="arg-browser-search-wrap"><form class="arg-browser-form"><input autofocus placeholder="' + esc(data.placeholder || '') + '"><button type="submit">⌕</button></form><div class="arg-browser-hot"><strong>\u4f60\u53ef\u80fd\u611f\u5174\u8da3</strong>' + (data.hotSearches || []).map(function (q) { return '<button data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div></div></section>'; bind(); }
      function search(q) { q = String(q || '').trim(); var rule = (data.searchRules || []).find(function (r) { return (r.keywords || [r.keyword]).some(function (key) { return String(key).toLowerCase() === q.toLowerCase(); }); }); var page = rule && data.pages && data.pages[rule.pageId]; if (page && page.layout === 'search-results') { var result = { html: pageHtml(page), url: 'https://www.chandler.com/search?q=' + encodeURIComponent(q) }; if (window.showBrowserPage && window.showBrowserPage(result)) return; view.innerHTML = result.html; container.querySelector('.arg-browser-address').textContent = result.url; bind(); return; } home(); }
      function bind() { view.__argBrowserSearch = search; window.hydrateBrowserView(view); }
      container.querySelector('[data-home]').onclick = home; home();
    });
  }};
}());
