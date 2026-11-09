/* hekim 기준 명세를 기존 공통 Description 패널에 추가합니다.
   공통 도구·공동 편집기·서버 저장소는 수정하거나 복제하지 않습니다. */
(() => {
  const Y=window.YJ,panel=document.querySelector('.ui-spec-panel');if(!panel)return;
  const labels={item:'항목',type:'유형',defaultValue:'기본값',placeholder:'플레이스홀더',options:'선택 옵션',required:'필수여부',detail:'기능상세',inputLimit:'입력 제한',validation:'유효성 검사',errorMessage:'오류 안내',visibility:'표시 조건',permission:'사용 권한',destination:'이동·연결 대상',dataSource:'데이터 출처',policy:'기본정책',exception:'예외사항',emptyState:'데이터 없음'};
  function specs(){return window.YEOJEONG_DESCRIPTIONS[Y.route()]||[];}
  function select(key,fromPin=false){
    const item=document.getElementById('yj-spec-'+key),target=document.querySelector(`[data-description-key="${key}"]`);
    panel.querySelectorAll('.yj-spec-card').forEach(card=>card.classList.toggle('selected',card===item));
    if(fromPin)item?.scrollIntoView({behavior:'smooth',block:'nearest'});else if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.animate([{outline:'3px solid #c62828'},{outline:'3px solid transparent'}],{duration:1300});}
  }
  function renderPanel(){
    const old=panel.querySelector('.yj-local-specs');if(old?.dataset.route===Y.route()){if(panel.firstElementChild!==old)panel.prepend(old);return;}
    old?.remove();if(Y.route()==='screens')return;
    const screen=window.YEOJEONG_SCREENS.find(s=>s.id===Y.route());if(!screen)return;
    const section=document.createElement('section');section.className='yj-local-specs';section.dataset.route=Y.route();
    section.innerHTML=`<h2>[${screen.id}] ${Y.esc([screen.lv1,screen.lv2,screen.lv3].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · '))}</h2><div class="yj-screen-overview"><h3>화면 개요</h3><p>${Y.esc(screen.description.replace(/^-\s*/gm,'')).replace(/\n/g,'<br>')}</p><small>원본 엑셀 ${screen.sourceRow}행 · 기준 명세 · 브라우저 실습 데이터</small></div>${specs().map((spec,i)=>`<article class="yj-spec-card" id="yj-spec-${spec.key}"><header><button type="button" data-local-spec="${spec.key}" aria-label="${String(i+1).padStart(2,'0')}번 ${Y.esc(spec.item)} 위치 보기">${String(i+1).padStart(2,'0')}</button><span>${Y.esc(spec.item)}</span></header><dl>${Object.entries(labels).filter(([key])=>spec[key]!==undefined).map(([key,label])=>`<dt>${label}</dt><dd>${Y.esc(spec[key]).replace(/\n/g,'<br>')}</dd>`).join('')}</dl></article>`).join('')}<p class="yj-spec-note">이 기준 명세는 로그인 없이 확인할 수 있습니다. 아래 공동 검토 설명은 기존 서버의 별도 편집 데이터입니다.</p>`;
    panel.prepend(section);
  }
  function pins(){
    Y.content.querySelectorAll('.yj-spec-pin').forEach(pin=>pin.remove());
    if(Y.route()==='screens')return;
    specs().forEach((spec,i)=>{const target=Y.content.querySelector(`[data-description-key="${spec.key}"]`);if(!target)return;target.classList.add('yj-spec-target');const button=document.createElement('button');button.type='button';button.className='yj-spec-pin';button.dataset.localPin=spec.key;button.textContent=String(i+1).padStart(2,'0');button.setAttribute('aria-label',button.textContent+'번 '+spec.item+' 설명 보기');target.prepend(button);});
  }
  function sync(){const view=window.GFAIR_DESCRIPTION_VIEW||{closed:true,numbers:true};document.body.classList.toggle('yj-show-pins',!view.closed&&view.numbers&&Y.route()!=='screens');const close=document.querySelector('[data-spec="close"]');if(close)close.textContent=view.closed?'디스크립션 열기':'디스크립션 닫기';renderPanel();}
  // 공통 패널이 새로 그려지는 경우에만 기준 명세를 복원합니다. 하위 노드 변경은 관찰하지 않습니다.
  new MutationObserver(()=>{renderPanel();const title=panel.querySelector('#annotation-panel > h2');if(title)title.textContent='공동 검토 설명';}).observe(panel,{childList:true});
  document.addEventListener('click',event=>{const pin=event.target.closest('[data-local-pin]');if(pin){event.preventDefault();event.stopPropagation();window.dispatchEvent(new Event('annotation-open'));select(pin.dataset.localPin,true);}const card=event.target.closest('[data-local-spec]');if(card)select(card.dataset.localSpec);});
  window.addEventListener('yeojeong-render',()=>{pins();sync();});window.addEventListener('annotation-sync',sync);window.addEventListener('hashchange',sync);
  pins();sync();
})();
