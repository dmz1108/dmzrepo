const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const match = src.match(new RegExp(`(?:async )?function ${name}\\(`));
  if (!match) throw new Error(`not found: ${name}`);
  const bodyStart = src.indexOf('{', src.indexOf(')', match.index));
  let depth = 0;
  let end = bodyStart;
  for (; end < src.length; end += 1) {
    if (src[end] === '{') depth += 1;
    else if (src[end] === '}' && --depth === 0) break;
  }
  return src.slice(match.index, end + 1);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
}

const numOrNull = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const chinaNowParts = () => ({ day: '2026-07-15' });
let thsConceptBoardsRealtimeCache = null;
let thsConceptBoardsRealtimeTask = null;
let thsConceptBoardsRealtimeState = {};
eval(extractFn('thsConceptBoardsCacheMetadata'));

const now = 1_000_000;
thsConceptBoardsRealtimeCache = {
  day: '2026-07-15',
  fetchedAt: '2026-07-15T01:00:00.000Z',
  fetchedAtMs: now - 10_000,
  expiresAt: now + 50_000,
  staleUntil: now + 290_000,
  boards: [{ plateId: '301558', name: 'test' }],
};
assert(thsConceptBoardsCacheMetadata(now, '2026-07-15').cacheState === 'fresh', 'same-day fresh cache is reusable');

thsConceptBoardsRealtimeCache.expiresAt = now - 1;
assert(thsConceptBoardsCacheMetadata(now, '2026-07-15').cacheState === 'stale', 'same-day stale cache remains available during background refresh');

assert(thsConceptBoardsCacheMetadata(now, '2026-07-16').cacheState === 'previous-day', 'previous-day realtime data is never presented as today');

thsConceptBoardsRealtimeCache.day = '2026-07-15';
thsConceptBoardsRealtimeCache.marketFinal = true;
thsConceptBoardsRealtimeCache.staleUntil = now - 1;
assert(thsConceptBoardsCacheMetadata(now, '2026-07-15').cacheState === 'fresh', 'after-close final cache stays fresh for the rest of the day');

const refreshSource = extractFn('startThsConceptBoardsRefresh');
const fetchSource = extractFn('fetchThsConceptBoards');
const freshSource = extractFn('fetchThsConceptBoardsFresh');
const warmSource = extractFn('thsConceptBoardsKeepWarmTick');

assert(refreshSource.includes('if (thsConceptBoardsRealtimeTask) return thsConceptBoardsRealtimeTask'), 'concurrent refreshes share one in-flight task');
assert(refreshSource.includes('expiresAt: completedAtMs + THS_CONCEPT_BOARDS_FRESH_MS'), 'fresh TTL starts after the slow upstream fetch completes');
assert(fetchSource.includes("if (meta.cacheState === 'stale')")
  && fetchSource.includes('startThsConceptBoardsRefresh(options).catch(() => {})')
  && fetchSource.includes('return thsConceptBoardsRealtimeCache.boards'), 'stale-while-revalidate returns immediately and refreshes in background');
assert(freshSource.includes('THS_CONCEPT_PAGE_CONCURRENCY'), 'THS page fetch concurrency is centrally bounded');
assert(src.includes("Math.min(4, Number(process.env.THS_CONCEPT_PAGE_CONCURRENCY) || 4)"),
  'THS upstream concurrency never exceeds the previously stable four requests');
assert(freshSource.includes('const firstFailures = pageResults.filter')
  && freshSource.includes('mapLimit(firstFailures.map(result => result.page), 1')
  && freshSource.includes('thsCookieCache = null'),
  'empty anti-bot pages retry serially with a refreshed cookie');
assert(freshSource.includes('THS realtime catalog incomplete'), 'partial multi-page responses fail quality validation instead of poisoning the cache');
assert(freshSource.includes('if (options.includeDiscovery)'), 'slow navigation/detail discovery is excluded from ordinary realtime refreshes');
assert(freshSource.includes('const persistedCatalog = await readThsConceptCatalog()')
  && freshSource.includes('byId.set(String(board.plateId), publicThsConceptBoard(board, board))'),
  'fast refresh preserves catalog-only boards without inventing realtime metrics');
assert(warmSource.includes("['集合竞价', '早盘', '上午盘', '午后', '尾盘']"), 'background prewarm covers market sessions');
assert(src.includes("fetchThsConceptBoards({ force: true, includeDiscovery: true })"), 'formal THS sync still waits for a complete fresh discovery pass');
assert(src.includes("fetchThsConceptBoards({ background: true })"), 'strategy catalog never blocks on a cold THS refresh');
assert((src.match(/fetchThsConceptBoards\(\{ background: true \}\)/g) || []).length >= 3,
  'catalog, realtime ranking, and strategy all avoid blocking on cold THS refreshes');
assert(src.includes('startThsConceptBoardsKeepWarm();'), 'server startup enables THS prewarming');

function createFetchHarness(meta, cache, refreshBoards = [{ plateId: 'fresh' }]) {
  const deps = {
    cache,
    meta,
    refreshCalls: 0,
    loadCalls: 0,
    async load() { this.loadCalls += 1; },
    refresh() {
      this.refreshCalls += 1;
      return Promise.resolve(refreshBoards);
    },
  };
  const factory = new Function('deps', `
    let thsConceptBoardsRealtimeCache = deps.cache;
    const loadThsConceptBoardsRealtimeCache = () => deps.load();
    const thsConceptBoardsCacheMetadata = () => deps.meta;
    const startThsConceptBoardsRefresh = options => deps.refresh(options);
    return (${fetchSource});
  `);
  return { deps, fetchBoards: factory(deps) };
}

async function runAsyncChecks() {
  const stale = createFetchHarness(
    { cacheState: 'stale' },
    { boards: [{ plateId: 'cached' }] },
  );
  const staleBoards = await stale.fetchBoards();
  assert(staleBoards[0].plateId === 'cached' && stale.deps.refreshCalls === 1,
    'stale request returns cached boards without awaiting the refresh result');

  const background = createFetchHarness({ cacheState: 'empty' }, null);
  const backgroundBoards = await background.fetchBoards({ background: true });
  assert(backgroundBoards.length === 0 && background.deps.refreshCalls === 1,
    'cold strategy helper starts one refresh and returns an immediate empty fallback');

  const blocking = createFetchHarness({ cacheState: 'empty' }, null);
  const blockingBoards = await blocking.fetchBoards();
  assert(blockingBoards[0].plateId === 'fresh' && blocking.deps.refreshCalls === 1,
    'cold realtime request waits for the first complete refresh when no safe cache exists');

  console.log(process.exitCode ? 'SOME THS PERFORMANCE CHECKS FAILED' : 'ALL THS PERFORMANCE CHECKS PASSED');
}

runAsyncChecks().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
