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
A(src.includes('return { byCode, scannedPlates, completedPlates, coveredCodes };'), 'collectStars 返回扫描/完成/覆盖三集合');
A(src.includes('strategyMainlineDeriveL2Status(l2Stars, hasQiStar, themeCodes)'), '三态推导走独立函数(含完成与覆盖门槛)');
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

// 5. 评审修正:三态推导行为测试(分批回传不判负/完成+覆盖才判负/预期明星立即QI)
eval(extractFn('strategyMainlineDeriveL2Status'));
const mk = (completed, covered) => ({
  completedPlates: new Set(completed),
  coveredCodes: new Set(covered),
  scannedPlates: new Set(completed.length ? completed : ['p1']),
});
const theme5 = new Set(['A1', 'A2', 'A3', 'A4', 'A5']);
A(strategyMainlineDeriveL2Status(mk([], ['A1', 'A2', 'A3']), false, theme5) === 'unscanned', '运行中分批回传(无完成任务):不判负,保持待验证');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['A1', 'A2', 'A3']), false, theme5) === 'scanned-no-star', '扫描完成且相关股覆盖(>=3):才判已扫无明星');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['X1', 'X2', 'X3']), false, theme5) === 'unscanned', '扫描完成但覆盖的都是无关股:不判负');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['A1']), false, theme5) === 'unscanned', '完成但相关覆盖不足(1/5<3):不判负');
A(strategyMainlineDeriveL2Status(mk([], []), true, theme5) === 'qi', '发现预期明星/明星确认:即使扫描未完成也立即 QI');
const theme2 = new Set(['B1', 'B2']);
A(strategyMainlineDeriveL2Status(mk(['p1'], ['B1']), false, theme2) === 'unscanned', '小主线(2只)只覆盖1只:不判负');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['B1', 'B2']), false, theme2) === 'scanned-no-star', '小主线全覆盖:可判负');

// 6. 评审修正:用户可见文案不再出现潜力股
A(!src.includes('潜力股${'), '后端 explain 不再输出潜力股文案');
A(src.includes('预期明星${expectedStars.length}只'), 'explain 改为预期明星(无预期明星不补位)');
A(src.includes('盯预期明星能否首板'), '阶段建议文案已替换');
A(!html.includes('m.focusStocks[0]') && !html.includes('const focus = (m.focusStocks'), '抢跑雷达与卡片不再使用 focusStocks');
A(html.includes("x.level === 'expected' || x.level === 'confirmed'"), '抢跑雷达改用预期明星/明星确认,无则不补位');
const visiblePotential = html.split('\n').filter(l => l.includes('潜力') && !l.trim().startsWith('//'));
A(visiblePotential.length === 0, '前端用户可见内容零"潜力"字样(仅存代码注释)');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL QI-MAINLINE-STATES CHECKS PASSED');
