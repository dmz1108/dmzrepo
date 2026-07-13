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
  const inspected = [];
  for (let i = 1; i < days.length; i++) {
    const prevDay = days[i - 1];
    const curDay = days[i];
    const curFile = path.join(snapshotDir, `${curDay}.json`);
    let curRaw, prevRaw;
    try { curRaw = fs.readFileSync(curFile, 'utf8'); prevRaw = fs.readFileSync(path.join(snapshotDir, `${prevDay}.json`), 'utf8'); }
    catch { continue; }
    let cur, prev;
    try { cur = JSON.parse(curRaw); prev = JSON.parse(prevRaw); } catch { continue; }

    // 若快照已带 boardsStale/boardsSourceDay(新写入器产物),优先信任显式来源日
    if (cur && cur.boardsStale === true) {
      suspected.push({
        targetDay: curDay, state: 'contaminated',
        observedSourceDay: cur.boardsSourceDay || prevDay,
        observedSha256: crypto.createHash('sha256').update(curRaw).digest('hex'),
        path: `strategy-data/snapshots/${curDay}.json`,
        reason: 'writer-flagged-cross-day-fallback', equalBoards: null, comparedBoards: null,
      });
      continue;
    }

    const curM = boardMetrics(cur);
    const prevM = boardMetrics(prev);
    const commonKeys = [...curM.keys()].filter(k => prevM.has(k) && meaningful(curM.get(k)) && meaningful(prevM.get(k)));
    if (!commonKeys.length) { inspected.push({ curDay, prevDay, compared: 0, equal: 0 }); continue; }
    const equal = commonKeys.filter(k => sameBoard(curM.get(k), prevM.get(k))).length;
    const ratio = equal / commonKeys.length;
    inspected.push({ curDay, prevDay, compared: commonKeys.length, equal, ratio: Number(ratio.toFixed(3)) });
    if (equal >= minEqualBoards && ratio >= minRatio) {
      suspected.push({
        targetDay: curDay, state: 'contaminated',
        observedSourceDay: prevDay,
        observedSha256: crypto.createHash('sha256').update(curRaw).digest('hex'),
        path: `strategy-data/snapshots/${curDay}.json`,
        reason: `board-metrics-identical-to-prev-day (${equal}/${commonKeys.length} boards)`,
        equalBoards: equal, comparedBoards: commonKeys.length,
      });
    }
  }
  return { snapshotDir, dayCount: days.length, minEqualBoards, minRatio, suspected, inspected };
}

module.exports = { scanBoardSnapshotContamination };

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
      console.log(JSON.stringify({ entries: report.suspected.map(({ equalBoards, comparedBoards, ...e }) => e) }, null, 2));
    } else {
      console.log(`扫描 ${report.dayCount} 天,阈值 equal>=${report.minEqualBoards} 且 ratio>=${report.minRatio}`);
      console.log(`可疑跨日污染日:${report.suspected.length}`);
      for (const s of report.suspected) console.log(`  ${s.targetDay} <- ${s.observedSourceDay}  ${s.reason}`);
    }
  }).catch(err => { console.error(err); process.exitCode = 1; });
}
