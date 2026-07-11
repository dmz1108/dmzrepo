// 真实 HTTP 端点测试(node tests/leader-debug-endpoint.test.js)——七审第5点。
// 把仓库拷到临时目录(所有 __dirname 数据路径随之隔离),用临时 KPL_ADMIN_USERNAME/PASSWORD
// 起本地服务,经真实 admin 登录 → /api/strategy-mainline-leader-debug 覆盖:
// 损坏快照、必要文件缺失、主因文件损坏、主因文件非 ENOENT 读错误(EISDIR),
// 以及并发两个诊断请求 + 诊断后普通请求互不串写(run() 隔离,七审第4点)。
// 不需要生产管理员 Token。root 环境下 chmod 不产生 EACCES(root 绕过),故用 EISDIR 走同一"非 ENOENT→readErrors"分支;
// 纯 EACCES 分支由 leader-pool-debug.test.js 的函数级注入覆盖。
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawnSync, spawn } = require('child_process');

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };
const REPO = path.join(__dirname, '..');

function httpJson(port, urlPath, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = http.request({ host: '127.0.0.1', port, path: urlPath, method,
      headers: { ...(data ? { 'content-type': 'application/json', 'content-length': data.length } : {}), ...headers },
      timeout: 30000 }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => { let j = null; try { j = JSON.parse(Buffer.concat(chunks)); } catch {} resolve({ status: res.statusCode, json: j }); });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function waitHealth(port, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const r = await httpJson(port, '/health'); if (r.status === 200) return true; } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

(async () => {
  // 1) 拷贝仓库到隔离临时目录(排除 .git/tmp/node_modules/证据缓存)
  const appDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'kpl-endpoint-'));
  const cp = spawnSync('bash', ['-c',
    `cd ${REPO} && tar --exclude=.git --exclude=tmp --exclude=node_modules --exclude='tmp-*' -cf - . | tar -xf - -C ${appDir}`]);
  if (cp.status !== 0) { console.error('FAIL: 拷贝仓库失败', cp.stderr && cp.stderr.toString()); process.exit(1); }

  const SNAP = z => path.join(appDir, 'kpl-snapshots', String(z));
  const MR = path.join(appDir, 'kpl-limitup-main-reason-db');
  const LU = path.join(appDir, 'kpl-limitup-db');
  const CLOSE = path.join(appDir, 'eastmoney-close-db');
  const CONCEPT = path.join(appDir, 'eastmoney-concepts-db');
  for (const z of [5, 6, 7]) await fsp.mkdir(SNAP(z), { recursive: true });
  for (const d of [MR, LU, CLOSE, CONCEPT]) await fsp.mkdir(d, { recursive: true });
  const writeSnap = async (day, z, content) => fsp.writeFile(path.join(SNAP(z), `${day}.json`), content);
  const validSnap = day => JSON.stringify({
    day, boards: [{ plateId: 'p1', name: '算力', ztCount: 2, netInflow: 1e8, gainPct: 3 }],
    cardData: { p1: { ztList: [{ code: '600001', name: 'X', gain: 10 }], zt10: [], gain10: [], gain30: [] } },
  });
  // 生成一段工作日(2026年7月无 A 股节假日),供必要输入(近10日库 + 收盘价基准)充足供给
  const weekdaysBack = (endDay, count) => {
    const out = []; const d = new Date(endDay + 'T00:00:00Z');
    while (out.length < count) { const wd = d.getUTCDay(); if (wd !== 0 && wd !== 6) out.unshift(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() - 1); }
    return out;
  };

  // 各场景独立交易日,fixtures 互不干扰
  const DAY_CORRUPT_SNAP = '2026-07-08';   // 三套快照全损坏 → ok:false + readErrors
  const DAY_MISSING_SNAP = '2026-07-07';   // 无任何快照 → ok:false + requiredMissing
  const DAY_MR_CORRUPT   = '2026-07-06';   // 有效快照 + 主因文件损坏 → complete:false
  const DAY_MR_EISDIR    = '2026-07-03';   // 有效快照 + 主因路径是目录(EISDIR)→ complete:false
  const DAY_CLEAN        = '2026-07-02';   // 必要输入齐全 → complete:true
  const DAY_TIMEOUT      = '2026-07-10';   // 作为"今日"(env 覆盖)+ 无快照 → 走实时补水 → board-hydrate 超时

  for (const z of [5, 6, 7]) await writeSnap(DAY_CORRUPT_SNAP, z, '{not valid json');
  // DAY_MISSING_SNAP:不写任何快照
  for (const z of [5, 6, 7]) await writeSnap(DAY_MR_CORRUPT, z, validSnap(DAY_MR_CORRUPT));
  await fsp.writeFile(path.join(MR, `${DAY_MR_CORRUPT}.json`), '{broken');
  for (const z of [5, 6, 7]) await writeSnap(DAY_MR_EISDIR, z, validSnap(DAY_MR_EISDIR));
  await fsp.mkdir(path.join(MR, `${DAY_MR_EISDIR}.json`), { recursive: true });   // 目录占位 → readFile EISDIR

  // DAY_CLEAN:必要输入全部齐全——快照(3)+ 覆盖窗口的近日涨停库/主因库/收盘价库(宽供给,45 工作日)
  for (const z of [5, 6, 7]) await writeSnap(DAY_CLEAN, z, validSnap(DAY_CLEAN));
  for (const d of weekdaysBack(DAY_CLEAN, 45)) {
    await fsp.writeFile(path.join(LU, `${d}.json`), JSON.stringify({ day: d, stocks: [] }));
    await fsp.writeFile(path.join(MR, `${d}.json`),
      JSON.stringify({ day: d, stocks: d === DAY_CLEAN ? [{ code: '600001', name: 'X', finalBoardTopic: '算力' }] : [] }));
    await fsp.writeFile(path.join(CLOSE, `${d}.json`), JSON.stringify({ day: d, stocks: [{ code: '600001', name: 'X', close: 10 }] }));
  }

  // DAY_TIMEOUT:无快照 → 实时回退。测试注入板块榜(env,绕过外网),让 hydrate 被调用 →
  // hydrate 自身网络被 1ms 超时兜底 race 掉 → 确定性触发 board-hydrate timeout,不依赖真实外网时序。
  const TEST_BOARD_RANKING = JSON.stringify({ '6': [{ plateId: 'BK9999', name: '算力', gainPct: 3, gain: 3, netInflow: 1e8, memberCount: 5 }] });

  // 2) 起服务(临时 admin 凭据 + 隔离端口)
  const port = 18900 + (process.pid % 500);
  const ADMIN_USER = 'testadmin';
  const ADMIN_PASS = 'Tt* ' + Math.random().toString(36).slice(2, 10);   // 满足复杂度,仅本进程内存
  const srv = spawn('node', ['kpl-stats-server.js'], {
    cwd: appDir,
    env: { ...process.env, KPL_STATS_PORT: String(port), KPL_STATS_HOST: '127.0.0.1',
      KPL_ADMIN_USERNAME: ADMIN_USER, KPL_ADMIN_PASSWORD: ADMIN_PASS,
      PANDA_AI_READONLY_TOKEN: '', PANDA_AI_STRATEGY_TOKEN: '',
      // 仅本测试进程(生产不设置,行为零变化):
      // DIAG_TODAY 把 DAY_TIMEOUT 当作诊断"今日"(机器为非交易日周末);TEST_BOARD_RANKING 注入板块榜绕过外网;
      // HYDRATE_TIMEOUT=1 使 hydrate 自身网络被 race 掉 → 确定性 board-hydrate timeout;KPL_API_KEY 仅过实时回退 `if(apiKey)` 门槛。
      STRATEGY_MAINLINE_DIAG_TODAY: '2026-07-10',
      STRATEGY_MAINLINE_TEST_BOARD_RANKING: TEST_BOARD_RANKING,
      STRATEGY_MAINLINE_LIVE_HYDRATE_TIMEOUT_MS: '1',
      KPL_API_KEY: 'endpoint-test-dummy-key' },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let srvErr = '';
  srv.stderr.on('data', d => { srvErr += d.toString(); });

  try {
    const up = await waitHealth(port);
    A(up, '本地服务启动并响应 /health');
    if (!up) { console.error(srvErr.slice(0, 500)); throw new Error('server did not start'); }

    // 3) 真实 admin 登录拿 token
    const login = await httpJson(port, '/api/admin/login', { method: 'POST', body: { username: ADMIN_USER, password: ADMIN_PASS } });
    A(login.status === 200 && login.json && login.json.token, 'admin 登录成功(临时凭据)');
    const token = login.json && login.json.token;
    A((await httpJson(port, `/api/strategy-mainline-leader-debug?day=${DAY_CLEAN}&codes=600001`)).status === 403, '无 token 访问诊断端点:403(门控完好)');

    const diag = (day) => httpJson(port, `/api/strategy-mainline-leader-debug?day=${day}&codes=600001`, { headers: { 'x-admin-token': token } });
    const meta = r => (r.json && r.json.live && r.json.live.debugMeta) || null;

    // 场景一:损坏快照
    const r1 = await diag(DAY_CORRUPT_SNAP);
    const m1 = meta(r1);
    A(r1.status === 200 && m1, '损坏快照:端点 200 且带 debugMeta');
    A(r1.json.live.ok === false && m1.complete === false && m1.partial === true,
      '损坏快照:live.ok=false → complete=false / partial=true(修复 Codex 复现的 bug)');
    A((m1.debugErrors || []).some(e => e.includes('snapshot-zs') && e.includes('invalid JSON')),
      '损坏快照:三源 JSON 损坏进入 debugErrors');

    // 场景二:必要快照缺失
    const r2 = await diag(DAY_MISSING_SNAP);
    const m2 = meta(r2);
    A(r2.json.live.ok === false && m2.complete === false && m2.partial === true, '缺快照:ok=false → complete=false / partial=true');
    A((m2.requiredMissing || []).some(x => x.startsWith('snapshot-zs') && x.endsWith(DAY_MISSING_SNAP)),
      '缺快照:本请求日快照记入 requiredMissing');
    A((m2.debugErrors || []).length === 0, '缺快照:纯 ENOENT 不进 readErrors(只 requiredMissing)');

    // 场景三:主因文件损坏(快照有效)
    const r3 = await diag(DAY_MR_CORRUPT);
    const m3 = meta(r3);
    A(m3 && m3.complete === false && m3.partial === true, '主因损坏:complete=false / partial=true');
    A((m3.debugErrors || []).some(e => e.startsWith(`main-reason ${DAY_MR_CORRUPT}`) && e.includes('invalid JSON')),
      '主因损坏:main-reason 读错误进入 debugErrors(底层 note-before-throw,调用方 .catch 吞不掉)');

    // 场景四:主因非 ENOENT 读错误(EISDIR)
    const r4 = await diag(DAY_MR_EISDIR);
    const m4 = meta(r4);
    A(m4 && m4.complete === false, 'EISDIR:非 ENOENT 读错误 → complete=false');
    A((m4.debugErrors || []).some(e => e.startsWith(`main-reason ${DAY_MR_EISDIR}`)),
      'EISDIR:main-reason 读错误进入 debugErrors(EACCES 同分支,函数级已注入覆盖)');

    // 场景五:必要输入齐全 → complete=true(八审第2点:干净日不因窗口中间日缺失而误判)
    const r5 = await diag(DAY_CLEAN);
    const m5 = meta(r5);
    A(r5.json.live.ok === true && m5.complete === true && m5.partial === false,
      '干净日(必要输入齐全):complete=true / partial=false');
    A((m5.debugErrors || []).length === 0 && (m5.requiredMissing || []).length === 0 && (m5.timeouts || []).length === 0,
      '干净日:无 readErrors / 无 requiredMissing / 无 timeouts');

    // 场景六:真实 board-hydrate 超时(八审第3点)——DAY_TIMEOUT 被当作今日,无快照 → 实时补水 → 1ms 超时兜底
    const r6 = await diag(DAY_TIMEOUT);
    const m6 = meta(r6);
    A(m6 && (m6.timeouts || []).some(t => t.startsWith('board-hydrate')),
      '实时补水超时:timeouts 记录 board-hydrate(实际使用 STRATEGY_MAINLINE_LIVE_HYDRATE_TIMEOUT_MS 触发)');
    A(m6.fullWait === false && m6.partial === true && m6.complete === false,
      '实时补水超时:fullWait=false / partial=true / complete=false');

    // 场景七:并发两个诊断请求 + 诊断后普通请求,run() 隔离互不串写(八审第4点:干净日补断言 complete===true)
    const [cA, cB] = await Promise.all([diag(DAY_CORRUPT_SNAP), diag(DAY_CLEAN)]);
    const mA = meta(cA), mB = meta(cB);
    A((mA.debugErrors || []).some(e => e.includes('invalid JSON')) && mA.complete === false, '并发A(损坏日):自身错误齐全 + complete=false');
    A((mB.debugErrors || []).every(e => !e.includes('invalid JSON')) && mB.complete === true && mB.partial === false,
      '并发B(干净日):未串入并发A的损坏错误,且自身 complete=true / partial=false(run() 按异步上下文隔离)');
    const normal = await httpJson(port, `/api/strategy-mainlines?day=${DAY_CLEAN}`);
    A(normal.status === 200 && (!normal.json || normal.json.debugMeta === undefined),
      '诊断后普通请求:无 debugMeta 残留(store 不泄漏到非诊断路径)');

    console.log(process.exitCode ? 'SOME ENDPOINT CHECKS FAILED' : 'ALL LEADER-DEBUG-ENDPOINT CHECKS PASSED');
  } finally {
    srv.kill('SIGKILL');
    await fsp.rm(appDir, { recursive: true, force: true }).catch(() => {});
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
