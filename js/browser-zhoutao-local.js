(function () {
  'use strict';
  if (!window.ARG_LOCAL_DATA || !window.ARG_LOCAL_DATA.records || !window.ARG_LOCAL_DATA.records.browser) return;
  /* Server data is authoritative. This marker keeps the local-mode record available for the same search UI. */
  window.ARG_LOCAL_DATA.records.browser[0].data.hotSearches = ['\u5468\u6d9b', '\u5e02\u5c40\u65e7\u6848', '\u5931\u8e2a\u4eba\u53e3', '\u533b\u9662\u503c\u73ed\u8868'];
  window.ARG_LOCAL_DATA.records.browser[0].data.searchRules = [{ keywords: ['\u5468\u6d9b'], pageId: 'zhou-tao-search' }];
  window.ARG_LOCAL_DATA.records.browser[0].data.pages = { 'zhou-tao-search': { layout: 'search-results', query: '\u5468\u6d9b', resultCount: '\u7ea6 8,640 \u4e2a\u7ed3\u679c', profile: { name: '\u5468\u6d9b', summary: '\u7537\uff0c36\u5c81\uff0c\u6c5f\u5dde\u5e02\u4eba\u3002\u6c5f\u5dde\u8fdc\u535a\u5b9e\u4e1a\u96c6\u56e2\u80a1\u4efd\u6709\u9650\u516c\u53f8\u521b\u59cb\u4eba\u3001\u8463\u4e8b\u957f\u3002', facts: ['\u6c5f\u5dde\u8fdc\u535a\u5b9e\u4e1a\u96c6\u56e2\u8463\u4e8b\u957f', '\u516c\u5f00\u51fa\u5e2d\u8bb0\u5f55\u6b62\u4e8e 2025 \u5e74 11 \u6708'] }, related: ['\u5468\u6d9b \u4e2a\u4eba\u8d44\u6599', '\u6c5f\u5dde\u8fdc\u535a\u5b9e\u4e1a\u96c6\u56e2'], news: [] } };
}());
