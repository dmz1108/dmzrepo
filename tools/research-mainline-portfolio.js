#!/usr/bin/env node
// Offline research only. Archived selections are not point-in-time execution evidence.
const fs = require('node:fs');
const crypto = require('node:crypto');

const DEFAULTS = Object.freeze({
  initialCash: 100000, stockWeight: 0.20, grossWeight: 0.60, familyWeight: 0.40,
  maxPositions: 3, entryPremium: 0.03, stopLoss: 0.06,
  pauseDailyLoss: 0.02, pauseDrawdown: 0.06,
  commissionRate: 0.0003, minimumCommission: 5, sellTaxRate: 0.0005,
  frictionBpsPerSide: 10,
});

const validBar = bar => bar && ['open', 'close', 'high', 'low'].every(key => Number.isFinite(bar[key]) && bar[key] > 0)
  && bar.high >= Math.max(bar.open, bar.close) && bar.low <= Math.min(bar.open, bar.close);
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const floorPrice = value => Math.floor((value + 1e-9) * 100) / 100;
const sum = values => values.reduce((a, b) => a + b, 0);

function costs(notional, side, options) {
  const commission = round(Math.max(options.minimumCommission, notional * options.commissionRate));
  const tax = side === 'sell' ? round(notional * options.sellTaxRate) : 0;
  const friction = round(notional * options.frictionBpsPerSide / 10000);
  return { commission, tax, friction, total: round(commission + tax + friction) };
}

function quantityForBudget(code, budget, limit, options) {
  const star = /^68/.test(code), increment = star ? 1 : 100, minimum = star ? 200 : 100;
  let quantity = Math.floor(budget / (limit * (1 + options.commissionRate + options.frictionBpsPerSide / 10000)) / increment) * increment;
  while (quantity >= minimum && quantity * limit + costs(quantity * limit, 'buy', options).total > budget + 1e-8) quantity -= increment;
  return quantity >= minimum ? quantity : 0;
}

function prepareInputs(history, adjusted) {
  if (!history.rows?.length || history.errors?.length) throw Error('Incomplete raw price capture');
  if (history.rows.some(row => row.adjustment !== 'unadjusted')) throw Error('Cash simulation requires unadjusted prices');
  const index = history.rows.find(row => row.symbol === 'sh000001');
  const calendar = index?.bars.map(bar => bar.day);
  if (!calendar?.length || new Set(calendar).size !== calendar.length || calendar.some((d, i) => i > 0 && d <= calendar[i - 1])) throw Error('Invalid calendar');
  const stocks = history.rows.filter(row => row.symbol !== 'sh000001');
  if (new Set(stocks.map(row => row.code)).size !== stocks.length) throw Error('Duplicate stock series');
  const series = rows => new Map(rows.map(row => {
    if (new Set(row.bars.map(bar => bar.day)).size !== row.bars.length) throw Error('Duplicate bar date');
    return [row.code, new Map(row.bars.map(bar => [bar.day, bar]))];
  }));
  return { calendar, index: new Map(index.bars.map(bar => [bar.day, bar])),
    byCode: series(stocks), adjusted: series((adjusted?.rows || []).filter(row => row.symbol !== 'sh000001')) };
}

