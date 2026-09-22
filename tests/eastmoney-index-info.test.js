const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const server = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const section = server.slice(server.indexOf('async function fetchEastmoneyTopicPoolCount('), server.indexOf('async function fetchEastmoneyLimitUps('));
const html = fs.readFileSync(path.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');
const helpers = [
  ['function compactDate(', 'function calcZtFromKline('],
  ['function isoFromCompactDate(', 'function recentTradingWindowDayList('],
  ['function numOrNull(', 'function isFiniteNumeric('],
].map(([start, end]) => server.slice(server.indexOf(start), server.indexOf(end))).join('\n');
function harness() {
  let clock = Date.parse('2026-09-22T02:00:00Z');
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
  const ctx = vm.createContext({ Date: Clock, Map, URL, URLSearchParams, AbortSignal,
    chinaNowParts: () => ({ day: '2026-09-22', hour: 10, minute: 0 }),
    mapLimit: (rows, n, fn) => Promise.all(rows.map(fn)),
    EASTMONEY_ZT_UT: 'public-fixture', EASTMONEY_ZT_DPT: 'fixture',
    fetch: async url => ({ ok: true, json: async () => ({rc:0,data:{tc:String(url).includes('DTPool')?0:101,qdate:20260922}}) }),
    eastmoneyFetchJson: async (api, p) => ({rc:0,data:{f57:p.secid.split('.')[1],f113:10,f114:5,f124:clock/1000}}),
    send: (res, status, body) => ({status,body}),
    eastmoneyIndexInfoCache: new Map(), eastmoneyIndexInfoInflight: new Map(),
  });
  vm.runInContext(helpers + '\n' + section, ctx);
  return {ctx, advance: ms => {clock += ms;}};
}

test('complete payload preserves all four existing fields including a genuine zero', async () => {
  const {ctx}=harness(); const p=await ctx.fetchEastmoneyIndexInfo('2026-09-22');
  assert.equal(p.complete,true);assert.equal(p.DaBanList.SZJS,30);assert.equal(p.DaBanList.XDJS,15);
  assert.equal(p.DaBanList.tZhangTing,101);assert.equal(p.DaBanList.tDieTing,0);
  assert.equal(p.metrics.SZJS.sourceDay,'2026-09-22');
});
test('production socket failure is partial HTTP 200 and preserves valid topic counts', async () => {
  const {ctx}=harness();ctx.eastmoneyFetchJson=async()=>{throw new TypeError('fetch failed');};
  const r=await ctx.eastmoneyIndexInfo(new URL('http://localhost/?day=2026-09-22'),{},{});
  assert.equal(r.status,200);assert.equal(r.body.status,'partial');assert.equal(r.body.DaBanList.SZJS,null);
  assert.equal(r.body.DaBanList.tZhangTing,101);assert.equal(r.body.metrics.SZJS.reason,'upstream-unavailable');
});
test('one failed exchange never yields a partial sum presented as all-market breadth',async()=>{
  const {ctx}=harness(), fetch=ctx.eastmoneyFetchJson;
  ctx.eastmoneyFetchJson=async(api,p)=>{if(p.secid==='0.399001')throw Error('closed');return fetch(api,p);};
  const p=await ctx.fetchEastmoneyIndexInfo('2026-09-22');assert.equal(p.DaBanList.SZJS,null);assert.equal(p.DaBanList.XDJS,null);
});
test('all failures return null instead of zero or leaking upstream error text',async()=>{
  const {ctx}=harness();ctx.fetch=ctx.eastmoneyFetchJson=async()=>{throw Error('private runtime path');};
  const p=await ctx.fetchEastmoneyIndexInfo('2026-09-22');assert.equal(p.status,'unavailable');
  assert.ok(Object.values(p.DaBanList).every(v=>v===null));assert.ok(!JSON.stringify(p).includes('private runtime path'));
});
for(const input of [null,{}, {rc:0,data:{tc:null,qdate:20260922}}, {rc:0,data:{tc:-1,qdate:20260922}}, {rc:1,data:{tc:99,qdate:20260922}}]) {
  test('invalid topic payload is missing: '+JSON.stringify(input),async()=>{
    const {ctx}=harness();ctx.fetch=async()=>({ok:true,json:async()=>input});
    await assert.rejects(ctx.fetchEastmoneyTopicPoolCount('getTopicZTPool','2026-09-22'));
  });
}
test('qdate mismatch is rejected, including the observed current payload for a historical request',async()=>{
  const {ctx}=harness();const p=await ctx.fetchEastmoneyIndexInfo('2026-09-21');
  assert.equal(p.DaBanList.SZJS,null);assert.equal(p.DaBanList.tZhangTing,null);
  assert.equal(p.metrics.tZhangTing.reason,'source-day-mismatch');
});
test('undated zero breadth is not accepted as successful empty-market data',async()=>{
  const {ctx}=harness();ctx.eastmoneyFetchJson=async(api,p)=>({rc:0,data:{f57:p.secid.split('.')[1],f113:0,f114:0,f124:0}});
  await assert.rejects(ctx.fetchEastmoneyBreadthCounts('2026-09-22'),/invalid-breadth/);
});
test('prior-day and mismatched index payloads are rejected',async()=>{
  const {ctx}=harness();ctx.eastmoneyFetchJson=async(api,p)=>({rc:0,data:{f57:p.secid.split('.')[1],f113:2,f114:3,f124:Date.parse('2026-09-21T07:00:00Z')/1000}});
  await assert.rejects(ctx.fetchEastmoneyBreadthCounts('2026-09-22'),/source-day-mismatch/);
  ctx.eastmoneyFetchJson=async()=>({rc:0,data:{f57:'wrong',f113:2,f114:3,f124:Date.parse('2026-09-22T02:00:00Z')/1000}});
  await assert.rejects(ctx.fetchEastmoneyBreadthCounts('2026-09-22'),/invalid-breadth/);
});
test('fresh counts survive brief failure as explicitly dated stale cache; failures never renew it',async()=>{
  const {ctx,advance}=harness();const first=await ctx.fetchEastmoneyIndexInfo('2026-09-22');advance(31000);
  ctx.fetch=ctx.eastmoneyFetchJson=async()=>{throw Error('closed');};
  const p=await ctx.fetchEastmoneyIndexInfo('2026-09-22');assert.equal(p.stale,true);assert.equal(p.DaBanList.SZJS,30);
  assert.equal(p.metrics.SZJS.fetchedAt,first.metrics.SZJS.fetchedAt);
  advance(31000);await ctx.fetchEastmoneyIndexInfo('2026-09-22');advance(28500);
  const expired=await ctx.fetchEastmoneyIndexInfo('2026-09-22');assert.equal(expired.DaBanList.SZJS,null);assert.equal(expired.stale,false);
});
test('parallel requests coalesce to one quote batch; failures are briefly cached',async()=>{
  const {ctx}=harness();let calls=0;const read=ctx.eastmoneyFetchJson;ctx.eastmoneyFetchJson=async(...args)=>{calls++;return read(...args);};
  await Promise.all(Array.from({length:20},()=>ctx.fetchEastmoneyIndexInfo('2026-09-22')));assert.equal(calls,3);
  await ctx.fetchEastmoneyIndexInfo('2026-09-22');assert.equal(calls,3);assert.equal(ctx.eastmoneyIndexInfoInflight.size,0);
  const h=harness();let failed=0;h.ctx.fetch=h.ctx.eastmoneyFetchJson=async()=>{failed++;throw Error('closed');};
  await h.ctx.fetchEastmoneyIndexInfo('2026-09-22');const n=failed;await h.ctx.fetchEastmoneyIndexInfo('2026-09-22');assert.equal(failed,n);
});
test('premarket and future days do not query yesterday-like current feeds',async()=>{
  const {ctx}=harness();ctx.chinaNowParts=()=>({day:'2026-09-22',hour:9,minute:3});
  ctx.fetch=ctx.eastmoneyFetchJson=async()=>assert.fail('must not fetch');
  const p=await ctx.fetchEastmoneyIndexInfo('2026-09-22');assert.equal(p.status,'pending');assert.equal(p.DaBanList.tZhangTing,null);
  const f=await ctx.fetchEastmoneyIndexInfo('2026-09-23');assert.equal(f.status,'unavailable');
});
test('invalid dates are HTTP 400 and historical requests never query live breadth',async()=>{
  const {ctx}=harness();for(const day of ['bad','2026-02-31','20260231','2026-13-01']){
    const r=await ctx.eastmoneyIndexInfo(new URL('http://localhost/?day='+day),{},{});assert.equal(r.status,400);
  }
  ctx.eastmoneyFetchJson=async()=>assert.fail('no live historical breadth');
  await ctx.fetchEastmoneyIndexInfo('2026-09-21');
});
test('topic calls have bounded timeout',async()=>{
  const {ctx}=harness();let signal;ctx.fetch=async(url,options)=>{signal=options.signal;return {ok:true,json:async()=>({rc:0,data:{tc:0,qdate:20260922}})};};
  assert.equal(await ctx.fetchEastmoneyTopicPoolCount('getTopicDTPool','2026-09-22'),0);assert.ok(signal instanceof AbortSignal);
});

function uiHarness() {
  const elements=new Map();const element=id=>elements.get(id)||elements.set(id,{textContent:'',title:'',hidden:true}).get(id);
  const ctx=vm.createContext({state:{date:'2026-09-22',zsType:6}, document:{getElementById:element},renderBreadthDial(){},fetchIndexInfo:async()=>({DaBanList:{SZJS:10}})});
  const render=html.slice(html.indexOf('function renderKPI('),html.indexOf('function polarToPoint('));
  const load=html.slice(html.indexOf('async function loadIndexInfo('),html.indexOf('async function hydrateBoardZtCount('));
  vm.runInContext(render+'\n'+load,ctx);return {ctx,element};
}
test('UI marks stale values, shows missing values and clears old status on recovery',()=>{
  const {ctx,element}=uiHarness();ctx.renderKPI({DaBanList:{SZJS:0,XDJS:3},stale:true,message:'delayed',metrics:{SZJS:{state:'stale',fetchedAt:'2026-09-22T02:00:00Z'}}});
  assert.equal(element('kpi-up').textContent,'0*');assert.equal(element('kpi-zt').textContent,'--');assert.equal(element('kpi-source-status').hidden,false);
  ctx.renderKPI({DaBanList:{SZJS:4}});assert.equal(element('kpi-up').textContent,'4');assert.equal(element('kpi-up').title,'');assert.equal(element('kpi-source-status').hidden,true);
});
test('late success and late failure cannot overwrite another date or source',async()=>{
  for(const kind of ['success','failure'])for(const change of ['date','zsType']){
    const {ctx,element}=uiHarness();let resolve,reject;ctx.fetchIndexInfo=()=>new Promise((a,b)=>{resolve=a;reject=b;});
    element('kpi-up').textContent='unchanged';const pending=ctx.loadIndexInfo();ctx.state[change]=change==='date'?'2026-09-21':5;
    if(kind==='success')resolve({DaBanList:{SZJS:99}});else reject(Error('network'));
    await pending;assert.equal(element('kpi-up').textContent,'unchanged');
  }
});
test('current network failure clears old figures without a page-wide error',async()=>{
  const {ctx,element}=uiHarness();ctx.fetchIndexInfo=async()=>{throw Error('fetch failed');};
  element('kpi-up').textContent='yesterday';await ctx.loadIndexInfo();assert.equal(element('kpi-up').textContent,'--');assert.equal(element('kpi-source-status').hidden,false);
});
