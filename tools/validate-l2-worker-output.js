#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { DEFAULT_THRESHOLDS } = require('../local-l2-task-queue');

const AMOUNT_FIELDS = ['activeBuy', 'activeSell', 'passiveBuy', 'passiveSell'];
const COUNT_FIELDS = AMOUNT_FIELDS.map((field) => `${field}Count`);
const PRICE_FIELDS = ['price', 'close', 'lastPrice'];

function issue(pathName, message) {
  return { path: pathName, message };
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function unwrapJob(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value.job && typeof value.job === 'object' ? value.job : value;
}

function unwrapResults(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.job?.results)) return value.job.results;
  return null;
}

function validateThresholdBucket(bucket, bucketPath, errors, warnings) {
  if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) {
    errors.push(issue(bucketPath, '档位必须是对象，真实无大单时也要传四项金额为 0'));
    return;
  }
  for (const field of AMOUNT_FIELDS) {
    const value = bucket[field];
    if (!isFiniteNumber(value) || value < 0) {
      errors.push(issue(`${bucketPath}.${field}`, '必须是大于等于 0 的 JSON 数字，不能缺失、传空值或数字字符串'));
    }
  }

  const presentCounts = COUNT_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(bucket, field));
  if (presentCounts.length && presentCounts.length !== COUNT_FIELDS.length) {
    errors.push(issue(bucketPath, '若回传委托笔数，四个 Count 字段必须同时存在'));
  } else if (presentCounts.length === COUNT_FIELDS.length) {
    for (const field of COUNT_FIELDS) {
      if (!Number.isInteger(bucket[field]) || bucket[field] < 0) {
        errors.push(issue(`${bucketPath}.${field}`, '委托笔数必须是大于等于 0 的整数'));
      }
    }
  } else {
    warnings.push(issue(bucketPath, '建议回传四个 Count 字段，便于核对档位聚合质量'));
  }
}

function validateMonotonicThresholds(thresholds, rowPath, errors) {
  for (const field of [...AMOUNT_FIELDS, ...COUNT_FIELDS]) {
    const values = DEFAULT_THRESHOLDS.map((threshold) => thresholds?.[String(threshold)]?.[field]);
    if (values.some((value) => value === undefined)) continue;
    for (let index = 1; index < values.length; index += 1) {
      if (Number(values[index]) > Number(values[index - 1])) {
        errors.push(issue(
          `${rowPath}.thresholds.${DEFAULT_THRESHOLDS[index]}.${field}`,
          `${field} 随档位升高不能增加；请检查金额单位、委托聚合或重复累计`,
        ));
      }
    }
  }
}

function validateResultRow(row, index) {
  const errors = [];
  const warnings = [];
  const rowPath = `results[${index}]`;
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return { errors: [issue(rowPath, '结果行必须是对象')], warnings };
  }

  if (!/^\d{6}$/.test(String(row.code || ''))) {
    errors.push(issue(`${rowPath}.code`, '必须是六位 A 股代码，不带交易所后缀'));
  }
  if (typeof row.name !== 'string' || !row.name.trim()) {
    errors.push(issue(`${rowPath}.name`, '必须保留任务下发的股票名称'));
  }
  if (!isFiniteNumber(row.gainPct)) {
    errors.push(issue(`${rowPath}.gainPct`, '必须保留任务下发的实时涨幅 JSON 数字'));
  }
  if (!Number.isInteger(row.rank) || row.rank < 1) {
    errors.push(issue(`${rowPath}.rank`, '必须保留任务下发的正整数顺序'));
  }
  if (!Number.isInteger(row.batch) || row.batch < 1) {
    errors.push(issue(`${rowPath}.batch`, '必须保留任务下发的正整数批次'));
  }

  const priceField = PRICE_FIELDS.find((field) => isFiniteNumber(row[field]) && row[field] > 0);
  if (!priceField) {
    errors.push(issue(`${rowPath}.price`, '必须回传以人民币元计的正数现价，推荐字段 price'));
  } else if (row[priceField] > 5000) {
    errors.push(issue(`${rowPath}.${priceField}`, '现价异常偏大，疑似把万分之一元的原始值直接回传'));
  }

  if (!row.thresholds || typeof row.thresholds !== 'object' || Array.isArray(row.thresholds)) {
    errors.push(issue(`${rowPath}.thresholds`, '必须回传五档 thresholds 对象'));
  } else {
    for (const threshold of DEFAULT_THRESHOLDS) {
      validateThresholdBucket(row.thresholds[String(threshold)], `${rowPath}.thresholds.${threshold}`, errors, warnings);
    }
    validateMonotonicThresholds(row.thresholds, rowPath, errors);
  }

  const base = row.thresholds?.[String(DEFAULT_THRESHOLDS[0])];
  if (base) {
    for (const field of AMOUNT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(row, field) && row[field] !== base[field]) {
        errors.push(issue(`${rowPath}.${field}`, `顶层兼容字段必须等于 50 万档 ${field}`));
      }
    }
    if (Object.prototype.hasOwnProperty.call(row, 'netActive') && row.netActive !== base.activeBuy - base.activeSell) {
      errors.push(issue(`${rowPath}.netActive`, '必须等于 50 万档 activeBuy - activeSell'));
    }
  }

  return { errors, warnings };
}

