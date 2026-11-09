(() => {
  const S=window.YJStore,D=window.YEOJEONG_DEMO;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let context={destinationId:'kyoto',tripId:'trip-demo',noticeId:'notice-3',inquiryId:'inquiry-demo'};
  try{context={...context,...JSON.parse(sessionStorage.getItem('yeojeong.context')||'{}')};}catch{}
  const state={context,region:'전체',category:'전체',keyword:'',sort:'popular',homeRegion:'전체',tripStatus:'전체',noticeQuery:'',noticeCategory:'전체',faqCategory:'전체',faqQuery:'',authTab:'id',authResult:'',resetReady:false,agreements:null,inquiryEdit:false,editor:null,editorDirty:false,editorDay:0,returnTo:'',tripEdit:false};
  const Y=window.YJ={S,D,state,esc,content:document.getElementById('content'),
    link(id,label,ctx={},cls=''){return `<a href="#${id}" data-go="${id}" data-context="${esc(JSON.stringify(ctx))}" class="${cls}">${label}</a>`;},
    button(label,action,attrs='',cls='outline'){return `<button type="button" data-action="${action}" ${attrs} class="${cls}">${label}</button>`;},
    section(key,html,cls=''){return `<section data-description-key="${key}" class="${cls}">${html}</section>`;},
    field(name,label,options={}){const {type='text',value='',required=false,max=100,hint='',attrs=''}=options;return `<label class="form-field"><span>${label}${required?' <b class="required">*</b>':''}</span><input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} maxlength="${max}" ${attrs}>${hint?`<small>${hint}</small>`:''}<span class="input-error" data-error="${name}"></span></label>`;},
    searchIcon(){return '<svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="3"/><path d="m15 15 6 6" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>';},
    errorBox(){return '<p class="form-error" role="alert" tabindex="-1"></p>';},
    pageHead(kicker,title,subtitle,action=''){return `<div class="page-heading"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;},
    empty(title,body,action=''){return `<div class="empty-state"><span aria-hidden="true">✧</span><h2>${title}</h2><p>${body}</p>${action}</div>`;},
    destination(id=state.context.destinationId){return D.destinations.find(d=>d.id===id);},
    reviews(id=state.context.destinationId){return window.YEOJEONG_REVIEWS[id]||[];},
    trip(){return S.data.trips.find(t=>t.id===state.context.tripId);},
    notice(){return D.notices.find(n=>n.id===state.context.noticeId);},
    inquiry(){return S.data.inquiries.find(n=>n.id===state.context.inquiryId);},
    route(){return location.hash.slice(1)||'HOME-01';},
    saveContext(ctx){state.context={...state.context,...ctx};try{sessionStorage.setItem('yeojeong.context',JSON.stringify(state.context));}catch{}},
    go(id,ctx={}){Y.saveContext(ctx);if(Y.route()===id){history.replaceState({yj:state.context},'','#'+id);Y.render();}else{history.pushState({yj:state.context},'','#'+id);window.dispatchEvent(new HashChangeEvent('hashchange'));}},
    toast(message){const t=document.getElementById('toast');t.textContent=message;t.classList.add('visible');clearTimeout(Y.toastTimer);Y.toastTimer=setTimeout(()=>t.classList.remove('visible'),4500);},
    formError(form,message,name){const box=form.querySelector('.form-error');if(box){box.textContent=message;box.focus();}if(name){const field=form.elements.namedItem(name);field?.setAttribute('aria-invalid','true');field?.focus();const inline=form.querySelector(`[data-error="${name}"]`);if(inline)inline.textContent=message;}},
    gate(){return Y.section('access',Y.empty('나만의 여정을 시작해요','로그인하고 여행 일정을 만들거나 마음에 드는 여행지를 담아보세요.',Y.link('AUTH-01','로그인',{},'primary')));},
    recommend(d,variant=0){const length=variant?Math.max(2,d.period-1):d.period;return {title:`${d.name} ${length}일 ${variant?'핵심 산책':'느긋한 발견'}`,length,days:Array.from({length},(_,i)=>({places:d.spots.slice(i*2,i*2+2).map((name,j)=>({name,time:j?'14:00':'09:00',note:j?'점심 후 천천히 둘러보기':'오전 방문 추천'})),memo:i===0?'교통편과 운영시간을 출발 전에 확인해 주세요.':''}))};},
    status(trip){const today=S.today();return trip.start>today?'예정':trip.end<today?'완료':'여행 중';},
    timeline(days,start='',editable=false){return days.map((day,i)=>`<section class="day-block"><header><strong>DAY ${String(i+1).padStart(2,'0')}</strong><span>${start?esc(S.dates(start,new Date(Date.parse(start+'T00:00:00Z')+(days.length-1)*86400000).toISOString().slice(0,10))[i]):'추천 코스'}</span></header><ol class="timeline">${day.places.map((p,j)=>`<li><span class="time">${esc(p.time)||'시간 미정'}</span><div><b>${esc(p.name)}</b>${p.note?`<p>${esc(p.note)}</p>`:''}</div></li>`).join('')||'<li class="no-place">등록한 장소가 없어요.</li>'}</ol>${day.memo?`<p class="day-memo">메모 · ${esc(day.memo)}</p>`:''}</section>`).join('');},
    modal(kind,title,body,onSubmit,confirmLabel='확인'){const dialog=document.getElementById('service-dialog');dialog.id=Y.route()+'-p'+(kind==='confirm'?'01':'02');dialog.dataset.serviceDialog='';dialog.setAttribute('aria-labelledby','service-modal-title');dialog.innerHTML=`<form id="modal-form"><header class="modal-heading"><h2 id="service-modal-title">${title}</h2><button type="button" data-action="close-modal" class="modal-close" aria-label="팝업 닫기">×</button></header>${body}${Y.errorBox()}<div class="form-actions">${Y.button('취소','close-modal')}<button class="primary" type="submit">${confirmLabel}</button></div></form>`;Y.modalSubmit=onSubmit;dialog.showModal();},
    closeModal(){const dialog=document.querySelector('[data-service-dialog]');dialog.close();dialog.id='service-dialog';Y.modalSubmit=null;},
    confirm(title,body,callback){Y.modal('confirm',title,`<p class="modal-copy">${body}</p>`,()=>{callback();Y.closeModal();},'확인');},
    login(remember=false){S.login(remember);const target=state.returnTo||'MYTR-01';state.returnTo='';Y.go(target);Y.toast('로그인되었어요.');},
    download(name,body,type='text/plain;charset=utf-8'){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  };
  // 모든 폼에 가시적인 필수 표시와 오류 영역을 유지합니다.
  document.addEventListener('invalid',e=>{if(!e.target.closest('#content,[data-service-dialog]'))return;const form=e.target.form;if(form){e.preventDefault();const v=e.target.validity;let message='입력한 값을 확인해 주세요.';if(v.valueMissing)message=e.target.type==='checkbox'?'필수 항목에 동의해 주세요.':e.target.tagName==='SELECT'?'필수 항목을 선택해 주세요.':'필수 항목을 입력해 주세요.';else if(v.typeMismatch)message='올바른 이메일 형식으로 입력해 주세요.';else if(v.patternMismatch)message='안내된 입력 형식에 맞춰 주세요.';else if(v.tooShort)message='최소 '+e.target.minLength+'자 이상 입력해 주세요.';else if(v.rangeUnderflow||v.rangeOverflow)message='허용된 날짜 범위에서 선택해 주세요.';Y.formError(form,message,e.target.name);}},true);
  document.addEventListener('input',e=>{if(e.target.hasAttribute('aria-invalid'))e.target.removeAttribute('aria-invalid');const form=e.target.form;if(form){const inline=form.querySelector(`[data-error="${e.target.name}"]`);if(inline)inline.textContent='';}});
})();
