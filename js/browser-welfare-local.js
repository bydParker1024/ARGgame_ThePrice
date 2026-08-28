(function () {
  'use strict';
  var records = window.ARG_LOCAL_DATA && window.ARG_LOCAL_DATA.records && window.ARG_LOCAL_DATA.records.browser;
  if (!records || !records[0]) return;
  var data = records[0].data;
  data.hotSearches = ['周涛', '翻斗花园阳光福利院', '市局旧案', '失踪人口'];
  data.searchRules.push({ keywords: ['翻斗花园阳光福利院'], pageId: 'fandou-welfare-search' });
  data.pages['fandou-welfare-search'] = { layout: 'search-results', query: '翻斗花园阳光福利院', resultCount: '约 1,280 个结果', profile: { name: '翻斗花园阳光福利院', summary: '翻斗花园阳光福利院，位于江州市翻斗花园社区，为儿童提供生活照护、教育支持、医疗协助及社会融入服务的公益福利机构。', facts: ['机构类型：儿童福利机构', '服务范围：生活照护、教育支持、医疗协助', '公开状态：正常运营'] }, related: ['翻斗花园阳光福利院 地址', '翻斗花园阳光福利院 志愿者', '江州市 儿童福利机构', '阳光福利院 捐赠'], news: [{ source: '江州市民政服务网', time: '2026-08-01', title: '翻斗花园阳光福利院发布暑期儿童关爱服务安排', snippet: '院方表示，暑期服务将围绕健康筛查、阅读陪伴及户外活动展开。' }, { source: '社区公益资讯', time: '2026-07-24', title: '翻斗花园社区志愿者走进阳光福利院', snippet: '志愿服务队完成院内阅读角整理及陪伴活动。' }] };
}());
