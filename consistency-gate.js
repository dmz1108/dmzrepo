const http=require('http');
function get(p){return new Promise((res,rej)=>{http.get('http://127.0.0.1:8765'+p,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(new Error('badjson '+p))}})}).on('error',rej);});}
const norm=c=>String(c||'').replace(/\D/g,'').slice(-6);
async function finalRowsFor(day){const sv=await get('/api/limit-up-main-reason-db/source-view?day='+day);return ((sv.tabs||(sv.payload&&sv.payload.tabs)||[]).find(t=>t.key==='final')||{}).rows||[];}
(async()=>{
  let days=process.argv.slice(2);if(!days.length){const sv0=await get('/api/limit-up-main-reason-db/source-view').catch(()=>({}));const dd=String(sv0.day||'').replace(/-/g,'');days=dd?[dd]:['20260626'];}
  let total=0;
  for(const day of days){
    const fin=await finalRowsFor(day);
    const byCode=new Map(fin.map(r=>[norm(r.code),r]));
    const pend=await get('/api/limit-up-main-reason-db/pending?day='+day).catch(()=>({pending:[]}));
    const pendCodes=new Set((pend.pending||[]).map(p=>norm(p.code)));
    let iss=[];
    // ① tier 内部自洽 + 手填面板不含已定档股
    for(const r of fin){
      const t=r.consensusTier,a=Number(r.agreeCount||0);
      if(t==='strong'&&a<3)iss.push(`${r.name} strong但agree=${a}`);
      if(t==='majority'&&a!==2)iss.push(`${r.name} majority但agree=${a}`);
      if(t==='event'&&!r.eventReason)iss.push(`${r.name} event无eventReason`);
      if(pendCodes.has(norm(r.code))&&['event','strong','majority'].includes(t))iss.push(`${r.name} ${t}却在手填`);
    }
    // ② 列表档==详情档(抽查易漂移的:event/其他/待定)
    const risky=fin.filter(r=>r.consensusTier==='event'||/其他|待定/.test(String(r.boardTopic||'')));
    for(const r of risky){const d=await get('/api/limit-up-main-reason-db/stock?day='+day+'&code='+norm(r.code)).catch(()=>null);
      if(d&&d.tier!==r.consensusTier)iss.push(`${r.name} 列表${r.consensusTier}≠详情${d.tier}`);}
    // ③ 策略口径核验:强势板块共振 每股 主因/档 == 综合归纳。
    //   坑:策略用 resolveStrategySnapshotDay(day) 解析到「板块快照日」reso.day,历史日常落到前一交易日
    //   (例 6/23 无快照→回退 6/22)。必须按 reso.day 对齐取综合归纳,否则跨日误报
    //   (六国化工 6/22磷化工/strong vs 6/23化工/majority,实为两天不同,非漂移)。
    const reso=await get('/api/strong-board-resonance?day='+day).catch(()=>({boards:[],day:''}));
    const resoDay=String(reso.day||'').replace(/-/g,'')||day;
    const resoByCode=resoDay===day?byCode:new Map((await finalRowsFor(resoDay).catch(()=>[])).map(r=>[norm(r.code),r]));
    let resoN=0;
    for(const b of (reso.boards||[]))for(const s of (b.resonanceStocks||[])){
      resoN++;const f=resoByCode.get(norm(s.code));if(!f)continue;
      const fTheme=String(f.finalBoardTopic||f.boardTopic||'');
      if(String(s.tier)!==String(f.consensusTier))iss.push(`策略:${s.name} 共振档${s.tier}≠综合归纳${f.consensusTier}`);
      if(String(s.mainTheme||'')!==fTheme)iss.push(`策略:${s.name} 共振主因${s.mainTheme}≠综合归纳${fTheme}`);
    }
    const dayNote=resoDay!==day?` 策略快照日${resoDay}`:'';
    console.log(`${day}: 涨停${fin.length} 手填${pendCodes.size} 策略共振股${resoN}${dayNote} | ${iss.length?'❌ '+iss.length+'处':'✅ 一致'}`);
    iss.slice(0,8).forEach(x=>console.log('   - '+x));
    total+=iss.length;
  }
  // ④ 过期抽查:近10天里随机挑2天,后台干跑重算主因 vs 存盘比,抓「改了源/归一表却忘重建那天库」导致的存盘主因过期。
  //   干跑不落盘/不写缓存(服务端 dryRun),手填覆盖股自动跳过。
  let staleTotal=0;
  try{
    const st=await get('/api/limit-up-main-reason-db/status');
    const recent=(st.days||[]).map(d=>String(d.day||'').replace(/-/g,'')).filter(Boolean).slice(-10);
    const pool=recent.slice(),pick=[];
    for(let i=0;i<2&&pool.length;i++)pick.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
    for(const d of pick){
      const r=await get('/api/limit-up-main-reason-db/staleness-check?day='+d).catch(()=>null);
      if(!r||!r.ok){console.log(`过期抽查 ${d}: 跳过(${r?r.reason:'err'})`);continue;}
      console.log(`过期抽查 ${d}: 查${r.checked}只 ${r.mismatchCount?('⚠ '+r.mismatchCount+'只主因过期,需重建该天库'):'✅ 未过期'}`);
      (r.mismatches||[]).slice(0,5).forEach(m=>console.log(`   - ${m.name} 存盘=${m.stored} → 现算=${m.fresh}`));
      staleTotal+=r.mismatchCount||0;
    }
  }catch(e){console.log('过期抽查 跳过:',e.message);}
  const ok=total===0&&staleTotal===0;
  const c1=total?('❌ '+total+'处不一致'):'✅ 全链一致(综合归纳⟷详情⟷手填⟷策略)';
  const c2=staleTotal?('⚠ '+staleTotal+'只主因过期(需重建对应天库)'):'✅ 主因无过期';
  console.log('\n=== '+c1+' · '+c2+' ===');
  process.exitCode=ok?0:1;
})().catch(e=>{console.log('FATAL',e.message);process.exitCode=2;});
