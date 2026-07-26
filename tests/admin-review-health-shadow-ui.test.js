'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'panda-admin.html'), 'utf8');

function functionSource(name) {
  const match = admin.match(new RegExp(`(?:async )?function ${name}\\(`));
  assert(match, `missing function ${name}`);
  const start = match.index;
  const bodyStart = admin.indexOf('{', admin.indexOf(')', start));
  let depth = 0;
  for (let index = bodyStart; index < admin.length; index += 1) {
    if (admin[index] === '{') depth += 1;
    if (admin[index] === '}') depth -= 1;
    if (depth === 0) return admin.slice(start, index + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

const refresh = functionSource('refreshOpsReviewHealth');
const render = functionSource('renderOpsReviewHealth');
const sync = functionSource('runOpsReviewSync');
const actualText = functionSource('reviewHealthActualText');

assert(
  refresh.includes("api('/api/admin/review-source-health-shadow?days=30')"),
  'admin health UI must consume the read-only shadow manifest',
);
assert(
  !refresh.includes('/api/admin/review-source-health?days=30'),
  'admin health UI must not silently fall back to the legacy health verdict',
);
assert(render.includes('row.manifest || {}'), 'renderer must use the manifest as its source of truth');
assert(render.includes('data.statusCounts || {}'), 'summary pill must use backend manifest status counts');
assert(admin.includes("stale: { label: '跨日数据'"), 'stale data must remain visibly distinct');
assert(actualText.includes('item.rawActual'), 'raw versus normalized source counts must remain explainable');
assert(actualText.includes('item.actual'), 'the visible source count must use normalized unique codes');
assert(
  admin.includes('健康检查不会写文件；“补齐”是单独的修复动作'),
  'the UI must explain that validation and repair are separate operations',
);
assert(
  sync.includes("api('/api/limit-up-main-reason-db/sync?mode=missing&days=30'"),
  'this phase must preserve the existing explicit repair endpoint',
);
assert(
  !sync.includes('statusCounts') && !sync.includes('manifest'),
  'the read-only manifest must not silently drive write behavior',
);

console.log('admin review health shadow UI tests passed');
