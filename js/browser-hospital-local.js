(function () {
  'use strict';
  var records = window.ARG_LOCAL_DATA && window.ARG_LOCAL_DATA.records && window.ARG_LOCAL_DATA.records.browser;
  if (!records || !records[0]) return;
  var data = records[0].data;
  data.hotSearches = ['周涛', '翻斗花园阳光福利院', '江州市第二人民医院', '市局旧案'];
  data.searchRules.push({ keywords: ['江州市第二人民医院'], pageId: 'jiangzhou-second-hospital-search' });
  data.pages['jiangzhou-second-hospital-search'] = { layout: 'search-results', query: '江州市第二人民医院', resultCount: '约 4,380 个结果', profile: { name: '江州市第二人民医院', summary: '江州市第二人民医院是一所综合性公立医院，提供门诊、住院、急诊、医疗协作及公共卫生服务。', facts: ['医院等级：三级综合医院', '地址：江州市城南区安康路18号', '门诊时间：8:00—17:30'] }, related: ['江州市第二人民医院 门诊', '江州市第二人民医院 医生', '江州市第二人民医院 地址', '江州市第二人民医院 预约挂号'], news: [] };
}());

(function () {
  'use strict';
  var records = window.ARG_LOCAL_DATA && window.ARG_LOCAL_DATA.records && window.ARG_LOCAL_DATA.records.browser;
  if (!records || !records[0]) return;
  var data = records[0].data;
  data.searchRules = data.searchRules || [];
  data.pages = data.pages || {};
  data.searchRules.push({ keywords: ['文莲慈善基金会'], pageId: 'wenlian-charity-search' });
  data.pages['wenlian-charity-search'] = { layout: 'search-results', query: '文莲慈善基金会', resultCount: '约 2,160 个结果', webResults: [{ pageId: 'wenlian-charity-official', source: '文莲慈善基金会官方网站', title: '文莲慈善基金会', url: 'https://wenlian-charity.local/', snippet: '文莲慈善基金会官方网站。公开发布公益项目、资助动态与机构信息。' }, { pageId: 'wenlian-charity-baike', source: '百度百科', title: '文莲慈善基金会_百度百科', url: 'https://baike.baidu.com/item/文莲慈善基金会', snippet: '文莲慈善基金会的相关资料。该词条内容正在整理中。' }], related: ['文莲慈善基金会 公益项目', '文莲慈善基金会 资助公示'] };
  data.pages['wenlian-charity-official'] = { layout: 'placeholder', title: '文莲慈善基金会', url: 'https://wenlian-charity.local/', message: '官方网站页面内容待录入。' };
  data.pages['wenlian-charity-baike'] = { layout: 'placeholder', title: '文莲慈善基金会 - 百度百科', url: 'https://baike.baidu.com/item/文莲慈善基金会', message: '百度百科页面内容待录入。' };
}());
