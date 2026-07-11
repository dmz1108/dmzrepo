// 静态缓存 + 认证加固测试(node tests/static-cache-auth-hardening.test.js)。
// 覆盖:版本化 URL 长缓存/无版本 ETag 协商、认证限流(含硬上限与单 IP 总闸)、yule 管理代理门控真实行为。
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

// 1. 缓存分层(二审):强缓存只给带版本参数的请求;无版本的字体/react 退回 no-cache 协商
eval(extractFn('staticCacheControl'));
A(staticCacheControl('Qi/vendor/fonts/space-grotesk-400.ttf', true) === 'public, max-age=31536000, immutable', '版本化字体:一年 immutable');
A(staticCacheControl('Qi/vendor/react.production.min.js', true) === 'public, max-age=31536000, immutable', '版本化 react vendor:一年 immutable');
A(staticCacheControl('Qi/vendor/fonts/space-grotesk-400.ttf', false) === 'no-cache', '无版本参数的字体:no-cache + ETag 协商(不敢强缓存)');
A(staticCacheControl('Qi/vendor/react.production.min.js', false) === 'no-cache', '无版本参数的 react:no-cache + ETag 协商');
A(staticCacheControl('favicon.ico', false) === 'public, max-age=86400' && staticCacheControl('Qi/vendor/dreamerqi-fonts.css', false) === 'public, max-age=86400', '图标/CSS 保持 1 天短缓存');
A(staticCacheControl('kpl-dashboard_17_apple.html', false) === 'no-cache', 'HTML no-cache(每次协商,靠 304 省传输)');
A(staticCacheControl('Qi/qi-home.compiled.js', false) === 'no-cache', 'qi-home.compiled.js 随首页构建变化,no-cache');
// 三审修正2:/kpl?v=1、/?v=1、/admin?v=1 这类 HTML 页面即使带版本参数也绝不强缓存
A(staticCacheControl('kpl-dashboard_17_apple.html', true) === 'no-cache', 'HTML 带 ?v= 仍 no-cache(强缓存只给静态资产)');
A(staticCacheControl('panda-admin.html', true) === 'no-cache' && staticCacheControl('Qi/index.html', true) === 'no-cache', '/admin?v=1、/?v=1 同样 no-cache');
A(staticCacheControl('Qi/qi-home.jsx', true) === 'no-cache' && staticCacheControl('site.webmanifest', true) === 'no-cache', 'JSX/manifest 带 ?v= 仍 no-cache');
A(staticCacheControl('Qi/vendor/dreamerqi-fonts.css', true) === 'public, max-age=31536000, immutable', '版本化 CSS 允许 immutable');

// 1b. 引用方已带版本参数(否则强缓存永远不生效)
const fontsCss = fsReal.readFileSync(pathReal.join(__dirname, '..', 'Qi/vendor/dreamerqi-fonts.css'), 'utf8');
A((fontsCss.match(/\.ttf\?v=\d/g) || []).length === 13, '13 个字体 URL 全部版本化(?v=)');
const qiIndex = fsReal.readFileSync(pathReal.join(__dirname, '..', 'Qi/index.html'), 'utf8');
A(qiIndex.includes('react.production.min.js?v=') && qiIndex.includes('react-dom.production.min.js?v='), 'react vendor 引用版本化');
A(qiIndex.includes('dreamerqi-fonts.css?v='), '首页字体 CSS 引用版本化');

