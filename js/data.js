/**
 * 数据层：预设数据、localStorage 读写、导入导出
 */

const STORAGE_KEY = 'risk_library_app';

/** 生成预设示例数据 */
function getPresetData() {
  // 库1：采购合同风险点库
  const lib1 = createRiskLibrary({
    id: 'lib_preset_1',
    name: '采购合同风险点库',
    tag: '客户',
    customerTag: '供应商A',
    creator: '张三',
    clauses: []
  });

  const clause1_1 = createReviewClause({
    id: 'clause_preset_1_1',
    libraryId: lib1.id,
    title: '签约主体资质审查',
    order: 0,
    reviewPoints: []
  });

  const rp1_1_1 = createReviewPoint({
    id: 'rp_preset_1_1_1',
    clauseId: clause1_1.id,
    libraryId: lib1.id,
    name: '签约主体名称与工商登记不一致',
    description: '合同签约主体名称与营业执照上的法定名称存在差异',
    type: '正常',
    riskLevel: '高风险',
    reviewSuggestion: '建议核实签约主体的工商登记信息，确保合同主体名称与营业执照完全一致',
    passCriteria: '签约主体名称与营业执照完全一致',
    riskCriteria: '名称不一致可能导致合同主体不明确，影响合同效力',
    boundaryDescription: '若为分支机构签约，需核实总公司授权情况',
    contractTags: ['通用', '采购'],
    stanceTags: ['发包方']
  });

  const rp1_1_2 = createReviewPoint({
    id: 'rp_preset_1_1_2',
    clauseId: clause1_1.id,
    libraryId: lib1.id,
    name: '签约主体资质文件缺失',
    description: '未提供营业执照、授权委托书等必要资质文件',
    type: '缺失',
    riskLevel: '高风险',
    reviewSuggestion: '要求签约方提供有效的营业执照和授权委托书',
    passCriteria: '资质文件齐全且在有效期内',
    riskCriteria: '资质文件缺失可能导致合同无效',
    boundaryDescription: '',
    contractTags: ['通用'],
    stanceTags: ['发包方']
  });

  const rp1_1_3 = createReviewPoint({
    id: 'rp_preset_1_1_3',
    clauseId: clause1_1.id,
    libraryId: lib1.id,
    name: '授权委托书过期',
    description: '签约代表的授权委托书已超过有效期',
    type: '正常',
    riskLevel: '中风险',
    reviewSuggestion: '要求提供在有效期内的授权委托书',
    passCriteria: '授权委托书在有效期内且授权范围充分',
    riskCriteria: '授权过期可能导致签约行为效力待定',
    boundaryDescription: '法定代表人亲自签约则无需授权委托书',
    contractTags: ['通用'],
    stanceTags: ['发包方']
  });

  clause1_1.reviewPoints = [rp1_1_1, rp1_1_2, rp1_1_3];

  const clause1_2 = createReviewClause({
    id: 'clause_preset_1_2',
    libraryId: lib1.id,
    title: '付款条款审查',
    order: 1,
    reviewPoints: []
  });

  const rp1_2_1 = createReviewPoint({
    id: 'rp_preset_1_2_1',
    clauseId: clause1_2.id,
    libraryId: lib1.id,
    name: '付款条件不明确',
    description: '合同未明确付款的前提条件和时间节点',
    type: '缺失',
    riskLevel: '高风险',
    reviewSuggestion: '建议明确付款的里程碑节点和验收标准',
    passCriteria: '付款条件清晰、可量化、可验证',
    riskCriteria: '付款条件模糊可能导致付款纠纷',
    boundaryDescription: '',
    contractTags: ['采购', '服务'],
    stanceTags: ['发包方']
  });

  const rp1_2_2 = createReviewPoint({
    id: 'rp_preset_1_2_2',
    clauseId: clause1_2.id,
    libraryId: lib1.id,
    name: '违约金比例过高',
    description: '合同约定的违约金比例超出法定标准',
    type: '正常',
    riskLevel: '中风险',
    reviewSuggestion: '建议将违约金调整至法定范围（不超过实际损失的30%）',
    passCriteria: '违约金比例不超过法定上限',
    riskCriteria: '违约金过高可能在诉讼中被法院调减',
    boundaryDescription: '',
    contractTags: ['通用', '采购'],
    stanceTags: []
  });

  clause1_2.reviewPoints = [rp1_2_1, rp1_2_2];

  lib1.clauses = [clause1_1, clause1_2];

  // 库2：保密合同风险点库
  const lib2 = createRiskLibrary({
    id: 'lib_preset_2',
    name: '保密合同风险点库',
    tag: '通用',
    customerTag: '',
    creator: '李四',
    clauses: []
  });

  const clause2_1 = createReviewClause({
    id: 'clause_preset_2_1',
    libraryId: lib2.id,
    title: '保密范围审查',
    order: 0,
    reviewPoints: []
  });

  const rp2_1_1 = createReviewPoint({
    id: 'rp_preset_2_1_1',
    clauseId: clause2_1.id,
    libraryId: lib2.id,
    name: '保密信息范围过于宽泛',
    description: '保密条款中"保密信息"的定义过于宽泛，可能将已公开信息纳入',
    type: '正常',
    riskLevel: '中风险',
    reviewSuggestion: '建议明确保密信息的具体范围和排除情形',
    passCriteria: '保密信息定义明确，排除已公开信息',
    riskCriteria: '范围过宽可能导致履约困难和不合理限制',
    boundaryDescription: '已公开或从合法渠道获取的信息不应纳入保密范围',
    contractTags: ['保密'],
    stanceTags: ['发包方']
  });

  const rp2_1_2 = createReviewPoint({
    id: 'rp_preset_2_1_2',
    clauseId: clause2_1.id,
    libraryId: lib2.id,
    name: '保密期限缺失',
    description: '合同未约定保密义务的存续期限',
    type: '缺失',
    riskLevel: '中风险',
    reviewSuggestion: '建议明确保密期限，包括合同终止后的保密义务存续时间',
    passCriteria: '保密期限明确，含终止后存续期限',
    riskCriteria: '期限缺失可能导致无限期保密义务',
    boundaryDescription: '',
    contractTags: ['保密', '服务'],
    stanceTags: ['承包方']
  });

  clause2_1.reviewPoints = [rp2_1_1, rp2_1_2];

  const clause2_2 = createReviewClause({
    id: 'clause_preset_2_2',
    libraryId: lib2.id,
    title: '违约责任审查',
    order: 1,
    reviewPoints: []
  });

  const rp2_2_1 = createReviewPoint({
    id: 'rp_preset_2_2_1',
    clauseId: clause2_2.id,
    libraryId: lib2.id,
    name: '违约责任不对等',
    description: '合同双方违约责任条款明显不对等，一方责任过重',
    type: '正常',
    riskLevel: '高风险',
    reviewSuggestion: '建议平衡双方违约责任，确保对等合理',
    passCriteria: '双方违约责任基本对等',
    riskCriteria: '责任不对等可能导致显失公平',
    boundaryDescription: '',
    contractTags: ['通用', '保密'],
    stanceTags: []
  });

  clause2_2.reviewPoints = [rp2_2_1];

  lib2.clauses = [clause2_1, clause2_2];

  return [lib1, lib2];
}

