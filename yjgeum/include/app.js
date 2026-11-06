(()=>{

"use strict";

const $ = (selector) => document.querySelector(selector);
const main = $("#content");
const dialog = $("#dialog");
const key = "yjgeum.haengbok-youth.demo.v1";
const initial = { signedIn: false, profile: { name: "행복청년", age: 25, interests: "", alerts: false }, records: [], drafts: {}, votes: {} };
let state;
try {
  state = JSON.parse(localStorage.getItem(key)) || structuredClone(initial);
} catch {
  state = structuredClone(initial);
}

const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const dateISO = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const today = new Date();
const offset = (days) => dateISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));
const year = today.getFullYear();
const demo = "가상 행복시의 시연 데이터입니다. 실제 개인정보나 서류를 입력하지 마세요.";
const groups = {
  center: ["소개", [["center", "청년센터 소개"], ["history", "법인소개 및 연혁"], ["org", "조직도"], ["directions", "오시는길"]]],
  policy: ["청년정책", [["policy", "청년정책 목록"], ["vote", "정책투표"], ["survey", "만족도 설문"]]],
  program: ["프로그램 신청", [["program", "프로그램 목록"], ["counsel", "마음건강 상담신청"]]],
  support: ["지원사업 신청", [["support", "지원사업 목록"]]],
  space: ["청년센터 예약", [["space", "청년센터 공간 안내"], ["rental-calendar", "대관 캘린더"], ["goods", "물품 대여"]]],
  board: ["소통공간", [["board", "공지사항"], ["proposal", "청년사업제안"], ["archive", "자료실"], ["talk", "게시판"], ["video", "영상게시판"], ["inquiry", "1:1 문의"]]],
  my: ["마이페이지", [["my", "전체 현황"], ["profile", "내 정보 수정"], ["my-program", "프로그램 신청 관리"], ["my-support", "지원사업 신청 관리"], ["my-counsel", "마음건강 상담신청 관리"], ["my-space", "예약관리"], ["my-inquiry", "문의 현황"], ["alerts", "알림"]]]
};
const labels = Object.fromEntries(Object.values(groups).flatMap(([, children]) => children));
const baseScreens = [
 {id:'HOME-01',route:'home',title:'메인'},
 ...Object.entries(groups).flatMap(([group,[name,children]]) => children.map(([route,title],i)=>({id:({center:'CTR',policy:'POL',program:'PRG',support:'SUP',space:'SPC',board:'COM',my:'MY'})[group]+'-'+String(i+1).padStart(2,'0'),route,title,group:name}))),
 ...[['CAL-01','calendar','일정 캘린더'],['SCH-01','search','통합검색'],['ETC-01','sitemap','사이트맵'],['ETC-02','privacy','개인정보처리방침']].map(([id,route,title])=>({id,route,title}))
];
let screens = baseScreens;
function screenFor(route){ return screens.find(s=>s.route===route); }
function screenHref(value){const [route,query='']=value.split('?');const id=screenFor(route)?.id||route;return (query?'?view='+encodeURIComponent(query):'?')+'#'+id;}

const categories = ["일자리", "주거", "교육", "복지·문화", "참여·권리"];
const regions = ["행복시 전역", "행복동", "온빛동", "전국"];
const kinds = { policy: "청년정책", program: "프로그램", support: "지원사업", space: "공간 예약", goods: "물품 대여", counsel: "상담", proposal: "청년사업제안", inquiry: "1:1 문의", survey: "설문" };
const items = [
  ["intern","policy","행복시 청년 인턴형 일자리사업","일자리","행복시 전역",18,34,15,"관내 기업에서 직무를 경험하고 취업 역량을 키워보세요.","internship"],
  ["rent","policy","행복시 청년 월세 지원","주거","행복시 전역",19,39,9,"독립한 청년의 주거비 부담을 줄이기 위해 월세 일부를 지원합니다.","rent-support"],
  ["portfolio","policy","청년 역량강화 교육 지원","교육","온빛동",19,34,20,"포트폴리오 제작과 직무 교육을 연계한 청년 역량강화 정책입니다.","portfolio-class"],
  ["mental","policy","행복시 청년 마음돌봄 지원","복지·문화","행복동",19,39,25,"마음건강 상담을 통해 일상의 어려움을 나눌 수 있습니다.","mind"],
  ["budget","policy","행복시 청년자치예산제","참여·권리","행복시 전역",19,39,30,"청년이 직접 생활 속 정책을 제안하고 투표로 참여하는 사업입니다.","idea"],
  ["national","policy","전국 청년정책 탐색 안내","일자리","전국",19,39,40,"온통청년에서 전국의 최신 청년정책을 확인할 수 있습니다.","https://www.youthcenter.go.kr/"],
  ["portfolio-class","program","나만의 포트폴리오 만들기","교육","온빛동",19,34,18,"직무 경험을 정리하고 실전 포트폴리오에 대한 피드백을 받는 교육입니다.","",16,"온빛 청년센터 교육실","교육"],
  ["one-day","program","퇴근 후 원데이 클래스","복지·문화","행복동",19,39,12,"청년센터에서 생활 소품을 만들며 지역 청년을 만납니다.","",12,"행복시 청년센터 다목적실","강좌"],
  ["lecture","program","청년 커리어 토크","일자리","행복동",19,39,24,"현직자와 직무 탐색 및 이직 경험을 나누는 공개 강연입니다.","",30,"행복시 청년센터 다목적실","강연회"],
  ["closed-class","program","첫 면접 준비 워크숍","일자리","행복동",19,34,-2,"자기소개와 모의 면접을 연습하는 교육입니다.","",15,"행복시 청년센터 교육실","교육"],
  ["internship","support","청년 인턴형 일자리사업 신청","일자리","행복시 전역",18,34,15,"행복시 청년이 관내 기업에서 직장 체험을 할 수 있도록 지원합니다.","",20,"행복시 청년센터"],
  ["rent-support","support","청년 월세 지원사업 신청","주거","행복시 전역",19,39,9,"행복시에 거주하는 무주택 청년의 월세 일부를 지원하는 예시 사업입니다.","",40,"행복시 청년센터"],
  ["certificate","support","청년 자격증 응시료 지원","교육","행복시 전역",19,39,28,"취업 준비에 필요한 자격시험 응시료를 지원합니다.","",30,"행복시 청년센터"],
  ["study","space","4층 스터디실","공간","행복동",19,39,45,"스터디, 면접 준비, 소규모 모임에 이용할 수 있는 무료 공간입니다.","",8,"행복시 청년센터 4층"],
  ["multi","space","3층 다목적실","공간","행복동",19,39,45,"모임과 워크숍에 이용할 수 있는 무료 공간입니다.","",20,"행복시 청년센터 3층"],
  ["laptop","goods","노트북","디지털","행복동",19,39,45,"교육·취업 준비용 노트북을 대여할 수 있습니다.","",1,"행복시 청년센터 안내데스크"],
  ["camera","goods","카메라","디지털","행복동",19,39,45,"동아리와 청년 프로젝트의 사진·영상 촬영을 지원합니다.","",1,"행복시 청년센터 안내데스크"],
  ["tent","goods","캠핑용품 세트","생활","행복동",19,39,45,"텐트, 이동식 매트, 캠핑용 의자를 대여할 수 있습니다.","",1,"행복시 청년센터 안내데스크"],
  ["mind","counsel","청년 마음건강 상담","마음건강","행복동",19,39,45,"희망 일정을 작성하면 상담 신청 흐름을 체험할 수 있습니다.","",1,"행복시 청년센터 상담실"],
  ["idea","proposal","청년자치예산제 사업 제안","참여·권리","행복시 전역",19,39,30,"청년 생활에 필요한 정책 아이디어를 제안해 주세요."],
  ["question","inquiry","행복시 청년센터 1:1 문의","문의","행복시 전역",0,120,45,"정책 이용과 프로그램 신청에 대해 궁금한 점을 남겨 주세요."],
  ["satisfaction","survey","청년센터 프로그램 만족도 조사","설문","행복시 전역",0,120,24,"프로그램 운영에 대한 만족도와 개선 의견을 알려주세요."]
].map(([id, kind, title, category, region, min, max, days, description, link, capacity, place, type]) => ({
  id, kind, title, category, region, min, max, days, description, link, capacity, place, type, end: offset(days)
}));
const posts = [
  ["notice-open","board","공지","행복시 청년정보 ON 시범 운영 안내", "정책 검색, 온라인 신청, 청년센터 예약을 시연할 수 있습니다.",-2],
  ["notice-space","board","시설","청년센터 공간 이용 수칙 안내","이용 시작 10분 전 안내데스크에서 예약을 확인해 주세요. 사용한 물품은 제자리에 정리해 주세요.",-4],
  ["notice-cert","board","프로그램","프로그램 이수 확인 안내","이수 확인은 프로그램 운영이 종료된 후 마이페이지의 신청 상세에서 안내됩니다.",-8],
  ["guide","archive","이용안내","청년센터 이용 안내문","이용시간은 평일 09:00~21:00, 토요일 09:00~18:00입니다. 공간과 물품은 미리 예약해 주세요.",-3],
  ["discussion","talk","소통","청년센터에서 열렸으면 하는 프로그램","청년센터에서 듣고 싶은 교육과 강연이 있으면 1:1 문의로 의견을 남겨 주세요.",-7],
  ["intro-video","video","센터 소개","청년센터 이용 순서","공간을 살펴보고 희망 일자를 선택한 뒤 마이페이지에서 접수 내역을 확인하세요.",-9]
].map(([id, kind, tag, title, description, days]) => ({ id, kind, tag, title, description, date: offset(days) }));
screens = [...baseScreens,
 ...items.map((item,i)=>({id:'DTL-'+String(i+1).padStart(2,'0'),route:'detail/'+item.id,title:item.title,group:'서비스 상세'})),
 ...posts.map((post,i)=>({id:'PST-'+String(i+1).padStart(2,'0'),route:'post/'+post.id,title:post.title,group:'게시글 상세'}))];
