'use strict';
/**
 * 策略页后端（自成一体模块，云端挂进主服务器 kpl-stats-server.js）
 *
 * 职责：
 *   - 管理「重点关注」= 管理员手动确认的板块（全站共用，按日期存服务器）
 *   - 每天 15:00 自动生成当天快照（重点关注 + 强势板块 + 各板块指标），存文件，超 30 天清
 *   - 提供 /api/strategy/* 接口给前端
 *
 * 与主服务器的耦合点（全部通过 createStrategyBackend(opts) 注入，便于本地开发 / 云端切换）：
 *   - opts.getBoards(day) -> Promise<[{plateId,name,gainPct,ztCount,netInflow,zsType}]>
 *        当天「所有概念类型」板块 + 指标。云端用主服务器的概念目录数据；本地用样例。
 *   - opts.isAdmin(req)   -> bool   是否管理员（写操作鉴权）。云端复用主服务器登录态。
 *   - opts.nowParts()     -> {day:'YYYY-MM-DD', hour, minute}   北京时间。默认内置实现。
 *   - opts.dataDir        快照/确认数据目录（默认 ./strategy-data）
 *   - opts.keepDays       快照保留天数（默认 30）
 *
 * 用法（云端 kpl-stats-server.js 里）：
 *   const { createStrategyBackend } = require('./strategy-backend');
 *   const strategy = createStrategyBackend({
 *     dataDir: path.join(__dirname, 'strategy-data'),
 *     getBoards: getStrategyBoardsForDay,        // 你接：返回当天各类型板块+指标
 *     isAdmin: (req) => isRequestAdmin(req),     // 你接：复用现有管理员鉴权
 *     nowParts: () => chinaNowParts(),           // 你已有
 *   });
 *   strategy.startCron();                        // 启动 15:00 定时快照
 *   // 在请求分发处最前面：
 *   if (await strategy.handle(req, res, url)) return;
 */
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

