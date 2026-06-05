/**
 * 应用入口：初始化、视图切换、全局状态管理
 */

// 当前视图状态：'list' | 'detail'
let currentView = 'list';

function init() {
  // 确保数据已初始化
  loadData();

  // 渲染默认视图
  switchView('list');

  // 绑定全局事件
  bindGlobalEvents();
}

function switchView(view, params) {
  const viewList = document.getElementById('view-library-list');
  const viewDetail = document.getElementById('view-library-detail');
  const viewRuleConfig = document.getElementById('view-rule-config');
  const viewBatch = document.getElementById('view-batch');
  const tabList = document.getElementById('tab-list');
  const tabDetail = document.getElementById('tab-detail');
  const tabRuleConfig = document.getElementById('tab-rule-config');
  const tabBatch = document.getElementById('tab-batch');
  const headerTitle = document.getElementById('header-title');

  currentView = view;

  // 重置所有 tab 样式
  const resetTabs = () => {
    tabList && (tabList.className = 'px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700');
    tabDetail && (tabDetail.className = 'px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700');
    tabRuleConfig && (tabRuleConfig.className = 'px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700');
    tabBatch && (tabBatch.className = 'px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700');
  };

  if (view === 'list') {
    viewList && viewList.classList.remove('hidden');
    viewDetail && viewDetail.classList.add('hidden');
    viewRuleConfig && viewRuleConfig.classList.add('hidden');
    viewBatch && viewBatch.classList.add('hidden');
    resetTabs();
    tabList && (tabList.className = 'px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600');
    if (headerTitle) headerTitle.textContent = '风险点库管理';
    initLibraryList();
  } else if (view === 'detail') {
    viewList && viewList.classList.add('hidden');
    viewDetail && viewDetail.classList.remove('hidden');
    viewRuleConfig && viewRuleConfig.classList.add('hidden');
    viewBatch && viewBatch.classList.add('hidden');
    resetTabs();
    tabDetail && (tabDetail.className = 'px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600');
    if (headerTitle) headerTitle.textContent = '风险点库详情';
    if (params && params.libraryId) {
      initLibraryDetail(params.libraryId);
    }
  } else if (view === 'rule-config') {
    viewList && viewList.classList.add('hidden');
    viewDetail && viewDetail.classList.add('hidden');
    viewRuleConfig && viewRuleConfig.classList.remove('hidden');
    viewBatch && viewBatch.classList.add('hidden');
    resetTabs();
    tabRuleConfig && (tabRuleConfig.className = 'px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600');
    if (headerTitle) headerTitle.textContent = '规则配置页';
    initRuleConfig();
  } else if (view === 'batch') {
    viewList && viewList.classList.add('hidden');
    viewDetail && viewDetail.classList.add('hidden');
    viewRuleConfig && viewRuleConfig.classList.add('hidden');
    viewBatch && viewBatch.classList.remove('hidden');
    resetTabs();
    tabBatch && (tabBatch.className = 'px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600');
    if (headerTitle) headerTitle.textContent = '初始化批量添加风险点';
    renderBatchPage();
  }
}

function navigateToDetail(libraryId) {
  switchView('detail', { libraryId });
}

function navigateToList() {
  switchView('list');
}

function bindGlobalEvents() {
  // Tab 切换
  const tabList = document.getElementById('tab-list');
  const tabDetail = document.getElementById('tab-detail');
  const tabRuleConfig = document.getElementById('tab-rule-config');
  const tabBatch = document.getElementById('tab-batch');

  if (tabList) {
    tabList.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToList();
    });
  }
  if (tabDetail) {
    tabDetail.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentLibraryId) {
        navigateToDetail(currentLibraryId);
      }
    });
  }
  if (tabRuleConfig) {
    tabRuleConfig.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('rule-config');
    });
  }
  if (tabBatch) {
    tabBatch.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('batch');
    });
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);