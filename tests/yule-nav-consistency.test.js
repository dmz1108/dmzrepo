const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'yule.html'), 'utf8');
const nav = html.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0] || '';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`ok: ${message}`);
}

const labels = ['行情', '娱乐', '探索', '瞎聊聊', '关于', '联系'];
const positions = labels.map(label => nav.indexOf(`>${label}</a>`));

assert(nav.includes('aria-label="Qi home"'), '娱乐页 Logo 与首页使用相同主页语义');
assert(!nav.includes('>首页</a>'), '娱乐页不额外插入首页栏目');
assert(positions.every(position => position >= 0), '娱乐页包含首页全部六个顶部栏目');
assert(positions.every((position, index) => index === 0 || position > positions[index - 1]), '娱乐页顶部栏目顺序与首页一致');
assert(nav.includes('href="/" class="active">娱乐</a>'), '娱乐栏目保留当前页状态');
assert(html.includes('.nav{min-height:82px') && html.includes('padding:12px clamp(18px,4vw,56px)'), '桌面导航高度与左右留白对齐首页');
assert(html.includes('@media (max-width:680px)') && html.includes('.nav{min-height:70px'), '手机导航断点与高度对齐首页');
assert(!html.includes('<span class="account-role">未登录</span>'), '未登录状态不再额外占用栏目宽度');

console.log(process.exitCode ? 'YULE NAV CONSISTENCY CHECKS FAILED' : 'ALL YULE NAV CONSISTENCY CHECKS PASSED');