function simulate(signals, history, config, adjusted) {
  const options = { ...DEFAULTS, ...config };
  for (const key of Object.keys(DEFAULTS)) if (!Number.isFinite(options[key])) throw Error('Invalid option: ' + key);
  if (options.initialCash <= 0 || options.maxPositions < 1 || !Number.isInteger(options.maxPositions)
    || ['stockWeight', 'grossWeight', 'familyWeight', 'stopLoss', 'pauseDailyLoss', 'pauseDrawdown'].some(key => options[key] <= 0 || options[key] > 1)
    || ['entryPremium', 'commissionRate', 'minimumCommission', 'sellTaxRate', 'frictionBpsPerSide'].some(key => options[key] < 0)) throw Error('Invalid simulation limits');
  const inputs = prepareInputs(history, adjusted), { calendar, byCode } = inputs;
  if (!calendar.includes(options.startDay) || !calendar.includes(options.endDay) || options.startDay >= options.endDay
    || !calendar.includes(options.signalEndDay) || options.signalEndDay < options.startDay || options.signalEndDay > options.endDay) throw Error('Invalid simulation dates');
  const keys = signals.map(signal => `${signal.day}:${signal.code}`);
  if (new Set(keys).size !== keys.length) throw Error('Duplicate signal');
  for (const signal of signals) {
    if (!/^\d{6}$/.test(signal.code) || !/^(00|30|60|68)/.test(signal.code) || !calendar.includes(signal.day)
      || !Number.isFinite(signal.leadScore) || ![1, 2].includes(signal.leaderRank)
      || !(signal.families || [signal.family]).every(family => typeof family === 'string' && family.length > 0)) throw Error('Invalid signal contract');
  }
  const activeDays = calendar.filter(day => day >= options.startDay && day <= options.endDay);
  const positions = new Map(), orders = [], trades = [], skipped = [], issues = [], equity = [];
  let cash = options.initialCash, previousNav = cash, peak = cash, paused = null, nextOrders = [];
  const note = (day, signal, reason) => skipped.push({ day, signalDay: signal.day, code: signal.code, reason });
  const markValue = () => sum([...positions.values()].map(position => position.shares * position.lastClose));
  const limitHint = code => /^(30|68)/.test(code) ? 19.5 : 9.5;

  function closePosition(position, day, field, reason, previousDay) {
    const bar = byCode.get(position.code)?.get(day), previous = byCode.get(position.code)?.get(previousDay);
    if (!validBar(bar) || !validBar(previous)) {
      issues.push({ day, code: position.code, reason: 'exit-price-unavailable' }); return false;
    }
    if ((bar[field] / previous.close - 1) * 100 <= -limitHint(position.code)) {
      orders.push({ day, code: position.code, action: 'sell-deferred', field, reason: 'near-lower-limit-queue-unverified' });
      return false;
    }
    const notional = round(position.shares * bar[field]), fee = costs(notional, 'sell', options);
    cash = round(cash + notional - fee.total);
    trades.push({ signalDay: position.signal.day, code: position.code, name: position.signal.name,
      families: position.families, leaderRank: position.signal.leaderRank, leadScore: position.signal.leadScore,
      entryDay: position.entryDay, exitDay: day, entry: position.entry, exit: bar[field], exitField: field,
      shares: position.shares, entryNotional: position.entryNotional, exitNotional: notional,
      entryCosts: position.fee, exitCosts: fee, reason,
      netPnl: round(notional - position.entryNotional - position.fee.total - fee.total),
      netPct: (notional - fee.total) / (position.entryNotional + position.fee.total) * 100 - 100 });
    positions.delete(position.code); return true;
  }

  function auditAdjustment(position, day, previousDay) {
    const bar = byCode.get(position.code)?.get(day), previous = byCode.get(position.code)?.get(previousDay);
    const a = inputs.adjusted.get(position.code)?.get(day), p = inputs.adjusted.get(position.code)?.get(previousDay);
    if (validBar(bar) && validBar(previous) && validBar(a) && validBar(p)
      && Math.abs((a.close / bar.close) / (p.close / previous.close) - 1) > 0.002) {
      issues.push({ day, code: position.code, reason: 'possible-corporate-action-unmodeled' });
    }
  }

  for (const day of activeDays) {
    const i = calendar.indexOf(day), previousDay = calendar[i - 1];
    for (const position of positions.values()) auditAdjustment(position, day, previousDay);
    // Orders were sized at the preceding close; opening sale proceeds cannot enlarge them.
    for (const position of [...positions.values()]) {
      if ((position.stopRequested || position.deferred) && i > position.entryIndex) {
        const reason = position.stopRequested ? 'previous-close-stop' : 'retry-deferred-exit';
        if (!closePosition(position, day, 'open', reason, previousDay)) position.deferred = true;
      }
    }
    for (const order of nextOrders) {
      if (paused) { note(day, order.signal, 'paused'); continue; }
      const bar = byCode.get(order.signal.code)?.get(day);
      if (!bar || !Number.isFinite(bar.open) || bar.open <= 0) {
        note(day, order.signal, 'opening-data-unavailable');
        issues.push({ day, code: order.signal.code, reason: 'opening-data-unavailable' }); continue;
      }
      if (bar.open > order.limit + 1e-8) { note(day, order.signal, 'auction-open-above-limit'); continue; }
      const notional = round(order.shares * bar.open), fee = costs(notional, 'buy', options);
      if (cash + 1e-8 < notional + fee.total) throw Error('Reservation failed: insufficient cash');
      cash = round(cash - notional - fee.total);
      positions.set(order.signal.code, { ...order, code: order.signal.code, entry: bar.open,
        entryDay: day, entryIndex: i, exitIndex: i + 1, entryNotional: notional,
        lastClose: bar.open, fee, deferred: false, stopRequested: false });
      orders.push({ day, code: order.signal.code, action: 'modeled-buy', shares: order.shares,
        price: bar.open, limit: order.limit, priceInformation: 'limit and quantity fixed at preceding close; fill is assumed' });
      auditAdjustment(positions.get(order.signal.code), day, previousDay);
    }
    nextOrders = [];
    for (const position of positions.values()) {
      const bar = byCode.get(position.code)?.get(day);
      if (!validBar(bar)) { issues.push({ day, code: position.code, reason: 'stale-position-valuation' }); continue; }
      position.lastClose = bar.close;
      if (i >= position.exitIndex && !closePosition(position, day, 'close', 'time-exit', previousDay)) position.deferred = true;
    }
    for (const position of positions.values()) {
      const bar = byCode.get(position.code)?.get(day);
      if (validBar(bar) && bar.close / position.entry - 1 <= -options.stopLoss) position.stopRequested = true;
    }
    const gross = markValue(), nav = round(cash + gross);
    peak = Math.max(peak, nav);
    const dailyPct = (nav / previousNav - 1) * 100, drawdownPct = (nav / peak - 1) * 100;
    if (!paused && (dailyPct <= -options.pauseDailyLoss * 100 || drawdownPct <= -options.pauseDrawdown * 100)) {
      paused = { day, reason: dailyPct <= -options.pauseDailyLoss * 100 ? 'daily-loss-budget' : 'drawdown-budget' };
    }
    equity.push({ day, cash, gross, nav, positions: positions.size, dailyPct, drawdownPct,
      grossPct: gross / nav * 100, paused: !!paused });
    if (paused) for (const signal of signals.filter(row => row.day === day)) note(day, signal, 'paused-at-signal-close');
    if (!paused && day <= options.signalEndDay && calendar[i + 1] <= options.endDay) {
      const candidates = signals.filter(signal => signal.day === day)
        .sort((a, b) => a.leaderRank - b.leaderRank || b.leadScore - a.leadScore || a.code.localeCompare(b.code));
      let reserved = 0, reservedNotional = 0;
      const families = new Map();
      for (const position of positions.values()) for (const family of position.families) families.set(family,
        (families.get(family) || 0) + position.shares * position.lastClose);
      for (const signal of candidates) {
        if (positions.has(signal.code)) { note(day, signal, 'already-held-no-pyramiding'); continue; }
        if (positions.size + nextOrders.length >= options.maxPositions) { note(day, signal, 'position-count-budget'); continue; }
        const bar = byCode.get(signal.code)?.get(day);
        if (!validBar(bar)) { note(day, signal, 'signal-close-unavailable'); issues.push({ day, code: signal.code, reason: 'signal-close-unavailable' }); continue; }
        const signalFamilies = [...new Set(signal.families || [signal.family])];
        const limit = floorPrice(bar.close * (1 + options.entryPremium));
        const budget = Math.min(nav * options.stockWeight,
          nav * options.grossWeight - gross - reservedNotional,
          ...signalFamilies.map(family => nav * options.familyWeight - (families.get(family) || 0)),
          cash - reserved);
        const shares = quantityForBudget(signal.code, budget, limit, options);
        if (!shares) { note(day, signal, 'cash-exposure-or-minimum-lot-budget'); continue; }
        const notional = shares * limit;
        nextOrders.push({ signal, shares, limit, families: signalFamilies });
        reservedNotional += notional;
        reserved += notional + costs(notional, 'buy', options).total;
        for (const family of signalFamilies) families.set(family, (families.get(family) || 0) + notional);
      }
    }
    if (cash < -0.001) throw Error('Negative cash');
    previousNav = nav;
  }
  const final = equity.at(-1), totalCosts = sum(trades.map(trade => trade.entryCosts.total + trade.exitCosts.total))
    + sum([...positions.values()].map(position => position.fee.total));
  for (const trade of trades) {
    const adjustedEntry = inputs.adjusted.get(trade.code)?.get(trade.entryDay)?.open;
    const adjustedExit = inputs.adjusted.get(trade.code)?.get(trade.exitDay)?.[trade.exitField];
    trade.adjustedGrossPct = adjustedEntry > 0 && adjustedExit > 0 ? (adjustedExit / adjustedEntry - 1) * 100 : null;
    trade.unadjustedGrossPct = (trade.exit / trade.entry - 1) * 100;
    if (trade.adjustedGrossPct != null && Math.abs(trade.adjustedGrossPct - trade.unadjustedGrossPct) > 0.15) {
      issues.push({ day: trade.exitDay, code: trade.code, reason: 'trade-adjustment-return-mismatch' });
    }
  }
  const closedWins = trades.filter(trade => trade.netPnl > 0).length;
  return { version: 'mainline-leader-paper-v1', options,
    summary: { signalEvents: signals.length, signalDays: new Set(signals.map(signal => signal.day)).size,
      closedTrades: trades.length, tradedSignalDays: new Set(trades.map(trade => trade.signalDay)).size,
      startDay: options.startDay, endDay: options.endDay,
      finalNav: final.nav, netReturnPct: (final.nav / options.initialCash - 1) * 100,
      closeMarkedDrawdownPct: Math.min(0, ...equity.map(row => row.drawdownPct)),
      worstCloseToCloseDayPct: Math.min(0, ...equity.map(row => row.dailyPct)),
      averageCloseExposurePct: sum(equity.map(row => row.grossPct)) / equity.length,
      maxCloseExposurePct: Math.max(0, ...equity.map(row => row.grossPct)), totalCosts: round(totalCosts),
      closedTradeWinPct: trades.length ? closedWins / trades.length * 100 : null,
      unresolvedPositions: positions.size, paused,
      mechanicsComplete: issues.length === 0 && positions.size === 0,
      signalTimingVerified: false, signalUniverseComplete: false, fillsVerified: false,
      passiveIndexReturnPct: (inputs.index.get(options.endDay).close / inputs.index.get(options.startDay).close - 1) * 100,
      skipped: Object.fromEntries([...new Set(skipped.map(row => row.reason))].map(reason => [reason, skipped.filter(row => row.reason === reason).length])) },
    trades, orders, skipped, issues, equity,
    unresolved: [...positions.values()].map(position => ({ code: position.code, entryDay: position.entryDay,
      shares: position.shares, lastClose: position.lastClose, deferred: position.deferred })),
    assumptions: [
      'Retrospective archived selections; historical signal availability, status and permissions are not independently verified.',
      'Only the supplied archived candidate events are replayed. Unobserved opportunities are not proof of no signal; this NAV path is conditional, not a full-month live-strategy backtest.',
      'Auction participation, full fills and closing execution are assumptions, not demonstrated by daily bars; adverse friction is debited as a cash cost.',
      'Unfilled auction orders are modeled as canceled. Real ordinary limit orders can persist into continuous trading; cancellation races and extra fills require broker/tick evidence.',
      'Near-lower-limit exits are conservatively deferred using an approximate 9.5/19.5 percent screen, not official reference prices or order books.',
      '100-share main/GEM lots and minimum 200 / increment 1 STAR lots; assumed STAR/GEM permissions. Broker fees are illustrative all-in commission, not an account quote.',
      'No post-close sale proceeds are reused at the same morning open. Unfilled reservations are not replaced after seeing opening prices.',
      'Exposure limits apply at order sizing; market moves may breach them. Pause triggers are close-based and cannot cap intraday or overnight losses.',
      'Unmodeled corporate actions, minute liquidity, auction allocation and information timestamps prevent live-performance claims.',
    ] };
}

