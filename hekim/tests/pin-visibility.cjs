/* 번호 토글은 Description 패널 열림 상태와 독립적으로 동작해야 합니다. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/collab**',route=>route.fulfill({json:{records:[],user:null,githubConfigured:false}}));
 await page.goto(process.env.YEOJEONG_TEST_URL||'http://127.0.0.1:8765/hekim/index.html');
 const panel=page.locator('.ui-spec-panel'),numbers=page.locator('[data-spec="numbers"]'),pins=page.locator('.yj-spec-pin:visible');
 assert.equal(await panel.isVisible(),false);
 assert.ok(await pins.count()>0);
 await numbers.click();assert.equal(await pins.count(),0);
 await numbers.click();assert.equal(await panel.isVisible(),false);assert.ok(await pins.count()>0);
 await page.locator('.ui-spec-screen-picker').selectOption('TRV-02');await page.locator('.destination-detail').waitFor();assert.ok(await pins.count()>0);
 await page.reload();assert.equal(await panel.isVisible(),false);assert.ok(await pins.count()>0);
 await page.locator('[data-local-pin="destination-info"]').click();assert.equal(await panel.isVisible(),true);assert.ok(await page.locator('#yj-spec-destination-info.selected').count());
 await page.locator('[data-spec="close"]').click();assert.equal(await panel.isVisible(),false);assert.ok(await pins.count()>0);
 await numbers.click();await page.reload();assert.equal(await pins.count(),0);await numbers.click();assert.ok(await pins.count()>0);
 await page.locator('[data-spec="screen-search"]').click();await page.locator('.screen-directory').waitFor();assert.equal(await pins.count(),0);assert.equal(await panel.isVisible(),false);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: pins independent of panel, toggle persistence, routing, reload, pin opens description, directory hides pins.');
})().catch(error=>{console.error(error);process.exit(1)});
