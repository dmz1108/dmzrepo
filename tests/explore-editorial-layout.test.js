const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'Qi', 'qi-home.jsx'), 'utf8');
const compiled = fs.readFileSync(path.join(root, 'Qi', 'qi-home.compiled.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'Qi', 'index.html'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`ok: ${message}`);
}

assert(source.includes('qi-discover-feature-grid'), '探索首屏使用真实地点精选网格');
assert(source.includes('qi-discover-route-grid'), '周末路线使用独立时间轴布局');
assert(source.includes('qi-discover-category-grid'), '主题入口使用编辑列表布局');
assert(source.includes('qi-discover-method'), '内容整理标准保留为低干扰信息带');
assert(source.includes('qi-discover-dialog-heading'), '地点详情具备响应式标题布局');
assert(source.includes('phoneLine(item)'), '城市条目可展示已核验电话');
assert(source.includes('@media (max-width: 760px)'), '探索页保留手机端适配');
assert(source.includes('@media (prefers-reduced-motion: reduce)'), '探索页尊重减少动态效果设置');
assert(!source.includes('className="qi-discover-plan"'), '旧版五张说明卡已移除');
assert(compiled.includes('qi-discover-feature-grid') && compiled.includes('qi-discover-dialog-heading'), '编译产物包含新版探索布局');
assert(html.includes('qi-home.compiled.js?v=20260715-explore-editorial'), '主页脚本缓存版本已更新');

console.log(process.exitCode ? 'EXPLORE EDITORIAL LAYOUT CHECKS FAILED' : 'ALL EXPLORE EDITORIAL LAYOUT CHECKS PASSED');
