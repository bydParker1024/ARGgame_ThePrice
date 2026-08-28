(function () {
  'use strict';
  var app = window.ARG_BROWSER;
  if (!app) return;
  function renderHome() {
    var updates = ['开展夏季儿童健康筛查与心理关怀活动', '志愿者服务队完成暑期陪伴计划培训', '福利院公布2026年第二季度捐赠使用情况', '院内生活区公共设施维护项目验收完成', '儿童阅读角更新图书与益智教具'];
    var policy = ['儿童福利机构管理办法', '未成年人保护与照护服务说明', '院内探访登记须知', '困难儿童医疗援助申请流程'];
    function list(items) { return '<ul>' + items.map(function (item, i) { return '<li><span>' + item + '</span><time>0' + (i + 2) + '-1' + i + '</time></li>'; }).join('') + '</ul>'; }
    return '<section class="arg-welfare"><header class="arg-welfare-banner"><div class="arg-welfare-brand"><i>♥</i><b>翻斗花园阳光福利院</b><small>FANDOU GARDEN SUNSHINE WELFARE HOME</small></div><div class="arg-welfare-rainbow"></div></header><nav>首页　　机构介绍　　新闻动态　　院务公开　　关爱服务　　志愿者招募　　联系我们</nav><main><section class="arg-welfare-feature"><figure class="arg-welfare-image"><img src="./assets/browser/welfare/activity-room.png" alt="福利院内志愿者陪伴儿童活动"><figcaption>院内活动图片</figcaption></figure><div class="arg-welfare-updates"><h2>工作动态 <small>更多&gt;</small></h2>' + list(updates) + '</div></section><section class="arg-welfare-cards"><figure><img src="./assets/browser/welfare/policy-banner.png" alt="政策宣传"><figcaption>政策宣传</figcaption></figure><figure><img src="./assets/browser/welfare/child-care-banner.png" alt="儿童关爱服务"><figcaption>儿童关爱服务</figcaption></figure><figure><img src="./assets/browser/welfare/volunteer-banner.png" alt="志愿服务"><figcaption>志愿服务</figcaption></figure></section><section class="arg-welfare-columns"><article><h2>通知公告 <small>更多&gt;</small></h2>' + list(policy) + '</article><article><h2>爱心项目 <small>更多&gt;</small></h2>' + list(['阳光成长陪伴计划', '基层医疗支持项目', '冬季保暖物资募集', '家庭探访服务安排']) + '</article></section><section class="arg-welfare-columns"><article><h2>院务公开 <small>更多&gt;</small></h2>' + list(['2026年度第一季度工作简报', '捐赠物资接收与使用公示', '服务项目预算说明']) + '</article><article><h2>相关链接 <small>更多&gt;</small></h2>' + list(['儿童权益保护咨询', '江州市社会福利服务平台', '志愿服务登记入口']) + '</article></section></main></section>';
  }
  function installTabs(container) {
    if (container.dataset.tabsBound) return;
    var toolbar = container.querySelector('.arg-browser-toolbar');
    if (!toolbar) return;
    container.dataset.tabsBound = 'true';
    var view = container.querySelector('.arg-browser-view'), address = container.querySelector('.arg-browser-address'), tabs = [{ id: 1, title: '新建标签页', address: address.textContent, html: view.innerHTML }], activeId = 1, nextId = 2;
    var strip = document.createElement('div');
    strip.className = 'arg-browser-tabsbar';
    container.insertBefore(strip, toolbar);
    function titleForAddress(value) { if (value.indexOf('fdgarden-welfare') >= 0) return '翻斗花园阳光福利院'; if (value.indexOf('chandler.com') >= 0) return '搜索结果'; return '新建标签页'; }
    function active() { return tabs.filter(function (tab) { return tab.id === activeId; })[0]; }
    function snapshot() { var tab = active(); if (!tab) return; tab.address = address.textContent; tab.html = view.innerHTML; tab.title = titleForAddress(tab.address); }
    function paint() { strip.innerHTML = tabs.map(function (tab) { return '<div class="arg-browser-tab ' + (tab.id === activeId ? 'is-active' : '') + '" data-tab="' + tab.id + '"><span class="arg-browser-tab-icon">⌕</span><b>' + tab.title + '</b>' + (tabs.length > 1 ? '<button type="button" data-close="' + tab.id + '" aria-label="关闭标签页">×</button>' : '') + '</div>'; }).join('') + '<button type="button" class="arg-browser-newtab" aria-label="新建标签页">＋</button>'; }
    function activate(id) { if (id === activeId) return; snapshot(); activeId = id; var tab = active(); address.textContent = tab.address; view.innerHTML = tab.html; window.hydrateBrowserView(view); paint(); }
    strip.onclick = function (event) { var close = event.target.closest('[data-close]'); if (close) { var id = Number(close.dataset.close); if (tabs.length === 1) return; var index = tabs.findIndex(function (tab) { return tab.id === id; }); tabs.splice(index, 1); if (activeId === id) { activeId = tabs[Math.max(0, index - 1)].id; var tab = active(); address.textContent = tab.address; view.innerHTML = tab.html; window.hydrateBrowserView(view); } paint(); return; } var tabButton = event.target.closest('[data-tab]'); if (tabButton) activate(Number(tabButton.dataset.tab)); };
    function newTab() { snapshot(); container.querySelector('[data-home]').click(); window.setTimeout(function () { var fresh = { id: nextId++, title: '新建标签页', address: address.textContent, html: view.innerHTML }; tabs.push(fresh); activeId = fresh.id; paint(); bindNewTab(); }, 0); }
    function bindNewTab() { strip.querySelector('.arg-browser-newtab').onclick = newTab; }
    new MutationObserver(function () { snapshot(); paint(); bindNewTab(); }).observe(address, { childList: true, characterData: true, subtree: true });
    paint(); bindNewTab();
  }
  function enhanceWelfare(container) {
    var feature = container.querySelector('.arg-welfare-image');
    if (!feature) return;
    var photos = [
      ['./assets/browser/welfare/activity-room.png', '院内志愿者陪伴儿童活动'],
      ['./assets/browser/welfare/activity-volunteer-training.png', '志愿者暑期陪伴计划培训'],
      ['./assets/browser/welfare/activity-reading-room.png', '儿童阅读角与图书整理活动'],
      ['./assets/browser/welfare/activity-community-donation.png', '社会爱心捐赠与院内活动']
    ], current = 0;
    feature.innerHTML = '<img alt="' + photos[0][1] + '"><button type="button" class="arg-welfare-photo-arrow prev" aria-label="上一张图片">‹</button><button type="button" class="arg-welfare-photo-arrow next" aria-label="下一张图片">›</button><figcaption></figcaption>';
    var image = feature.querySelector('img'), caption = feature.querySelector('figcaption');
    function show(index) { current = (index + photos.length) % photos.length; image.src = photos[current][0]; image.alt = photos[current][1]; caption.textContent = '院内活动图片 · ' + (current + 1) + '/' + photos.length; }
    feature.querySelector('.prev').onclick = function () { show(current - 1); };
    feature.querySelector('.next').onclick = function () { show(current + 1); };
    show(0);
    var nav = container.querySelector('.arg-welfare > nav');
    if (!nav || nav.querySelector('.arg-welfare-search')) return;
    var search = document.createElement('form');
    search.className = 'arg-welfare-search';
    search.innerHTML = '<input aria-label="站内搜索" placeholder="搜索院内信息"><button type="submit">搜索</button>';
    search.onsubmit = function (event) { event.preventDefault(); var keyword = search.querySelector('input').value.trim(); if (!keyword) return; container.querySelector('.arg-browser-view').innerHTML = '<section class="arg-welfare-search-result"><h2>站内搜索</h2><form class="arg-welfare-search"><input aria-label="站内搜索" value="' + keyword.replace(/[&<>'"]/g, '') + '"><button type="submit">搜索</button></form>' + (keyword === '李晓晓' ? '<article><small>儿童关爱服务 · 院内活动记录</small><h3>李晓晓</h3><p>检索到 1 条虚构叙事资料：儿童阅读角活动登记中出现该姓名。该页面为互动叙事设定，不对应现实个人或机构资料。</p></article>' : '<p>未找到与“' + keyword.replace(/[&<>'"]/g, '') + '”相关的院内公开信息。</p>') + '</section>'; container.querySelector('.arg-browser-address').textContent = 'https://fdgarden-welfare.local/search?q=' + encodeURIComponent(keyword); };
    nav.appendChild(search);
  }
  function showXiaoxiaoArticle(container) {
    var paragraphs = [
      '在城市的一角，有这样一个温暖的地方，承载着许多孩子对未来的期待与希望。福利院不仅是孩子们生活的港湾，更是社会各界关爱传递的重要纽带。近年来，在社会各界爱心人士和工作人员的共同努力下，越来越多困境儿童得到关怀与帮助，在温暖陪伴中健康成长。',
      '李晓晓（化名）就是其中的一员。',
      '多年来，李晓晓在福利院工作人员的悉心照料下成长。刚来到福利院时，她还是一个年幼的孩子，对于陌生的环境充满了不安与迷茫。福利院工作人员始终将她视为自己的孩子，从日常生活照顾到心理陪伴，从学习辅导到兴趣培养，用耐心和责任守护着她成长的每一步。',
      '在福利院生活期间，李晓晓逐渐养成了开朗乐观的性格。她喜欢阅读，热爱绘画，也愿意主动帮助身边的小伙伴。在老师和工作人员眼中，她是一个懂事、坚强、充满希望的孩子。虽然成长过程中经历过困难，但她始终保持着对生活的热爱，对未来充满期待。',
      '随着年龄增长，李晓晓也更加渴望拥有一个属于自己的家庭，能够像其他孩子一样，在父母的陪伴下成长，感受家庭的温暖。',
      '一次偶然的机会，林警官在参与社会公益活动过程中了解到福利院儿童的生活情况。在与福利院工作人员沟通交流后，他逐渐关注到了李晓晓的成长经历。经过多次接触与了解，林警官被孩子的坚强与懂事所打动，也希望能够为她提供一个更加稳定、温暖的成长环境。',
      '在符合相关法律规定和办理程序的基础上，林警官积极配合相关部门开展收养申请工作。福利院工作人员也全程参与，为孩子未来的生活安排提供支持和帮助。经过严格审核、评估以及相关手续办理，李晓晓正式进入新的家庭，开启人生新的篇章。',
      '收养当天，福利院内洋溢着温暖而感人的氛围。工作人员为李晓晓准备了纪念礼物，并送上祝福，希望她在新的家庭中继续保持乐观、自信，勇敢追逐自己的梦想。',
      '林警官表示，成为李晓晓的监护人不仅是一份责任，更是一份承诺。未来，他将尽己所能，为孩子提供良好的成长环境，关注她的学习、生活和心理发展，让她感受到家庭的关爱与社会的温暖。',
      '福利院负责人表示，儿童福利事业的发展离不开社会各界的共同参与。每一个孩子都值得被关注、被关爱、被呵护。此次李晓晓顺利融入新家庭，是社会爱心力量共同努力的体现，也展现了社会保障体系不断完善、公益关怀持续深入的发展成果。',
      '近年来，相关部门持续推进困境儿童保障工作，通过完善儿童福利服务体系、加强心理关爱、推动家庭收养等方式，为更多儿童创造健康成长的条件。社会各界也积极参与公益事业，用实际行动传递关爱，让更多孩子能够拥有更加美好的未来。',
      '从福利院到新家庭，改变的是生活环境，不变的是对孩子成长的守护。李晓晓未来的道路仍然漫长，但在爱与责任的陪伴下，她将带着新的希望继续前行。',
      '一份收养，是一个家庭新的开始；一份守护，是社会温暖力量的延续。愿每一个孩子都能在关爱中成长，在阳光下追逐属于自己的梦想。'
    ];
    var html = '<article class="arg-welfare-article"><p class="arg-welfare-article-source">翻斗花园阳光福利院 · 爱心项目 · 2016-08-05</p><h1>爱心汇聚温暖同行——福利院儿童李晓晓迎来新家庭</h1><img src="./assets/browser/welfare/xiaoxiao-new-family.png" alt="李晓晓迎来新家庭的纪念照片"><div>' + paragraphs.map(function (paragraph) { return '<p>' + paragraph + '</p>'; }).join('') + '</div><small>本文为互动叙事中的虚构文章，人物、机构和事件不对应现实资料。</small></article>';
    if (!container) return html;
    container.querySelector('.arg-browser-view').innerHTML = html;
    container.querySelector('.arg-browser-address').textContent = 'https://fdgarden-welfare.local/news/xiaoxiao-new-family';
  }
  window.ARG_WELFARE_XIAOXIAO_ARTICLE = function () { return showXiaoxiaoArticle(); };
  window.ARG_BROWSER = { renderApp: function (container, deps) { app.renderApp(container, deps); (function waitForToolbar(attempts) { if (container.querySelector('.arg-browser-toolbar')) { installTabs(container); return; } if (attempts) window.setTimeout(function () { waitForToolbar(attempts - 1); }, 50); }(20)); if (container.dataset.welfareBound) return; container.dataset.welfareBound = 'true'; container.addEventListener('click', function (event) { var title = event.target.closest('.arg-profile-card h1'); if (title && title.textContent.trim() === '翻斗花园阳光福利院') { window.showBrowserPage({ html: renderHome(), url: 'https://fdgarden-welfare.local/', enhance: function () { enhanceWelfare(container); } }); return; } if (event.target.closest('.arg-welfare-search-result article')) showXiaoxiaoArticle(container); }); }};
}());
