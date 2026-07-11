// 字体 WOFF2 化 + 预览图 WebP + yule-server 缓存对齐测试(node tests/font-woff2-yule-cache.test.js)。
const fsReal = require('fs');
const pathReal = require('path');
const R = (...p) => pathReal.join(__dirname, '..', ...p);
const kplSrc = fsReal.readFileSync(R('kpl-stats-server.js'), 'utf8');
const yuleSrc = fsReal.readFileSync(R('yule-server.js'), 'utf8');

function extractFn(src, name) {
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

// 1. WOFF2 文件:13 个、wOF2 魔数、每个都有 TTF 后备、总大小显著小于 TTF
const fontDir = R('Qi', 'vendor', 'fonts');
const woff2s = fsReal.readdirSync(fontDir).filter(f => f.endsWith('.woff2')).sort();
A(woff2s.length === 13, `13 个 WOFF2 文件(实际 ${woff2s.length})`);
let w2Total = 0, ttfTotal = 0, magicOk = true, siblingOk = true;
for (const f of woff2s) {
  const buf = fsReal.readFileSync(pathReal.join(fontDir, f));
  if (buf.slice(0, 4).toString('latin1') !== 'wOF2') magicOk = false;
  w2Total += buf.length;
  const ttf = pathReal.join(fontDir, f.replace(/\.woff2$/, '.ttf'));
  if (!fsReal.existsSync(ttf)) siblingOk = false; else ttfTotal += fsReal.statSync(ttf).size;
}
A(magicOk, '全部 WOFF2 魔数正确(wOF2)');
A(siblingOk, '每个 WOFF2 都保留同名 TTF 后备');
A(w2Total < 500 * 1024 && w2Total < ttfTotal / 2, `WOFF2 总大小 ${Math.round(w2Total / 1024)}KB(< 500KB 且 < TTF 一半 ${Math.round(ttfTotal / 1024)}KB)`);

// 2. CSS:woff2 排在 ttf 前、13 组、字名/字重/swap 不变、URL 均带版本号
const css = fsReal.readFileSync(R('Qi', 'vendor', 'dreamerqi-fonts.css'), 'utf8');
const srcLines = css.match(/src: url\([^;]+;/g) || [];
A(srcLines.length === 13 && srcLines.every(l => /url\('\.\/fonts\/[a-z0-9-]+\.woff2\?v=\d+'\) format\('woff2'\), url\('\.\/fonts\/[a-z0-9-]+\.ttf\?v=\d+'\) format\('truetype'\)/.test(l)), '13 组 src:WOFF2(带版本号)在前,TTF(带版本号)后备');
A((css.match(/font-display: swap/g) || []).length === 13, 'font-display: swap 13 处不变');
for (const fam of ['IBM Plex Mono', 'JetBrains Mono', 'Space Grotesk', 'Space Mono']) {
  A(css.includes(`font-family: '${fam}'`), `字体名不变:${fam}`);
}
A([400, 500, 600, 700].every(w => css.includes(`font-weight: ${w}`)), '字重声明齐全(400/500/600/700)');

// 3. CSS 内容变化 → 页面引用必须升到 ?v=2
const pages = ['Qi/index.html', 'Qi/logo.html', 'Qi/games/掼蛋.html', 'kpl-dashboard_17_apple.html', 'kpl-dashboard_17_apple_hierarchy.html', 'yule.html'];
for (const p of pages) {
  const html = fsReal.readFileSync(R(p), 'utf8');
  A(html.includes('dreamerqi-fonts.css?v=2') && !html.includes('dreamerqi-fonts.css?v=1'), `${p}:字体 CSS 引用已升 ?v=2`);
}

// 4. WebP:文件存在且魔数正确、保留 PNG、jsx 用 <picture> 回退、compiled 由构建生成
const webpBuf = fsReal.readFileSync(R('Qi', 'assets', 'chatter-cute-preview.webp'));
A(webpBuf.slice(8, 12).toString('latin1') === 'WEBP' && webpBuf.length < 50 * 1024, `WebP 魔数正确且体积小(${Math.round(webpBuf.length / 1024)}KB)`);
A(fsReal.existsSync(R('Qi', 'assets', 'chatter-cute-preview.png')), 'PNG 原图保留(回退)');
const jsx = fsReal.readFileSync(R('Qi', 'qi-home.jsx'), 'utf8');
A(jsx.includes('chatter-cute-preview.webp?v=1') && jsx.includes('chatter-cute-preview.png?v=1'), 'jsx:WebP 与 PNG 均带版本号');
A(jsx.includes('<picture>') && jsx.includes('type="image/webp"'), 'jsx:<picture> + <source type=image/webp> + <img> PNG 回退');
const compiled = fsReal.readFileSync(R('Qi', 'qi-home.compiled.js'), 'utf8');
A(compiled.includes('chatter-cute-preview.webp') && compiled.includes('image/webp'), 'compiled 已由 build-home.js 重新生成(含 WebP 引用)');

// 5. 主服务:webp MIME、静态路由、版本化 webp 可 immutable
eval(extractFn(kplSrc, 'staticContentType'));
A(staticContentType('Qi/assets/chatter-cute-preview.webp') === 'image/webp', '主服务 staticContentType 支持 image/webp');
A(staticContentType('Qi/vendor/fonts/a.woff2') === 'font/woff2' && staticContentType('Qi/vendor/fonts/a.ttf') === 'font/ttf', 'WOFF2/TTF MIME 正确');
A(kplSrc.includes("['/assets/chatter-cute-preview.webp', 'Qi/assets/chatter-cute-preview.webp']"), 'WebP 静态路由已注册');
eval(extractFn(kplSrc, 'staticCacheControl'));
A(staticCacheControl('Qi/assets/chatter-cute-preview.webp', true) === 'public, max-age=31536000, immutable', '版本化 WebP:一年 immutable');
A(staticCacheControl('Qi/vendor/fonts/a.woff2', true) === 'public, max-age=31536000, immutable', '版本化 WOFF2:一年 immutable');
// 字体路由正则允许 woff2(带 ?v= 时 query 不进 pathname,无需改路由)
A(/\(ttf\|woff2\?\|otf\)/.test(kplSrc) || kplSrc.includes('(ttf|woff2?|otf)'), 'vendor 字体路由正则覆盖 woff2');

// 6. yule-server:ETag/304/HEAD 不读正文、HTML 恒 no-cache、版本化资产 immutable、JSON no-store
(() => {
  const FAKE_ST = { size: 0xABC, mtimeMs: 1721000000456.2 };
  let readCalls = 0;
  const fs = {
    existsSync: () => true,
    statSync: () => FAKE_ST,
    readFileSync: () => { readCalls++; return Buffer.from('YULE'); },
  };
  const path = { extname: (p) => { const m = String(p).match(/\.[a-z0-9]+$/i); return m ? m[0] : ''; } };
  const MIME = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png' };
  const mkRes = () => {
    const r = { headers: null, status: 0, body: undefined };
    r.writeHead = (c, h) => { r.status = c; r.headers = h || null; };
    r.end = (b) => { r.body = b; };
    return r;
  };
  eval(extractFn(yuleSrc, 'fileCacheControl'));
  eval(extractFn(yuleSrc, 'serveFile'));
  const etag = `"${FAKE_ST.size.toString(16)}-${Math.floor(FAKE_ST.mtimeMs).toString(16)}"`;

  const r1 = mkRes();
  serveFile({ method: 'GET', headers: {}, url: '/yule' }, r1, '/x/yule.html');
  A(r1.status === 200 && r1.headers.ETag === etag && String(r1.body) === 'YULE', 'yule:200 + ETag + 正文');
  A(r1.headers['Cache-Control'] === 'no-cache', 'yule:HTML no-cache(原 no-store 改协商)');

  const r2 = mkRes();
  const before = readCalls;
  serveFile({ method: 'GET', headers: { 'if-none-match': etag }, url: '/yule' }, r2, '/x/yule.html');
  A(r2.status === 304 && readCalls === before, 'yule:If-None-Match 命中 304 且不读正文');

  const r3 = mkRes();
  const beforeHead = readCalls;
  serveFile({ method: 'HEAD', headers: {}, url: '/yule' }, r3, '/x/yule.html');
  A(r3.status === 200 && r3.body === undefined && readCalls === beforeHead, 'yule:HEAD 200 无正文且不读文件');

  const r4 = mkRes();
  serveFile({ method: 'GET', headers: {}, url: '/yule?v=9' }, r4, '/x/yule.html');
  A(r4.headers['Cache-Control'] === 'no-cache', 'yule:HTML 带 ?v= 仍 no-cache(绝不 immutable)');

  const r5 = mkRes();
  serveFile({ method: 'GET', headers: {}, url: '/vendor/fonts/a.woff2?v=1' }, r5, '/x/a.woff2');
  A(r5.headers['Cache-Control'] === 'public, max-age=31536000, immutable', 'yule:版本化字体一年 immutable');

  const r6 = mkRes();
  serveFile({ method: 'GET', headers: {}, url: '/yule-img/p.png' }, r6, '/x/p.png');
  A(r6.headers['Cache-Control'] === 'public, max-age=86400', 'yule:未版本化图片 1 天短缓存(采集图不受影响)');
})();
A(yuleSrc.includes("'Cache-Control': 'no-store'") && extractFn(yuleSrc, 'sendJson').includes("no-store"), 'yule:全部 JSON API(含管理接口)保持 no-store');
A((yuleSrc.match(/return serveFile\(req, res, /g) || []).length === 4, 'yule:4 个 serveFile 调用点全部传入 req');
A(!/serveFile\(res, /.test(yuleSrc), 'yule:无残留旧签名调用');

// 7. 权限与代理逻辑零改动回归
A(kplSrc.includes('yuleProxyNeedsAdmin(url.pathname, req.method) && !requireAdmin(req, res)'), '主服务 yule 管理代理门控保持不变');
A(!/isAdmin|requireAdmin/.test(extractFn(yuleSrc, 'serveFile')), 'serveFile 未引入权限逻辑(职责不变)');
A(yuleSrc.includes("p === '/api/yule/collect' && req.method === 'POST'"), '采集触发路由不变');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL FONT-WOFF2-YULE-CACHE CHECKS PASSED');
