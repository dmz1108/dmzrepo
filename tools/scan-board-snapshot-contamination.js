'use strict';

// P1 板块快照跨日污染普查(只读,离线):扫描 strategy-data/snapshots/<DAY>.json 复合快照,
// 找出「当日板块资金/涨幅/涨停数与前一交易日逐板精确相等」的可疑跨日污染日,产出 data-quality 清单条目。
//
// 判据(遵 Owner 联合比较口径):plateId 集合 + gainPct + netInflow + ztCount 联合逐板相等,
// 排除 0/null 空值造成的假相等;equalRatio 达阈值即判 suspected-stale。不改写、不删除任何文件。
//
// 用法:node tools/scan-board-snapshot-contamination.js [--dir=strategy-data/snapshots] [--min=8] [--ratio=0.85] [--emit-manifest]

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DAY_RE = /^(\d{4}-\d{2}-\d{2})\.json$/;

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// 复合快照 boards 是 { scopedKey: {plateId, netInflow, gainPct, ztCount} } 映射
function boardMetrics(payload) {
  const boards = payload && payload.boards && typeof payload.boards === 'object' ? payload.boards : {};
  const map = new Map();
  for (const [key, b] of Object.entries(boards)) {
    const plateId = String(b?.plateId ?? key.split(':').pop() ?? '').trim();
    if (!plateId) continue;
    map.set(`${b?.zsType ?? key.split(':')[0] ?? ''}:${plateId}`, {
      netInflow: num(b?.netInflow),
      gainPct: num(b?.gainPct),
      ztCount: num(b?.ztCount),
    });
  }
  return map;
}

// 一块板块三项是否「有意义」(非全 0/null),用于排除空值假相等
function meaningful(m) {
  return !!(m && ((m.netInflow != null && m.netInflow !== 0) ||
    (m.gainPct != null && m.gainPct !== 0) ||
    (m.ztCount != null && m.ztCount !== 0)));
}

function sameBoard(a, b) {
  return a.netInflow === b.netInflow && a.gainPct === b.gainPct && a.ztCount === b.ztCount;
}

