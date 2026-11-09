const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))requests.push(r.url());});
 await page.goto((process.env.STUDY_TEST_URL||'http://127.0.0.1:8877')+'/yjgeum/index.html');
 await page.waitForFunction(()=>window.GFAIR_COLLAB?.loaded);
 const original=await page.evaluate(async()=>{
  const s=GFAIR_COLLAB,screen=location.hash.slice(1)||document.body.dataset.screen||'screens';
  const {id}=await s.mutate('create',{screen,text:'테스트 설명',anchor:{selector:'#app',sample:'본문',x:0.5,y:0.5}});
  await s.mutate('update',{id,revision:1,text:JSON.stringify({format:'description-spec-v1',item:'항목',planningNote:'확인 필요'})});
  await s.mutate('move',{id,revision:2,offsetX:10,offsetY:20});
  return {id,backup:s.exportData(),notes:await s.planningNotes()};
 });
 assert.equal(original.notes.length,1);
 await page.reload();await page.waitForFunction(()=>window.GFAIR_COLLAB?.loaded);
 assert.equal(await page.evaluate(()=>JSON.parse(GFAIR_COLLAB.exportData()).records[0].anchor.offsetX),10);
 const failure=await page.evaluate(async id=>{try{await GFAIR_COLLAB.mutate('update',{id,revision:1,text:'stale'});return false;}catch{return true;}},original.id);assert.equal(failure,true);
 await page.evaluate(async id=>{await GFAIR_COLLAB.mutate('delete',{id,revision:3});},original.id);
 assert.equal(await page.evaluate(()=>JSON.parse(GFAIR_COLLAB.exportData()).records.length),0);
 await page.evaluate(raw=>GFAIR_COLLAB.importData(raw),original.backup);
 assert.equal(await page.evaluate(()=>JSON.parse(GFAIR_COLLAB.exportData()).records.length),1);
 assert.equal(await page.evaluate(raw=>{const before=GFAIR_COLLAB.exportData();for(const input of ['invalid',JSON.stringify({...JSON.parse(raw),project:'hekim'}),JSON.stringify({...JSON.parse(raw),records:[{}]})]){try{GFAIR_COLLAB.importData(input);return false;}catch{}}return JSON.parse(before).records.length===JSON.parse(GFAIR_COLLAB.exportData()).records.length;},original.backup),true);
 assert.equal(await page.evaluate(async id=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota')};try{await GFAIR_COLLAB.mutate('delete',{id,revision:3});return false;}catch{return JSON.parse(GFAIR_COLLAB.exportData()).records.length===1;}finally{Storage.prototype.setItem=original;}},original.id),true);
 await page.route('**/yjgeum/index.html',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('data-project="yjgeum"','data-project="test-other"')});});
 await page.route('**/yjgeum/descriptions.json',r=>r.fulfill({json:{format:'study-descriptions-v1',project:'test-other',records:[]}}));
 await page.goto((process.env.STUDY_TEST_URL||'http://127.0.0.1:8877')+'/yjgeum/index.html');
 await page.waitForFunction(()=>window.GFAIR_COLLAB?.loaded);
 assert.equal(await page.evaluate(()=>JSON.parse(GFAIR_COLLAB.exportData()).records.length),0);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'JSON 내보내기',exact:true}).click();assert.equal((await download).suggestedFilename(),'descriptions.json');
 await page.unroute('**/yjgeum/index.html');await page.unroute('**/yjgeum/descriptions.json');
 const published=JSON.parse(original.backup);published.records[0].text='저장소 설명';
 await page.route('**/yjgeum/descriptions.json',r=>r.fulfill({json:published}));
 await page.goto((process.env.STUDY_TEST_URL||'http://127.0.0.1:8877')+'/yjgeum/index.html');
 await page.waitForFunction(()=>window.GFAIR_COLLAB?.loaded);
 // Existing browser draft must remain intact until explicitly discarded.
 assert.notEqual(await page.evaluate(()=>JSON.parse(GFAIR_COLLAB.exportData()).records[0].text),'저장소 설명');
 await page.evaluate(()=>GFAIR_COLLAB.usePublished());
 assert.equal(await page.evaluate(()=>JSON.parse(GFAIR_COLLAB.exportData()).records[0].text),'저장소 설명');
 assert.equal(await page.evaluate(()=>GFAIR_COLLAB.hasDraft),false);
 await page.reload();await page.waitForFunction(()=>window.GFAIR_COLLAB?.loaded);
 assert.equal(await page.evaluate(()=>JSON.parse(GFAIR_COLLAB.exportData()).records[0].text),'저장소 설명');
 await page.evaluate(async()=>{const r=JSON.parse(GFAIR_COLLAB.exportData()).records[0];await GFAIR_COLLAB.mutate('update',{id:r.id,revision:r.revision,text:'새 편집'});});
 assert.equal(await page.evaluate(()=>JSON.parse(GFAIR_COLLAB.exportData()).records[0].text),'새 편집');
 await page.route('**/yjgeum/descriptions.json',r=>r.fulfill({body:'bad json'}));
 await page.evaluate(()=>GFAIR_COLLAB.refresh());
 assert.equal(await page.evaluate(()=>JSON.parse(GFAIR_COLLAB.exportData()).records[0].text),'새 편집');
 assert.ok(await page.evaluate(()=>GFAIR_COLLAB.error));
 assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
 console.log('PASS: anonymous local CRUD, reload persistence, pin movement, revision conflict, JSON roundtrip/download, invalid import and quota preservation, project isolation, no API requests');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
