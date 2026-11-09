(()=>{
 'use strict';const store=window.GFAIR_COLLAB;if(!store)return;
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('../css/message-specs.css?v=type-first-20261021',document.currentScript.src);document.head.append(css);
 const tabs=new Map(),route=()=>window.MOCKUP_DESCRIPTION_CONTEXT?.id||decodeURIComponent(location.hash.slice(1))||document.body.dataset.screen;
 const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
 const button=(text,fn)=>{const node=el('button',text);node.type='button';node.addEventListener('click',fn);return node;};
 const messageType=value=>value==='브라우저 기본 검증'?'유효성 검사':value;
 const parse=record=>{try{const value=JSON.parse(record.text);return value.format==='screen-message-v1'?value:null;}catch{return null;}};
 function browserValidations(){
  const root=window.MOCKUP_DESCRIPTION_CONTEXT?document.getElementById('dialog-content'):document.querySelector('#app #content');if(!root)return [];
  const result=[],seen=new Set();
  root.querySelectorAll('input,select,textarea').forEach((control,index)=>{
   if(!control.willValidate||!control.getClientRects().length||control.closest('[hidden]'))return;
   const group=control.closest('.field,fieldset'),caption=group?.querySelector(':scope>span,:scope>label,:scope>legend');
   const name=(caption?.textContent||control.getAttribute('aria-label')||control.labels?.[0]?.textContent||control.name||'입력 항목').replace(/\*/g,'').replace(/필수/g,'').trim().replace(/\s+/g,' ');
   const id=control.name||control.id||String(index),probe=control.cloneNode(true);
   const add=(rule,title,trigger,message)=>{const key='native-'+id+'-'+rule;if(seen.has(key))return;seen.add(key);result.push({key,title,type:'유효성 검사',trigger,message,confirm:'제출을 중단하고 해당 입력 항목으로 포커스를 이동합니다. 값을 보완한 뒤 다시 제출합니다.',note:'브라우저와 언어 환경에 따라 문구·표시 모양이 달라질 수 있습니다.',screens:[route()]});};
   if(control.required){const choice=control.tagName==='SELECT'||['radio','checkbox'].includes(control.type);if(control.type==='radio'||control.type==='checkbox')probe.checked=false;else if(control.tagName==='SELECT')probe.selectedIndex=-1;else probe.value='';add('required',name+(choice?' 미선택':' 미입력'),name+(choice?'을 선택하지 않고 제출':'을 입력하지 않고 제출'),probe.validationMessage||(choice?'목록에서 항목을 선택하세요.':'이 입력란을 작성하세요.'));}
   if(['email','url'].includes(control.type)){probe.value='invalid';if(probe.validity.typeMismatch)add('type',name+' 형식 오류',name+'에 올바르지 않은 '+(control.type==='email'?'이메일':'URL')+' 형식으로 입력 후 제출',probe.validationMessage);}
   if(control.pattern){probe.value='!';if(!probe.validity.patternMismatch)probe.value='invalid-format';if(probe.validity.patternMismatch)add('pattern',name+' 입력 형식 불일치',name+'이 지정된 입력 형식(pattern)과 불일치한 상태로 제출',probe.validationMessage);}
   if(control.type==='number'){for(const [attr,flag,offset,desc] of [['min','rangeUnderflow',-1,'미만'],['max','rangeOverflow',1,'초과']])if(control.hasAttribute(attr)){probe.value=String(Number(control.getAttribute(attr))+offset);if(probe.validity[flag])add(attr,name+' 허용 범위 오류',name+'을 허용값 '+control.getAttribute(attr)+' '+desc+'로 입력 후 제출',probe.validationMessage);}}
  });return result;
 }
 function entries(){
  const current=route(),base=window.GFAIR_WORKFLOW?.entry(current)?.parent||current.split('-P')[0],records=store.records.map(record=>({record,value:parse(record)})).filter(item=>item.value);
  const defaults=[...(window.GFAIR_MESSAGE_SPECS||[]).filter(item=>item.screens.includes(current)||(current==='MON-01'&&item.screens.includes('*'))),...browserValidations()];
  return [...defaults.map(item=>{const saved=records.find(r=>r.value.key===item.key);return saved?{...item,...saved.value,record:saved.record}:item;}),...records.filter(item=>!defaults.some(d=>d.key===item.value.key)).map(item=>({...item.value,record:item.record}))];
 }
 function edit(item){
  const screen=route(),dialog=el('dialog',undefined,'annotation-dialog message-spec-dialog'),form=el('form'),header=el('div',undefined,'message-spec-heading'),close=button('×',()=>dialog.close());close.setAttribute('aria-label','메시지 설명 수정 닫기');header.append(el('h2',item?'메시지 설명 수정':'메시지 설명 추가'),close);form.append(header);
  const fields={},labels={title:'상황 제목',type:'표시 유형',trigger:'발생 조건',message:'메시지 문구',confirm:'확인 후 동작',cancel:'취소 후 동작'};
  Object.entries(labels).forEach(([key,title])=>{const label=el('label',title),control=el(key==='type'?'select':key==='title'?'input':'textarea');control.name=key;control.value=item?.[key]||'';control.required=['title','type','trigger','message'].includes(key);if(control.required)label.append(el('span',' *','annotation-required-mark'));control.maxLength=key==='message'?1500:key==='title'?80:600;if(key==='type'){['알럿','컨펌','레이어 컨펌','토스트','인라인 오류','유효성 검사'].forEach(text=>control.append(new Option(text,text)));control.value=messageType(item?.type)||'알럿';}label.append(control);form.append(label);fields[key]=control;});
  const error=el('p',undefined,'message-spec-error');error.setAttribute('role','alert');const save=el('button','저장');save.type='submit';const actions=el('div',undefined,'annotation-actions');actions.append(button('취소',()=>dialog.close()),save);form.append(error,actions);
  form.addEventListener('submit',async event=>{event.preventDefault();if(screen!==route()||!form.reportValidity())return;const spec={format:'screen-message-v1',key:item?.key||'custom-'+Date.now()};for(const key of Object.keys(labels))spec[key]=fields[key].value.trim();if(!spec.trigger||!spec.message){error.textContent='발생 조건과 메시지를 입력해 주세요.';return;}const text=JSON.stringify(spec);if(text.length>5000){error.textContent='전체 내용을 5,000자 이하로 작성해 주세요.';return;}save.disabled=true;try{await store.mutate(item?.record?'update':'create',item?.record?{id:item.record.id,text,revision:item.record.revision}:{screen,text,anchor:{selector:'#content',sample:'알럿/컨펌',x:0,y:0}});dialog.close();}catch(e){error.textContent=e.message;}finally{save.disabled=false;}});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.append(form);document.body.append(dialog);dialog.showModal();fields.trigger.focus();
 }
 function buildMessages(){
  const area=el('div',undefined,'message-spec-list');area.append(button('메시지 추가',()=>edit()));
  const items=entries();if(!items.length)area.append(el('p','이 화면에서 별도로 정의된 알럿/컨펌이 없습니다.','annotation-guide'));
  items.forEach((item,index)=>{const card=el('article',undefined,'message-spec-card'),header=el('div',undefined,'message-spec-heading');header.append(el('small',messageType(item.type),'message-spec-type'),el('h3',item.title||item.trigger||'메시지 안내'));if(item.screens?.includes('*'))header.append(el('small','공통'));header.append(button('수정',()=>edit(item)));card.append(header);const dl=el('dl',undefined,'annotation-spec');for(const [key,title] of Object.entries({trigger:'발생 조건',message:'메시지',confirm:'확인 후',cancel:'취소 후',note:'참고'}))if(item[key])dl.append(el('dt',title),el('dd',item[key]));card.append(dl);area.append(card);});return area;
 }
 function mount(){
  const section=document.getElementById('annotation-panel');if(!section||section.dataset.messageTabs)return;section.dataset.messageTabs='true';const details=el('div'),messages=buildMessages(),nav=el('div',undefined,'message-spec-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Description 유형');
  [...section.children].filter(node=>!node.matches('h2,.annotation-screen-overview')).forEach(node=>details.append(node));details.id='description-regions';messages.id='description-messages';details.setAttribute('role','tabpanel');messages.setAttribute('role','tabpanel');
  const buttons=[];function activate(key,focus=false){tabs.set(route(),key);details.hidden=key!=='regions';messages.hidden=key!=='messages';buttons.forEach(({button,value})=>{const selected=value===key;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;if(selected&&focus)button.focus();});}
  [['regions','영역 설명',details],['messages','알럿/컨펌',messages]].forEach(([key,title,pane])=>{const tab=button(title,()=>activate(key));tab.id='description-tab-'+key;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',pane.id);pane.setAttribute('aria-labelledby',tab.id);tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();activate(key==='regions'?'messages':'regions',true);}});buttons.push({button:tab,value:key});nav.append(tab);});section.append(nav,details,messages);activate(tabs.get(route())||'regions');
 }
 document.addEventListener('click',event=>{if(event.target.closest('.annotation-pin'))tabs.set(route(),'regions');},true);window.addEventListener('annotation-select-scope',()=>tabs.set(route(),'regions'));new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});window.addEventListener('description-context-changed',mount);mount();
})();
