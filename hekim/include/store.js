/* 서비스 실습 데이터만 저장합니다. 공동 Description 서버와 완전히 독립적입니다. */
(() => {
  const KEY='yeojeong.prototype.v2';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const makeSeed=()=>({version:2,profile:{id:'demo',name:'여행자',nickname:'여정러',email:'traveler@example.com'},favorites:['kyoto'],trips:[{id:'trip-demo',title:'교토의 골목을 걷는 4일',destinationId:'kyoto',start:'2026-12-10',end:'2026-12-13',days:[{places:[{name:'기요미즈데라',time:'09:00',note:'아침 산책'},{name:'니넨자카',time:'13:00',note:'점심과 골목 탐방'}],memo:'걷기 편한 신발 챙기기'},{places:[{name:'기온 거리',time:'10:00',note:''},{name:'후시미 이나리',time:'15:00',note:'해 질 무렵 방문'}],memo:''},{places:[{name:'아라시야마',time:'09:00',note:''}],memo:''},{places:[{name:'니시키 시장',time:'11:00',note:'기념품 구입'}],memo:''}]}],inquiries:[{id:'inquiry-demo',type:'이용 문의',title:'추천 일정의 장소를 바꿀 수 있나요?',body:'추천 일정을 담은 뒤 장소를 추가하거나 순서를 바꿀 수 있는지 궁금합니다.',date:'2026-11-09',status:'답변 완료',answer:'네, 나의 여행의 일정 편집에서 방문 장소를 추가·수정·삭제하고 순서를 바꿀 수 있습니다. 이 답변은 기능 검토용 예시입니다.',file:null}],agreements:null});
  let data=makeSeed(),session=false,storageError='';
  try {const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved){if(saved.version!==2||!saved.profile||!Array.isArray(saved.trips)||!Array.isArray(saved.favorites)||!Array.isArray(saved.inquiries))throw Error('invalid');data=saved;}session=sessionStorage.getItem(KEY+'.session')==='true'||localStorage.getItem(KEY+'.remember')==='true';}catch {storageError='저장 데이터를 읽지 못해 예시 데이터로 표시합니다. 저장 기능을 사용할 수 있는지 브라우저 설정을 확인해 주세요.';}
  const write=next=>{localStorage.setItem(KEY,JSON.stringify(next));data=next;};
  window.YJStore={
    get data(){return clone(data);},get loggedIn(){return session;},get error(){return storageError;},
    save(mutator){const next=clone(data);mutator(next);try{write(next);return true;}catch{throw Error('브라우저 저장 공간이 부족하거나 저장이 차단되어 있습니다. 변경 사항을 저장하지 못했습니다.');}},
    login(remember=false){try{sessionStorage.setItem(KEY+'.session','true');if(remember)localStorage.setItem(KEY+'.remember','true');else localStorage.removeItem(KEY+'.remember');session=true;}catch{throw Error('로그인 상태를 저장할 수 없습니다. 브라우저 저장 설정을 확인해 주세요.');}},
    logout(){try{sessionStorage.removeItem(KEY+'.session');localStorage.removeItem(KEY+'.remember');}finally{session=false;}},
    reset(){write(makeSeed());this.logout();},
    withdraw(){write({version:2,profile:{id:'',name:'',nickname:'',email:''},trips:[],favorites:[],inquiries:[],agreements:null});this.logout();},
    uid(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);},
    dates(start,end){const a=Date.parse(start+'T00:00:00Z'),b=Date.parse(end+'T00:00:00Z');if(!Number.isFinite(a)||!Number.isFinite(b)||b<a)return [];const n=Math.round((b-a)/86400000)+1;if(n>30)return [];return Array.from({length:n},(_,i)=>new Date(a+i*86400000).toISOString().slice(0,10));},
    today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());}
  };
})();