function validateAgainstClaim(rows, update, claimInput, errors, warnings) {
  const job = unwrapJob(claimInput);
  if (!job) {
    warnings.push(issue('claim', '未提供领取任务文件，无法核对股票覆盖和优先顺序'));
    return;
  }

  if (String(update?.jobId || '') !== String(job.jobId || '')) {
    errors.push(issue('jobId', '与领取任务的 jobId 不一致'));
  }
  const expectedThresholds = JSON.stringify(DEFAULT_THRESHOLDS);
  if (JSON.stringify(job.thresholds || []) !== expectedThresholds) {
    errors.push(issue('claim.thresholds', `云端任务档位必须是 ${expectedThresholds}`));
  }

  const stocks = Array.isArray(job.stocks) ? job.stocks : [];
  const expectedCodes = stocks.map((stock) => String(stock?.code || ''));
  const resultCodes = rows.map((row) => String(row?.code || ''));
  const expectedSet = new Set(expectedCodes);
  const seen = new Set();
  for (const code of resultCodes) {
    if (!expectedSet.has(code)) errors.push(issue('results', `包含任务外股票 ${code || '(empty)'}`));
    if (seen.has(code)) errors.push(issue('results', `股票 ${code || '(empty)'} 重复出现`));
    seen.add(code);
  }

  const expectedPrefix = expectedCodes.slice(0, resultCodes.length);
  if (JSON.stringify(resultCodes) !== JSON.stringify(expectedPrefix)) {
    errors.push(issue('results', '结果必须保持领取任务 stocks 的顺序；priorityCodes 已由云端排在前面'));
  }

  rows.forEach((row, index) => {
    const stock = stocks[index];
    if (!stock || String(row?.code || '') !== String(stock.code || '')) return;
    for (const field of ['name', 'gainPct', 'rank', 'batch']) {
      if (row[field] !== stock[field]) {
        errors.push(issue(`results[${index}].${field}`, `必须原样保留领取任务中的 ${field}`));
      }
    }
  });

  const priorities = Array.isArray(job.priorityCodes) ? job.priorityCodes.map(String) : [];
  if (priorities.length) {
    const prefix = expectedCodes.slice(0, priorities.length);
    if (JSON.stringify(prefix) !== JSON.stringify(priorities)) {
      errors.push(issue('claim.priorityCodes', '领取任务本身未把优先股票放在 stocks 前部'));
    }
  }

  if (update?.status === 'done' && resultCodes.length !== expectedCodes.length) {
    errors.push(issue('results', `done 状态必须覆盖全部 ${expectedCodes.length} 只股票，当前 ${resultCodes.length} 只`));
  }
}

function validateWorkerOutput(input, options = {}) {
  const errors = [];
  const warnings = [];
  const update = Array.isArray(input) ? {} : (input || {});
  const errorPayload = !Array.isArray(input) && update.status === 'error';
  let rows = unwrapResults(input);

  if (!rows && errorPayload) rows = [];
  if (!rows) {
    errors.push(issue('results', '找不到结果数组；请传 worker 的 result 请求体或结果数组'));
    return { ok: false, errors, warnings, metrics: { resultRows: 0, rowsWithPrice: 0, rowsWithAllBuckets: 0 } };
  }

  if (!Array.isArray(input)) {
    if (!String(update.jobId || '').trim()) errors.push(issue('jobId', '结果请求必须带 jobId'));
    if (!String(update.version || '').trim()) errors.push(issue('version', '必须回传非空 workerVersion，例如 company-l2-worker/2.0.0'));
    if (!['running', 'done', 'error'].includes(String(update.status || ''))) {
      errors.push(issue('status', '必须是 running、done 或 error'));
    }
    if (errorPayload) {
      if (!String(update.error || update.note || '').trim()) {
        errors.push(issue('error', 'error 状态必须带不含凭据的诊断信息'));
      }
      if (rows.length) {
        errors.push(issue('results', 'error 状态不得用伪造的零值结果掩盖下载或解析失败'));
      }
      if (update.scanned !== undefined && (!Number.isInteger(update.scanned) || update.scanned < 0)) {
        errors.push(issue('scanned', '若 error 状态回传 scanned，必须是大于等于 0 的整数'));
      }
    } else {
      if (!Number.isInteger(update.scanned) || update.scanned < 0) {
        errors.push(issue('scanned', '必须是大于等于 0 的整数'));
      }
      if (update.scanned !== rows.length) {
        errors.push(issue('scanned', '必须等于本次累计 results 的行数；云端会整批替换而不是增量合并'));
      }
    }
  } else {
    warnings.push(issue('payload', '只校验了结果数组，未校验 jobId、version、status 和 scanned'));
  }

  rows.forEach((row, index) => {
    const rowReport = validateResultRow(row, index);
    errors.push(...rowReport.errors);
    warnings.push(...rowReport.warnings);
  });
  validateAgainstClaim(rows, update, options.claim, errors, warnings);

  const rowsWithPrice = rows.filter((row) => PRICE_FIELDS.some((field) => isFiniteNumber(row?.[field]) && row[field] > 0)).length;
  const rowsWithAllBuckets = rows.filter((row) => DEFAULT_THRESHOLDS.every((threshold) => {
    const bucket = row?.thresholds?.[String(threshold)];
    return bucket && AMOUNT_FIELDS.every((field) => isFiniteNumber(bucket[field]) && bucket[field] >= 0);
  })).length;

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    metrics: {
      resultRows: rows.length,
      rowsWithPrice,
      rowsWithAllBuckets,
    },
  };
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || '' : '';
}

function readJson(filePath) {
  const text = filePath === '-'
    ? fs.readFileSync(0, 'utf8')
    : fs.readFileSync(path.resolve(filePath), 'utf8');
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath || inputPath.startsWith('--')) {
    throw new Error('Usage: node tools/validate-l2-worker-output.js <result.json|-> [--job claim.json]');
  }
  const claimPath = argValue('--job');
  const report = validateWorkerOutput(readJson(inputPath), {
    claim: claimPath ? readJson(claimPath) : null,
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ ok: false, error: error.message }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  AMOUNT_FIELDS,
  COUNT_FIELDS,
  PRICE_FIELDS,
  validateWorkerOutput,
};
