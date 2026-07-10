// QI 主线三态测试(node tests/qi-mainline-states.test.js)——Shared Decision v1 第3条实施验证。
const fsReal = require('fs');
const pathReal = require('path');
const src = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const html = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bodyBrace = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bodyBrace;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(m.index, i + 1);
}
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

// 1. certainty 封顶:已扫无明星时最高降到中等;未扫不惩罚
const isFiniteNumeric = v => Number.isFinite(Number(v)) && v !== null && v !== '';
eval(extractFn('strategyMainlineCertainty'));
const richItem = { count: 3, maxLianban: 2, bigGainCount: 5, nearLimitCount: 2, priorReasonCount: 3, netInflow: 5e8, boardCount: 3 };
const base = strategyMainlineCertainty(richItem, null, {});
A(base.level === 'high', '信号充足时基线为高确定性');
const capped = strategyMainlineCertainty(richItem, null, { scannedNoStar: true });
A(capped.level === 'medium', '已扫无明星:高确定性封顶降为中等');
const unscanned = strategyMainlineCertainty(richItem, null, { scannedNoStar: false });
A(unscanned.level === 'high', '未扫描不惩罚(scannedNoStar=false 保持高)');
const mid = strategyMainlineCertainty({ count: 1, bigGainCount: 3, nearLimitCount: 1 }, null, { scannedNoStar: true });
A(mid.level !== 'high', '中等及以下不再额外降(只封顶不叠罚)');

// 2. 接线静态断言(后端)
A(src.includes('return { byCode, scannedPlates };'), 'collectStars 返回扫描板块集合');
A(src.includes("? 'unscanned'") && src.includes("(hasQiStar ? 'qi' : 'scanned-no-star')"), '三态推导:unscanned/qi/scanned-no-star');
A(src.includes("star.level === 'confirmed' || star.level === 'expected'"), 'QI 判定=预期明星或明星确认(L2 全方位符合)');
A(src.includes("l2VerificationStatus: m.l2VerificationStatus || ''"), 'P1-C 预测记录携带 QI 状态');
A(src.includes("scannedNoStar: l2VerificationStatus === 'scanned-no-star'"), 'certainty 接收已扫无明星标志');
A(!src.includes('isConfirmedMainline = l2') && src.includes('const l2VerificationStatus'), '独立字段,不复用 isConfirmedMainline');

// 3. 接线静态断言(前端)
A(html.includes('QI 主线') && html.includes('L2 未见明星') && html.includes('L2 待验证'), '前端三态徽章齐备');
A(html.includes('${qiBadge}${confirmedBadge}'), 'QI 徽章与 Owner 确认徽章并列独立');
A(html.includes(".filter(s => s.level === 'confirmed' || s.level === 'expected').slice(0, 3)"), '明星行只显确认/预期,至多3只');
A(!html.includes('>潜力</span>'), '潜力行已退役(Owner 定稿:预期明星取代)');
A(src.includes('focusStocks,'), 'focusStocks 后端数据保留(供调度用)');

// 4. 前端内联脚本编译
let ok = true;
for (const m2 of html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)) {
  try { new Function(m2[1]); } catch (e) { ok = false; console.error('compile failed:', e.message); }
}
A(ok, '前端内联脚本可编译');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL QI-MAINLINE-STATES CHECKS PASSED');
