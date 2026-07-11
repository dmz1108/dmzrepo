#!/usr/bin/env node
// 2026-07-08 算力AI 龙头池数据修复(Owner 方案2:修数据本身,统计按真实龙头计)。
//
// 背景:当日快照采集不完整,紫光股份(000938)未进入 cardData 的 zt10/gain10/gain30 统计,
// 导致龙头评分池里没有它——v2 评分(PR #9)已核定 紫光 90 分第一龙头、长源东谷 79 分第二,
// 但历史日重算补不出缺失的源数据,须修复快照文件本身。
//
// 用法(在云端服务器仓库目录下):
//   node tools/patch-20260708-suanli-leaders.js              # dry-run:只打印将要做什么,不写文件
//   node tools/patch-20260708-suanli-leaders.js --apply      # 实际写入(先自动备份原文件)
//
// 行为:
// - 对 zsType 6/5/7 的 2026-07-08 快照,定位「长源东谷(603950) 出现在 zt10/gain10/gain30 任一表」的板块
//   (即算力AI 龙头池所在板块),向同板块三张表补入紫光股份;
// - 补入值为双源核验数字(腾讯/东财一致):zt10 主次数2(06-30 光模块、07-06 算力/云计算数据中心),
//   gain10 +21.55,gain30 +16.6;
// - 不动 ztList(紫光当日未涨停,不伪造涨停记录);已存在则跳过(幂等);
// - --apply 时先把原文件复制为 <文件>.bak-<时间戳>,失败不落半截数据(整文件原子替换)。
// - 无需重启服务:快照文件按请求读取。

const fs = require('fs');
const path = require('path');

const DAY = '2026-07-08';
const ANCHOR_CODE = '603950';   // 长源东谷:算力AI 龙头池锚点
const PATCH = {
  code: '000938',
  name: '紫光股份',
  zt10: { ztCount: 2, totalCount: 2 },   // 06-30 光模块、07-06 算力/云计算数据中心
  gain10: 21.55,                          // 双源核验(腾讯 21.55 / 东财 21.55)
  gain30: 16.6,                           // 双源核验(腾讯 16.59 / 东财 16.57)
};
const APPLY = process.argv.includes('--apply');

function snapshotPath(baseDir, day, zsType) {
  const safe = v => String(v || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(baseDir, 'strategy-data', 'snapshots', safe(String(zsType)), `${safe(day)}.json`);
}

function hasCode(arr, code) {
  return Array.isArray(arr) && arr.some(r => String(r?.code || '') === code);
}

function main() {
  const baseDir = process.cwd();
  let touched = 0;
  for (const zsType of [6, 5, 7]) {
    const file = snapshotPath(baseDir, DAY, zsType);
    if (!fs.existsSync(file)) { console.log(`[zs${zsType}] 无快照文件,跳过: ${file}`); continue; }
    const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
    const cardData = payload?.cardData || {};
    const boards = Array.isArray(payload?.boards) ? payload.boards : [];
    const nameOf = new Map(boards.map(b => [String(b?.plateId ?? b?.id ?? ''), String(b?.name || b?.plateName || '')]));
    let changed = false;
    for (const [plateId, card] of Object.entries(cardData)) {
      if (!card) continue;
      const anchored = hasCode(card.zt10, ANCHOR_CODE) || hasCode(card.gain10, ANCHOR_CODE) || hasCode(card.gain30, ANCHOR_CODE);
      if (!anchored) continue;
      const bname = nameOf.get(String(plateId)) || plateId;
      const plans = [];
      if (Array.isArray(card.zt10) && !hasCode(card.zt10, PATCH.code)) {
        plans.push(['zt10', { code: PATCH.code, name: PATCH.name, ztCount: PATCH.zt10.ztCount, totalCount: PATCH.zt10.totalCount }]);
      }
      if (Array.isArray(card.gain10) && !hasCode(card.gain10, PATCH.code)) {
        plans.push(['gain10', { code: PATCH.code, name: PATCH.name, gain: PATCH.gain10 }]);
      }
      if (Array.isArray(card.gain30) && !hasCode(card.gain30, PATCH.code)) {
        plans.push(['gain30', { code: PATCH.code, name: PATCH.name, gain: PATCH.gain30 }]);
      }
      if (!plans.length) { console.log(`[zs${zsType}] ${bname}: 紫光已在三表中,无需修补(幂等跳过)`); continue; }
      for (const [key, row] of plans) {
        console.log(`[zs${zsType}] ${bname}(${plateId}) ${key} += ${JSON.stringify(row)}`);
        if (APPLY) card[key].push(row);
      }
      changed = changed || APPLY;
      touched += 1;
    }
    if (APPLY && changed) {
      const bak = `${file}.bak-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)}`;
      fs.copyFileSync(file, bak);
      const tmp = `${file}.tmp-patch`;
      fs.writeFileSync(tmp, JSON.stringify(payload));
      fs.renameSync(tmp, file);
      console.log(`[zs${zsType}] 已写入(备份: ${path.basename(bak)})`);
    }
  }
  if (!touched) console.log('未找到锚点板块(长源东谷不在任何 cardData 统计表中)——请人工核对快照结构。');
  console.log(APPLY ? '完成(--apply 模式)。' : '以上为 dry-run 预览;确认无误后加 --apply 执行。');
  console.log('验证:GET /api/strategy-mainlines?day=2026-07-08 → 算力AI 龙头应为 紫光股份(000938) 第一、长源东谷 第二(v2 评分 90/79)。');
}

main();