function cohorts(research) {
  const confirmed = new Set(research.rows.julyStars.filter(row => row.predictLevel === 'confirmed').map(row => `${row.day}:${row.family}`));
  return {
    july: { signals: research.rows.julyLeaders.filter(row => confirmed.has(`${row.day}:${row.family}`)),
      startDay: '2026-07-13', signalEndDay: '2026-07-24', endDay: '2026-07-29' },
    august: { signals: research.rows.augustLeaders,
      startDay: '2026-08-10', signalEndDay: '2026-08-31', endDay: '2026-09-08' },
  };
}

function runResearch(research, history, adjusted) {
  const results = {};
  for (const [name, cohort] of Object.entries(cohorts(research))) {
    const { signals, ...dates } = cohort;
    results[name] = {};
    for (const frictionBpsPerSide of [10, 25, 50]) results[name]['friction-' + frictionBpsPerSide] = simulate(signals, history, { ...dates, frictionBpsPerSide }, adjusted);
    results[name].dayRemovalSensitivity = [...new Set(signals.map(row => row.day))].sort().map(excludedDay => ({
      excludedDay, ...simulate(signals.filter(row => row.day !== excludedDay), history, dates, adjusted).summary,
    }));
  }
  return { generatedAt: new Date().toISOString(), results,
    warning: 'Exploratory capital-constrained reference execution. Not verified historical strategy performance or out-of-sample validation.' };
}

if (require.main === module) {
  const [researchFile, rawFile, adjustedFile, outputFile] = process.argv.slice(2);
  if (!outputFile) throw Error('Usage: research-mainline-portfolio.js research.json raw.json adjusted.json output.json');
  const files = [researchFile, rawFile, adjustedFile].map(file => fs.readFileSync(file));
  const result = runResearch(...files.map(bytes => JSON.parse(bytes)));
  result.inputs = Object.fromEntries(files.map((bytes, i) => [['research', 'unadjusted', 'adjusted'][i], crypto.createHash('sha256').update(bytes).digest('hex')]));
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(result.results).map(([key, value]) => [key,
    Object.fromEntries(Object.entries(value).map(([name, result]) => [name, Array.isArray(result) ? result.map(row => ({ excludedDay: row.excludedDay, netReturnPct: row.netReturnPct })) : result.summary]))])), null, 2));
}

module.exports = { DEFAULTS, costs, quantityForBudget, simulate, cohorts, runResearch };