async function scanBoardSnapshotContamination(options = {}) {
  const snapshotDir = options.snapshotDir || path.join(__dirname, '..', 'strategy-data', 'snapshots');
  const minEqualBoards = Number(options.minEqualBoards ?? options.min ?? 8);
  const minRatio = Number(options.minRatio ?? options.ratio ?? 0.85);

  let files = [];
  try { files = fs.readdirSync(snapshotDir); } catch { files = []; }
  const days = files.map(f => (DAY_RE.exec(f) || [])[1]).filter(Boolean).sort();

  const suspected = [];
  const suppressed = [];
  const inspected = [];

  // 逐文件读取解析(缓存),避免任一文件损坏/缺失影响其它文件的判定
  const parsed = new Map();
  for (const d of days) {
    try {
      const raw = fs.readFileSync(path.join(snapshotDir, `${d}.json`), 'utf8');
      parsed.set(d, { raw, json: JSON.parse(raw) });
    } catch { parsed.set(d, null); }
  }

  // 第一遍:识别写入器显式状态(boardsStale / 非完全可信),不依赖前一文件。
  // 新写入器产物:板块事实已被抑制/本日不可用 → 属「已抑制」,绝不能标 contaminated。
  const suppressedDays = new Set();
  for (const d of days) {
    const entry = parsed.get(d);
    if (!entry) continue;
    const cur = entry.json;
    const writerSuppressed = cur && (cur.boardsStale === true ||
      cur.boardsFullyTrusted === false ||
      (typeof cur.boardsUnavailableReason === 'string' && cur.boardsUnavailableReason));
    if (writerSuppressed) {
      suppressedDays.add(d);
      suppressed.push({
        targetDay: d, state: 'suppressed',
        boardsSourceDay: cur.boardsSourceDay || null,
        path: `strategy-data/snapshots/${d}.json`,
        reason: cur.boardsUnavailableReason || 'writer-suppressed-no-board-facts',
      });
    }
  }

  // 第二遍:对未被显式抑制的文件做前日指标比较(检测旧写入器留下的真跨日复制值)
  for (let i = 1; i < days.length; i++) {
    const prevDay = days[i - 1];
    const curDay = days[i];
    if (suppressedDays.has(curDay)) continue;
    const curEntry = parsed.get(curDay);
    const prevEntry = parsed.get(prevDay);
    if (!curEntry || !prevEntry) continue;
    const curM = boardMetrics(curEntry.json);
    const prevM = boardMetrics(prevEntry.json);
    const commonKeys = [...curM.keys()].filter(k => prevM.has(k) && meaningful(curM.get(k)) && meaningful(prevM.get(k)));
    if (!commonKeys.length) { inspected.push({ curDay, prevDay, compared: 0, equal: 0 }); continue; }
    const equal = commonKeys.filter(k => sameBoard(curM.get(k), prevM.get(k))).length;
    const ratio = equal / commonKeys.length;
    inspected.push({ curDay, prevDay, compared: commonKeys.length, equal, ratio: Number(ratio.toFixed(3)) });
    if (equal >= minEqualBoards && ratio >= minRatio) {
      suspected.push({
        targetDay: curDay, state: 'contaminated',
        observedSourceDay: prevDay,
        observedSha256: crypto.createHash('sha256').update(curEntry.raw).digest('hex'),
        path: `strategy-data/snapshots/${curDay}.json`,
        reason: `board-metrics-identical-to-prev-day (${equal}/${commonKeys.length} boards)`,
        equalBoards: equal, comparedBoards: commonKeys.length,
      });
    }
  }
  return { snapshotDir, dayCount: days.length, minEqualBoards, minRatio, suspected, suppressed, inspected };
}

// 把扫描报告转成 data-quality 判别联合清单条目(CLI 与测试共用,保证 emit 路径一致)
function manifestEntriesFromReport(report) {
  return [
    ...(report.suspected || []).map(({ equalBoards, comparedBoards, ...e }) => e),
    ...(report.suppressed || []).map(s => ({
      expectedPath: s.path, state: 'missing', targetDay: s.targetDay,
      reason: s.reason, sha256: null,
    })),
  ];
}

module.exports = { scanBoardSnapshotContamination, manifestEntriesFromReport };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : undefined; };
  const emit = args.includes('--emit-manifest');
  scanBoardSnapshotContamination({
    snapshotDir: opt('dir'),
    minEqualBoards: opt('min') !== undefined ? Number(opt('min')) : undefined,
    minRatio: opt('ratio') !== undefined ? Number(opt('ratio')) : undefined,
  }).then(report => {
    if (emit) {
      // 判别联合:contaminated(文件含跨日复制值,带 observedSha256/observedSourceDay);
      // suppressed → missing 形状(文件已抑制、本日板块事实不可用,expectedPath + sha256:null),
      // 使现有 loadStrategySnapshotForDailyEvents 直接判为不可用,而不是只在控制台展示。
      console.log(JSON.stringify({ entries: manifestEntriesFromReport(report) }, null, 2));
    } else {
      console.log(`扫描 ${report.dayCount} 天,阈值 equal>=${report.minEqualBoards} 且 ratio>=${report.minRatio}`);
      console.log(`可疑跨日污染日(contaminated):${report.suspected.length}`);
      for (const s of report.suspected) console.log(`  ${s.targetDay} <- ${s.observedSourceDay}  ${s.reason}`);
      console.log(`已抑制/本日事实缺失(suppressed,非污染):${report.suppressed.length}`);
      for (const s of report.suppressed) console.log(`  ${s.targetDay}  ${s.reason}`);
    }
  }).catch(err => { console.error(err); process.exitCode = 1; });
}
