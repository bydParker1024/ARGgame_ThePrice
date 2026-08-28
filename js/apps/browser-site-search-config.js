(function () {
  'use strict';
  var app = window.ARG_BROWSER;
  if (!app) return;
  var browserPages = {};

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function article(rule, siteName) {
    if (canonicalKeyword(rule.keyword) === '李晓晓' && siteName === '翻斗花园阳光福利院' && window.ARG_WELFARE_XIAOXIAO_ARTICLE) {
      return window.ARG_WELFARE_XIAOXIAO_ARTICLE().replace('<h1>', '<p class="arg-welfare-search-summary">检索到 1 条儿童关爱服务活动记录。</p><h1>');
    }
    var content = rule.content || '暂未录入正文内容。';
    if (canonicalKeyword(rule.keyword) === '翻斗花园阳光福利院' && content.length < 120) {
      content = '江州日报讯（记者报道）\n\n2026年7月8日上午，江州市晨曦花园阳光儿童福利中心发生重大疑似食品安全事故。事故发生后，多名儿童陆续出现腹痛、持续呕吐、高热、精神状态异常、意识模糊等症状，部分患儿病情迅速恶化。\n\n接到救治通知后，江州市第二人民医院立即启动重大突发公共卫生事件应急响应机制，第一时间开通急救绿色通道，组织急诊医学科、儿科、重症医学科、感染科、检验科等多学科专家组成专项救治团队，对送医患儿展开紧急救治。\n\n截至目前，共有10名儿童被紧急送往江州市第二人民医院接受治疗，其中6名患儿因病情危重，被转入重症医学科（ICU）进行生命支持治疗，其余患儿在儿科病区接受密切观察和对症治疗。经医院初步检查及临床诊断，4名患儿因病情发展迅速，经全力抢救无效死亡。\n\n专家分析：儿童免疫系统和身体代谢能力尚未完全发育成熟，更容易受到食品污染或过敏因素影响。严重食物中毒可能造成持续呕吐、腹泻、电解质流失、全身炎症反应及多器官功能损害；急性食物过敏反应则可能导致呼吸道水肿、血压下降及过敏性休克。\n\n医院启动最高级别救治保障\n\n医院安排重症医学科专家全天候监护危重患儿生命指标，开展呼吸支持、循环支持、抗感染治疗及对症治疗；儿科团队持续跟踪病情，根据实验室检测结果调整方案。相关食品样本已移交有关部门检测，事故原因仍在进一步调查。';
    }
    if (canonicalKeyword(rule.keyword).indexOf('文莲慈善基金') === 0 && content.length < 180) {
      content = '近年来，随着医疗卫生事业不断发展，人民群众对高质量医疗服务的需求日益增长。江州市人民医院始终坚持以人民健康为中心的发展理念，持续推进医疗服务能力提升，完善医疗设施建设，为群众提供更加安全、高效、便捷的医疗保障。\n\n近日，江州市人民医院收到来自文莲慈善基金与江州远博实业集团股份有限公司的大力支持。文莲慈善基金为医院相关医疗服务能力提升项目提供专项资金支持；江州远博实业集团股份有限公司提供了一批先进医疗器械设备，有效助力医院进一步提升诊疗水平和医疗保障能力。\n\n公益助力医疗建设，专项资金推动服务提升\n\n文莲慈善基金长期关注医疗健康、困难救助等领域公益项目建设。专项资金将严格按照规范使用、公开透明、专款专用原则，重点用于医疗服务能力提升、患者救治保障以及公益医疗项目建设，进一步优化医疗服务流程、改善患者就医环境。\n\n企业担当赋能医疗发展，先进设备提升诊疗能力\n\n医疗设备是现代医院开展精准诊断和高效治疗的重要基础。此次设备支持覆盖多个医疗应用领域，进一步完善了医院相关科室医疗设备配置，提高了医疗服务效率和诊疗质量，帮助医务人员更准确地开展疾病筛查、辅助诊断与治疗评估。\n\n医院致谢社会各界，共绘健康事业新篇章\n\n文莲慈善基金与江州远博实业集团股份有限公司的爱心支持，为医院提升医疗服务能力注入新的动力。江州市人民医院向两家单位表示衷心感谢，并将持续加强医疗质量管理、优化服务模式，把社会各界的支持转化为守护群众健康的实际成果。';
    }
    return '<article class="arg-config-search-article"><p>' + esc(siteName) + ' · 站内搜索结果</p><h1>' + esc(rule.title || rule.keyword) + '</h1>' + (rule.image ? '<img src="' + esc(rule.image) + '" alt="配图">' : '') + '<div>' + esc(content).replace(/\n/g, '<br>') + '</div></article>';
  }

  function unavailable(siteName) {
    return '<section class="arg-config-search-article arg-config-search-empty"><p>' + esc(siteName) + ' · 站内搜索</p><h1>该内容暂时无法搜索</h1><div>请检查搜索关键词，或稍后再试。</div></section>';
  }

  function wenlianResults() {
    var page = browserPages['wenlian-charity-search'];
    var result = function (item) { return '<article><p class="arg-result-source">' + (item.ad ? '广告 · ' : '') + esc(item.source) + (item.time ? ' · ' + esc(item.time) : '') + '</p><h2>' + (item.pageId ? '<button type="button" class="arg-web-result-title is-link" data-page-id="' + esc(item.pageId) + '">' : '<span class="arg-web-result-title is-static">') + esc(item.title) + (item.pageId ? '</button>' : '</span>') + '</h2><small>' + esc(item.url) + '</small><p>' + esc(item.snippet) + '</p></article>'; };
    var results = window.resolveChandlerSearchResults ? window.resolveChandlerSearchResults(page && page.webResults) : page && page.webResults || [];
    var related = page && page.related || [];
    return '<section class="arg-search-page"><header class="arg-search-header"><span class="arg-search-mark"></span><div><b>Microsoft Chandler</b><small>国内版　国际版</small></div></header><form class="arg-search-query"><span>⌕</span><input value="文莲慈善基金会" aria-label="搜索"><button type="submit">搜索</button></form><nav class="arg-search-nav">网页　　图片　　视频　　学术　　词典　　地图</nav><main class="arg-search-grid"><div class="arg-web-results"><p class="arg-result-count">' + esc(page && page.resultCount || '约 2,160 个结果') + '</p>' + results.map(result).join('') + '</div><aside><h2>相关搜索</h2>' + related.map(function (item) { return '<button type="button">⌕　' + esc(item) + '</button>'; }).join('') + '</aside></main></section>';
  }

  function wenlianOfficial() {
    return '<section class="arg-wenlian-official"><style>.arg-wenlian-official{min-height:100%;background:#fcfbf6;color:#3d2d22;font-family:"Microsoft YaHei",sans-serif}.arg-wenlian-official header{max-width:1120px;margin:auto;height:96px;display:flex;align-items:center;gap:20px}.arg-wenlian-official .mark{font-size:34px;color:#b4832e}.arg-wenlian-official header b{font-size:28px;letter-spacing:3px}.arg-wenlian-official header small{display:block;letter-spacing:2px;color:#866b50}.arg-wenlian-official nav{border-top:1px solid #eee4d6;border-bottom:1px solid #eee4d6;text-align:center;padding:16px;word-spacing:36px}.arg-wenlian-official main{max-width:1120px;margin:28px auto}.arg-wenlian-official .hero{display:grid;grid-template-columns:1fr 1.3fr;background:#fff;border:1px solid #eee4d6}.arg-wenlian-official .hero-copy{padding:48px 38px}.arg-wenlian-official .hero h1{color:#b98124;font-size:31px;font-weight:500}.arg-wenlian-official .hero img{width:100%;height:360px;object-fit:cover}.arg-wenlian-official h2{font-size:24px;text-align:center;color:#704b25}.arg-wenlian-official .news{display:grid;grid-template-columns:1.25fr .75fr;gap:38px;margin-top:35px}.arg-wenlian-official .news-list article{padding:16px 0;border-bottom:1px solid #e9ddcd}.arg-wenlian-official .news-list h3{margin:0;color:#35271f}.arg-wenlian-official .placeholder{height:235px;display:grid;place-items:center;background:#f1ede4;color:#a6947d}.arg-wenlian-official footer{padding:24px;text-align:center;background:#f1e5d1;color:#6d502d}</style><header><span class="mark">✿</span><div><b>文莲慈善基金会</b><small>WENLIAN CHARITY FOUNDATION</small></div></header><nav>首页　　关于文莲　　公益项目　　新闻中心　　信息公开　　加入文莲　　我要来助</nav><main><section class="hero"><div class="hero-copy"><h1>一份善意，惠及众生</h1><p>文莲慈善基金会以关爱儿童、扶助弱势、回馈社会为宗旨，致力于改善儿童生活条件，推动社会公益事业发展。</p><p>我们相信，每一份爱心都能汇成希望的光。</p></div><img src="./assets/browser/wenlian-charity/foundation-hero.png" alt="文莲慈善基金会公益活动"></section><section class="news"><div class="news-list"><h2>新闻中心</h2><article><h3>文莲慈善基金会开展暑期儿童关爱行动</h3><p>志愿者走进社区与福利机构，为儿童带去陪伴与学习物资。</p></article><article><h3>医疗援助项目完成新一轮设备支持</h3><p>专项公益资金将继续用于基层医疗服务能力建设。</p></article></div><div><h2>视频中心</h2><div class="placeholder">图片 / 视频素材待补充</div></div></section></main><footer>文莲慈善基金会　以爱之名 · 传递希望</footer></section>';
  }

  function enhanceWenlianOfficial(view) {
    if (!view || view.querySelector('.wl-carousel')) return;
    var nav = view.querySelector('nav');
    if (nav) nav.innerHTML = '首页　　关于文莲　　公益项目　　新闻中心　　信息公开　　<button type="button" data-wenlian-action="join" style="appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;cursor:pointer">加入文莲</button>　　我要来助';
    var heroImage = view.querySelector('.hero img');
    if (heroImage) {
      heroImage.style.height = 'auto';
      heroImage.style.maxHeight = '480px';
      heroImage.style.objectFit = 'contain';
      heroImage.style.background = '#f8f4eb';
    }
    var videoTitle = Array.prototype.find.call(view.querySelectorAll('h2'), function (title) {
      return String(title.textContent || '').trim() === '视频中心';
    });
    if (!videoTitle || !videoTitle.parentElement) return;
    videoTitle.parentElement.innerHTML = '<h2>公益影像</h2><div class="wl-carousel"><img class="active" src="./assets/browser/wenlian-charity/charity-event.png" alt="文莲慈善基金会公益活动"><img src="./assets/browser/wenlian-charity/charity-calligraphy.png" alt="积水成渊 积善成德"><img src="./assets/browser/wenlian-charity/charity-water-project.png" alt="文莲慈善基金会公益水井项目"><button type="button" data-wl-carousel="prev" aria-label="上一张">‹</button><button type="button" data-wl-carousel="next" aria-label="下一张">›</button></div><style>.wl-carousel{position:relative;height:235px;overflow:hidden;background:#f1ede4}.wl-carousel img{display:none;width:100%;height:235px;object-fit:cover}.wl-carousel img.active{display:block}.wl-carousel button{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:42px;border:0;border-radius:4px;background:#342b20aa;color:#fff;font-size:25px;cursor:pointer}.wl-carousel [data-wl-carousel="prev"]{left:10px}.wl-carousel [data-wl-carousel="next"]{right:10px}</style>';
  }

  function wenlianWikiShort() {
    return '<section class="arg-wenlian-wiki"><style>.arg-wenlian-wiki{min-height:100%;background:#fff;font:15px/1.8 "Microsoft YaHei",sans-serif;color:#222}.arg-wenlian-wiki header{padding:15px 9%;color:#fff;background:#4095e8;font-size:18px}.arg-wenlian-wiki main{max-width:1040px;margin:35px auto;display:grid;grid-template-columns:1fr 300px;gap:35px}.arg-wenlian-wiki h1{margin:0;border-bottom:1px solid #ddd;font-size:32px}.arg-wenlian-wiki h2{border-left:4px solid #3e95e8;padding-left:10px}.arg-wenlian-wiki table{width:100%;border-collapse:collapse}.arg-wenlian-wiki th,.arg-wenlian-wiki td{padding:9px;border-bottom:1px solid #e5e5e5;text-align:left}.arg-wenlian-wiki aside{border:1px solid #ddd;padding:10px;height:max-content}.arg-wenlian-wiki aside img{width:100%;display:block}.arg-wenlian-wiki aside p{text-align:center;color:#557}</style><header>百度百科　词条页</header><main><article><h1>文莲慈善基金会</h1><p>文莲慈善基金会是一家以儿童帮扶、医疗援助、社会公益服务为主要方向的慈善组织。</p><h2>机构简介</h2><p>基金会最初关注贫困地区儿童饮水与弱势群体救助，现与医疗机构、福利机构等开展公益合作，持续推进儿童关爱与基层医疗支持项目。</p><h2>基本信息</h2><table><tr><th>成立时间</th><td>2019年</td></tr><tr><th>创始人</th><td>林文武</td></tr><tr><th>总部所在地</th><td>江州市</td></tr><tr><th>主要方向</th><td>儿童帮扶、医疗援助、社会公益</td></tr></table></article><aside><img src="./assets/browser/wenlian-charity/foundation-building.png" alt="文莲慈善基金会"><p>文莲慈善基金会办公楼与公益活动</p></aside></main></section>';
  }

  function wenlianWikiBase() {
    return '<section class="arg-wenlian-wiki"><style>.arg-wenlian-wiki{min-height:100%;background:#fff;font:15px/1.8 "Microsoft YaHei",sans-serif;color:#222}.arg-wenlian-wiki header{padding:15px 9%;color:#fff;background:#4095e8;font-size:18px}.arg-wenlian-wiki main{max-width:1040px;margin:35px auto;display:grid;grid-template-columns:1fr 300px;gap:35px}.arg-wenlian-wiki h1{margin:0;border-bottom:1px solid #ddd;font-size:32px}.arg-wenlian-wiki h2{border-left:4px solid #3e95e8;padding-left:10px;margin-top:28px}.arg-wenlian-wiki table{width:100%;border-collapse:collapse}.arg-wenlian-wiki th,.arg-wenlian-wiki td{padding:9px;border-bottom:1px solid #e5e5e5;text-align:left}.arg-wenlian-wiki aside{border:1px solid #ddd;padding:10px;height:max-content}.arg-wenlian-wiki aside img{width:100%;display:block}.arg-wenlian-wiki aside p{text-align:center;color:#557}.arg-wenlian-wiki ul{padding-left:22px}.arg-wenlian-wiki li{margin:7px 0}</style><header>百度百科　词条页</header><main><article><h1>文莲慈善基金会</h1><p>慈善组织</p><h2>机构简介</h2><p>文莲慈善基金会成立于2019年，是一家以儿童公益、医疗援助和社会救助为主要方向的慈善组织。基金会持续开展困难儿童关爱、基层医疗支持及社会公益服务，与社会各界共同推动公益项目落地。</p><h2>基本信息</h2><table><tr><th>成立时间</th><td>2019年</td></tr><tr><th>创始人</th><td>林文武</td></tr><tr><th>总部所在地</th><td>江州市</td></tr><tr><th>业务方向</th><td>儿童公益、医疗援助、社会救助</td></tr></table><h2>发展历程</h2><p>基金会成立初期主要关注困难地区儿童饮水与生活保障，随后逐步拓展至医疗援助、儿童福利及基层社会服务等公益领域。</p><h2>公益项目</h2><ul><li>儿童饮水援助与基础设施改善项目</li><li>困难患者医疗援助与基层医疗支持项目</li><li>儿童福利机构关爱及生活支持项目</li><li>困难家庭社会救助服务</li></ul><h2>主要合作单位</h2><ul><li>江州市水利部门</li><li>江州远博实业集团股份有限公司</li><li>医疗机构</li><li>社会福利机构</li></ul><h2>社会活动</h2><p>基金会通过公益合作、志愿服务和专项资助等方式参与儿童关爱与社区服务，持续发布相关项目进展和公益活动信息。</p></article><aside><img src="./assets/browser/wenlian-charity/foundation-building.png" alt="文莲慈善基金会"><p>文莲慈善基金会办公楼与公益活动</p></aside></main></section>';
  }

  function wenlianWiki() {
    var timeline = [['2019年','基金会在江州市成立，由林文武发起。成立初期主要开展困难地区儿童饮水改善、生活物资援助及基层公益服务。'],['2020年','基金会逐步扩大公益范围，开始参与困难儿童医疗援助、困难家庭救助，并与江州市部分医疗机构建立公益协作关系。'],['2021年','基金会继续拓展医疗援助和基层社会服务项目，参与困难患者援助、儿童关爱活动及部分基层医疗公益支持。'],['2022年','基金会加强与社会福利机构、社区公益组织及医疗单位的合作，开展儿童关爱、生活物资援助和基层社会救助活动。'],['2023年','基金会参与江州市部分民生服务和基层公益项目，在儿童关爱、困难群体救助及基层设施改善等领域参与社会公益协作。'],['2024年','基金会拓展与医疗机构、福利机构及社会服务单位的合作，部分公益项目逐步纳入多部门协作和社会力量共同参与的民生服务体系。'],['2025年','基金会作为社会合作单位参与江州市儿童关爱与基层福利设施提升相关项目，并继续开展医疗救助、儿童关爱和基层公益合作。'],['2026年','基金会继续开展儿童关爱、医疗援助和基层公益服务，推动公益项目常态化运行，并加强与医疗机构、社会福利机构及社会企业的合作。']];
    var projects = [['“清泉计划”儿童饮水援助项目','面向基层及困难地区儿童开展饮水设施改善、生活饮水保障及相关公益援助。'],['“莲心医疗援助计划”','针对符合条件的困难患者提供医疗援助，并与合作医疗机构开展公益支持活动。'],['儿童关爱与福利机构支持项目','面向社会福利机构和困难儿童群体开展生活物资援助、儿童关爱活动及福利设施支持。'],['基层医疗公益支持项目','通过公益合作、医疗物资支持及社会资源协调参与基层医疗和困难患者援助。'],['困难家庭社会救助服务','为符合条件的困难家庭提供生活物资、临时援助及相关公益服务支持。']];
    var section = function (title, html) { return '<h2>' + title + '</h2>' + html; };
    return '<section class="arg-wenlian-wiki"><style>.arg-wenlian-wiki{min-height:100%;background:#fff;font:15px/1.8 "Microsoft YaHei",sans-serif;color:#222}.arg-wenlian-wiki header{padding:15px 9%;color:#fff;background:#4095e8;font-size:18px}.arg-wenlian-wiki main{max-width:1040px;margin:35px auto;display:grid;grid-template-columns:1fr 300px;gap:35px}.arg-wenlian-wiki h1{margin:0;border-bottom:1px solid #ddd;font-size:32px}.arg-wenlian-wiki h2{border-left:4px solid #3e95e8;padding-left:10px;margin-top:28px}.arg-wenlian-wiki table{width:100%;border-collapse:collapse}.arg-wenlian-wiki th,.arg-wenlian-wiki td{padding:9px;border-bottom:1px solid #e5e5e5;text-align:left}.arg-wenlian-wiki aside{border:1px solid #ddd;padding:10px;height:max-content}.arg-wenlian-wiki aside img{width:100%;display:block}.arg-wenlian-wiki aside p{text-align:center;color:#557}.arg-wenlian-wiki ul{padding-left:22px}.arg-wenlian-wiki li{margin:8px 0}.arg-wenlian-wiki .toc{padding:12px 18px;background:#f6f8fb;border:1px solid #e2e8f0}.arg-wenlian-wiki .timeline b{display:block;color:#397bc1}</style><header>百度百科　词条页</header><main><article><h1>文莲慈善基金会</h1><p>文莲慈善基金会是一家以儿童帮扶、医疗援助、社会救助和基层公益服务为主要方向的慈善组织。基金会于2019年在江州市成立，由企业家、公益人士林文武发起，逐步与地方政府部门、医疗机构、社会福利机构及企业开展公益合作。</p><div class="toc"><b>目录</b><br>1 机构简介　2 基本信息　3 发展历程　4 主要公益项目　5 主要合作单位　6 组织与管理　7 社会活动与公益合作　8 社会影响　9 参考资料</div>' + section('机构简介','<p>基金会成立初期主要关注困难地区儿童饮水、基本生活保障及弱势群体救助，随后逐步拓展至困难患者医疗援助、儿童福利机构支持、基层医疗公益及社区社会服务等领域。</p><p>基金会通过公益项目、定向援助、物资支持及社会资源协调等方式开展活动，并与地方政府部门、医疗机构、福利机构及社会企业建立合作关系。</p>') + section('基本信息','<table><tr><th>中文名</th><td>文莲慈善基金会</td></tr><tr><th>机构性质</th><td>慈善组织</td></tr><tr><th>成立时间</th><td>2019年</td></tr><tr><th>发起人</th><td>林文武</td></tr><tr><th>总部所在地</th><td>江州市</td></tr><tr><th>业务方向</th><td>儿童公益、医疗援助、社会救助、基层公益服务</td></tr><tr><th>主要服务对象</th><td>困难儿童、困难患者、社会福利机构及其他需要援助的群体</td></tr><tr><th>主要活动地区</th><td>江州市及周边地区</td></tr></table>') + section('发展历程','<div class="timeline">' + timeline.map(function (item) { return '<p><b>' + item[0] + '</b>' + item[1] + '</p>'; }).join('') + '</div>') + section('主要公益项目','<ul>' + projects.map(function (item) { return '<li><b>' + item[0] + '</b><br>' + item[1] + '</li>'; }).join('') + '</ul>') + section('主要合作单位','<ul><li><b>江州市有关水利部门</b><br>围绕基层饮水设施改善、儿童饮水保障及相关公益项目开展合作。</li><li><b>江州远博实业集团股份有限公司</b><br>参与部分公益项目的资金支持、物资援助及社会资源合作。</li><li><b>医疗机构</b><br>围绕困难患者医疗援助、儿童医疗支持和基层医疗公益项目开展合作。</li><li><b>社会福利机构</b><br>开展儿童关爱、生活物资援助及福利设施支持等公益活动。</li></ul>') + section('组织与管理','<p>文莲慈善基金会由发起人及相关管理人员参与日常管理，主要负责公益项目规划、资源协调、合作机构沟通及项目执行等工作。林文武作为基金会发起人，长期参与基金会公益项目及对外公益活动。</p>') + section('社会活动与公益合作','<p>基金会长期开展儿童关爱、困难家庭慰问、医疗公益宣传、公益物资捐助及志愿服务等活动。在部分项目中，基金会与地方政府部门、医疗机构、社会福利机构及企业共同开展公益合作。</p>') + section('社会影响','<p>随着公益项目范围扩大，文莲慈善基金会逐步参与江州市多个儿童关爱、医疗援助和基层社会服务项目，并与多类社会机构建立公益合作关系。基金会相关活动曾出现在地方公益服务、儿童福利及医疗援助等公开报道中。</p>') + section('参考资料','<ol><li>文莲慈善基金会成立并启动儿童公益项目</li><li>社会公益力量参与江州市基层民生服务</li><li>江州市开展儿童福利和社会公益服务合作交流</li><li>社会公益力量参与医疗救助服务</li><li>江州市推进儿童关爱与基层福利设施提升项目</li></ol>') + '</article><aside><img src="./assets/browser/wenlian-charity/foundation-building.png" alt="文莲慈善基金会"><p>文莲慈善基金会办公楼与公益活动</p></aside></main></section>';
  }

  function canonicalKeyword(value) {
    return String(value || '').trim();
  }

  window.registerBrowserPage('wenlian-charity-baike', function () {
    return { html: wenlianWiki(), url: 'https://baike.baidu.com/item/文莲慈善基金会' };
  });
  window.registerBrowserPage('wenlian-charity-official', function () {
    return { html: wenlianOfficial(), url: 'https://wenlian-charity.local/', enhance: enhanceWenlianOfficial };
  });

  window.ARG_BROWSER = {
    renderApp: function (container, deps) {
      app.renderApp(container, deps);
      window.mountBrowserNavigation(container);

      function cleanWenlianSearchResult() {
        var view = container.querySelector('.arg-browser-view');
        if (view) window.hydrateBrowserView(view);
      }
      window.requestAnimationFrame(cleanWenlianSearchResult);
      new MutationObserver(function () { window.requestAnimationFrame(cleanWenlianSearchResult); }).observe(container, { childList: true, subtree: true });
      if (container.dataset.siteSearchConfigBound) return;
      container.dataset.siteSearchConfigBound = 'true';
      container.addEventListener('click', function (event) {
        var carouselControl = event.target.closest('[data-wl-carousel]');
        if (!carouselControl) return;
        event.preventDefault();
        var carousel = carouselControl.closest('.wl-carousel');
        var slides = carousel && carousel.querySelectorAll('img');
        if (!slides || !slides.length) return;
        var current = Array.prototype.findIndex.call(slides, function (slide) { return slide.classList.contains('active'); });
        var direction = carouselControl.dataset.wlCarousel === 'next' ? 1 : -1;
        slides[current].classList.remove('active');
        slides[(current + direction + slides.length) % slides.length].classList.add('active');
      }, true);

      deps.loadJson(deps.app.source + 'index.json').then(function (data) {
        browserPages = data.pages || {};
        window.requestAnimationFrame(cleanWenlianSearchResult);
      }).catch(function () {
        pages = {};
      });

      var mappings = [
        { selector: '.arg-hospital-search', pageId: 'jiangzhou-second-hospital-search', name: '江州市第二人民医院' },
        { selector: '.arg-welfare-search', pageId: 'fandou-welfare-search', name: '翻斗花园阳光福利院' }
      ];

      /* Capture phase is intentional: it gives saved editor rules priority over old page-specific listeners. */
      container.addEventListener('submit', function (event) {
        var target = event.target;
        var mapping = mappings.find(function (item) {
          return target && target.closest && target.closest(item.selector);
        });
        if (!mapping) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        var form = target.closest(mapping.selector);
        var input = form && form.querySelector('input');
        var keyword = input ? input.value.trim() : '';
        var rules = (pages[mapping.pageId] && pages[mapping.pageId].siteSearchRules) || [];
        var rule = rules.find(function (item) {
          var saved = canonicalKeyword(item.keyword);
          var typed = canonicalKeyword(keyword);
          return saved === typed || (typed.length >= 4 && saved.indexOf(typed) === 0);
        });
        window.showBrowserPage({ html: rule ? article(rule, mapping.name) : unavailable(mapping.name), url: 'https://local.arg/site-search?q=' + encodeURIComponent(keyword) });
      }, true);
    }
  };
}());
/* Register the Zhao Degang enhancement before the desktop can open the browser. */
var zhaoSearchScript = document.createElement('script');
zhaoSearchScript.src = './js/apps/browser-zhao-search.js?v=20260818e';
zhaoSearchScript.async = false;
document.head.appendChild(zhaoSearchScript);
