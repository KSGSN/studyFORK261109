/* 서버가 인증과 권한을 검증한다. 브라우저에는 현재 탭의 세션만 보관한다. */
(()=>{
 'use strict';
 const SERVER=window.MOCKUP_SHARED_CONFIG.server;
 const PROJECT=document.body.dataset.project||window.MOCKUP_SHARED_CONFIG.defaultProject;
 if(!SERVER){
  const notice='Description 저장 서버가 아직 설정되지 않았습니다. 로그인·작성·공동 저장은 서버 연결 후 사용할 수 있습니다.';
  const unavailable=async()=>{throw Error(notice);};
  window.GFAIR_COLLAB={user:null,githubReady:false,records:[],loading:false,loaded:true,error:notice,refresh:async()=>window.dispatchEvent(new Event('collaboration-updated')),login:unavailable,logout:async()=>{},mutate:unavailable,planningNotes:async()=>[]};
  return;
 }
 const TOKEN='study.collab.session.'+PROJECT,VERIFIER='study.collab.verifier.'+PROJECT;
 let token=sessionStorage.getItem(TOKEN)||'',user=null,records=[],screen='',snapshot='',activeRequest=null,loading=false,githubReady=false;
 const changed=()=>window.dispatchEvent(new Event('collaboration-updated'));
 const current=()=>window.MOCKUP_DESCRIPTION_CONTEXT?.id||decodeURIComponent(location.hash.slice(1))||document.body.dataset.screen||'screens';
 async function api(op,body,options={}){
  const url=SERVER+'/api/collab'+(body?'':'?'+new URLSearchParams({op,project:PROJECT,screen:options.route||current()}));
  const response=await fetch(url,{method:body?'POST':'GET',credentials:'omit',cache:'no-store',signal:options.signal,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify({op,project:PROJECT,...body}):undefined});
  let result;try{result=await response.json();}catch{throw Error('공동작업 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');}
  if(!response.ok){if(response.status===401){token='';user=null;records=[];sessionStorage.removeItem(TOKEN);changed();if(op==='list'&&!body)return api('list',undefined,options);}throw Error(result.error||'요청을 처리하지 못했습니다.');}return result;
 }
 async function refresh(force=false){
  const route=current();if(activeRequest?.route===route&&!force)return;
  activeRequest?.controller.abort();if(route==='screens'){activeRequest=null;loading=false;changed();return;}
  const request={route,controller:new AbortController(),notify:screen!==route||!!window.GFAIR_COLLAB.error};activeRequest=request;loading=true;if(request.notify)changed();
  try{const result=await api('list',undefined,{route,signal:AbortSignal.any([request.controller.signal,AbortSignal.timeout(15000)])});if(activeRequest!==request||route!==current())return;if(!Array.isArray(result.records))throw Error('디스크립션 응답을 확인하지 못했습니다. 다시 불러와 주세요.');user=result.user;githubReady=!!result.githubConfigured;records=result.records;screen=route;const next=JSON.stringify(result);request.notify=request.notify||snapshot!==next;snapshot=next;if(!new URL(location.href).searchParams.has('annotation_error')&&!window.GFAIR_COLLAB.authError)window.GFAIR_COLLAB.error='';}
  catch(error){if(activeRequest!==request||request.controller.signal.aborted)return;request.notify=true;window.GFAIR_COLLAB.error=error.name==='TimeoutError'?'디스크립션 조회가 지연되고 있습니다. 다시 불러와 주세요.':error.message;}finally{if(activeRequest===request){activeRequest=null;loading=false;if(request.notify)changed();}}
 }
 async function login(){
  if(!githubReady)throw Error('GitHub 로그인 앱 연결 설정이 필요합니다.');
  window.GFAIR_COLLAB.authError=false;window.GFAIR_COLLAB.error='';
  const bytes=crypto.getRandomValues(new Uint8Array(32)),verifier=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  sessionStorage.setItem(VERIFIER,verifier);const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
  const challenge=btoa(String.fromCharCode(...digest)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  location.assign(SERVER+'/api/github/start?'+new URLSearchParams({challenge,project:PROJECT,screen:current()==='screens'?(document.body.dataset.screen||'HOME-01'):current()}));
 }
 window.GFAIR_COLLAB={get user(){return user;},get githubReady(){return githubReady;},get records(){return screen===current()?records:[];},get loading(){return loading;},get loaded(){return screen===current();},error:'',login,refresh,
  async planningNotes(){return (await api('planning-notes')).records;},
  async mutate(op,body){const result=await api(op,body);snapshot='';await refresh(true);return result;},
  async logout(){try{if(token)await api('logout',{});}finally{token='';user=null;records=[];snapshot='';sessionStorage.removeItem(TOKEN);changed();}}
 };
 window.addEventListener('description-context-changed',()=>{snapshot='';changed();refresh();});
 window.addEventListener('hashchange',()=>{snapshot='';changed();refresh();});
 document.addEventListener('click',event=>{if(event.target.closest('[data-spec=refresh]'))refresh();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});setInterval(()=>{if(!document.hidden)refresh();},5000);
 (async()=>{const url=new URL(location.href),code=url.searchParams.get('annotation_code'),authError=url.searchParams.get('annotation_error');
  if(authError){window.GFAIR_COLLAB.authError=true;url.searchParams.delete('annotation_error');history.replaceState(null,'',url.pathname+url.search+url.hash);const messages={github_configuration:'GitHub 로그인 앱 연결 설정이 필요합니다.',github_request:'로그인 요청이 만료되었습니다. 다시 시작해 주세요.',github_cancelled:'GitHub 로그인을 취소했습니다.',github_not_collaborator:'이 계정은 저장소 공동작업자가 아닙니다. 댓글은 로그인 없이 작성할 수 있습니다.',github_permissions:'GitHub App의 저장소 설치 및 Metadata 권한을 확인해 주세요.',github_login:'GitHub 로그인에 실패했습니다. 다시 시도해 주세요.'};window.GFAIR_COLLAB.error=messages[authError]||'GitHub 로그인을 다시 진행해 주세요.';changed();}
  if(code){url.searchParams.delete('annotation_code');history.replaceState(null,'',url.pathname+url.search+url.hash);try{const verifier=sessionStorage.getItem(VERIFIER);sessionStorage.removeItem(VERIFIER);if(!verifier)throw Error('로그인을 시작한 탭에서 다시 로그인해 주세요.');const result=await api('exchange',{code,verifier});token=result.token;user=result.user;sessionStorage.setItem(TOKEN,token);}catch(error){window.GFAIR_COLLAB.error=error.message;changed();}}
  await Promise.all([refresh(),(async()=>{try{githubReady=(await api('config')).githubConfigured;}catch(error){window.GFAIR_COLLAB.error=error.message;}changed();})()]);
 })();
})();
