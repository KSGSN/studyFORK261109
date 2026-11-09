/* 여행지 별점 → 후기 화면의 선택 전달·필터·정렬·복귀 검증 */
const{chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/hekim/')&&r.status()===404)missing.push(r.url());});
 await page.route('**/api/collab**',r=>r.fulfill({json:{records:[],user:null,githubConfigured:false}}));
 await page.goto(process.env.YEOJEONG_TEST_URL||'http://127.0.0.1:8765/hekim/index.html');
 const wait=()=>page.waitForTimeout(70),go=async id=>{await page.locator('.ui-spec-screen-picker').selectOption(id);await wait();};
 assert.equal(await page.evaluate(()=>YJStore.loggedIn),false);assert.equal(await page.evaluate(()=>YEOJEONG_SCREENS.length),21);
 for(const d of await page.evaluate(()=>YEOJEONG_DEMO.destinations.map(d=>({id:d.id,name:d.name,score:d.score})))){
  await go('TRV-01');await page.getByRole('link',{name:d.name,exact:true}).click();await page.locator('.destination-detail').waitFor();
  assert.equal(await page.locator('.destination-detail h1').innerText(),d.name);assert.match(await page.locator('.rating-link').innerText(),/후기 10개/);
  await page.locator('.rating-link').focus();await page.keyboard.press('Enter');await page.locator('.reviews-summary').waitFor();
  assert.equal(await page.evaluate(()=>YJ.route()),'TRV-05');assert.match(await page.locator('.page-heading h1').innerText(),new RegExp(d.name));
  assert.match(await page.locator('.review-average>strong').innerText(),new RegExp(String(d.score)));assert.equal(await page.locator('.review-card').count(),10);assert.equal(await page.locator('.review-body p').count(),20);
  assert.equal(await page.evaluate(()=>YJStore.loggedIn),false);
  await page.locator('[data-action="review-score"][data-value="4"]').click();await wait();assert.equal(await page.locator('.review-card').count(),10-Math.round((d.score-4)*10));assert.equal(await page.locator('.review-card:not([data-score="4"])').count(),0);
  await page.locator('[data-action="review-score"][data-value="1"]').click();await page.locator('.empty-state').waitFor();assert.equal(await page.locator('.review-card').count(),0);await page.getByRole('button',{name:'전체 후기 보기',exact:true}).click();await wait();assert.equal(await page.locator('.review-card').count(),10);
  await page.locator('#review-sort').selectOption('low');await wait();let scores=await page.locator('.review-card').evaluateAll(list=>list.map(el=>Number(el.dataset.score)));assert.deepEqual(scores,[...scores].sort((a,b)=>a-b));await page.locator('#review-sort').selectOption('high');await wait();scores=await page.locator('.review-card').evaluateAll(list=>list.map(el=>Number(el.dataset.score)));assert.deepEqual(scores,[...scores].sort((a,b)=>b-a));
  await page.locator('.back-link').click();await page.locator('.destination-detail').waitFor();assert.equal(await page.locator('.destination-detail h1').innerText(),d.name);await page.goBack();await page.locator('.reviews-summary').waitFor();assert.match(await page.locator('.page-heading h1').innerText(),new RegExp(d.name));await page.reload();await page.locator('.reviews-summary').waitFor();assert.match(await page.locator('.page-heading h1').innerText(),new RegExp(d.name));assert.doesNotMatch(await page.locator('.yj-screen-overview').innerText(),/undefined|null/);
 }
 for(const width of [1440,1101,768,390,320]){
  await page.setViewportSize({width,height:1000});
  for(const open of [false,true]){if(await page.locator('.ui-spec-panel').isVisible()!==open)await page.locator('[data-spec="close"]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width} ${open}`);}
 }
 await page.setViewportSize({width:1440,height:1000});if(await page.locator('[data-spec="numbers"]').getAttribute('aria-pressed')!=='true')await page.locator('[data-spec="numbers"]').click();await page.locator('[data-local-pin="review-summary"]').click();assert.equal(await page.locator('.ui-spec-panel').isVisible(),true);assert.equal(await page.locator('#yj-spec-review-summary.selected').count(),1);await page.locator('[data-local-pin="review-summary"]').click();assert.equal(await page.locator('.ui-spec-panel').isVisible(),false);await page.screenshot({path:'/tmp/yeojeong-reviews.png',fullPage:true});
 // 유효하지 않은 여행지의 빈 상태도 복귀 링크를 제공해야 합니다.
 await page.evaluate(()=>YJ.go('TRV-05',{destinationId:'missing'}));await page.locator('.empty-state').waitFor();assert.ok(await page.getByRole('link',{name:'목록으로 이동',exact:true}).count());
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await browser.close();console.log('PASS: 6 destinations, star keyboard navigation, correct average/count/full reviews, score filters/sort/empty state, selected destination on back/reload, public access, 5 responsive widths, descriptions and pin toggle, invalid destination.');
})().catch(e=>{console.error(e);process.exit(1)});
