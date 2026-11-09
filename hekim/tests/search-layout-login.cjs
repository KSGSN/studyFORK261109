/* 검색 오류 후 레이아웃, SVG 아이콘 및 빈 입력 로그인 회귀 검증 */
const{chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/collab**',r=>r.fulfill({json:{records:[],user:null,githubConfigured:false}}));
 await page.goto(process.env.YEOJEONG_TEST_URL||'http://127.0.0.1:8765/hekim/index.html');
 const wait=()=>page.waitForTimeout(70),go=async id=>{await page.locator('.ui-spec-screen-picker').selectOption(id);await wait();};
 // 보호된 화면 → 로그인 → 입력 없이 로그인 → 원래 화면 복귀.
 await go('MYTR-02');await page.locator('#content a[data-go="AUTH-01"]').last().click();await wait();
 assert.equal(await page.locator('#login-form input[required]').count(),0);
 assert.equal(await page.locator('#login-form [name="id"]').inputValue(),'');assert.equal(await page.locator('#login-form [name="password"]').inputValue(),'');
 await page.locator('#login-form [name="remember"]').check();await page.locator('#login-form button[type="submit"]').click();await page.locator('#trip-form').waitFor();
 assert.equal(await page.evaluate(()=>YJStore.loggedIn),true);assert.equal(new URL(page.url()).search,'');await page.reload();await page.locator('#trip-form').waitFor();assert.equal(await page.evaluate(()=>YJStore.loggedIn),true);
 // 값을 입력하는 경로에서는 기존 아이디·비밀번호 조건 유지.
 await go('AUTH-01');await page.locator('#login-form [name="id"]').fill('demo');await page.locator('#login-form [name="password"]').fill('short');await page.locator('#login-form button[type="submit"]').click();assert.match(await page.locator('#login-form .form-error').innerText(),/8자/);
 // 모든 화면을 PC·모바일 및 Description 분할 화면에서 확인.
 const widths=[1440,1101,768,390,320];
 for(const width of widths){
  await page.setViewportSize({width,height:1000});
  for(const open of [false,true]){
   if(await page.locator('.ui-spec-panel').isVisible()!==open)await page.locator('[data-spec="close"]').click();
   for(const id of await page.evaluate(()=>YEOJEONG_SCREENS.map(s=>s.id))){await go(id);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${id} width=${width} description=${open}`);}
   await go('HOME-01');
   const before=await page.locator('#home-search label').boundingBox();await page.locator('#destination-query').fill('   ');await page.locator('#home-search button[type="submit"]').click();
   const after=await page.locator('#home-search label').boundingBox();assert.ok(after.width>=160,`label ${after.width}px width=${width}`);assert.ok(Math.abs(before.width-after.width)<=1,'error must not shrink input');assert.ok(after.height<90,'label must not wrap one letter per line');
   assert.equal(await page.locator('#home-search .search-icon circle').count(),1);assert.equal(await page.locator('#home-search .search-icon path').count(),1);
   const error=await page.locator('#home-search .form-error').boundingBox(),button=await page.locator('#home-search button[type="submit"]').boundingBox();assert.ok(error.y>=Math.max(after.y+after.height,button.y+button.height),'error must occupy separate row');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(width===1440&&!open)await page.screenshot({path:'/tmp/yeojeong-search-fixed.png',fullPage:true});
  }
 }
 await go('HOME-01');await page.locator('#destination-query').fill('교토');await page.locator('#home-search button[type="submit"]').click();await page.locator('#travel-filter').waitFor();assert.equal(await page.locator('.destination').count(),1);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: blank login/return/remember, entered credential validation, 20 screens × 5 widths × 2 description states, error row does not shrink search input, SVG icons, successful search.');
})().catch(e=>{console.error(e);process.exit(1)});