/** 从 localStorage 加载数据 */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('localStorage 数据读取失败，使用预设数据', e);
  }
  const preset = getPresetData();
  saveData(preset);
  return preset;
}

/** 保存数据到 localStorage */
function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    showToast('数据保存失败，请检查浏览器存储空间', 'error');
  }
}

/** 获取所有风险点库 */
function getLibraries() {
  return loadData();
}

/** 根据 ID 获取风险点库 */
function getLibraryById(id) {
  const libraries = loadData();
  return libraries.find(lib => lib.id === id) || null;
}

/** 新增风险点库 */
function addLibrary(data) {
  const libraries = loadData();
  const lib = createRiskLibrary(data);
  libraries.push(lib);
  saveData(libraries);
  return lib;
}

/** 更新风险点库 */
function updateLibrary(id, updates) {
  const libraries = loadData();
  const idx = libraries.findIndex(lib => lib.id === id);
  if (idx === -1) return null;
  libraries[idx] = { ...libraries[idx], ...updates, updatedAt: now() };
  saveData(libraries);
  return libraries[idx];
}

/** 删除风险点库（级联删除所有条款和审查点） */
function deleteLibrary(id) {
  const libraries = loadData();
  const filtered = libraries.filter(lib => lib.id !== id);
  saveData(filtered);
}

/** 复制风险点库（深拷贝，含条款和审查点），支持指定新标签和客户标签 */
function duplicateLibrary(id, newTag, newCustomerTag) {
  const libraries = loadData();
  const source = libraries.find(lib => lib.id === id);
  if (!source) return null;

  const newId = generateId('lib');
  const newLib = JSON.parse(JSON.stringify(source));
  newLib.id = newId;
  newLib.name = source.name + '（副本）';
  // 使用传入的标签和客户标签
  newLib.tag = newTag || source.tag || '';
  newLib.customerTag = newTag === '客户' ? (newCustomerTag || '') : '';
  newLib.createdAt = now();
  newLib.updatedAt = now();

  // 为条款和审查点生成新 ID
  newLib.clauses.forEach(clause => {
    clause.id = generateId('clause');
    clause.libraryId = newId;
    clause.createdAt = now();
    clause.updatedAt = now();
    clause.reviewPoints.forEach(rp => {
      rp.id = generateId('rp');
      rp.clauseId = clause.id;
      rp.libraryId = newId;
      rp.createdAt = now();
      rp.updatedAt = now();
    });
  });

  libraries.push(newLib);
  saveData(libraries);
  return newLib;
}

/** 新增条款 */
function addClause(libraryId, data) {
  const libraries = loadData();
  const lib = libraries.find(l => l.id === libraryId);
  if (!lib) return null;
  const order = lib.clauses.length;
  const clause = createReviewClause({ ...data, libraryId, order });
  lib.clauses.push(clause);
  lib.updatedAt = now();
  saveData(libraries);
  return clause;
}

