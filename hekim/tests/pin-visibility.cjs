/* 번호의 기본 숨김, 전용 줄 배치 및 디스크립션 토글 회귀 검증 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/collab**',route=>route.fulfill({json:{records:[],user:null,githubConfigured:false}}));
 // 이전 방문의 보이기 상태도 첫 로드 시 숨김으로 초기화되어야 합니다.
 await page.addInitScript(()=>sessionStorage.setItem('mockup.description.numbers.hekim','true'));
 await page.goto(process.env.YEOJEONG_TEST_URL||'http://127.0.0.1:8765/hekim/index.html');
 const panel=page.locator('.ui-spec-panel'),numbers=page.locator('[data-spec="numbers"]'),pins=page.locator('.yj-spec-pin:visible');
 const wait=()=>page.waitForTimeout(70),go=async id=>{await page.locator('.ui-spec-screen-picker').selectOption(id);await wait();};
 assert.equal(await panel.isVisible(),false);assert.equal(await pins.count(),0);assert.equal(await numbers.innerText(),'번호 보이기');
 await numbers.click();assert.ok(await pins.count()>0);assert.equal(await panel.isVisible(),false);
 const first=page.locator('[data-local-pin="hero"]'),second=page.locator('[data-local-pin="search"]');
 await first.click();assert.equal(await panel.isVisible(),true);assert.equal(await first.getAttribute('aria-expanded'),'true');assert.ok(await page.locator('#yj-spec-hero.selected').count());
 await first.click();assert.equal(await panel.isVisible(),false);assert.equal(await first.getAttribute('aria-expanded'),'false');assert.ok(await pins.count()>0);
 await first.click();await second.click();assert.equal(await panel.isVisible(),true);assert.ok(await page.locator('#yj-spec-search.selected').count());assert.equal(await first.getAttribute('aria-expanded'),'false');assert.equal(await second.getAttribute('aria-expanded'),'true');await second.click();assert.equal(await panel.isVisible(),false);
 await numbers.click();assert.equal(await pins.count(),0);await numbers.click();await go('TRV-02');assert.equal(await pins.count(),0);assert.equal(await numbers.innerText(),'번호 보이기');
 await numbers.click();await page.reload();assert.equal(await pins.count(),0);assert.equal(await numbers.getAttribute('aria-pressed'),'false');
 // 전체 화면에서 콘텐츠와 핀의 실제 사각형이 겹치지 않는지 확인합니다.
 await go('AUTH-01');await page.locator('#login-form button[type="submit"]').click();await page.locator('.trip-grid').waitFor();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  for(const id of await page.evaluate(()=>YEOJEONG_SCREENS.map(s=>s.id))){
   await go(id);assert.equal(await pins.count(),0);await numbers.click();assert.ok(await pins.count()>0,id);
   for(const open of [false,true]){
    if(await panel.isVisible()!==open)await page.locator('[data-spec="close"]').click();
    const overlaps=await page.evaluate(()=>{
      const controls=[...document.querySelectorAll('#content button,#content a,#content input,#content select,#content textarea,#content summary,#content h1,#content h2,#content h3,#content label')].filter(el=>!el.closest('.yj-pin-rail')&&el.getClientRects().length);
      return [...document.querySelectorAll('.yj-spec-pin')].filter(pin=>pin.getClientRects().length).flatMap(pin=>{const a=pin.getBoundingClientRect();return controls.filter(control=>{const b=control.getBoundingClientRect();return Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;}).map(control=>({pin:pin.dataset.localPin,tag:control.tagName,text:control.textContent.slice(0,30)}));});
    });
    assert.deepEqual(overlaps,[],`${id} width=${width} open=${open}`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   }
  }
 }
 await page.setViewportSize({width:1440,height:1000});await go('MYTR-01');if(await panel.isVisible())await page.locator('[data-spec="close"]').click();await numbers.click();await page.screenshot({path:'/tmp/yeojeong-pins-rail.png',fullPage:true});
 await page.locator('[data-spec="screen-search"]').click();await page.locator('.screen-directory').waitFor();assert.equal(await pins.count(),0);assert.equal(await panel.isVisible(),false);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: hidden on entry/reload/navigation, same-pin open/close, switching pins, ARIA state, non-overlap in all all registered screens at PC/mobile with descriptions open/closed.');
})().catch(error=>{console.error(error);process.exit(1)});
