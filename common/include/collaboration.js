/* 서버 없이 브라우저 보관 및 프로젝트별 JSON 파일 가져오기·내보내기 */
(()=>{
 'use strict';
 const PROJECT=document.body.dataset.project||window.MOCKUP_SHARED_CONFIG.defaultProject;
 const KEY='study.descriptions.local.v1.'+PROJECT,FORMAT='study-descriptions-v1';
 let all=[],published=[],loaded=false,error='',loading=false,initial;
 const publishedUrl=new URL('descriptions.json',location.href);publishedUrl.search='';publishedUrl.hash='';
 const changed=()=>window.dispatchEvent(new Event('collaboration-updated'));
 const current=()=>window.MOCKUP_DESCRIPTION_CONTEXT?.id||decodeURIComponent(location.hash.slice(1))||document.body.dataset.screen||'screens';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const text=(x,max)=>typeof x==='string'&&x.length<=max;
 function validate(rows){
  if(!Array.isArray(rows)||rows.length>2000)throw Error('설명 목록 형식이나 개수를 확인해 주세요.');
  const ids=new Set();
  for(const r of rows){
   if(!r||!text(r.id,100)||!r.id||ids.has(r.id)||!text(r.screen,200)||!r.screen||!text(r.text,5000)||!Number.isSafeInteger(r.number)||r.number<1||!Number.isSafeInteger(r.revision)||r.revision<1||!text(r.author,100)||(!text(r.created,100)||!Number.isFinite(Date.parse(r.created)))||!Array.isArray(r.comments))throw Error('설명 데이터 형식이 올바르지 않습니다.');
   ids.add(r.id);const a=r.anchor;
   if(!a||!text(a.selector,1000)||!a.selector||!text(a.sample||'',100)||!Number.isFinite(a.x)||!Number.isFinite(a.y)||a.x<0||a.x>1||a.y<0||a.y>1)throw Error('핀 위치 데이터가 올바르지 않습니다.');
   try{document.createDocumentFragment().querySelector(a.selector);}catch{throw Error('핀 선택자 형식이 올바르지 않습니다.');}
   for(const k of ['offsetX','offsetY'])if(a[k]!==undefined&&(!Number.isFinite(a[k])||Math.abs(a[k])>4096))throw Error('핀 이동 범위를 확인해 주세요.');
   if(r.updated!==undefined&&(!text(r.updated,100)||!Number.isFinite(Date.parse(r.updated)))||r.updatedBy!==undefined&&!text(r.updatedBy,100))throw Error('수정 정보 형식이 올바르지 않습니다.');
   for(const c of r.comments){if(!c||!text(c.id,100)||!text(c.author,100)||!text(c.text,5000)||(!text(c.created,100)||!Number.isFinite(Date.parse(c.created)))||!Number.isSafeInteger(c.revision)||c.revision<1||!['미처리','처리중','처리완료'].includes(c.status))throw Error('댓글 형식이 올바르지 않습니다.');}
  }
  return clone(rows);
 }
 function read(){const raw=localStorage.getItem(KEY);return raw!==null?validate(JSON.parse(raw)):clone(published);}
 function commit(rows){const checked=validate(rows);try{localStorage.setItem(KEY,JSON.stringify(checked));}catch{throw Error('브라우저 저장 공간이 부족하거나 저장이 차단되었습니다. 기존 데이터는 유지됩니다.');}all=checked;loaded=true;error='';changed();}
 function parseFile(raw){let data;try{data=JSON.parse(raw);}catch{throw Error('올바른 JSON 파일이 아닙니다.');}if(data?.format!==FORMAT||data.project!==PROJECT)throw Error('현재 프로젝트('+PROJECT+')의 설명 JSON 파일을 선택해 주세요.');return validate(data.records);}
 async function refresh(){
  if(loading)return initial;
  loading=true;changed();
  try{
   const response=await fetch(publishedUrl,{cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw Error('descriptions.json 응답: '+response.status);
   const raw=await response.text();if(raw.length>5*1024*1024)throw Error('JSON 파일이 너무 큽니다.');
   const next=parseFile(raw);published=next;all=read();loaded=true;error='';
  }catch(e){
   error='저장소 descriptions.json을 읽지 못했습니다. 로컬 웹 서버로 실행하고 파일 형식을 확인해 주세요.';
   try{if(localStorage.getItem(KEY)!==null){all=read();loaded=true;}}catch{error+=' 브라우저 임시 저장도 확인해 주세요.';}
  }finally{loading=false;changed();}
 }
 window.GFAIR_COLLAB={user:null,githubReady:false,mode:'local',get records(){return clone(all.filter(r=>r.screen===current()));},get loading(){return loading;},get hasDraft(){try{return localStorage.getItem(KEY)!==null;}catch{return false;}},get loaded(){return loaded;},get error(){return error;},refresh,
  exportData(){if(!loaded)throw Error('기존 데이터를 읽지 못해 내보낼 수 없습니다.');return JSON.stringify({format:FORMAT,project:PROJECT,exportedAt:new Date().toISOString(),records:all},null,2);},
  importData(raw){commit(parseFile(raw));},
  async usePublished(){await refresh();if(error)throw Error(error);try{localStorage.removeItem(KEY);}catch{throw Error('브라우저 임시 저장을 지우지 못했습니다.');}all=clone(published);changed();},
  async planningNotes(){return all.flatMap(r=>{try{const s=JSON.parse(r.text);return s.planningNote?[{id:r.id,screen:r.screen,number:r.number,item:s.item||'',planningNote:s.planningNote}]:[];}catch{return [];}});},
  async mutate(op,body){
   await initial;if(!loaded)throw Error(error||'설명을 불러오는 중입니다.');
   let rows;try{rows=read();}catch{throw Error('기존 데이터를 읽지 못해 저장을 중단했습니다.');}
   const now=new Date().toISOString();let id=body.id;
   if(op==='create'){id='local-'+Date.now().toString(36)+'-'+Array.from(crypto.getRandomValues(new Uint8Array(12)),x=>x.toString(16).padStart(2,'0')).join('');rows.push({id,screen:body.screen,text:body.text,anchor:body.anchor,number:Math.max(0,...rows.filter(r=>r.screen===body.screen).map(r=>r.number))+1,revision:1,author:'로컬 편집',created:now,comments:[]});}
   else if(op==='status'){const parent=rows.find(r=>r.comments.some(c=>c.id===id)),c=parent?.comments.find(c=>c.id===id);if(!c)throw Error('댓글을 찾지 못했습니다.');if(c.revision!==body.revision)throw Error('다른 사용자가 수정했습니다. 다시 불러와 주세요.');Object.assign(c,{status:body.status,revision:c.revision+1,updated:now,updatedBy:'로컬 편집'});parent.revision++;}
   else {const r=rows.find(r=>r.id===id);if(!r)throw Error('설명을 찾지 못했습니다.');if(r.revision!==body.revision)throw Error('다른 사용자가 수정했습니다. 다시 불러와 주세요.');if(op==='delete')rows=rows.filter(r=>r.id!==id);else{if(op==='update')r.text=body.text;else if(op==='move')Object.assign(r.anchor,{offsetX:body.offsetX,offsetY:body.offsetY});else throw Error('지원하지 않는 작업입니다.');Object.assign(r,{revision:r.revision+1,updated:now,updatedBy:'로컬 편집'});}}
   commit(rows);return {id};
  }
 };
 window.addEventListener('hashchange',changed);window.addEventListener('description-context-changed',changed);
 window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)refresh();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 document.addEventListener('click',event=>{if(event.target.closest('[data-spec=refresh]'))refresh();});
 initial=refresh();
})();