(async () => {
  // 2. sendStatic:ETag/304 + 版本参数识别
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
  await sendStatic({ method: 'GET', headers: {}, url: '/kpl' }, res1, 'kpl-dashboard_17_apple.html');
  const expectEtag = `"${FAKE_ST.size.toString(16)}-${Math.floor(FAKE_ST.mtimeMs).toString(16)}"`;
  A(res1.status === 200 && res1.headers.ETag === expectEtag && String(res1.body) === 'BODY', '首次请求:200 + ETag + 正文');
  A(res1.headers['Cache-Control'] === 'no-cache', 'HTML 响应头 no-cache');

  const res2 = mkRes();
  const before = readFileCalls;
  await sendStatic({ method: 'GET', headers: { 'if-none-match': expectEtag }, url: '/kpl' }, res2, 'kpl-dashboard_17_apple.html');
  A(res2.status === 304 && res2.body === undefined && readFileCalls === before, 'If-None-Match 命中:304 且不读文件体');

  const res3 = mkRes();
  await sendStatic({ method: 'GET', headers: {}, url: '/vendor/fonts/a.ttf?v=1' }, res3, 'Qi/vendor/fonts/a.ttf');
  A(res3.headers['Cache-Control'] === 'public, max-age=31536000, immutable', '带 ?v= 的请求:一年 immutable');
  const res3b = mkRes();
  await sendStatic({ method: 'GET', headers: {}, url: '/vendor/fonts/a.ttf' }, res3b, 'Qi/vendor/fonts/a.ttf');
  A(res3b.headers['Cache-Control'] === 'no-cache', '同一文件不带 ?v=:退回 no-cache 协商');

  const res3c = mkRes();
  await sendStatic({ method: 'GET', headers: {}, url: '/kpl?v=1' }, res3c, 'kpl-dashboard_17_apple.html');
  A(res3c.headers['Cache-Control'] === 'no-cache', '行为验证:/kpl?v=1 响应头仍是 no-cache');

  const res4 = mkRes();
  const beforeHead = readFileCalls;
  await sendStatic({ method: 'HEAD', headers: {}, url: '/kpl' }, res4, 'kpl-dashboard_17_apple.html');
  A(res4.status === 200 && res4.body === undefined && readFileCalls === beforeHead, 'HEAD:200 无正文且不读文件体(三审建议项)');

  // 2b. requestIp 信任边界(三审阻塞项1):公网直连伪造 XFF 无效,本机 Caddy 转发 XFF 生效
  const net = require('net');
  eval(extractFn('requestIp').replace(/TRUSTED_PROXY_IPS/g, 'TRUSTED_PROXY_IPS_T'));
  const TRUSTED_PROXY_IPS_T = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
  const mkReq = (remote, xff) => ({ socket: { remoteAddress: remote }, headers: xff ? { 'x-forwarded-for': xff } : {} });
  A(requestIp(mkReq('124.222.188.68', '9.9.9.9')) === '124.222.188.68', '公网直连伪造 XFF:忽略,使用 socket IP');
  A(requestIp(mkReq('127.0.0.1', '58.100.1.9')) === '58.100.1.9', '本机 Caddy 转发:XFF 生效');
  A(requestIp(mkReq('::ffff:127.0.0.1', '58.100.1.9')) === '58.100.1.9', 'IPv4-mapped 回环同样可信');
  A(requestIp(mkReq('::1', '2001:db8::7')) === '2001:db8::7', 'IPv6 回环 + IPv6 客户端');
  A(requestIp(mkReq('127.0.0.1', 'fake-junk, 58.100.1.9')) === '58.100.1.9', '伪造链首无效:取链尾(Caddy 追加的真实客户端)');
  A(requestIp(mkReq('127.0.0.1', 'not-an-ip')) === '127.0.0.1', 'XFF 非法值(net.isIP 校验失败):回退 socket IP');
  A(requestIp(mkReq('127.0.0.1', '')) === '127.0.0.1', '无 XFF:回退 socket IP');
  A(requestIp(mkReq('::ffff:203.0.113.7', '9.9.9.9')) === '203.0.113.7', '公网 IPv4-mapped 直连:剥前缀用真实 socket IP,XFF 忽略');

  // 3. 认证限流:失败计数/上限拒绝/成功清零/窗口过期,以及硬上限与定期清理(二审)
  const AUTH_RATE_WINDOWS = new Map();
  const AUTH_RATE_MAIL_WINDOW_MS = 60 * 60 * 1000;
  const AUTH_RATE_MAX_KEYS = Number((src.match(/AUTH_RATE_MAX_KEYS = (\d+)/) || [])[1]);
  A(Number.isFinite(AUTH_RATE_MAX_KEYS) && AUTH_RATE_MAX_KEYS > 0, `源码声明键数硬上限(AUTH_RATE_MAX_KEYS=${AUTH_RATE_MAX_KEYS})`);
  eval(extractFn('authRatePrune'));
  eval(extractFn('authRateExceeded'));
  eval(extractFn('authRateRecord'));
  eval(extractFn('authRateClear'));

  const K = 'login:1.2.3.4:panda';
  let prematureBlock = false;
  for (let i = 0; i < 8; i++) {
    if (authRateExceeded(K, 8, 60000)) prematureBlock = true;
    authRateRecord(K);
  }
  A(!prematureBlock, '8 次失败之前不触发限流');
  A(authRateExceeded(K, 8, 60000) === true, '8 次失败后第 9 次尝试被拒(429)');
  authRateClear(K);
  A(authRateExceeded(K, 8, 60000) === false, '成功登录清零后恢复放行');
  authRateRecord(K);
  await new Promise(r => setTimeout(r, 15));
  A(authRateExceeded(K, 1, 10) === false, '窗口过期的失败记录不再计数(自动解锁)');

  // 3b. 硬上限回归:12000 个不同 key 灌入,Map 始终有界(评审要求 10000+ 规模)
  AUTH_RATE_WINDOWS.clear();
  let maxSeen = 0;
  for (let i = 0; i < 12000; i++) {
    authRateRecord(`attack:${i}`);
    if (AUTH_RATE_WINDOWS.size > maxSeen) maxSeen = AUTH_RATE_WINDOWS.size;
  }
  A(AUTH_RATE_WINDOWS.size <= AUTH_RATE_MAX_KEYS && maxSeen <= AUTH_RATE_MAX_KEYS, `12000 个不同 key 后 Map 有界(峰值 ${maxSeen} <= ${AUTH_RATE_MAX_KEYS})`);
  A(AUTH_RATE_WINDOWS.has('attack:11999') && !AUTH_RATE_WINDOWS.has('attack:0'), '写满按插入序淘汰最老键,最新键保留');

  // 3c. 定期清理:超过最大窗口(1小时)无新命中的键被清除
  AUTH_RATE_WINDOWS.clear();
  AUTH_RATE_WINDOWS.set('stale-key', [Date.now() - AUTH_RATE_MAIL_WINDOW_MS - 1000]);
  AUTH_RATE_WINDOWS.set('fresh-key', [Date.now()]);
  authRatePrune();
  A(!AUTH_RATE_WINDOWS.has('stale-key') && AUTH_RATE_WINDOWS.has('fresh-key'), 'authRatePrune 清过期键、留活跃键');
  A(src.includes('setInterval(() => authRatePrune(), 10 * 60 * 1000).unref()'), '服务内每 10 分钟定期清理(unref 不阻退出)');

  // 3d. 单 IP 总闸(二审):换邮箱刷 key 被 confirm-ip 拦住
  AUTH_RATE_WINDOWS.clear();
  const ipKey = 'confirm-ip:9.9.9.9';
  let blockedAt = -1;
  for (let i = 0; i < 40; i++) {
    const emailKey = `reset-confirm:9.9.9.9:mail${i}@x.com`;   // 每次换邮箱,单邮箱 key 永远不满
    if (authRateExceeded(emailKey, 10, 900000) || authRateExceeded(ipKey, 30, 900000)) { blockedAt = i; break; }
    authRateRecord(emailKey);
    authRateRecord(ipKey);
  }
  A(blockedAt === 30, `换邮箱穷举在第 ${blockedAt + 1} 次被单 IP 总闸拦截(30 次上限)`);
  A(src.includes('`confirm-ip:${requestIp(req)}`') && (src.match(/confirm-ip:\$\{requestIp\(req\)\}/g) || []).length >= 2, '注册/重置确认双入口共用 confirm-ip 总闸');

  // 4. yule 管理代理门控:真实行为(未登录 403 / 管理员放行 / 普通用户 403)
  const adminSessions = new Map();
  const cleanupAdminSessions = () => {};
  const persistAuthSessionsToDisk = () => {};
  const authNowIso = () => new Date().toISOString();
  const ADMIN_SESSION_TTL_MS = 3600000;
  const ADMIN_SESSION_RENEW_WINDOW_MS = 0;
  let sent = null;
  const send = (res, code, body) => { sent = { code, body }; };
  eval(extractFn('readAdminToken'));
  eval(extractFn('adminSessionFromToken'));
  eval(extractFn('isAdminRequest'));
  eval(extractFn('requireAdmin'));
  eval(extractFn('yuleProxyNeedsAdmin'));

  A(yuleProxyNeedsAdmin('/api/yule/admin/items', 'GET') && yuleProxyNeedsAdmin('/api/yule/admin/item/x', 'DELETE'), '管理路径全方法需要 admin');
  A(yuleProxyNeedsAdmin('/api/yule/collect', 'POST') && !yuleProxyNeedsAdmin('/api/yule/collect', 'GET'), '采集触发 POST 需 admin,GET 探活不拦');
  A(!yuleProxyNeedsAdmin('/api/yule/list', 'GET') && !yuleProxyNeedsAdmin('/api/yule/item/1', 'GET'), '公开读接口不受影响');

  sent = null;
  A(requireAdmin({ headers: {} }, {}) === false && sent?.code === 403, '未登录访问:403 admin required');
  adminSessions.set('good-token', { role: 'admin', username: 'panda', expiresAtMs: Date.now() + 3600000 });
  adminSessions.set('user-token', { role: 'user', username: 'guest', expiresAtMs: Date.now() + 3600000 });
  sent = null;
  A(requireAdmin({ headers: { cookie: 'panda_admin_token=good-token' } }, {}) === true && sent === null, '管理员会话 cookie:放行且不发 403');
  sent = null;
  A(requireAdmin({ headers: { 'x-admin-token': 'good-token' } }, {}) === true && sent === null, '管理员 x-admin-token 头:放行');
  sent = null;
  A(requireAdmin({ headers: { cookie: 'panda_admin_token=user-token' } }, {}) === false && sent?.code === 403, '普通用户会话:403(role 必须 admin)');
  sent = null;
  A(requireAdmin({ headers: { cookie: 'panda_admin_token=no-such' } }, {}) === false && sent?.code === 403, '伪造 token:403');
  A(src.includes('yuleProxyNeedsAdmin(url.pathname, req.method) && !requireAdmin(req, res)'), '代理入口已接线门控函数');

  // 5. 登录限流接线与维度说明(二审:IP+账号,非纯账号级)
  A((src.match(/authRateExceeded\(/g) || []).length >= 9, '限流检查接入登录/验证码/邮件全部入口(含 IP 总闸)');
  A(src.includes("reason: 'rate-limited'") && src.includes('too many attempts, try again later'), '登录限流:429 + 登录事件记 rate-limited');
  A(src.includes('too many code requests, try again later'), '验证码邮件限流(防轰炸):注册与重置双入口');
  A((src.match(/维度为 IP\+账号/g) || []).length === 2, '两处登录入口注明维度为 IP+账号(拒绝纯账号锁定防锁死攻击)');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STATIC-CACHE-AUTH-HARDENING CHECKS PASSED');
})();