window.GFAIR_SCREENS=[...new Set(screens.map(s=>s.group||'공통'))].map(name=>({name,screens:screens.filter(s=>(s.group||'공통')===name)}));
const initialRoute=location.hash.slice(1).split('?')[0];
if(!initialRoute || screenFor(initialRoute)){const url=new URL(location.href);const query=location.hash.slice(1).split('?')[1];if(query)url.searchParams.set('view',query);url.hash=screenFor(initialRoute||'home').id;history.replaceState(null,'',url);}
const paths = [
  '<circle cx="10" cy="10" r="5"/><path d="m14 14 5 5"/>',
  '<path d="M4 19V8l8-5 8 5v11zM9 19v-6h6v6"/>',
  '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M8 7V5h8v2M4 12h16"/>',
  '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 3v6m8-6v6M4 11h16"/>',
  '<path d="M5 5h14v11H9l-4 4zM8 9h8m-8 3h5"/>',
  '<circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 5 0 0 1 14 0v2z"/>'
];
const icon = (index) => '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24">' + paths[index] + '</svg></span>';
const linkTo = (route, text, css = "") => '<a class="' + css + '" href="#' + route + '">' + text + '</a>';
const button = (action, title, css = "secondary", id = "") => '<button type="button" class="' + css + '" data-action="' + action + '" data-id="' + esc(id) + '">' + title + '</button>';
const option = (label, value = label, selected = false) => '<option value="' + esc(value) + '"' + (selected ? " selected" : "") + '>' + esc(label) + '</option>';
const field = (label, html) => "<label>" + label + html + "</label>";
const status = (item) => item.days < 0 ? "접수마감" : "접수중";
const empty = (message) => '<p class="empty">' + esc(message) + "</p>";
let toastTimer;
function notify(message) {
  $("#toast").textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("#toast").textContent = ""; }, 4000);
}
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    notify("브라우저 저장소를 사용할 수 없어 현재 탭에만 변경 사항이 유지됩니다.");
  }
}
function route() {
 const id=decodeURIComponent(location.hash.slice(1));
 return [screens.find(s=>s.id===id)?.route||id||'home',new URLSearchParams(new URL(location.href).searchParams.get('view')||'')];
}
function go(page, query = {}) {
 const params=new URLSearchParams(query),url=new URL(location.href);
 if(params.size)url.searchParams.set('view',params.toString());else url.searchParams.delete('view');
 history.replaceState(null,'',url.pathname+url.search+url.hash);
 const hash='#'+(screenFor(page)?.id||page);
 if(location.hash===hash){render();window.dispatchEvent(new Event('hashchange'));}else location.hash=hash;
}
function rewriteLinks(root=document.getElementById('app')){
 root.querySelectorAll('a[href^="#"]').forEach(a=>{const value=a.getAttribute('href').slice(1);if(value==='content'||value==='screens'||screens.some(s=>s.id===value))return;a.setAttribute('href',screenHref(value));});
}
function screenList(){return '<section class="sb-screen-list"><h1>행복시 청년정보 ON · 화면검색</h1><p>화면을 선택하고 상단 Description을 열어 스토리보드를 작성하세요. 서비스 로그인은 시연용이며, 설명 저장은 GitHub 편집 권한이 필요합니다.</p><label>화면 ID 또는 화면명<input id="sb-screen-query" type="search" placeholder="예: PRG, 프로그램, 예약"></label><div class="grid">'+screens.map(s=>'<a class="card" data-screen-entry href="?#'+s.id+'"><small>'+s.id+' · '+esc(s.group||'공통')+'</small><h3>'+esc(s.title)+'</h3></a>').join('')+'</div></section>';}
document.addEventListener('input',e=>{if(e.target.id==='sb-screen-query'){const q=e.target.value.trim().toLowerCase();main.querySelectorAll('[data-screen-entry]').forEach(a=>a.hidden=!a.textContent.toLowerCase().includes(q));}});
function page(title, description, content, parent) {
  return '<div class="pagehero"><div class="wrap"><p class="crumb"><a href="#home">홈</a>　/　' +
    (parent ? linkTo(parent, groups[parent]?.[0] || labels[parent]) + "　/　" : "") + esc(title) + '</p><h1>' +
    esc(title) + '</h1><p class="subtext">' + esc(description) + '</p></div></div><div class="page wrap">' + content + '</div>';
}
function chips(values, current, action) {
  return '<div class="chips">' + values.map((value) => '<button class="chip" type="button" aria-pressed="' +
    (value === current) + '" data-action="' + action + '" data-id="' + esc(value) + '">' + esc(value) + '</button>').join("") + '</div>';
}
function cards(list) {
  if (!list.length) return empty("조건에 맞는 항목이 없습니다.");
  return '<div class="grid">' + list.map((item) => '<article class="card"><div class="labels"><span class="badge">' +
    esc(item.type || item.category) + '</span><span class="badge ' + (item.days < 0 ? "gray" : "green") + '">' +
    status(item) + '</span></div><h3>' + esc(item.title) + '</h3><p>' + esc(item.description) + '</p><p>' +
    esc(item.place || item.region) + (item.capacity ? " · " + item.capacity + "명" : "") + '</p><p>접수 ~ ' + item.end +
    '</p>' + linkTo("detail/" + item.id, "자세히 보기 <span aria-hidden=\"true\">→</span><span class=\"sr\"> " + esc(item.title) + "</span>", "detail-link") + '</article>').join("") + '</div>';
}
function section(title, eyebrow, description, more, body, soft = false) {
  return '<section class="section' + (soft ? " soft" : "") + '"><div class="wrap"><div class="sectionhead"><div><span class="eyebrow">' +
    eyebrow + '</span><h2>' + title + '</h2><p>' + description + '</p></div>' +
    linkTo(more, "전체보기 <span aria-hidden=\"true\">↗</span>") + '</div>' + body + '</div></section>';
}
let featured = "전체";
function home() {
  const policies = items.filter((item) => item.kind === "policy" && (featured === "전체" || item.category === featured));
  const shortcuts = [["policy","정책 찾기"],["program","프로그램 신청"],["support","지원사업 신청"],["space","공간 예약"],["vote","정책 참여"],["my","마이페이지"]];
  return '<section class="hero"><div class="wrap"><div class="hero-copy"><span class="eyebrow">HAENGBOK YOUTH PORTAL</span>' +
    '<h1>청년의 기회를 켜다,<br><strong>행복청년 ON</strong></h1><p>청년정책부터 프로그램, 공간 예약까지 한곳에서 만나보세요.</p>' +
    '<form data-form="search"><input name="q" type="search" aria-label="통합검색어" placeholder="어떤 청년정보를 찾으세요?" required><button class="primary">검색</button></form>' +
    '</div><img class="hero-art" src="hero.svg" alt="청년 서비스가 연결되는 행복시 일러스트레이션"></div></section>' +
    '<section class="quick" aria-label="주요 서비스 바로가기"><div class="quickgrid wrap">' +
    shortcuts.map(([target, label], i) => linkTo(target, icon(i) + label)).join("") + '</div></section>' +
    section("나에게 맞는 청년정책", "YOUTH POLICY", "관심 분야를 선택해 행복시의 청년 지원 정보를 찾아보세요.", "policy",
      '<div id="featured">' + chips(["전체", ...categories], featured, "featured") + cards(policies.slice(0, 3)) + '</div>') +
    section("함께하는 프로그램", "PROGRAMS", "교육, 강좌와 강연에서 새로운 경험을 쌓아보세요.", "program",
      cards(items.filter((item) => item.kind === "program" && item.days >= 0)), true) +
    '<section class="section"><div class="wrap split"><div class="panel"><div class="sectionhead"><h2>공지사항</h2>' + linkTo("board", "전체보기 ↗") +
    '</div>' + posts.filter((post) => post.kind === "board").map(notice).join("") + '</div><div class="panel"><span class="eyebrow">YOUTH CENTER</span><h2>행복시 청년센터</h2>' +
    '<p class="subtext">함께 배우고, 쉬고, 모일 수 있는 청년 공간입니다.</p><div class="actions">' +
    linkTo("space", "공간 둘러보기", "primary") + linkTo("calendar", "일정 캘린더", "secondary") + '</div></div></div></section>';
}
function notice(post) {
  return '<a class="notice" href="#post/' + post.id + '"><span><span class="badge">' + esc(post.tag) +
    '</span> ' + esc(post.title) + '</span><small>' + post.date + '</small></a>';
}
function includes(query, ...values) {
  return query.toLowerCase().trim().split(/\s+/).every((term) => values.join(" ").toLowerCase().includes(term));
}
function listing(kind, params) {
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const region = params.get("region") || "";
  const age = params.get("age") || "";
  const availability = params.get("availability") || "";
  const categoryOptions = kind === "program" ? ["교육", "강좌", "강연회"] : categories;
  const list = items.filter((item) => item.kind === kind &&
    includes(q, item.title, item.description, item.category, item.type, item.region) &&
    (!category || (kind === "program" ? item.type : item.category) === category) &&
    (!region || item.region === region) &&
    (!age || (Number(age) >= item.min && Number(age) <= item.max)) &&
    (!availability || status(item) === availability));
  const filterable = ["policy", "program", "support"].includes(kind);
  const filter = '<form class="filter" data-form="filter" data-id="' + kind + '">' +
    field("검색어", '<input type="search" name="q" value="' + esc(q) + '" placeholder="제목 또는 키워드">') +
    (filterable ? field(kind === "program" ? "유형" : "분야", '<select name="category">' + option("전체", "") +
      categoryOptions.map((value) => option(value, value, category === value)).join("") + '</select>') : "") +
    (kind === "policy" ? field("지역", '<select name="region">' + option("전체", "") +
      regions.map((value) => option(value, value, region === value)).join("") + '</select>') +
      field("만 나이", '<input type="number" name="age" min="0" max="120" value="' + esc(age) + '" placeholder="예: 25">') : "") +
    (filterable ? field("접수 상태", '<select name="availability">' + option("전체", "") +
      ["접수중", "접수마감"].map((value) => option(value, value, availability === value)).join("") + '</select>') : "") +
    '<button class="primary">검색</button>' + linkTo(kind, "초기화", "secondary") + '</form>';
  return page(groups[kind]?.[0] || labels[kind], kind === "policy" ? "행복시와 전국의 청년정책을 조건별로 찾아보세요." :
    "상세 안내에서 이용 조건과 신청 방법을 확인하세요.",
    (["space", "goods"].includes(kind) ? '<div class="actions">' + linkTo("space", "공간 안내", "secondary") +
      linkTo("rental-calendar", "대관 캘린더", "secondary") + linkTo("goods", "물품 대여", "secondary") + '</div><br>' : "") +
    filter + '<p class="results">검색 결과 <b>' + list.length + '</b>건</p>' + cards(list));
}
function details(entries) {
  return '<dl class="details">' + entries.map(([label, value]) => '<div><dt>' + label + '</dt><dd>' + esc(value) + '</dd></div>').join("") + '</dl>';
}
function itemDetail(item) {
  const related = items.find((entry) => entry.id === item.link);
  const action = item.kind === "policy"
    ? (related ? linkTo("detail/" + related.id, "관련 서비스 보기", "primary") :
      '<a class="primary" href="' + esc(item.link) + '" target="_blank" rel="noopener">온통청년 열기 ↗</a>')
    : item.days < 0 ? '<span class="badge gray">접수가 마감되었습니다</span>' :
      button("apply", ({ space: "공간 예약 신청", goods: "물품 대여 신청", survey: "설문 참여", inquiry: "문의 작성", proposal: "제안 작성" })[item.kind] || "신청하기", "primary", item.id);
  return page(item.title, item.description, '<article class="panel"><div class="labels"><span class="badge">' +
    esc(item.category) + '</span><span class="badge ' + (item.days < 0 ? "gray" : "green") + '">' + status(item) +
    '</span></div>' + details([["지역", item.region], ["접수 마감", item.end], ["대상", item.min === 0 ? "전체" : "만 " + item.min + " ~ " + item.max + "세"],
      ["운영 장소", item.place || (item.region === "전국" ? "온통청년 안내 참고" : "행복시 청년센터")],
      ...(item.capacity ? [["인원", item.capacity + "명"]] : []),
      ...(item.kind === "space" ? [["이용시간", "평일 09:00~21:00 / 토요일 09:00~18:00"], ["이용료", "무료"]] : [])]) +
    '<p>' + esc(item.description) + '</p><div class="actions">' + action + linkTo(item.kind, "목록으로", "secondary") +
    button("share", "주소 공유") + button("print", "인쇄") + '</div></article>', item.kind === "goods" ? "space" :
    groups[item.kind] ? item.kind : undefined);
}
function search(params) {
  const q = params.get("q") || "";
  const matches = q ? items.filter((item) => includes(q, item.title, item.category, item.description, kinds[item.kind])) : [];
  const boardMatches = q ? posts.filter((post) => includes(q, post.title, post.description, post.tag)) : [];
  const navMatches = q ? Object.entries(labels).filter(([, label]) => includes(q, label)) : [];
  return page("통합검색", "청년정책, 프로그램, 공지사항과 메뉴를 한 번에 검색합니다.",
    '<form class="filter" data-form="search">' + field("검색어", '<input name="q" type="search" required value="' +
    esc(q) + '" placeholder="예: 월세, 교육, 예약">') + '<button class="primary">검색</button></form>' +
    (q ? '<p class="results">‘' + esc(q) + '’ 검색 결과 <b>' + (matches.length + boardMatches.length + navMatches.length) +
      '</b>건</p>' + cards(matches) + (boardMatches.length ? '<br><div class="panel"><h2>게시글</h2>' + boardMatches.map(notice).join("") + '</div>' : "") +
      (navMatches.length ? '<br><div class="panel"><h2>메뉴</h2><div class="actions">' + navMatches.map(([target, label]) => linkTo(target, esc(label), "secondary")).join("") + '</div></div>' : "") : ""));
}
function board(kind, params) {
  const q = params.get("q") || "";
  const entries = posts.filter((post) => post.kind === kind && includes(q, post.title, post.description));
  return page(labels[kind], "행복시 청년센터의 소식과 자료를 확인하세요.",
    '<form class="filter" data-form="filter" data-id="' + kind + '">' + field("게시글 검색", '<input name="q" type="search" value="' +
    esc(q) + '" placeholder="제목 또는 내용">') + '<button class="primary">검색</button>' + linkTo(kind, "초기화", "secondary") + '</form>' +
    (entries.length ? '<div class="panel">' + entries.map(notice).join("") + '</div>' : empty("검색 결과가 없습니다.")));
}
function postDetail(post) {
  return page(post.title, post.date + " · 행복시 청년센터 운영팀", '<div class="panel"><p>' + esc(post.description) +
    '</p>' + (["guide", "notice-space"].includes(post.id) ? '<div class="callout"><b>첨부 안내문</b><div class="actions">' +
    button("preview", "미리보기", "secondary", post.id) + button("download", "다운로드", "secondary", post.id) + '</div></div>' : "") +
    (post.kind === "video" ? '<details class="callout"><summary>영상 안내 대본</summary><p>청년센터 예약 메뉴에서 공간을 선택합니다. 이용일과 시간을 고르고 신청서를 저장합니다. 마이페이지에서 접수 내역을 확인합니다.</p></details>' : "") +
    '<div class="actions">' + linkTo(post.kind, "목록으로", "secondary") + button("print", "인쇄") + '</div></div>', "board");
}
function center(kind) {
  const text = {
    center: ["청년을 위한 배움과 교류의 공간", "행복시 청년센터는 취업 준비, 교육, 상담, 커뮤니티 활동을 지원합니다."],
    history: ["법인소개 및 연혁", year + "년 행복시 청년센터 시범 운영 및 청년정보 ON 통합 서비스 개설"],
    org: ["조직도", "센터장 · 정책지원팀 · 프로그램운영팀 · 공간운영팀"],
    directions: ["오시는길", "행복시 행복동 청년로 1(가상) · 행복역 2번 출구에서 도보 8분 · 청년센터 정류장 하차"]
  }[kind];
  return page(labels[kind], "청년의 일상을 돕는 행복시 청년센터입니다.", '<div class="panel"><h2>' + text[0] +
    '</h2><p>' + text[1] + '</p>' + (["center", "directions"].includes(kind) ?
      '<div class="map" role="img" aria-label="행복시 청년센터 위치를 나타낸 가상 약도"><span>◆ 행복시 청년센터</span></div>' +
      details([["운영시간", "평일 09:00~21:00 / 토요일 09:00~18:00"], ["휴관일", "일요일 및 공휴일"]]) : "") +
    '<div class="actions">' + linkTo("space", "공간 안내 및 예약", "primary") + linkTo("directions", "오시는길", "secondary") + '</div></div>');
}
function calendar(kind, params) {
  const raw = params.get("month") || "";
  const base = /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? new Date(raw + "-01T12:00:00") : new Date(today.getFullYear(), today.getMonth(), 1);
  const y = base.getFullYear(), m = base.getMonth();
  const prev = dateISO(new Date(y, m - 1, 1)).slice(0, 7), next = dateISO(new Date(y, m + 1, 1)).slice(0, 7);
  const slots = kind === "rental-calendar";
  const days = new Date(y, m + 1, 0).getDate();
  const events = slots ? state.records.filter((r) => r.kind === "space" && r.status !== "취소") :
    items.filter((item) => ["policy", "program", "support"].includes(item.kind)).map((item) => ({ date: item.end, title: item.title, itemId: item.id }));
  const cells = Array.from({length: base.getDay() + days}, (_, i) => {
    const day = i - base.getDay() + 1;
    if (day < 1) return '<div aria-hidden="true"></div>';
    const date = dateISO(new Date(y, m, day));
    const matches = events.filter((event) => event.date === date);
    return '<div><b>' + day + '</b>' + matches.map((entry) => linkTo("detail/" + entry.itemId, esc(slots ? entry.time + " 예약 접수" : entry.title))).join("") +
      (slots && date >= offset(0) && new Date(y, m, day).getDay() !== 0 ? linkTo("space?date=" + date, "공간 선택") : "") + '</div>';
  }).join("");
  return page(slots ? "대관 캘린더" : "일정 캘린더", slots ? "예약 일정을 확인하고 날짜별로 공간을 선택하세요." : "정책, 프로그램 및 지원사업의 접수 마감일을 확인하세요.",
    '<div class="calbar">' + linkTo(kind + "?month=" + prev, "← 이전 달", "secondary") + '<h2>' + y + '년 ' + (m + 1) +
    '월</h2>' + linkTo(kind + "?month=" + next, "다음 달 →", "secondary") + '</div><div class="cal">' +
    ["일","월","화","수","목","금","토"].map((day) => '<div class="weekday">' + day + '</div>').join("") + cells +
    '</div><div class="actions">' + linkTo(kind, "이번 달", "secondary") + (slots ? linkTo("space", "공간 목록", "secondary") : "") + '</div>');
}
function participation(kind, params) {
  if (kind === "survey") return listing(kind, params);
  if (kind === "vote") {
    return page("정책투표", "행복시 청년 정책의 우선순위에 의견을 남겨주세요.",
      '<div class="grid"><article class="card"><span class="badge green">투표중</span><h3>청년센터 주말 운영 확대 찬반 투표</h3>' +
      '<p>토요일 운영 시간을 확대하는 시범 정책에 대해 찬성 또는 반대를 선택하세요.</p><p>투표 마감 ' + offset(20) +
      ' · 마감 후 결과 공개</p>' + (state.votes.weekend ? '<p class="state">투표 참여 완료</p>' : button("vote", "투표 참여", "primary")) +
      '</article><article class="card"><span class="badge gray">투표 종료</span><h3>청년 네트워킹 데이 도입</h3><p>종료된 예시 투표의 결과를 확인하세요.</p>' +
      button("vote-result", "결과 보기") + '</article></div>');
  }
  const proposal = kind === "proposal";
  const item = items.find((entry) => entry.kind === kind);
  const titles = ["청년 자격증 취득 비용 지원", "청년 동아리 활동비 지원", "면접 정장 대여사업 제안"];
  return page(labels[kind], proposal ? "행복시 청년자치예산제에 사업 아이디어를 제안하세요." : "서비스 이용에 관한 질문을 남길 수 있습니다.",
    '<div class="panel"><h2>' + esc(item.title) + '</h2><p>' + (proposal ? "시연 기준은 만 19~39세입니다. 제안 목록에는 제목만 표시됩니다." : "작성한 문의 내용은 마이페이지에서 확인할 수 있습니다.") +
    '</p><div class="actions">' + button("apply", proposal ? "사업 제안하기" : "문의하기", "primary", item.id) + '</div></div>' +
    (proposal ? '<br><div class="panel"><h2>제안 목록</h2><ul class="board">' +
      [...titles, ...state.records.filter((r) => r.kind === "proposal" && r.status !== "취소").map((r) => r.subject)].map((title) => '<li>' + esc(title) + '</li>').join("") + '</ul></div>' : ""));
}
const myKinds = { "my-program": ["program"], "my-support": ["support"], "my-counsel": ["counsel"], "my-space": ["space", "goods"], "my-inquiry": ["inquiry", "proposal", "survey"] };
function myPage(kind) {
  if (!state.signedIn) return page(labels[kind] || "마이페이지", "신청내역과 이용 현황을 한 곳에서 확인하세요.",
    '<div class="empty"><p>데모 로그인 후 이용할 수 있습니다.</p><div class="actions">' + button("login", "데모 로그인", "primary") + '</div></div>');
  const links = '<div class="chips">' + groups.my[1].map(([target, label]) =>
    linkTo(target, esc(label), "chip" + (target === kind ? " active" : ""))).join("") + '</div>';
  if (kind === "profile") {
    return page("내 정보 수정", "데모 프로필과 알림 수신 설정을 관리합니다.", links +
      '<form class="panel profile" data-form="profile">' + field("별명", '<input name="name" required maxlength="30" value="' + esc(state.profile.name) + '">') +
      field("만 나이", '<input name="age" type="number" min="0" max="120" required value="' + state.profile.age + '">') +
      field("관심 분야", '<select name="interests">' + option("선택 안 함", "") + categories.map((v) => option(v, v, state.profile.interests === v)).join("") + '</select>') +
      '<label class="choice"><input type="checkbox" name="alerts"' + (state.profile.alerts ? " checked" : "") +
      '> 관심분야 문자알림 수신 희망(설정 시연)</label><div class="actions"><button class="primary">저장</button>' +
      button("withdraw", "데모 프로필 초기화") + button("logout", "로그아웃") + '</div></form>');
  }
  const list = state.records.filter((record) => !myKinds[kind] || myKinds[kind].includes(record.kind)).slice().reverse();
  const title = kind === "my" ? "마이페이지" : labels[kind];
  if (kind === "alerts") return page(title, "이 브라우저에 저장된 접수 및 취소 내역입니다.", links +
    (list.length ? '<div class="panel"><ul class="board">' + list.map((record) => '<li>' + esc(record.title) +
      ' · <b>' + esc(record.status) + '</b></li>').join("") + '</ul></div>' : empty("새로운 알림이 없습니다.")));
  const summary = kind === "my" ? '<div class="callout"><b>' + esc(state.profile.name) + '님</b> · 접수 ' +
    state.records.filter((r) => r.status === "접수").length + '건 · 취소 ' + state.records.filter((r) => r.status === "취소").length +
    '건' + (Object.keys(state.drafts).length ? ' · 임시저장 ' + Object.keys(state.drafts).length + '건' : '') + '</div>' : "";
  const drafts = Object.keys(state.drafts).map((id) => items.find((item) => item.id === id))
    .filter((item) => item && (kind === "my" || myKinds[kind]?.includes(item.kind)));
  return page(title, "접수 내용을 조회하고 처리 전인 신청을 수정하거나 취소할 수 있습니다.", links + summary +
    (drafts.length ? '<div class="panel"><h2>임시저장</h2>' + drafts.map((item) => '<div class="notice"><span>' +
      esc(item.title) + '</span>' + button("apply", "이어서 작성", "secondary", item.id) + '</div>').join("") + '</div><br>' : "") +
    (list.length ? '<div class="grid">' + list.map((r) => '<article class="card"><span class="badge ' + (r.status === "취소" ? "gray" : "green") +
      '">' + esc(r.status) + '</span><h3>' + esc(r.subject || r.title) + '</h3><p>' + esc(kinds[r.kind]) + ' · ' +
      esc(r.date || r.created) + (r.time ? " " + esc(r.time) : "") + '</p><div class="actions">' +
      button("receipt", "상세·접수증", "secondary", r.id) + (r.status === "접수" && r.kind !== "survey" ?
        button("edit", "수정", "secondary", r.id) + button("cancel", "취소", "secondary", r.id) : "") + '</div></article>').join("") + '</div>'
      : empty("신청 내역이 없습니다.")));
}
function render(focus = false) {
  const [kind, params] = route();
  const active = Object.entries(groups).find(([, [, children]]) => children.some(([child]) => child === kind))?.[0];
  $("#nav").innerHTML = Object.entries(groups).filter(([group]) => group !== "my").map(([group, [title, children]]) =>
    '<div class="navitem"><a href="#' + group + '"' + (active === group ? ' aria-current="true"' : "") + '>' + title +
    '</a><div class="submenu">' + children.map(([target, label]) => linkTo(target, esc(label))).join("") + '</div></div>').join("");
  $("#account").textContent = state.signedIn ? "마이페이지" : "로그인";
  $("#account").dataset.action = state.signedIn ? "my" : "login";
  const item = items.find((entry) => kind === "detail/" + entry.id);
  const post = posts.find((entry) => kind === "post/" + entry.id);
  if (kind === "screens") main.innerHTML = screenList();
  else if (kind === "home") main.innerHTML = home();
  else if (item) main.innerHTML = itemDetail(item);
  else if (post) main.innerHTML = postDetail(post);
  else if (["policy", "program", "support", "space", "goods", "counsel"].includes(kind)) {
    main.innerHTML = listing(kind, params);
    const date = params.get("date");
    if (kind === "space" && /^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
      main.querySelectorAll(".detail-link").forEach((a) => { a.href += "?date=" + date; });
    }
  } else if (["center", "history", "org", "directions"].includes(kind)) main.innerHTML = center(kind);
  else if (["board", "archive", "talk", "video"].includes(kind)) main.innerHTML = board(kind, params);
  else if (["vote", "survey", "proposal", "inquiry"].includes(kind)) main.innerHTML = participation(kind, params);
  else if (["calendar", "rental-calendar"].includes(kind)) main.innerHTML = calendar(kind, params);
  else if (kind === "search") main.innerHTML = search(params);
  else if (kind === "my" || kind in myKinds || ["profile", "alerts"].includes(kind)) main.innerHTML = myPage(kind);
  else if (kind === "sitemap") main.innerHTML = page("사이트맵", "행복시 청년정보 ON의 전체 메뉴입니다.", '<div class="grid">' +
    Object.values(groups).map(([title, children]) => '<div class="panel"><h2>' + title + '</h2><ul class="board">' +
      children.map(([target, label]) => '<li>' + linkTo(target, esc(label)) + '</li>').join("") + '</ul></div>').join("") +
    '<div class="panel"><h2>공통 서비스</h2><ul class="board"><li><a href="#calendar">일정 캘린더</a></li><li><a href="#search">통합검색</a></li></ul></div></div>');
  else if (kind === "privacy") main.innerHTML = page("개인정보처리방침", "시연 환경의 브라우저 저장 안내", '<div class="panel"><p>' + demo +
    '</p><p>데모 프로필, 신청서의 예시 입력값과 참여 내역은 브라우저 저장소에 보관됩니다. 지원사업 첨부는 파일명과 형식 확인만 시연합니다.</p>' +
    '<p>마이페이지의 데모 프로필 초기화 또는 브라우저의 사이트 데이터 삭제를 통해 저장된 내용을 지울 수 있습니다.</p></div>');
  else main.innerHTML = page("페이지를 찾을 수 없습니다", "주소를 확인하거나 홈으로 이동하세요.", linkTo("home", "홈으로", "primary"));
  document.title = kind === "home" ? "행복시 청년정보 ON" : (main.querySelector("h1")?.textContent || "청년정보") + " | 행복시 청년정보 ON";
  rewriteLinks();
  closeNav();
  if (focus) {
    main.focus({preventScroll:true});
    window.scrollTo(0, 0);
  }
}
function closeNav() {
  $("#nav").classList.remove("open");
  $("#menu").setAttribute("aria-expanded", "false");
}
const popupTitles=['데모 로그인','프로필 초기화','통합검색','신청 상세 · 접수증','접수 취소','청년센터 주말 운영 확대','종료된 예시 투표 결과','주소 공유',...items.map(i=>i.title),...posts.map(p=>p.title)];
function clearPopupContext(){delete window.MOCKUP_DESCRIPTION_CONTEXT;dialog.classList.remove('sb-description-mode');window.dispatchEvent(new Event('description-context-changed'));}
dialog.addEventListener('close',()=>{if(!dialog.classList.contains('sb-switching'))clearPopupContext();});
function showDialog(title, content) {
 clearPopupContext();
 const parent=screenFor(route()[0])?.id||'HOME-01';
 const number=popupTitles.indexOf(title)+1;
 if(!number)throw Error('팝업 ID 등록이 필요합니다: '+title);
 const id=parent+'-p'+String(number).padStart(2,'0');dialog.dataset.screenId=id;
 dialog.innerHTML='<div class="dialoghead"><h2 id="dialog-title">'+esc(title)+'</h2><button type="button" data-action="close" aria-label="'+esc(title)+' 팝업 닫기">×</button></div><p class="sb-popup-id">'+id+'</p><button type="button" data-popup-description>Description</button><div id="dialog-content">'+content+'</div>';
 dialog.querySelector('[data-popup-description]').addEventListener('click',()=>{
  if(dialog.matches(':modal')){dialog.classList.add('sb-switching');dialog.close();dialog.show();setTimeout(()=>dialog.classList.remove('sb-switching'),0);}
  dialog.classList.add('sb-description-mode');
  window.MOCKUP_DESCRIPTION_CONTEXT={id,title};window.dispatchEvent(new Event('description-context-changed'));window.dispatchEvent(new Event('annotation-open'));
 });
 rewriteLinks(dialog);
 if (!dialog.open) dialog.showModal();
}
let afterLogin;
function login(next) {
  afterLogin = next;
  showDialog("데모 로그인", '<p>' + demo + '</p><form data-form="login">' +
    field("사용할 별명", '<input name="name" required maxlength="30" value="' + esc(state.profile.name) + '">') +
    field("만 나이(시연용)", '<input name="age" type="number" min="0" max="120" required value="' + state.profile.age + '">') +
    '<label class="choice"><input name="consent" type="checkbox" required> 시연 내용이 브라우저에 저장되는 데 동의합니다.</label>' +
    '<button class="primary">데모 시작</button></form>');
}
function member(callback) {
  if (state.signedIn) callback();
  else login(callback);
}
const times = ["09:00", "13:00", "16:00", "19:00"];
function availableTimes(item, date, excludeId) {
  const day = new Date(date + "T12:00:00").getDay();
  if (!date || date < offset(0) || date > item.end || day === 0) return [];
  return times.filter((time) => !(day === 6 && time === "19:00") && !state.records.some((r) =>
    r.id !== excludeId && r.status !== "취소" && r.itemId === item.id && r.date === date && r.time === time));
}
function formRecord(item, record) {
  const draft = record || state.drafts[item.id] || {};
  const space = item.kind === "space", goods = item.kind === "goods", counsel = item.kind === "counsel";
  const hasDate = space || goods || counsel;
  const date = draft.date || route()[1].get("date") || offset(0);
  const written = ["proposal", "inquiry"].includes(item.kind);
  const survey = item.kind === "survey";
  if (item.days < 0 || (item.kind === "proposal" && (state.profile.age < item.min || state.profile.age > item.max))) {
    showDialog(item.title, '<p>현재 데모 프로필 또는 접수 기간으로는 참여할 수 없습니다.</p>');
    return;
  }
  if (survey && state.records.some((r) => r.itemId === item.id)) {
    showDialog(item.title, '<p class="state">이미 설문에 응답했습니다. 응답은 마이페이지에서 확인할 수 있습니다.</p>');
    return;
  }
  showDialog(item.title, '<p class="muted">' + demo + '</p><form data-form="record" data-id="' + item.id + '" data-edit="' + (record?.id || "") + '">' +
    field("신청자 별명", '<input name="name" required maxlength="30" value="' + esc(draft.name || state.profile.name) + '">') +
    (written ? field("제목", '<input name="subject" maxlength="100" required value="' + esc(draft.subject || "") + '">') : "") +
    (hasDate ? field(space ? "이용일" : goods ? "대여 시작일" : "상담 희망일", '<input name="date" type="date" required min="' +
      offset(0) + '" max="' + item.end + '" value="' + esc(date) + '">') : "") +
    (space ? field("예약 시간", '<select name="time" required>' + timeOptions(item, date, record?.id, draft.time) + '</select>') +
      field("이용 인원", '<input name="people" type="number" required min="1" max="' + item.capacity + '" value="' + (draft.people || 1) + '">') +
      field("부대시설", '<select name="equipment">' + ["사용 안 함", "프로젝터", "화이트보드"].map((v) => option(v, v, draft.equipment === v)).join("") + '</select>') : "") +
    (goods ? field("반납 예정일", '<input name="until" type="date" required min="' + esc(date) + '" max="' + item.end + '" value="' + esc(draft.until || date) + '">') : "") +
    (survey ? field("프로그램에 얼마나 만족하셨나요?", '<select name="rating" required>' + option("선택해 주세요", "") +
      ["매우 만족", "만족", "보통", "불만족", "매우 불만족"].map((v) => option(v, v, draft.rating === v)).join("") + '</select>') : "") +
    field(written ? "내용" : survey ? "개선 의견" : "신청 목적 또는 요청사항", '<textarea name="note" maxlength="1000"' +
      (written || space ? " required" : "") + '>' + esc(draft.note || "") + '</textarea>') +
    (item.kind === "support" ? field("첨부파일 (PDF 또는 ZIP, 파일당 20MB)", '<input type="file" name="files" multiple accept=".pdf,.zip">' +
      (draft.files?.length ? '<span class="muted">저장된 파일명: ' + draft.files.map(esc).join(", ") + '</span>' : "")) : "") +
    '<p class="form-error" role="alert"></p><div class="actions"><button class="primary">' + (record ? "변경 저장" : "제출하기") + '</button>' +
    (!record && !survey ? button("draft", "임시저장") : "") + '</div></form>');
}
function timeOptions(item, date, editId, selected) {
  const available = availableTimes(item, date, editId);
  return option(available.length ? "시간 선택" : "예약 가능한 시간이 없습니다", "") +
    available.map((time) => option(time, time, time === selected)).join("");
}
function recordValues(form) {
  const data = new FormData(form);
  const values = Object.fromEntries([...data].filter(([, value]) => typeof value === "string").map(([name, value]) => [name, value.trim()]));
  const files = [...(form.elements.files?.files || [])];
  if (files.some((file) => !/\.(pdf|zip)$/i.test(file.name) || file.size > 20 * 1024 * 1024)) {
    form.querySelector(".form-error").textContent = "파일당 20MB 이하의 PDF 또는 ZIP 파일만 첨부할 수 있습니다.";
    return null;
  }
  const prior = state.records.find((r) => r.id === form.dataset.edit) || state.drafts[form.dataset.id];
  values.files = files.length ? files.map((file) => file.name) : prior?.files || [];
  return values;
}
function receipt(record) {
  showDialog("신청 상세 · 접수증", '<h3>' + esc(record.subject || record.title) + '</h3>' + details([
    ["접수번호", record.id], ["처리 상태", record.status], ["신청자", record.name], ["접수일", record.created],
    ...(record.date ? [["이용일", record.date + (record.time ? " " + record.time : "")]] : []),
    ...(record.until ? [["반납 예정일", record.until]] : []),
    ...(record.people ? [["이용 인원", record.people], ["부대시설", record.equipment]] : []),
    ...(record.rating ? [["만족도", record.rating]] : []),
    ...(record.files.length ? [["첨부 파일명", record.files.join(", ")]] : []),
    ["내용", record.note || "입력 없음"]
  ]) + '<div class="actions">' + button("print", "접수증 인쇄", "primary") + '</div>');
}

