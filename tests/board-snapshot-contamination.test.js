'use strict';

// P1 防跨日污染:strategy-backend 快照写入不得把回退(昨日)板块数据当作本日事实落盘。
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createStrategyBackend } = require('../strategy-backend');
const { scanBoardSnapshotContamination, manifestEntriesFromReport } = require('../tools/scan-board-snapshot-contamination');
const { loadStrategySnapshotForDailyEvents } = require('../strategy-daily-event-quality');

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

  // ── 2c. Codex 二轮阻断#2:全部行缺 sourceDay → 不得静默丢弃后仍让 QI 二次回退
  const be2c = makeBackend(() => [
    { plateId: 'pU', name: '无来源', zsType: 6, gainPct: 3, ztCount: 2, netInflow: 4e8 },  // 无 sourceDay
  ]);
  const unknownAll = await be2c.buildPayload(TODAY);
  ok(unknownAll.unknownSourceDayCount === 1, '记录未知来源板块数=1');
  ok(unknownAll.boardsFullyTrusted === false, '未知来源 → 板块非完全可信');
  ok(unknownAll.qiBoard === null, '全未知来源时不调 QI 聚合(封住昨日 QI 回退旁路)');
  ok(Object.keys(unknownAll.boards).length === 0, '未知来源行不进本日事实');
  ok(unknownAll.boardsUnavailableReason === 'unknown-source-suppressed', '未知来源抑制原因标注');

  // ── 2d. 同日行 + 缺日期行:未知行被剔除并计数,QI 因非完全可信不回退
  const be2d = makeBackend(() => [
    { plateId: 'pT', name: '本日', zsType: 6, gainPct: 4, ztCount: 3, netInflow: 6e8, sourceDay: TODAY },
    { plateId: 'pU', name: '无来源', zsType: 6, gainPct: 1, ztCount: 0, netInflow: 2e8 },
  ]);
  const mixedUnknown = await be2d.buildPayload(TODAY);
  ok(mixedUnknown.unknownSourceDayCount === 1 && mixedUnknown.boardsFullyTrusted === false,
    '同日+未知混合:计未知数且非完全可信');
  ok(mixedUnknown.qiBoard === null, '混入未知来源时不调 QI 聚合');
  ok(!JSON.stringify(mixedUnknown.boards).includes('"pU"'), '未知来源行被剔除,不进本日事实');

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

  // ── 5. Codex 二轮阻断#1 端到端:scan → emit manifest → loadStrategySnapshotForDailyEvents
  //      被抑制的综合快照日必须让 P6 质量加载器判为不可用,而不是 ok。
  const e2eRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'p1-e2e-'));
  const E2E_DAY = '2026-07-02';
  fs.mkdirSync(path.join(e2eRoot, 'strategy-data', 'snapshots'), { recursive: true });
  for (const zs of [5, 6, 7]) {
    fs.mkdirSync(path.join(e2eRoot, 'kpl-snapshots', String(zs)), { recursive: true });
    fs.writeFileSync(path.join(e2eRoot, 'kpl-snapshots', String(zs), `${E2E_DAY}.json`), JSON.stringify({ day: E2E_DAY, boards: [] }));
  }
  fs.writeFileSync(path.join(e2eRoot, 'strategy-data', `strategy-mainline-snapshot-${E2E_DAY}.json`), JSON.stringify({ day: E2E_DAY, mainlines: [] }));
  // 综合快照为已抑制空档(新写入器产物)
  fs.writeFileSync(path.join(e2eRoot, 'strategy-data', 'snapshots', `${E2E_DAY}.json`),
    JSON.stringify({ date: E2E_DAY, boardsStale: true, boardsSourceDay: '2026-07-01', boards: {} }));

  // 基线:无清单时,依赖链齐全 → loader 判 ok(证明是清单条目导致不可用,而非文件缺失)
  const baseline = await loadStrategySnapshotForDailyEvents({ rootDir: e2eRoot, day: E2E_DAY });
  ok(baseline.snapshotStatus === 'ok' && baseline.snapshotUsable === true, 'E2E 基线:依赖齐全无清单时为 ok');

  // scan → emit manifest → 写入正式清单路径
  const e2eReport = await scanBoardSnapshotContamination({ snapshotDir: path.join(e2eRoot, 'strategy-data', 'snapshots'), minEqualBoards: 3 });
  const entries = manifestEntriesFromReport(e2eReport);
  ok(entries.some(e => e.targetDay === E2E_DAY && e.state === 'missing' && e.sha256 === null && e.expectedPath === `strategy-data/snapshots/${E2E_DAY}.json`),
    'emit-manifest 把 suppressed 输出为 missing 形状(进入正式清单)');
  fs.writeFileSync(path.join(e2eRoot, 'strategy-data', 'strategy-data-quality.json'), JSON.stringify({ entries }));

  // 加载器带清单再判:必须不可用
  const gated = await loadStrategySnapshotForDailyEvents({ rootDir: e2eRoot, day: E2E_DAY });
  ok(gated.snapshotStatus !== 'ok' && gated.snapshotUsable === false,
    'E2E:清单含 suppressed 日后,loader 判 snapshotStatus!=ok 且 snapshotUsable=false');
  fs.rmSync(e2eRoot, { recursive: true, force: true });

  fs.rmSync(dataDir, { recursive: true, force: true });
  console.log(failed ? 'SOME CHECKS FAILED' : 'ALL BOARD-CONTAMINATION CHECKS PASSED');
  if (failed) process.exitCode = 1;
})().catch(err => { console.error(err); process.exitCode = 1; });