/** 更新条款 */
function updateClause(libraryId, clauseId, updates) {
  const libraries = loadData();
  const lib = libraries.find(l => l.id === libraryId);
  if (!lib) return null;
  const clause = lib.clauses.find(c => c.id === clauseId);
  if (!clause) return null;
  Object.assign(clause, updates, { updatedAt: now() });
  lib.updatedAt = now();
  saveData(libraries);
  return clause;
}

/** 删除条款 */
function deleteClause(libraryId, clauseId) {
  const libraries = loadData();
  const lib = libraries.find(l => l.id === libraryId);
  if (!lib) return;
  lib.clauses = lib.clauses.filter(c => c.id !== clauseId);
  lib.updatedAt = now();
  saveData(libraries);
}

/** 新增审查点 */
function addReviewPoint(libraryId, clauseId, data) {
  const libraries = loadData();
  const lib = libraries.find(l => l.id === libraryId);
  if (!lib) return null;
  const clause = lib.clauses.find(c => c.id === clauseId);
  if (!clause) return null;
  const rp = createReviewPoint({ ...data, clauseId, libraryId });
  clause.reviewPoints.push(rp);
  clause.updatedAt = now();
  lib.updatedAt = now();
  saveData(libraries);
  return rp;
}

/** 更新审查点 */
function updateReviewPoint(libraryId, clauseId, rpId, updates) {
  const libraries = loadData();
  const lib = libraries.find(l => l.id === libraryId);
  if (!lib) return null;
  const clause = lib.clauses.find(c => c.id === clauseId);
  if (!clause) return null;
  const rp = clause.reviewPoints.find(p => p.id === rpId);
  if (!rp) return null;
  Object.assign(rp, updates, { updatedAt: now() });
  clause.updatedAt = now();
  lib.updatedAt = now();
  saveData(libraries);
  return rp;
}

/** 删除审查点 */
function deleteReviewPoint(libraryId, clauseId, rpId) {
  const libraries = loadData();
  const lib = libraries.find(l => l.id === libraryId);
  if (!lib) return;
  const clause = lib.clauses.find(c => c.id === clauseId);
  if (!clause) return;
  clause.reviewPoints = clause.reviewPoints.filter(p => p.id !== rpId);
  clause.updatedAt = now();
  lib.updatedAt = now();
  saveData(libraries);
}

/** 导出风险点库为 JSON */
function exportLibraryJSON(libraryId) {
  const lib = getLibraryById(libraryId);
  if (!lib) return;
  const json = JSON.stringify(lib, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${lib.name}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 导出条款为 JSON（含审查点） */
function exportClausesJSON(libraryId) {
  const lib = getLibraryById(libraryId);
  if (!lib) return;
  const data = {
    libraryName: lib.name,
    clauses: lib.clauses || []
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${lib.name}_条款_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 导入条款 JSON */
function importClausesJSON(libraryId, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        let clauses = [];
        if (Array.isArray(data)) {
          clauses = data;
        } else if (data.clauses && Array.isArray(data.clauses)) {
          clauses = data.clauses;
        } else {
          reject(new Error('JSON 格式不正确，需要 clauses 数组'));
          return;
        }
        const lib = getLibraryById(libraryId);
        if (!lib) { reject(new Error('风险点库不存在')); return; }
        let addedCount = 0;
        clauses.forEach(c => {
          const clause = createReviewClause({
            libraryId,
            title: c.title || '未命名条款',
            order: (lib.clauses ? lib.clauses.length : 0) + addedCount
          });
          if (c.reviewPoints && Array.isArray(c.reviewPoints)) {
            clause.reviewPoints = c.reviewPoints.map(rp => createReviewPoint({
              ...rp,
              id: generateId('rp'),
              clauseId: clause.id,
              libraryId
            }));
          }
          lib.clauses.push(clause);
          addedCount++;
        });
        lib.updatedAt = now();
        const all = getLibraries();
        const idx = all.findIndex(l => l.id === libraryId);
        if (idx !== -1) {
          all[idx] = lib;
          saveData(all);
        }
        resolve(addedCount);
      } catch (err) {
        reject(new Error('JSON 解析失败：' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

/** 导入风险点库 JSON */
function importLibraryJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // 简单校验
        if (!data.name) {
          reject(new Error('JSON 格式不正确，缺少 name 字段'));
          return;
        }
        // 为新导入的库重新生成 ID
        data.id = generateId('lib');
        data.createdAt = now();
        data.updatedAt = now();
        if (data.clauses) {
          data.clauses.forEach(clause => {
            clause.id = generateId('clause');
            clause.libraryId = data.id;
            clause.createdAt = now();
            clause.updatedAt = now();
            if (clause.reviewPoints) {
              clause.reviewPoints.forEach(rp => {
                rp.id = generateId('rp');
                rp.clauseId = clause.id;
                rp.libraryId = data.id;
                rp.createdAt = now();
                rp.updatedAt = now();
              });
            }
          });
        }
        const libraries = loadData();
        libraries.push(data);
        saveData(libraries);
        resolve(data);
      } catch (err) {
        reject(new Error('JSON 解析失败：' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}