function defaultNowParts() {
  // 北京时间 UTC+8
  const d = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const day = d.toISOString().slice(0, 10);
  return { day, hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

function sendJson(res, status, obj) {
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let buf = '';
    req.on('data', (c) => { buf += c; if (buf.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pickStrong(boards) {
  // 强势板块 = 涨幅前2 + 涨停前2（去重，标 reasons）
  const byId = new Map();
  const add = (b, reason) => {
    const id = String(b.plateId);
    const e = byId.get(id) || {
      plateId: id, name: b.name, zsType: b.zsType,
      gainPct: numOrNull(b.gainPct), ztCount: numOrNull(b.ztCount), netInflow: numOrNull(b.netInflow),
      qiLeaders: b.qiLeaders || null,
      reasons: [],
    };
    if (!e.reasons.includes(reason)) e.reasons.push(reason);
    byId.set(id, e);
  };
  boards.filter((b) => Number.isFinite(Number(b.gainPct)))
    .sort((a, b) => Number(b.gainPct) - Number(a.gainPct)).slice(0, 2).forEach((b) => add(b, 'gain'));
  boards.filter((b) => Number.isFinite(Number(b.ztCount)))
    .sort((a, b) => Number(b.ztCount) - Number(a.ztCount)).slice(0, 2).forEach((b) => add(b, 'zt'));
  return [...byId.values()];
}

function numOrNull(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }

function normZsType(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function scopedBoardKey(plateId, zsType) {
  return `${normZsType(zsType) || ''}:${String(plateId ?? '').trim()}`;
}

function samePlateAndSource(board, plateId, zsType) {
  if (String(board?.plateId ?? '') !== String(plateId ?? '')) return false;
  const expected = normZsType(zsType);
  return !expected || normZsType(board?.zsType) === expected;
}

function emptyHiddenSpec() {
  return { ids: new Set(), scoped: new Set() };
}

function parseHiddenSpec(url) {
  const hidden = emptyHiddenSpec();
  const raw = [
    url?.searchParams?.get('hidden'),
    url?.searchParams?.get('hidden_boards'),
    url?.searchParams?.get('hiddenBoards'),
  ].filter(Boolean).join(',');
  for (const token of raw.split(/[,\s]+/)) {
    const text = String(token || '').trim();
    if (!text) continue;
    const m = /^([^:]+):(.+)$/.exec(text);
    if (m) hidden.scoped.add(`${String(m[1]).trim()}:${String(m[2]).trim()}`);
    else hidden.ids.add(text);
  }
  return hidden;
}

function hasHiddenSpec(hidden) {
  return !!hidden && (hidden.ids?.size > 0 || hidden.scoped?.size > 0);
}

function isHiddenBoard(board, hidden) {
  if (!hasHiddenSpec(hidden)) return false;
  const plateId = String(board?.plateId ?? board?.id ?? board?.code ?? '').trim();
  if (!plateId) return false;
  const zsType = String(board?.zsType ?? board?.zs_type ?? '').trim();
  return hidden.ids.has(plateId) || (zsType && hidden.scoped.has(`${zsType}:${plateId}`));
}

function boardMapToList(map) {
  return Object.entries(map || {}).map(([plateId, b]) => ({
    plateId: String(plateId),
    name: b?.name,
    zsType: b?.zsType,
    gainPct: b?.gainPct,
    ztCount: b?.ztCount,
    netInflow: b?.netInflow,
    qiLeaders: b?.qiLeaders || null,
  }));
}

function listToBoardMap(list) {
  const map = {};
  for (const b of list || []) {
    map[String(b.plateId)] = {
      name: b.name,
      zsType: b.zsType,
      gainPct: numOrNull(b.gainPct),
      ztCount: numOrNull(b.ztCount),
      netInflow: numOrNull(b.netInflow),
      qiLeaders: b.qiLeaders || null,
    };
  }
  return map;
}

function filterQiBoard(qiBoard, hidden) {
  if (!hasHiddenSpec(hidden) || !qiBoard || !Array.isArray(qiBoard.leaders)) return qiBoard;
  const leaders = qiBoard.leaders.map((leader) => {
    const boards = (leader.boards || []).filter((b) => !isHiddenBoard(b, hidden));
    return { ...leader, boards, boardCount: boards.length };
  }).filter((leader) => leader.boards.length > 0);
  return {
    ...qiBoard,
    total: leaders.length,
    newCount: leaders.filter((leader) => leader.isNew).length,
    leaders,
  };
}

function filterPayloadHidden(payload, hidden) {
  if (!hasHiddenSpec(hidden) || !payload) return payload;
  const boards = boardMapToList(payload.boards).filter((b) => !isHiddenBoard(b, hidden));
  const focus = (payload.focus || []).filter((b) => !isHiddenBoard(b, hidden));
  const focusIds = new Set(focus.map((b) => String(b.plateId)));
  const strong = boards.length
    ? pickStrong(boards).filter((b) => !focusIds.has(String(b.plateId)))
    : (payload.strong || []).filter((b) => !isHiddenBoard(b, hidden) && !focusIds.has(String(b.plateId)));
  return {
    ...payload,
    focus,
    strong,
    boards: listToBoardMap(boards),
    qiBoard: filterQiBoard(payload.qiBoard, hidden),
  };
}

function createStrategyBackend(opts = {}) {
  const DATA_DIR = opts.dataDir || path.join(__dirname, 'strategy-data');
  const FOCUS_DIR = path.join(DATA_DIR, 'focus');        // <date>.json -> [{plateId,name,zsType,confirmedAt}]
  const SNAP_DIR = path.join(DATA_DIR, 'snapshots');     // <date>.json -> snapshot
  const KEEP_DAYS = opts.keepDays || 30;
  const getBoards = opts.getBoards || (async () => []);
  // (plateId, day, info) -> [{code,name}]；info = { zsType, name }（成分股按概念类型走不同数据源，故下发 zsType）
  const getBoardStocks = opts.getBoardStocks || (async () => []);
  const getBoardRealtimeStocks = opts.getBoardRealtimeStocks || getBoardStocks;
  const l2FocusScanner = opts.l2FocusScanner || null;
  const canRunL2Scan = typeof opts.canRunL2Scan === 'function' ? opts.canRunL2Scan : isAdmin;
  // 逐笔统计适配器：(code, day, minAmount) -> { activeBuy, passiveBuy, activeSell, passiveSell }
  //   minAmount = 单笔最小成交金额（元，前端可选 50万/300万/500万/800万/1000万）；只统计单笔≥minAmount 的逐笔。
  // 不注入 = 逐笔数据源未接入（智能选股返回 available:false，不出任何结果）。接 L2 逐笔委托后注入真实实现。
  const getOrderStats = typeof opts.getOrderStats === 'function' ? opts.getOrderStats : null;
  // QI 龙头作战室聚合：(day, boards) -> { day, prevDay, total, newCount, leaders:[...] }
  // 不注入 = 不下发 qiBoard，前端会用各板块 qiLeaders 客户端兜底聚合。
  const getQiAggregate = typeof opts.getQiAggregate === 'function' ? opts.getQiAggregate : null;
  const isAdmin = opts.isAdmin || (() => false);
  const nowParts = opts.nowParts || defaultNowParts;
  const SMART_PICK_RATIO = opts.smartPickRatio || 1.5;

  fsSync.mkdirSync(FOCUS_DIR, { recursive: true });
  fsSync.mkdirSync(SNAP_DIR, { recursive: true });

  // ---------- 重点关注（确认）存取 ----------
  async function readFocus(day) {
    try { return JSON.parse(await fs.readFile(path.join(FOCUS_DIR, `${day}.json`), 'utf8')) || []; }
    catch { return []; }
  }
  async function writeFocus(day, list) {
    await fs.writeFile(path.join(FOCUS_DIR, `${day}.json`), JSON.stringify(list), 'utf8');
  }
  async function addFocus(day, board) {
    const list = await readFocus(day);
    const id = String(board.plateId);
    const zsType = normZsType(board.zsType);
    const existing = list.find((b) => String(b.plateId) === id && normZsType(b.zsType) === zsType)
      || (zsType ? list.find((b) => String(b.plateId) === id && !normZsType(b.zsType)) : null);
    if (existing) {
      existing.name = String(board.name || existing.name || '');
      existing.zsType = zsType;
      existing.confirmedAt = existing.confirmedAt || new Date().toISOString();
      await writeFocus(day, list);
    } else {
      list.push({ plateId: id, name: String(board.name || ''), zsType, confirmedAt: new Date().toISOString() });
      await writeFocus(day, list);
    }
    return list;
  }
  async function removeFocus(day, plateId, zsType = null) {
    const id = String(plateId);
    const requestedZsType = normZsType(zsType);
    const list = (await readFocus(day)).filter((b) => {
      if (String(b.plateId) !== id) return true;
      if (!requestedZsType) return false;
      const currentZsType = normZsType(b.zsType);
      return currentZsType && currentZsType !== requestedZsType;
    });
    await writeFocus(day, list);
    return list;
  }

  // ---------- 组装「今天/快照」结构 ----------
  async function buildPayload(day, hidden = emptyHiddenSpec()) {
    const boards = (await getBoards(day).catch(() => []))
      .filter((b) => !isHiddenBoard(b, hidden));
    const map = new Map(boards.map((b) => [scopedBoardKey(b.plateId, b.zsType), b]));
    const focusRaw = (await readFocus(day))
      .filter((b) => !isHiddenBoard(b, hidden));
    const focusIds = new Set(focusRaw.map((b) => scopedBoardKey(b.plateId, b.zsType)));

    const focus = focusRaw.map((f) => {
      const m = map.get(scopedBoardKey(f.plateId, f.zsType))
        || (!normZsType(f.zsType) ? boards.find((b) => String(b.plateId) === String(f.plateId)) : null);   // 用当天同来源板块指标补齐
      return {
        plateId: String(f.plateId), name: f.name, zsType: f.zsType,
        gainPct: m ? numOrNull(m.gainPct) : null,
        ztCount: m ? numOrNull(m.ztCount) : null,
        netInflow: m ? numOrNull(m.netInflow) : null,
        qiLeaders: m ? (m.qiLeaders || null) : null,
      };
    });
    const strong = pickStrong(boards).filter((b) => !focusIds.has(scopedBoardKey(b.plateId, b.zsType)));  // 与重点关注按来源去重
    const boardsMap = listToBoardMap(boards);
    let qiBoard = null;
    if (getQiAggregate) { try { qiBoard = await getQiAggregate(day, boards); } catch (e) { qiBoard = null; } }
    return { date: day, savedAt: new Date().toISOString(), focus, strong, boards: boardsMap, qiBoard: filterQiBoard(qiBoard, hidden) };
  }

  // ---------- 快照存储 + 清理 ----------
  async function saveSnapshot(day, { force = false } = {}) {
    const file = path.join(SNAP_DIR, `${day}.json`);
    if (!force) { try { await fs.access(file); return JSON.parse(await fs.readFile(file, 'utf8')); } catch {} }
    const payload = await buildPayload(day);
    await fs.writeFile(file, JSON.stringify(payload), 'utf8');
    await prune();
    return payload;
  }
  async function readSnapshot(day) {
    try { return JSON.parse(await fs.readFile(path.join(SNAP_DIR, `${day}.json`), 'utf8')); }
    catch { return null; }
  }
  async function prune() {
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
    for (const dir of [SNAP_DIR, FOCUS_DIR]) {
      let files = [];
      try { files = await fs.readdir(dir); } catch { continue; }
      for (const f of files) {
        const m = /^(\d{4}-\d{2}-\d{2})\.json$/.exec(f);
        if (!m) continue;
        const t = new Date(`${m[1]}T00:00:00+08:00`).getTime();
        if (Number.isFinite(t) && t < cutoff) await fs.unlink(path.join(dir, f)).catch(() => {});
      }
    }
  }

  // ---------- 定时：每天 15:00 存一次 ----------
  let lastSnapDay = '';
  let timer = null;
  async function tick() {
    const n = nowParts();
    if (n.hour === 15 && lastSnapDay !== n.day) {
      lastSnapDay = n.day;
      try { await saveSnapshot(n.day, { force: true }); } catch (e) { console.error('[strategy] snapshot failed:', e.message); }
    }
  }
  function startCron() { if (!timer) { timer = setInterval(() => { tick().catch(() => {}); }, 60 * 1000); tick().catch(() => {}); } }
  function stopCron() { if (timer) { clearInterval(timer); timer = null; } }

  // ---------- 路由 ----------
  async function handle(req, res, url) {
    if (!url.pathname.startsWith('/api/strategy/')) return false;
    const method = req.method || 'GET';

    // 今天实时
    if (url.pathname === '/api/strategy/today' && method === 'GET') {
      const day = url.searchParams.get('day') || nowParts().day;
      if (!DATE_RE.test(day)) { sendJson(res, 400, { error: 'bad day' }); return true; }
      sendJson(res, 200, await buildPayload(day, parseHiddenSpec(url)));
      return true;
    }
    // 历史快照
    if (url.pathname === '/api/strategy/snapshot' && method === 'GET') {
      const day = url.searchParams.get('day') || nowParts().day;
      if (!DATE_RE.test(day)) { sendJson(res, 400, { error: 'bad day' }); return true; }
      const snap = await readSnapshot(day);
      if (!snap) { sendJson(res, 404, { error: 'snapshot not found' }); return true; }
      sendJson(res, 200, filterPayloadHidden(snap, parseHiddenSpec(url)));
      return true;
    }
    // 确认 / 取消确认（管理员）
    if (url.pathname === '/api/strategy/focus') {
      if (!isAdmin(req)) { sendJson(res, 403, { error: 'admin only' }); return true; }
      const day = url.searchParams.get('day') || nowParts().day;
      if (method === 'POST') {
        const body = await readBody(req);
        if (body.plateId == null || !body.name) { sendJson(res, 400, { error: 'missing plateId/name' }); return true; }
        const list = await addFocus(day, { plateId: body.plateId, name: body.name, zsType: body.zsType });
        sendJson(res, 200, { ok: true, day, focus: list });
        return true;
      }
      if (method === 'DELETE') {
        const plateId = url.searchParams.get('plateId') || url.searchParams.get('plate_id');
        if (!plateId) { sendJson(res, 400, { error: 'missing plateId' }); return true; }
        const list = await removeFocus(day, plateId, url.searchParams.get('zsType') || url.searchParams.get('zs_type'));
        sendJson(res, 200, { ok: true, day, focus: list });
        return true;
      }
      if (method === 'GET') { sendJson(res, 200, { day, focus: await readFocus(day) }); return true; }
    }
    // 重点关注 L2 扫描：L1 仅取成分股实时涨幅快照排序，L2 逐笔成交分批统计主动/被动买卖。
    if (url.pathname === '/api/strategy/focus-l2-scan') {
      if (!l2FocusScanner) {
        sendJson(res, 200, { available: false, note: 'L2扫描器未接入' });
        return true;
      }
      if (method === 'GET') {
        const jobId = url.searchParams.get('jobId') || url.searchParams.get('job_id');
        if (jobId) {
          const job = l2FocusScanner.get(jobId);
          sendJson(res, job ? 200 : 404, job || { error: 'job not found' });
          return true;
        }
        sendJson(res, 200, await l2FocusScanner.status());
        return true;
      }
      if (method === 'POST') {
        if (!canRunL2Scan(req)) { sendJson(res, 403, { error: 'login required' }); return true; }
        const body = await readBody(req);
        const plateId = body.plateId || body.plate_id || url.searchParams.get('plateId') || url.searchParams.get('plate_id');
        const day = body.day || url.searchParams.get('day') || nowParts().day;
        if (!plateId) { sendJson(res, 400, { error: 'missing plateId' }); return true; }
        const thRaw = Number(body.threshold ?? url.searchParams.get('threshold'));
        const threshold = Number.isFinite(thRaw) && thRaw > 0 ? thRaw : SMART_PICK_RATIO;
        const minRaw = Number(body.minAmount ?? url.searchParams.get('minAmount'));
        const minAmount = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : 500000;
        const requestedZsType = normZsType(body.zsType ?? body.zs_type ?? url.searchParams.get('zsType') ?? url.searchParams.get('zs_type'));
        const boardsForPick = await getBoards(day).catch(() => []);
        const focusRows = await readFocus(day).catch(() => []);
        const focusForPick = focusRows.find((b) => samePlateAndSource(b, plateId, requestedZsType))
          || focusRows.find((b) => String(b.plateId) === String(plateId))
          || null;
        const sourceZsType = requestedZsType || normZsType(focusForPick?.zsType);
        const boardForPick = boardsForPick.find((b) => samePlateAndSource(b, plateId, sourceZsType))
          || boardsForPick.find((b) => String(b.plateId) === String(plateId))
          || null;
        const stockInfo = {
          zsType: sourceZsType ?? normZsType(boardForPick?.zsType),
          name: boardForPick?.name || focusForPick?.name || body.boardName || body.name || '',
        };
        const stocks = await getBoardRealtimeStocks(plateId, day, stockInfo).catch(async () => getBoardStocks(plateId, day, stockInfo).catch(() => []));
        const job = l2FocusScanner.start({
          plateId: String(plateId),
          boardName: body.boardName || body.name || boardForPick?.name || stockInfo.name || '',
          day,
          threshold,
          minAmount,
          stocks,
          sortSnapshotAt: new Date().toISOString(),
        });
        sendJson(res, 202, job);
        return true;
      }
      sendJson(res, 405, { error: 'method not allowed' });
      return true;
    }
    // 智能选股：读板块成分股 → 统计每只≥50万主动/被动买卖 → 筛 主动买/主动卖 ≥ 阈值
    if (url.pathname === '/api/strategy/smart-pick' && method === 'GET') {
      const plateId = url.searchParams.get('plateId') || url.searchParams.get('plate_id');
      const day = url.searchParams.get('day') || nowParts().day;
      if (!plateId) { sendJson(res, 400, { error: 'missing plateId' }); return true; }
      const thRaw = Number(url.searchParams.get('threshold'));
      const threshold = Number.isFinite(thRaw) && thRaw > 0 ? thRaw : SMART_PICK_RATIO;  // 阈值可调
      const minRaw = Number(url.searchParams.get('minAmount'));
      const minAmount = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : 500000;  // 单笔最小成交金额（元），默认50万，可调
      if (!getOrderStats) {  // 逐笔数据源未接入 → 不出任何结果，交给前端提示
        sendJson(res, 200, { plateId: String(plateId), day, available: false, note: '逐笔数据源未接入', threshold, minAmount, total: 0, pickedCount: 0, picked: [] });
        return true;
      }
      // 取当天板块，拿 zsType/name 给成分股适配器选对数据源
      const boardsForPick = await getBoards(day).catch(() => []);
      const requestedZsType = normZsType(url.searchParams.get('zsType') || url.searchParams.get('zs_type'));
      const focusRows = await readFocus(day).catch(() => []);
      const focusForPick = focusRows.find((b) => samePlateAndSource(b, plateId, requestedZsType))
        || focusRows.find((b) => String(b.plateId) === String(plateId))
        || null;
      const sourceZsType = requestedZsType || normZsType(focusForPick?.zsType);
      const boardForPick = boardsForPick.find((b) => samePlateAndSource(b, plateId, sourceZsType))
        || boardsForPick.find((b) => String(b.plateId) === String(plateId))
        || null;
      const stockInfo = {
        zsType: sourceZsType ?? normZsType(boardForPick?.zsType),
        name: boardForPick?.name || focusForPick?.name || '',
      };
      const stocks = await getBoardStocks(plateId, day, stockInfo).catch(() => []);
      const picked = [];
      for (const s of stocks) {
        const st = await getOrderStats(s.code, day, minAmount);  // 真实「单笔≥minAmount」主动/被动 逐笔统计
        const ratio = st.activeSell > 0 ? st.activeBuy / st.activeSell : (st.activeBuy > 0 ? Infinity : 0);
        if (ratio >= threshold) {
          picked.push({
            code: s.code, name: s.name,
            ratio: Number.isFinite(ratio) ? Math.round(ratio * 100) / 100 : null,
            activeBuy: st.activeBuy, activeSell: st.activeSell,
            passiveBuy: st.passiveBuy, passiveSell: st.passiveSell,
          });
        }
      }
      sendJson(res, 200, { plateId: String(plateId), day, available: true, total: stocks.length, threshold, minAmount, pickedCount: picked.length, picked });
      return true;
    }
    // 手动补存快照（管理员）
    if (url.pathname === '/api/strategy/snapshot/rebuild' && method === 'POST') {
      if (!isAdmin(req)) { sendJson(res, 403, { error: 'admin only' }); return true; }
      const day = url.searchParams.get('day') || nowParts().day;
      if (!DATE_RE.test(day)) { sendJson(res, 400, { error: 'bad day' }); return true; }
      const snap = await saveSnapshot(day, { force: true });
      sendJson(res, 200, { ok: true, day, savedAt: snap.savedAt });
      return true;
    }
    sendJson(res, 404, { error: 'unknown strategy route' });
    return true;
  }

  return { handle, startCron, stopCron, saveSnapshot, buildPayload, readFocus, addFocus, removeFocus, prune };
}

module.exports = { createStrategyBackend };
