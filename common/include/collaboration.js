/* 로그인 없는 공동 편집: 데이터는 공동 서버에 저장합니다. */
(()=>{
 'use strict';
 const SERVER=window.MOCKUP_SHARED_CONFIG.server,PROJECT=document.body.dataset.project||window.MOCKUP_SHARED_CONFIG.defaultProject;
 let records=[],screen='',loading=false,activeRequest=null;
 const changed=()=>window.dispatchEvent(new Event('collaboration-updated'));
 const current=()=>window.MOCKUP_DESCRIPTION_CONTEXT?.id||decodeURIComponent(location.hash.slice(1))||document.body.dataset.screen||'screens';
 async function api(op,body,options={}){
  if(!SERVER)throw Error('공동 저장 서버가 설정되지 않았습니다.');
  const response=await fetch(SERVER+'/api/collab'+(body?'':'?'+new URLSearchParams({op,project:PROJECT,screen:options.route||current()})),{method:body?'POST':'GET',credentials:'omit',cache:'no-store',signal:options.signal,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify({op,project:PROJECT,...body}):undefined});
  let result;try{result=await response.json();}catch{throw Error('공동작업 서버에 연결하지 못했습니다.');}
  if(!response.ok)throw Error(result.error||'요청을 처리하지 못했습니다.');return result;
 }
 async function refresh(force=false){
  const route=current();if(activeRequest?.route===route&&!force)return;
  activeRequest?.controller.abort();if(route==='screens'){activeRequest=null;loading=false;changed();return;}
  const request={route,controller:new AbortController()};activeRequest=request;loading=true;changed();
  try{const result=await api('list',undefined,{route,signal:AbortSignal.any([request.controller.signal,AbortSignal.timeout(15000)])});if(activeRequest!==request||route!==current())return;if(!Array.isArray(result.records))throw Error('설명 응답을 확인하지 못했습니다.');records=result.records;screen=route;window.GFAIR_COLLAB.error='';}
  catch(error){if(activeRequest!==request||request.controller.signal.aborted)return;window.GFAIR_COLLAB.error=error.name==='TimeoutError'?'설명 조회가 지연되고 있습니다.':error.message;}
  finally{if(activeRequest===request){activeRequest=null;loading=false;changed();}}
 }
 window.GFAIR_COLLAB={user:null,githubReady:false,get records(){return screen===current()?records:[];},get loading(){return loading;},get loaded(){return screen===current();},error:'',refresh,
  async planningNotes(){return(await api('planning-notes')).records;},
  async mutate(op,body){const result=await api(op,body);await refresh(true);return result;}
 };
 window.addEventListener('description-context-changed',()=>{changed();refresh();});
 window.addEventListener('hashchange',()=>{changed();refresh();});
 document.addEventListener('click',event=>{if(event.target.closest('[data-spec=refresh]'))refresh();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 setInterval(()=>{if(!document.hidden)refresh();},5000);
 refresh();
})();
