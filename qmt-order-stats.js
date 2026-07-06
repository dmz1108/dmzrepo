'use strict';

const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_QMT_PYTHON = 'C:\\PandaDashboard\\tools\\qmt-python36\\python.exe';
const DEFAULT_TIMEOUT_MS = 120000;

function normalizeCode(code) {
  const s = String(code || '').trim().toUpperCase();
  if (!s) return '';
  if (s.includes('.')) return s;
  return /^[69]/.test(s) ? `${s}.SH` : `${s}.SZ`;
}

function runProcess(file, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { windowsHide: true, ...opts });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`QMT统计超时(${opts.timeoutMs || DEFAULT_TIMEOUT_MS}ms)`));
    }, opts.timeoutMs || DEFAULT_TIMEOUT_MS);
    child.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
    child.stderr.on('data', (d) => { stderr += d.toString('utf8'); });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `QMT统计进程退出: ${code}`));
    });
  });
}

async function getQmtOrderStatsBulk(stocks, day, minAmount, options = {}) {
  const python = options.python || process.env.QMT_XTQUANT_PYTHON || DEFAULT_QMT_PYTHON;
  const script = options.script || path.join(__dirname, 'tools', 'qmt_order_stats.py');
  if (!fsSync.existsSync(python)) {
    throw new Error(`迅投 L1 统计未配置：找不到 ${python}`);
  }
  if (!fsSync.existsSync(script)) {
    throw new Error(`迅投 L1 统计脚本不存在：${script}`);
  }

  const codes = [...new Set((Array.isArray(stocks) ? stocks : [])
    .map((s) => normalizeCode(s && (s.code || s.stockCode || s)))
    .filter(Boolean))];
  if (!codes.length) return { meta: { source: 'none', note: '板块没有成分股' }, stats: new Map() };

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'panda-qmt-'));
  const inputPath = path.join(tempDir, 'input.json');
  const outputPath = path.join(tempDir, 'output.json');
  await fs.writeFile(inputPath, JSON.stringify({ codes, day, minAmount }), 'utf8');

  try {
    await runProcess(python, [script, inputPath, outputPath], { timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS });
    const raw = JSON.parse(await fs.readFile(outputPath, 'utf8'));
    if (!raw || raw.ok === false) throw new Error(raw && raw.error ? raw.error : '迅投统计失败');
    const stats = new Map();
    for (const [code, value] of Object.entries(raw.stats || {})) {
      stats.set(code, value);
      const shortCode = code.split('.')[0];
      stats.set(shortCode, value);
    }
    return { meta: raw.meta || null, stats };
  } finally {
    fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = { getQmtOrderStatsBulk };
