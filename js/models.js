/**
 * 数据模型定义 & 常量
 * 三层结构：风险点库 → 审查条款 → 审查点
 */

// === 常量 ===

/** 风险点库标签 */
const LIBRARY_TAGS = ['通用', '客户'];

/** 客户标签（选"客户"时可用） */
const CUSTOMER_TAGS = ['供应商A', '供应商B', '客户A', '客户B', '合作方X', '合作方Y'];

/** 风险等级 */
const RISK_LEVELS = ['高风险', '中风险', '低风险'];

/** 风险点类型 */
const RISK_TYPES = ['正常', '缺失'];

/** 适用合同类型标签 */
const CONTRACT_TAGS = ['通用', '采购', '租赁', '服务', '劳动', '销售', '技术', '保密', '合作', '委托'];

/** 审查立场标签 */
const STANCE_TAGS = ['发包方', '承包方', '中立', '甲方', '乙方'];

// === 工具函数 ===

function generateId(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

function now() {
  return new Date().toISOString();
}

// === 工厂函数 ===

/** 创建风险点库 */
function createRiskLibrary(overrides = {}) {
  return {
    id: generateId('lib'),
    name: '',
    tag: '',            // '通用' | '客户'，互斥单选
    customerTag: '',    // 选"客户"时必填
    creator: '',        // 创建人
    clauses: [],        // ReviewClause 数组
    createdAt: now(),
    updatedAt: now(),
    ...overrides
  };
}

/** 创建审查条款 */
function createReviewClause(overrides = {}) {
  return {
    id: generateId('clause'),
    libraryId: '',
    title: '',
    order: 0,
    reviewPoints: [],   // ReviewPoint 数组
    createdAt: now(),
    updatedAt: now(),
    ...overrides
  };
}

/** 创建审查点 */
function createReviewPoint(overrides = {}) {
  return {
    id: generateId('rp'),
    clauseId: '',
    libraryId: '',
    name: '',
    description: '',
    type: '正常',
    riskLevel: '中风险',
    reviewSuggestion: '',
    passCriteria: '',
    riskCriteria: '',
    boundaryDescription: '',
    contractTags: [],
    stanceTags: [],
    createdAt: now(),
    updatedAt: now(),
    ...overrides
  };
}