document.addEventListener("click", async (event) => {
  if(event.target.closest('a[href="#content"]')){event.preventDefault();main.focus();main.scrollIntoView();return;}
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const {action, id} = target.dataset;
  const item = items.find((entry) => entry.id === id);
  const record = state.records.find((entry) => entry.id === id);
  switch (action) {
    case "menu":
      target.setAttribute("aria-expanded", $("#nav").classList.toggle("open"));
      break;
    case "featured":
      featured = id;
      $("#featured").innerHTML = chips(["전체", ...categories], featured, "featured") +
        cards(items.filter((entry) => entry.kind === "policy" && (id === "전체" || entry.category === id)).slice(0, 3));
      $("#featured [aria-pressed=true]").focus();
      break;
    case "my": go("my"); break;
    case "login": login(() => go("my")); break;
    case "logout":
      state.signedIn = false;
      save();
      go("home");
      notify("로그아웃했습니다.");
      break;
    case "withdraw":
      showDialog("프로필 초기화", state.records.some((r) => r.status === "접수" && ["program","support","space","goods","counsel"].includes(r.kind))
        ? "<p>처리 중인 신청이나 예약이 있습니다. 해당 접수를 취소한 후 초기화할 수 있습니다.</p>"
        : '<p>이 브라우저에 저장된 시연 내역을 삭제합니다.</p><div class="actions">' + button("reset", "초기화", "primary") + '</div>');
      break;
    case "reset":
      state = structuredClone(initial);
      save();
      dialog.close();
      go("home");
      notify("시연 데이터를 초기화했습니다.");
      break;
    case "search":
      showDialog("통합검색", '<form data-form="search">' + field("검색어", '<input name="q" type="search" required autofocus>') +
        '<button class="primary">검색</button></form>');
      break;
    case "close": dialog.close(); break;
    case "print": window.print(); break;
    case "apply": if (item) member(() => formRecord(item)); break;
    case "edit": if (record?.status === "접수") member(() => formRecord(items.find((entry) => entry.id === record.itemId), record)); break;
    case "receipt": if (record) member(() => receipt(record)); break;
    case "cancel":
      if (record?.status === "접수") member(() => showDialog("접수 취소", '<p>‘' + esc(record.subject || record.title) +
        '’의 접수를 취소할까요?</p><div class="actions">' + button("cancel-confirm", "접수 취소", "primary", id) + '</div>'));
      break;
    case "cancel-confirm":
      if (!state.signedIn || record?.status !== "접수") break;
      record.status = "취소";
      save();
      dialog.close();
      render();
      notify("접수를 취소했습니다.");
      break;
    case "draft": {
      if (!state.signedIn) break;
      const form = target.closest("form");
      const values = recordValues(form);
      if (!values) break;
      state.drafts[form.dataset.id] = values;
      save();
      dialog.close();
      notify("임시저장했습니다. 마이페이지에서 이어서 작성할 수 있습니다.");
      break;
    }
    case "vote":
      member(() => showDialog("청년센터 주말 운영 확대", state.votes.weekend ? '<p>이미 투표했습니다.</p>' :
        '<form data-form="vote"><p>토요일 운영 시간 확대에 동의하시나요?</p>' +
        '<label class="choice"><input type="radio" name="choice" value="찬성" required> 찬성</label>' +
        '<label class="choice"><input type="radio" name="choice" value="반대"> 반대</label><button class="primary">투표 제출</button></form>'));
      break;
    case "vote-result":
      showDialog("종료된 예시 투표 결과", '<p>청년 네트워킹 데이 도입 · 총 100표</p>' + details([["찬성","76표"],["반대","24표"]]));
      break;
    case "share":
      try {
        await navigator.clipboard.writeText(location.href);
        notify("주소를 복사했습니다.");
      } catch {
        showDialog("주소 공유", field("이 페이지 주소", '<input readonly value="' + esc(location.href) + '">'));
      }
      break;
    case "preview":
    case "download": {
      const post = posts.find((entry) => entry.id === id);
      if (!post) break;
      if (action === "preview") showDialog(post.title, '<p>' + esc(post.description) + '</p>');
      else {
        const url = URL.createObjectURL(new Blob(["\uFEFF", post.title, "\n\n", post.description], {type:"text/plain;charset=utf-8"}));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = post.title + ".txt";
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      break;
    }
  }
});
document.addEventListener("change", ({target: input}) => {
  const form = input.closest('form[data-form="record"]');
  if (!form || input.name !== "date") return;
  if (form.elements.time) {
    const item = items.find((entry) => entry.id === form.dataset.id);
    form.elements.time.innerHTML = timeOptions(item, input.value, form.dataset.edit);
  }
  if (form.elements.until) {
    form.elements.until.min = input.value;
    if (form.elements.until.value < input.value) form.elements.until.value = input.value;
  }
});


document.addEventListener("submit", (event) => {
  const form = event.target;
  const kind = form.dataset.form;
  if (!kind) return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  if (kind === "search" || kind === "filter") {
    const params = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, value.trim()]).filter(([, value]) => value));
    if (kind === "search" && !params.q) return;
    if (dialog.open) dialog.close();
    go(kind === "search" ? "search" : form.dataset.id, params);
    return;
  }
  if (kind === "login" || kind === "profile") {
    if (kind === "profile" && !state.signedIn) return;
    if (!values.name.trim()) {
      form.elements.name.focus();
      return;
    }
    state.profile = { ...state.profile, name: values.name.trim(), age: Number(values.age) };
    if (kind === "profile") {
      state.profile.interests = values.interests;
      state.profile.alerts = Boolean(values.alerts);
      save();
      notify("데모 프로필을 저장했습니다.");
    } else {
      state.signedIn = true;
      save();
      dialog.close();
      render();
      const next = afterLogin;
      afterLogin = undefined;
      next?.();
      notify("데모 로그인을 완료했습니다.");
    }
    return;
  }
  if (!state.signedIn) return;
  if (kind === "vote") {
    if (state.votes.weekend || !["찬성","반대"].includes(values.choice)) return;
    state.votes.weekend = values.choice;
    save();
    dialog.close();
    render();
    notify("투표했습니다. 결과는 마감 후 공개됩니다.");
  }
  if (kind === "record") submitRecord(form);
});
function submitRecord(form) {
  const item = items.find((entry) => entry.id === form.dataset.id);
  const existing = state.records.find((r) => r.id === form.dataset.edit);
  const data = recordValues(form);
  if (!data) return;
  const error = form.querySelector(".form-error");
  if (!data.name || (form.elements.subject && !data.subject) || (form.elements.note.required && !data.note)) {
    error.textContent = "필수 항목을 입력해 주세요.";
    return;
  }
  if (existing && existing.status !== "접수") {
    error.textContent = "현재 상태에서는 수정할 수 없습니다.";
    return;
  }
  if (item.kind === "space" && !availableTimes(item, data.date, existing?.id).includes(data.time)) {
    error.textContent = "예약할 수 없는 시간입니다. 다른 시간을 선택해 주세요.";
    return;
  }
  if (item.kind === "goods" && (data.until < data.date || state.records.some((r) =>
    r.id !== existing?.id && r.itemId === item.id && r.status !== "취소" && r.date <= data.until && r.until >= data.date))) {
    error.textContent = "선택한 기간에 대여할 수 없습니다. 시작일과 반납일을 확인해 주세요.";
    return;
  }
  if (item.kind === "survey" && state.records.some((r) => r.itemId === item.id)) {
    error.textContent = "이미 응답했습니다.";
    return;
  }
  if (existing) Object.assign(existing, data);
  else state.records.push({ ...data, id: "HB-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2,6).toUpperCase(),
    title: item.title, itemId: item.id, kind: item.kind, created: offset(0), status: "접수" });
  delete state.drafts[item.id];
  save();
  dialog.close();
  go("my");
  notify(existing ? "변경 사항을 저장했습니다." : "접수했습니다. 마이페이지에서 확인할 수 있습니다.");
}
window.addEventListener("hashchange", () => {
  if(dialog.open)dialog.close();
  if (location.hash !== "#content") render(true);
});
render();


})();
