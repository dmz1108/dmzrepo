'use strict';

// P1 防跨日污染:strategy-backend 快照写入不得把回退(昨日)板块数据当作本日事实落盘。
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createStrategyBackend } = require('../strategy-backend');
const { scanBoardSnapshotContamination } = require('../tools/scan-board-snapshot-contamination');

const TODAY = '2026-07-13';
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p1-board-'));

// 注入的 getBoards:按 requestedDay 返回带 sourceDay 的板块;past 日无自有快照 → 回退返回昨日来源。
function makeBackend(boardsByDay) {
  return createStrategyBackend({
    dataDir,
    nowParts: () => ({ day: TODAY, hour: 15, minute: 0 }),
    getBoards: async (day) => boardsByDay(day),
    getQiAggregate: async () => ({ day: TODAY, leaders: [{ code: '000001' }] }),
    isAdmin: () => false,
    canRunL2Scan: () => false,   // 注入以避开 createStrategyBackend 的 isAdmin TDZ(生产始终注入,故不触发)
  });
}

let failed = 0;
const ok = (cond, msg) => { if (!cond) { failed++; console.error('FAIL: ' + msg); } else console.log('ok: ' + msg); };

(async () => {
  // ── 1. 本日有自有板块(sourceDay===day):正常落盘,不判 stale
  const be1 = makeBackend((day) => [
    { plateId: 'p1', name: '甲', zsType: 6, gainPct: 3, ztCount: 2, netInflow: 5e8, sourceDay: day, sourceKind: 'snapshot' },
  ]);
  const fresh = await be1.buildPayload(TODAY);
  ok(fresh.boardsStale === false && fresh.boardsSourceDay === TODAY, '本日自有板块 → boardsStale=false');
  ok(Object.keys(fresh.boards).length >= 1 && fresh.focus !== undefined, '本日板块正常进入快照');

  // ── 2. 历史日无自有快照,getBoards 回退返回昨日来源(sourceDay=昨日)→ 必须抑制
  const PAST = '2026-07-02';
  const FALLBACK_SRC = '2026-07-01';
  const be2 = makeBackend(() => [
    { plateId: 'bk0711', name: '券商', zsType: 6, gainPct: 1.2, ztCount: 0, netInflow: 1.0634e10, sourceDay: FALLBACK_SRC, sourceKind: 'snapshot' },
    { plateId: 'p9', name: '乙', zsType: 6, gainPct: 2, ztCount: 1, netInflow: 3e8, sourceDay: FALLBACK_SRC, sourceKind: 'snapshot' },
  ]);
  const stale = await be2.buildPayload(PAST);
  ok(stale.boardsStale === true, '跨日回退 → boardsStale=true');
  ok(stale.boardsSourceDay === FALLBACK_SRC, '如实记录回退来源日');
  ok(stale.boardsUnavailableReason === 'cross-day-fallback-suppressed', '标注抑制原因');
  ok(Object.keys(stale.boards).length === 0, '回退板块数据不进 boards(不冒充本日)');
  ok(stale.strong.length === 0, '回退时无 strong 板块');
  ok(stale.qiBoard === null, '回退时不调 QI 聚合(否则会二次回退绕回污染)');

  // ── 2b. Codex 阻断#1:混合来源日(target + previous),stale 放第二位,不能只看第一个值
  const be2b = makeBackend(() => [
    { plateId: 'pT', name: '本日', zsType: 6, gainPct: 4, ztCount: 3, netInflow: 6e8, sourceDay: TODAY, sourceKind: 'snapshot' },
    { plateId: 'pF', name: '昨日', zsType: 6, gainPct: 1, ztCount: 0, netInflow: 9e9, sourceDay: '2026-07-10', sourceKind: 'snapshot' },
  ]);
  const mixed = await be2b.buildPayload(TODAY);
  ok(mixed.boardsStale === true, '混合来源(第二位是跨日)→ boardsStale=true,不被顺序骗过');
  ok(mixed.droppedForeignBoardCount === 1, '记录被剔除的跨日板块数=1');
  ok(mixed.boardsSourceDays.includes(TODAY) && mixed.boardsSourceDays.includes('2026-07-10'),
    '记录完整来源日集合,不只第一个值');
  ok(!JSON.stringify(mixed.boards).includes('9000000000') && !JSON.stringify(mixed.boards).includes('"pF"'),
    '跨日板块 pF 被逐行剔除,不进本日事实');
  ok(mixed.boardsUnavailableReason === 'partial-cross-day-suppressed', '部分抑制原因标注正确');

  // ── 3. saveSnapshot 落盘的是抑制后的诚实空档,不是昨日券商 +106 亿
  const saved = await be2.saveSnapshot(PAST, { force: true });
  const onDisk = JSON.parse(fs.readFileSync(path.join(dataDir, 'snapshots', `${PAST}.json`), 'utf8'));
  ok(saved.boardsStale === true && onDisk.boardsStale === true, '落盘文件带 boardsStale=true');
  ok(!JSON.stringify(onDisk.boards).includes('10634000000') && Object.keys(onDisk.boards).length === 0,
    '磁盘快照不含被冒充的昨日券商净流入(污染未被创建)');

  // ── 4. 普查工具:合成两天快照,当日 ≥N 板块净流入与前一日精确相等 → 判 suspected-stale
  const sweepDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p1-sweep-'));
  const dayA = { date: '2026-07-01', boards: { '6:bk0711': { plateId: 'bk0711', netInflow: 1.0634e10, gainPct: 1.2, ztCount: 0 },
    '6:bk0712': { plateId: 'bk0712', netInflow: 2e8, gainPct: 0.5, ztCount: 1 },
    '6:bk0713': { plateId: 'bk0713', netInflow: -3.676e9, gainPct: -1, ztCount: 0 } } };
  const dayB = { date: '2026-07-02', boards: { '6:bk0711': { plateId: 'bk0711', netInflow: 1.0634e10, gainPct: 1.2, ztCount: 0 },
    '6:bk0712': { plateId: 'bk0712', netInflow: 2e8, gainPct: 0.5, ztCount: 1 },
    '6:bk0713': { plateId: 'bk0713', netInflow: -3.676e9, gainPct: -1, ztCount: 0 } } };  // 与前一日逐板精确相等 = 被污染
  const dayC = { date: '2026-07-03', boards: { '6:bk0711': { plateId: 'bk0711', netInflow: 8e9, gainPct: 2.1, ztCount: 1 },
    '6:bk0712': { plateId: 'bk0712', netInflow: 5e8, gainPct: 1.1, ztCount: 2 },
    '6:bk0713': { plateId: 'bk0713', netInflow: 1e9, gainPct: 0.3, ztCount: 0 } } };  // 正常变化
  fs.writeFileSync(path.join(sweepDir, '2026-07-01.json'), JSON.stringify(dayA));
  fs.writeFileSync(path.join(sweepDir, '2026-07-02.json'), JSON.stringify(dayB));
  fs.writeFileSync(path.join(sweepDir, '2026-07-03.json'), JSON.stringify(dayC));
  const report = await scanBoardSnapshotContamination({ snapshotDir: sweepDir, minEqualBoards: 3 });
  const flagged = report.suspected.map(s => s.targetDay);
  ok(flagged.includes('2026-07-02'), '普查命中被污染的 07-02(逐板与前日精确相等)');
  ok(!flagged.includes('2026-07-03'), '普查不误报正常变化的 07-03');
  const entry = report.suspected.find(s => s.targetDay === '2026-07-02');
  ok(entry && entry.state === 'contaminated' && entry.observedSourceDay === '2026-07-01' &&
    /^[a-f0-9]{64}$/.test(entry.observedSha256) && entry.path === 'strategy-data/snapshots/2026-07-02.json',
    '清单条目为判别联合 contaminated 形状(path + state + observedSha256 + observedSourceDay)');

  // ── 4b. Codex 阻断#2:新写入器抑制后的诚实空档(boardsStale:true + boards:{})绝不能标 contaminated
  const dayD = { date: '2026-07-06', boardsStale: true, boardsSourceDay: '2026-07-03', boards: {} };  // 已抑制,无板块值
  fs.writeFileSync(path.join(sweepDir, '2026-07-06.json'), JSON.stringify(dayD));
  const report2 = await scanBoardSnapshotContamination({ snapshotDir: sweepDir, minEqualBoards: 3 });
  ok(!report2.suspected.some(s => s.targetDay === '2026-07-06'), '已抑制的诚实空档不进 contaminated');
  ok(report2.suppressed.some(s => s.targetDay === '2026-07-06' && s.state === 'suppressed'),
    '已抑制文件归入 suppressed(区别于污染)');
  ok(report2.suspected.some(s => s.targetDay === '2026-07-02' && s.state === 'contaminated'),
    '真正含跨日复制值的旧文件仍命中 contaminated');
  fs.rmSync(sweepDir, { recursive: true, force: true });

  fs.rmSync(dataDir, { recursive: true, force: true });
  console.log(failed ? 'SOME CHECKS FAILED' : 'ALL BOARD-CONTAMINATION CHECKS PASSED');
  if (failed) process.exitCode = 1;
})().catch(err => { console.error(err); process.exitCode = 1; });
