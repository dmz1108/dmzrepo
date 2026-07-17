'use strict';

const fs = require('fs/promises');
const path = require('path');
const {
  createBoardFundFlowStore,
  reconstructEastmoneyBoardFundFlowDay,
} = require('../strategy-realtime-data');

function option(args, name) {
  const prefix = `--${name}=`;
  const found = args.find(arg => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : '';
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function normalizeBoards(payload) {
  const rows = Array.isArray(payload) ? payload
    : (Array.isArray(payload?.boards) ? payload.boards : []);
  const byId = new Map();
  for (const row of rows) {
    const plateId = String(row?.plateId || row?.code || '').trim().toUpperCase();
    const name = String(row?.name || row?.plateName || '').trim();
    if (!/^BK\d+$/.test(plateId) || !name) continue;
    byId.set(plateId, { plateId, name });
  }
  return [...byId.values()].sort((a, b) => a.plateId.localeCompare(b.plateId));
}

async function loadBoards(rootDir, day, inputFile) {
  if (inputFile) return normalizeBoards(await readJson(path.resolve(inputFile)));
  const candidates = [
    path.join(rootDir, 'kpl-snapshots', '6', `${day}.json`),
    path.join(rootDir, 'eastmoney-concepts-db', 'catalog.json'),
  ];
  for (const file of candidates) {
    try {
      const boards = normalizeBoards(await readJson(file));
      if (boards.length) return boards;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return [];
}

async function main() {
  const args = process.argv.slice(2);
  const day = option(args, 'day');
  const source = (option(args, 'source') || 'eastmoney').toLowerCase();
  const rootDir = path.resolve(option(args, 'root') || path.join(__dirname, '..'));
  const inputFile = option(args, 'input');
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(day)) throw new Error('usage: --day=YYYY-MM-DD [--source=eastmoney]');
  if (source !== 'eastmoney') {
    throw new Error('historical reconstruction is currently verified only for Eastmoney; THS/KPL must remain null');
  }
  const boards = await loadBoards(rootDir, day, inputFile);
  if (!boards.length) throw new Error('no Eastmoney board metadata found; pass --input=/path/to/boards.json');
  const store = createBoardFundFlowStore({
    rootDir: path.join(rootDir, 'strategy-data', 'board-fund-flow'),
    reconstructedRootDir: path.join(rootDir, 'strategy-data', 'board-fund-flow-reconstructed'),
  });
  const result = await reconstructEastmoneyBoardFundFlowDay({
    day,
    boards,
    store,
    concurrency: Math.max(1, Math.min(8, Number(option(args, 'concurrency') || 4))),
    force: args.includes('--force'),
    scope: inputFile ? 'selected-boards' : 'available-board-catalog',
  });
  const safe = {
    ok: true,
    day,
    source,
    written: result.written,
    reason: result.reason,
    requestedBoardCount: result.requestedBoardCount,
    reconstructedBoardCount: result.reconstructedBoardCount,
    errorCount: result.errorCount,
    complete: !!result.payload?.complete,
    contentHash: result.payload?.contentHash || null,
    factHash: result.payload?.factHash || null,
  };
  console.log(JSON.stringify(safe, null, 2));
  if (!safe.complete) process.exitCode = 2;
}

if (require.main === module) {
  main().catch(error => {
    console.error(error?.message || String(error));
    process.exitCode = 1;
  });
}

module.exports = { loadBoards, normalizeBoards };
