/* 화면 라우팅과 사용자 동작. 화면 UI는 views.js, 저장은 store.js에서 관리합니다. */
(() => {
  const Y=window.YJ,{S,D,state,esc:e}=Y;
  const screens=window.YEOJEONG_SCREENS;
  const groups=[...new Set(screens.map(s=>s.lv1))];
  const screenTitle=s=>[s.lv1,s.lv2,s.lv3].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · ');
  window.GFAIR_SCREENS=groups.map(name=>({name,screens:screens.filter(s=>s.lv1===name).map(s=>({...s,title:screenTitle(s),summary:s.description}))}));
  window.GFAIR_SCREEN_OVERVIEWS=Object.fromEntries(screens.map(s=>[s.id,s.description]));
  function render(){
    if(history.state?.yj)state.context={...state.context,...history.state.yj};
    const id=Y.route(),screen=screens.find(s=>s.id===id);
    document.body.dataset.screen=screen?.id||'HOME-01';
    document.getElementById('screen-meta').textContent=screen?`${id} / ${screenTitle(screen)}`:'전체 화면 목록';
    if(id==='screens')Y.content.innerHTML=`<section class="screen-directory"><h1>전체 화면 목록</h1><p class="muted">화면을 선택해 이동하세요. 20개 화면 모두 구현되어 있습니다.</p>${screens.map(s=>Y.link(s.id,`<b>${s.id}</b> ${screenTitle(s)} <small>구현 완료</small>`)).join('')}</section>`;
    else if(!screen)Y.content.innerHTML=Y.empty('화면을 찾을 수 없어요','상단의 화면 선택 또는 화면검색을 이용해 주세요.',Y.link('HOME-01','메인으로 이동',{},'primary'));
    else Y.content.innerHTML=Y.serviceHeader()+(S.error?`<p class="storage-warning" role="alert">${e(S.error)}</p>`:'')+Y.views[id]()+Y.serviceFooter();
    document.title=`${screen?screenTitle(screen):'화면 목록'} | YEOJEONG 웹 기획안`;
    Y.content.querySelectorAll('.sub-tabs a,.service-header nav a').forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','page');});
    window.dispatchEvent(new Event('yeojeong-render'));
  }
  Y.render=render;
  function requireLogin(){if(S.loggedIn)return true;state.returnTo=Y.route();Y.go('AUTH-01');Y.toast('로그인 후 이용해 주세요.');return false;}
  const saveEditor=()=>{if(!state.editor)return;S.save(data=>{const i=data.trips.findIndex(t=>t.id===state.editor.id);if(i<0)throw Error('이 여행이 삭제되어 저장할 수 없습니다.');data.trips[i]=JSON.parse(JSON.stringify(state.editor));});state.editorDirty=false;render();Y.toast('일정을 브라우저에 저장했어요.');};
  function placeModal(index){
    const day=state.editor.days[state.editorDay],place=index===undefined?null:day.places[index];
    if(!place&&day.places.length>=20){Y.toast('하루 최대 20개 장소까지 추가할 수 있어요.');return;}
    Y.modal('edit',place?'방문 장소 수정':'방문 장소 추가',`${Y.field('name','장소명',{required:true,max:80,value:place?.name||'',attrs:'list="place-suggestions"'})}<datalist id="place-suggestions">${(Y.destination(state.editor.destinationId)?.spots||[]).map(s=>`<option value="${s}">`).join('')}</datalist>${Y.field('time','방문 시간',{type:'time',value:place?.time||''})}<label class="form-field"><span>장소 메모</span><textarea name="note" rows="3" maxlength="200">${e(place?.note||'')}</textarea><small>최대 200자</small></label>`,form=>{const fd=new FormData(form),name=fd.get('name').trim();if(!name){Y.formError(form,'장소명을 입력해 주세요.','name');return;}const item={name,time:fd.get('time'),note:fd.get('note').trim()};if(place)day.places[index]=item;else day.places.push(item);state.editorDirty=true;Y.closeModal();render();},'적용');
  }
  const actions={
    logout:()=>Y.confirm('로그아웃할까요?','로그아웃 후에도 저장한 여행은 유지됩니다.',()=>{S.logout();state.editor=null;state.editorDirty=false;Y.go('HOME-01');Y.toast('로그아웃했어요.');}),
    favorite:el=>{if(!requireLogin())return;const id=el.dataset.id;if(!Y.destination(id))return;const liked=S.data.favorites.includes(id);S.save(data=>{data.favorites=liked?data.favorites.filter(x=>x!==id):[...data.favorites,id];});render();Y.toast(liked?'찜을 해제했어요.':'여행지를 찜했어요.');},
    'home-filter':el=>{state.homeRegion=el.dataset.value;render();},
    'reset-travel':()=>{Object.assign(state,{region:'전체',category:'전체',keyword:'',sort:'popular'});render();},
    'auth-tab':el=>{state.authTab=el.dataset.value;state.authResult='';state.resetReady=false;render();},
    'trip-filter':el=>{state.tripStatus=el.dataset.value;render();},
    'edit-trip':()=>{state.tripEdit=true;Y.go('MYTR-02');},
    'cancel-trip-form':()=>{Y.go(state.tripEdit?'MYTR-03':'MYTR-01');state.tripEdit=false;},
    'delete-trip':el=>{if(!requireLogin())return;const id=el.dataset.id,t=S.data.trips.find(x=>x.id===id);if(!t)return;Y.confirm('여행을 삭제할까요?',`${e(t.title)}의 여행 정보와 모든 일정을 삭제합니다. 삭제 후 복원할 수 없습니다.`,()=>{S.save(data=>{data.trips=data.trips.filter(x=>x.id!==id);});if(state.editor?.id===id){state.editor=null;state.editorDirty=false;}Y.go('MYTR-01');Y.toast('여행을 삭제했어요.');});},
    'copy-itinerary':()=>{
      if(!requireLogin())return;const d=Y.destination(),r=Y.recommend(d,Number(state.context.recommendation)||0);
      Y.modal('edit','추천 일정을 내 여행에 담기',`${Y.field('title','여행 제목',{required:true,max:60,value:r.title})}${Y.field('start','여행 시작일',{type:'date',required:true,attrs:'min="2020-01-01" max="2100-11-30"'})}<p class="muted">${r.length}일 일정이 복사되며 원본 추천 일정은 유지됩니다.</p>`,form=>{const fd=new FormData(form),title=fd.get('title').trim(),start=fd.get('start');if(!title){Y.formError(form,'여행 제목을 입력해 주세요.','title');return;}const end=new Date(Date.parse(start+'T00:00:00Z')+(r.length-1)*86400000).toISOString().slice(0,10),id=S.uid('trip');S.save(data=>{data.trips.unshift({id,title,destinationId:d.id,start,end,days:JSON.parse(JSON.stringify(r.days))});});Y.closeModal();Y.go('MYTR-03',{tripId:id});Y.toast('추천 일정을 내 여행에 담았어요.');},'내 여행에 담기');
    },
    'editor-day':el=>{state.editorDay=Number(el.dataset.index);render();},
    'add-place':()=>placeModal(),
    'edit-place':el=>placeModal(Number(el.dataset.index)),
    'delete-place':el=>{const index=Number(el.dataset.index);Y.confirm('장소를 삭제할까요?',e(state.editor.days[state.editorDay].places[index].name)+'을(를) 일정에서 제외합니다. 일정 저장 전까지 원본에 반영되지 않습니다.',()=>{state.editor.days[state.editorDay].places.splice(index,1);state.editorDirty=true;render();});},
    'move-place':el=>{const i=Number(el.dataset.index),to=i+Number(el.dataset.direction),places=state.editor.days[state.editorDay].places;if(to<0||to>=places.length)return;[places[i],places[to]]=[places[to],places[i]];state.editorDirty=true;render();},
    'save-itinerary':saveEditor,
    'cancel-editor':()=>{const leave=()=>{state.editor=null;state.editorDirty=false;Y.go('MYTR-03');};if(state.editorDirty)Y.confirm('변경을 취소할까요?','저장하지 않은 일정 변경사항은 사라집니다.',leave);else leave();},
    'reset-notices':()=>{state.noticeQuery='';state.noticeCategory='전체';render();},
    'reset-faq':()=>{state.faqQuery='';state.faqCategory='전체';render();},
    'notice-download':()=>{const n=Y.notice();if(n?.attachment)Y.download(n.attachment,n.title+'\n\n'+n.body);},
    'edit-inquiry':()=>{if(Y.inquiry()?.status!=='답변 대기'){Y.toast('답변 대기 문의만 수정할 수 있어요.');return;}state.inquiryEdit=true;Y.go('SUP-04');},
    'cancel-inquiry':()=>{state.inquiryEdit=false;Y.go('SUP-05');},
    'delete-inquiry':()=>{const n=Y.inquiry();if(!n||n.status!=='답변 대기')return;Y.confirm('문의를 삭제할까요?','등록한 문의와 첨부파일이 이 브라우저에서 삭제됩니다.',()=>{S.save(data=>{data.inquiries=data.inquiries.filter(x=>x.id!==n.id);});state.inquiryEdit=false;Y.go('SUP-04');Y.toast('문의를 삭제했어요.');});},
    'inquiry-download':()=>{const file=Y.inquiry()?.file;if(!file)return;const [meta,content]=file.data.split(','),binary=atob(content),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));Y.download(file.name,bytes,meta.slice(5).split(';')[0]);},
    withdraw:()=>Y.confirm('회원 탈퇴를 진행할까요?','이 브라우저의 프로필·여행·찜·문의·첨부파일이 삭제됩니다. 복원할 수 없습니다.',()=>{S.withdraw();state.editor=null;state.editorDirty=false;Y.go('HOME-01');Y.toast('회원 탈퇴가 완료되었습니다.');}),
    'close-modal':()=>Y.closeModal()
  };
  const handlers={
    'home-search':form=>{const value=form.elements.query.value.trim();if(!value){Y.formError(form,'여행지 또는 국가를 입력해 주세요.','query');return;}state.keyword=value;state.region='전체';state.category='전체';Y.go('TRV-01');},
    'travel-filter':form=>{const fd=new FormData(form);Object.assign(state,{region:fd.get('region'),category:fd.get('category'),keyword:fd.get('keyword').trim()});render();},
    'login-form':form=>{const fd=new FormData(form);if(fd.get('id').trim()!==S.data.profile.id){Y.formError(form,'아이디를 확인해 주세요.','id');return;}if(fd.get('password').length<8){Y.formError(form,'비밀번호를 8자 이상 입력해 주세요.','password');return;}Y.login(fd.get('remember')==='on');},
    'agreement-form':form=>{const fd=new FormData(form);if(!fd.has('service')||!fd.has('privacy')){Y.formError(form,'필수 약관에 모두 동의해 주세요.');return;}state.agreements={service:true,privacy:true,marketing:fd.has('marketing')};Y.go('JOIN-02');},
    'join-form':form=>{if(!state.agreements){Y.go('JOIN-01');return;}const fd=new FormData(form);if(fd.get('password')!==fd.get('confirm')){Y.formError(form,'비밀번호가 일치하지 않습니다.','confirm');return;}if(fd.get('id').trim()===S.data.profile.id){Y.formError(form,'이미 사용 중인 아이디입니다.','id');return;}for(const k of ['name','nickname'])if(!fd.get(k).trim()){Y.formError(form,'공백만 입력할 수 없습니다.',k);return;}Y.confirm('회원가입을 완료할까요?','입력한 정보로 가입합니다. 이 브라우저의 기존 프로필과 여행 데이터는 새 계정으로 전환하면서 초기화됩니다.',()=>{S.save(data=>{data.profile={id:fd.get('id').trim(),name:fd.get('name').trim(),nickname:fd.get('nickname').trim(),email:fd.get('email').trim()};data.trips=[];data.favorites=[];data.inquiries=[];data.agreements=state.agreements;});S.logout();state.agreements=null;state.editor=null;state.editorDirty=false;Y.go('AUTH-01');Y.toast('회원가입이 완료되었습니다. 로그인해 주세요.');});},
    'recovery-form':form=>{const fd=new FormData(form),p=S.data.profile;const found=(state.authTab==='id'?fd.get('name').trim()===p.name:fd.get('name').trim()===p.id)&&fd.get('email').trim().toLowerCase()===p.email.toLowerCase();if(!found){Y.formError(form,'입력한 정보와 일치하는 회원이 없습니다.');return;}state.authResult=state.authTab==='id'?`아이디는 ${p.id}입니다.`:'인증번호를 확인하고 입력해 주세요.';state.resetReady=state.authTab==='password';render();},
    'reset-form':form=>{const fd=new FormData(form);if(fd.get('code')!=='123456'){Y.formError(form,'인증번호를 확인해 주세요.','code');return;}if(fd.get('password')!==fd.get('confirm')){Y.formError(form,'비밀번호가 일치하지 않습니다.','confirm');return;}state.resetReady=false;state.authResult='비밀번호 재설정이 완료되었습니다.';render();},
    'trip-form':form=>{
      const fd=new FormData(form),title=fd.get('title').trim(),start=fd.get('start'),end=fd.get('end'),dates=S.dates(start,end),old=state.tripEdit?Y.trip():null;
      if(!title){Y.formError(form,'여행 제목을 입력해 주세요.','title');return;}if(!dates.length){Y.formError(form,'종료일은 시작일 이후여야 하며 여행 기간은 최대 30일입니다.','end');return;}if(!Y.destination(fd.get('destinationId'))){Y.formError(form,'여행 지역을 선택해 주세요.','destinationId');return;}
      const apply=()=>{const id=old?.id||S.uid('trip');S.save(data=>{const days=dates.map((_,i)=>old?.days[i]||{places:[],memo:''});const trip={id,title,destinationId:fd.get('destinationId'),start,end,days};if(old)data.trips[data.trips.findIndex(x=>x.id===id)]=trip;else data.trips.unshift(trip);});state.tripEdit=false;state.editor=null;state.editorDirty=false;Y.go('MYTR-03',{tripId:id});Y.toast('여행 정보를 저장했어요.');};
      if(old&&dates.length<old.days.length)Y.confirm('여행 기간을 줄일까요?','제외되는 날짜의 장소와 메모가 삭제됩니다. 날짜 변경 시 일정은 1일차부터 순서대로 유지됩니다.',apply);else apply();
    },
    'profile-form':form=>{const fd=new FormData(form);for(const k of ['name','nickname'])if(!fd.get(k).trim()){Y.formError(form,'공백만 입력할 수 없습니다.',k);return;}S.save(data=>{data.profile={...data.profile,name:fd.get('name').trim(),nickname:fd.get('nickname').trim(),email:fd.get('email').trim()};});render();Y.toast('회원정보를 저장했어요.');},
    'password-form':form=>{const fd=new FormData(form);if(fd.get('password')!==fd.get('confirm')){Y.formError(form,'새 비밀번호가 일치하지 않습니다.','confirm');return;}if(fd.get('password')===fd.get('current')){Y.formError(form,'새 비밀번호를 현재 입력값과 다르게 입력해 주세요.','password');return;}form.reset();Y.toast('비밀번호 변경이 완료되었습니다.');},
    'notice-filter':form=>{const fd=new FormData(form);state.noticeCategory=fd.get('category');state.noticeQuery=fd.get('keyword').trim();render();},
    'faq-filter':form=>{const fd=new FormData(form);state.faqCategory=fd.get('category');state.faqQuery=fd.get('keyword').trim();render();},
    'inquiry-form':async form=>{
      const fd=new FormData(form),title=fd.get('title').trim(),body=fd.get('body').trim();if(!title||!body){Y.formError(form,'제목과 내용을 공백 없이 입력해 주세요.',!title?'title':'body');return;}const old=state.inquiryEdit?Y.inquiry():null;if(old&&old.status!=='답변 대기'){Y.formError(form,'답변 완료 문의는 수정할 수 없습니다.');return;}
      let file=fd.has('removeFile')?null:old?.file||null;const upload=fd.get('file');if(upload?.size){if(upload.size>2*1024*1024){Y.formError(form,'첨부파일은 최대 2MB입니다.','file');return;}if(!/\.(png|jpe?g|pdf|txt)$/i.test(upload.name)){Y.formError(form,'PNG, JPG, PDF, TXT 파일만 첨부할 수 있습니다.','file');return;}const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('파일을 읽지 못했습니다. 다시 선택해 주세요.'));r.readAsDataURL(upload);});file={name:upload.name,size:upload.size,data};}
      const id=old?.id||S.uid('inquiry'),record={id,type:fd.get('type'),title,body,date:old?.date||S.today(),status:'답변 대기',answer:'',file};S.save(data=>{if(old)data.inquiries[data.inquiries.findIndex(i=>i.id===id)]=record;else data.inquiries.unshift(record);});state.inquiryEdit=false;Y.go('SUP-05',{inquiryId:id});Y.toast('문의가 등록되었습니다.');
    }
  };
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-action]');if(action&&actions[action.dataset.action]){event.preventDefault();try{actions[action.dataset.action](action);}catch(error){Y.toast(error.message);}return;}
    const a=event.target.closest('a[data-go]');if(a&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey){event.preventDefault();if(a.dataset.go==='AUTH-01'&&!S.loggedIn&&/^(MYTR|MYP)-|^SUP-0[45]$/.test(Y.route()))state.returnTo=Y.route();if(a.dataset.go==='MYTR-02')state.tripEdit=false;if(a.dataset.go==='SUP-04')state.inquiryEdit=false;Y.go(a.dataset.go,JSON.parse(a.dataset.context||'{}'));}
  });
  document.addEventListener('submit',async event=>{
    const form=event.target,id=form.getAttribute('id');if(form.closest('#content,[data-service-dialog]'))event.preventDefault();const handler=id==='modal-form'?Y.modalSubmit:handlers[id];if(!handler)return;event.preventDefault();if(form.dataset.submitting==='true'||!form.reportValidity())return;form.querySelectorAll('.form-error,.input-error').forEach(x=>x.textContent='');form.dataset.submitting='true';const submit=form.querySelector('[type="submit"],button:not([type])');if(submit)submit.disabled=true;try{await handler(form);}catch(error){Y.formError(form,error.message);}finally{form.dataset.submitting='false';if(submit)submit.disabled=false;}
  });
  document.addEventListener('change',event=>{if(event.target.id==='travel-sort'){state.sort=event.target.value;render();}if(event.target.id==='terms-all'){event.target.form.querySelectorAll('input[name]').forEach(x=>x.checked=event.target.checked);}if(event.target.closest('#agreement-form')&&event.target.name){const inputs=[...event.target.form.querySelectorAll('input[name]')];document.getElementById('terms-all').checked=inputs.every(x=>x.checked);}});
  document.addEventListener('input',event=>{if(event.target.id==='day-memo'&&state.editor){state.editor.days[state.editorDay].memo=event.target.value;state.editorDirty=true;document.getElementById('save-status').textContent='저장하지 않은 변경사항이 있어요.';}});
  document.querySelector('[data-service-dialog]').addEventListener('cancel',event=>{event.preventDefault();Y.closeModal();});
  window.addEventListener('beforeunload',event=>{if(state.editorDirty){event.preventDefault();event.returnValue='';}});
  let previousRoute=Y.route();
  window.addEventListener('hashchange',()=>{if(previousRoute==='MYTR-02'&&Y.route()!=='MYTR-02')state.tripEdit=false;if(previousRoute==='SUP-04'&&Y.route()!=='SUP-04')state.inquiryEdit=false;previousRoute=Y.route();render();Y.content.focus({preventScroll:true});window.scrollTo(0,0);});
  if(!location.hash)history.replaceState({yj:state.context},'','#HOME-01');
  render();
})();
