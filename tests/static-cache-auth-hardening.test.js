// 静态缓存 + 认证加固测试(node tests/static-cache-auth-hardening.test.js)。
// 覆盖:缓存分层/ETag 304、认证限流(登录/验证码/邮件)、yule 管理代理门控静态断言。
const fsReal = require('fs');
const pathReal = require('path');
const src = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bodyBrace = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bodyBrace;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(m.index, i + 1);
}
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

// 1. 缓存分层:字体30天、react vendor 7天、图片/css 1天;HTML 与 qi-home.compiled.js 必须 no-cache(随发布变化)
eval(extractFn('staticCacheControl'));
A(staticCacheControl('Qi/vendor/fonts/space-grotesk-400.ttf') === 'public, max-age=2592000', '字体 30 天缓存');
A(staticCacheControl('Qi/vendor/react.production.min.js') === 'public, max-age=604800', 'react vendor 7 天缓存');
A(staticCacheControl('Qi/vendor/react-dom.production.min.js') === 'public, max-age=604800', 'react-dom vendor 7 天缓存');
A(staticCacheControl('favicon.ico') === 'public, max-age=86400' && staticCacheControl('Qi/vendor/dreamerqi-fonts.css') === 'public, max-age=86400', '图标/CSS 1 天缓存');
A(staticCacheControl('kpl-dashboard_17_apple.html') === 'no-cache', 'HTML 保持 no-cache(每次协商,靠 304 省传输)');
A(staticCacheControl('Qi/qi-home.compiled.js') === 'no-cache', 'qi-home.compiled.js 随首页构建变化,必须 no-cache');
A(staticCacheControl('site.webmanifest') === 'no-cache', 'manifest 保持 no-cache');

// 2. sendStatic:ETag 生成与 If-None-Match 304(304 时不读文件体)
(async () => {
  const FAKE_ST = { size: 0x1234, mtimeMs: 1720000000123.7 };
  let readFileCalls = 0;
  const fs = {
    stat: async () => FAKE_ST,
    readFile: async () => { readFileCalls++; return Buffer.from('BODY'); },
  };
  const path = { join: (...xs) => xs.join('/') };
  const __dirname_ = '.';
  const staticContentType = () => 'text/html; charset=utf-8';
  const mkRes = () => {
    const r = { headers: null, status: 0, body: undefined, ended: false };
    r.writeHead = (code, h) => { r.status = code; r.headers = h; };
    r.end = (b) => { r.body = b; r.ended = true; };
    return r;
  };
  const fnSrc = extractFn('sendStatic').replace(/__dirname/g, '__dirname_');
  eval(fnSrc);

  const res1 = mkRes();
  await sendStatic({ method: 'GET', headers: {} }, res1, 'kpl-dashboard_17_apple.html');
  const expectEtag = `"${FAKE_ST.size.toString(16)}-${Math.floor(FAKE_ST.mtimeMs).toString(16)}"`;
  A(res1.status === 200 && res1.headers.ETag === expectEtag && String(res1.body) === 'BODY', '首次请求:200 + ETag + 正文');
  A(res1.headers['Cache-Control'] === 'no-cache', 'HTML 响应头 no-cache');

  const res2 = mkRes();
  const before = readFileCalls;
  await sendStatic({ method: 'GET', headers: { 'if-none-match': expectEtag } }, res2, 'kpl-dashboard_17_apple.html');
  A(res2.status === 304 && res2.body === undefined && readFileCalls === before, 'If-None-Match 命中:304 且不读文件体');

  const res3 = mkRes();
  await sendStatic({ method: 'GET', headers: { 'if-none-match': '"stale"' } }, res3, 'kpl-dashboard_17_apple.html');
  A(res3.status === 200 && String(res3.body) === 'BODY', 'ETag 不匹配:正常回 200 全量');

  const res4 = mkRes();
  await sendStatic({ method: 'HEAD', headers: {} }, res4, 'kpl-dashboard_17_apple.html');
  A(res4.status === 200 && res4.body === undefined, 'HEAD:200 无正文');

  // 3. 认证限流:失败计数、达到上限拒绝、成功清零、窗口过期自动放行
  const AUTH_RATE_WINDOWS = new Map();
  eval(extractFn('authRateExceeded'));
  eval(extractFn('authRateRecord'));
  eval(extractFn('authRateClear'));
  const K = 'login:1.2.3.4:panda';
  for (let i = 0; i < 8; i++) {
    A2 : { if (authRateExceeded(K, 8, 60000)) { A(false, `第${i + 1}次失败前不应触发限流`); break A2; } }
    authRateRecord(K);
  }
  A(authRateExceeded(K, 8, 60000) === true, '8 次失败后第 9 次尝试被拒(429)');
  authRateClear(K);
  A(authRateExceeded(K, 8, 60000) === false, '成功登录清零后恢复放行');
  authRateRecord(K);
  await new Promise(r => setTimeout(r, 15));
  A(authRateExceeded(K, 1, 10) === false, '窗口过期的失败记录不再计数(自动解锁)');

  // 4. 接线静态断言:六个认证入口都有限流;yule 管理/采集代理必须过 admin 会话
  A((src.match(/authRateExceeded\(/g) || []).length >= 7, '限流检查接入登录/验证码/邮件全部入口');
  A(src.includes("reason: 'rate-limited'") && src.includes('too many attempts, try again later'), '登录限流:429 + 登录事件记录 rate-limited');
  A(src.includes('too many code requests, try again later'), '验证码邮件限流(防轰炸):注册与重置双入口');
  A(src.includes("`reset-confirm:${requestIp(req)}:${email}`"), '重置确认按 IP+邮箱限次(封 6 位码穷举)');
  A(src.includes("`register-confirm:${requestIp(req)}:${email}`"), '注册确认按 IP+邮箱限次');
  A(src.includes("url.pathname.startsWith('/api/yule/admin/')") && src.includes('yuleNeedsAdmin && !requireAdmin(req, res)'), 'yule 管理接口代理层强制 admin 会话');
  A(src.includes("url.pathname === '/api/yule/collect' && req.method !== 'GET'"), 'yule 手动采集触发同样要求 admin');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STATIC-CACHE-AUTH-HARDENING CHECKS PASSED');
})();
