import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { projects as defaults } from './projects.mjs';
const hash = x => createHash('sha256').update(x).digest('base64url');
const random = () => randomBytes(32).toString('base64url');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const str = (x, max=200) => { if(typeof x !== 'string' || !x.trim() || x.length>max) fail(400,'입력값을 확인해 주세요.'); return x; };
export function createApp({dbPath=process.env.DB_PATH||'./data/study.sqlite', projects=defaults, clientId=process.env.GITHUB_CLIENT_ID, clientSecret=process.env.GITHUB_CLIENT_SECRET, publicUrl=process.env.PUBLIC_URL, fetcher=fetch}={}) {
 mkdirSync(dirname(dbPath),{recursive:true});
 const db=new DatabaseSync(dbPath);
 db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,project TEXT,screen TEXT,data TEXT); CREATE TABLE IF NOT EXISTS auth(key TEXT PRIMARY KEY,kind TEXT,data TEXT,expires INTEGER);`);
 const configured=!!(clientId&&clientSecret&&publicUrl);
 if(configured && new URL(publicUrl).protocol!=='https:') throw Error('PUBLIC_URL must use HTTPS');
 const origins=new Set(Object.values(projects).map(p=>new URL(p.returnUrl).origin));
 const put=(key,kind,data,ttl)=>db.prepare('INSERT INTO auth VALUES(?,?,?,?)').run(hash(key),kind,JSON.stringify(data),Date.now()+ttl);
 const get=(key,kind,consume=false)=>{const k=hash(key),row=db.prepare('SELECT * FROM auth WHERE key=? AND kind=? AND expires>?').get(k,kind,Date.now());if(consume)db.prepare('DELETE FROM auth WHERE key=? AND kind=?').run(k,kind);return row?JSON.parse(row.data):null;};
 const github=async(path,token)=>{const r=await fetcher('https://api.github.com'+path,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(15000)});if(!r.ok)fail(r.status===401?401:403,'GitHub 권한을 확인하지 못했습니다.');return r.json();};
 const identity=async(token,project)=>{const u=await github('/user',token);const repo=await github('/repos/'+projects[project].repository,token);if(!repo.permissions?.push&&!repo.permissions?.admin&&!repo.permissions?.maintain)fail(403,'저장소 쓰기 권한이 있는 공동작업자가 아닙니다.');return {name:u.login,editor:true};};
 const records=project=>db.prepare('SELECT data FROM records WHERE project=? ORDER BY rowid').all(project).map(r=>JSON.parse(r.data));
 const save=(project,r)=>db.prepare('INSERT OR REPLACE INTO records VALUES(?,?,?,?)').run(r.id,project,r.screen,JSON.stringify(r));
 const rates=new Map();
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  const redirect=url=>{res.writeHead(302,{Location:String(url)});res.end();};
  try {
   db.prepare('DELETE FROM auth WHERE expires<=?').run(Date.now());
   const now=Date.now();
   for(const [key,value] of rates)if(value.until<now)rates.delete(key);
   const ip=req.socket.remoteAddress;
   const rate=rates.get(ip)||{count:0,until:now+60000};
   rate.count++;rates.set(ip,rate);
   if(rate.count>300){res.setHeader('Retry-After','60');fail(429,'요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');}
   const url=new URL(req.url,'http://localhost');
   if(req.headers.origin){if(!origins.has(req.headers.origin))fail(403,'허용되지 않은 사이트입니다.');res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');}
   if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');res.writeHead(204);return res.end();}
   if(url.pathname==='/health'&&req.method==='GET')return json(200,{ok:true,githubConfigured:configured});
   if(url.pathname==='/api/github/start'&&req.method==='GET'){
    if(!configured)fail(503,'GitHub 로그인 앱 연결 설정이 필요합니다.');
    const project=url.searchParams.get('project'),challenge=url.searchParams.get('challenge'),screen=str(url.searchParams.get('screen'));
    if(!Object.hasOwn(projects,project)||! /^[A-Za-z0-9_-]{43}$/.test(challenge||''))fail(400,'로그인 요청을 확인해 주세요.');
    const state=random();put(state,'state',{project,challenge,screen},600000);
    const target=new URL('https://github.com/login/oauth/authorize');target.search=new URLSearchParams({client_id:clientId,redirect_uri:publicUrl+'/api/github/callback',scope:'repo',state});return redirect(target);
   }
   if(url.pathname==='/api/github/callback'&&req.method==='GET'){
    const state=get(url.searchParams.get('state')||'','state',true);if(!state)fail(400,'로그인 요청이 만료되었습니다. 다시 시작해 주세요.');
    const target=new URL(projects[state.project].returnUrl);target.hash=state.screen;
    try {
     if(url.searchParams.has('error'))fail(401,'GitHub login cancelled');
     const code=str(url.searchParams.get('code'),500);
     const response=await fetcher('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:clientId,client_secret:clientSecret,code,redirect_uri:publicUrl+'/api/github/callback'}),signal:AbortSignal.timeout(15000)});
     const data=await response.json();if(!response.ok||!data.access_token)fail(401,'GitHub login failed');
     await identity(data.access_token,state.project);
     const exchange=random();put(exchange,'exchange',{...state,accessToken:data.access_token},120000);target.searchParams.set('annotation_code',exchange);
    }catch{target.searchParams.set('annotation_error','github_login');}
    return redirect(target);
   }
   if(url.pathname!=='/api/collab')fail(404,'Not found');
   if(!['GET','POST'].includes(req.method))fail(405,'Method not allowed');
   let body={};if(req.method==='POST'){
    if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'JSON 요청이 필요합니다.');
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>20000)fail(413,'요청이 너무 큽니다.');}try{body=JSON.parse(raw);}catch{fail(400,'잘못된 JSON입니다.');}
   }
   const op=req.method==='POST'?body.op:url.searchParams.get('op'),project=req.method==='POST'?body.project:url.searchParams.get('project');
   if(!Object.hasOwn(projects,project))fail(400,'등록되지 않은 프로젝트입니다.');
   if(op==='exchange'&&req.method==='POST'){
    const pending=get(str(body.code,500),'exchange');if(!pending||pending.project!==project||hash(str(body.verifier,200))!==pending.challenge)fail(401,'로그인 요청이 유효하지 않습니다.');
    get(body.code,'exchange',true);const user=await identity(pending.accessToken,project),token=random();put(token,'session',{project,accessToken:pending.accessToken},8*3600000);return json(200,{token,user});
   }
   const token=req.headers.authorization?.replace(/^Bearer /,'');let session=token?get(token,'session'):null;
   if(token&&(!session||session.project!==project))fail(401,'로그인이 만료되었습니다.');
   if(op==='logout'&&req.method==='POST'){if(token)get(token,'session',true);return json(200,{ok:true});}
   if(op==='config'&&req.method==='GET')return json(200,{githubConfigured:configured});
   const user=session?await identity(session.accessToken,project):null;
   if(op==='list'&&req.method==='GET')return json(200,{records:records(project).filter(r=>r.screen===url.searchParams.get('screen')),user,githubConfigured:configured});
   if(op==='planning-notes'&&req.method==='GET')return json(200,{records:records(project).flatMap(r=>{try{const s=JSON.parse(r.text);return s.planningNote?[{id:r.id,screen:r.screen,number:r.number,item:s.item,planningNote:s.planningNote}]:[];}catch{return [];}})});
   if(req.method!=='POST')fail(400,'지원하지 않는 요청입니다.');
   if(!user?.editor)fail(401,'공동작업자 로그인이 필요합니다.');
   if(op==='create'){
    const screen=str(body.screen),text=str(body.text,5000),a=body.anchor;
    if(!a||typeof a.selector!=='string'||a.selector.length>1000||!Number.isFinite(a.x)||!Number.isFinite(a.y)||a.x<0||a.x>1||a.y<0||a.y>1)fail(400,'핀 위치를 확인해 주세요.');
    const r={id:random(),screen,text,anchor:{selector:a.selector,sample:String(a.sample||'').slice(0,100),x:a.x,y:a.y},number:Math.max(0,...records(project).filter(r=>r.screen===screen).map(r=>r.number))+1,revision:1,author:user.name,created:new Date().toISOString(),comments:[]};save(project,r);return json(200,{id:r.id});
   }
   const r=records(project).find(r=>r.id===body.id);if(!r)fail(404,'설명을 찾지 못했습니다.');if(r.revision!==body.revision)fail(409,'다른 사용자가 수정했습니다. 다시 불러와 주세요.');
   if(op==='delete')db.prepare('DELETE FROM records WHERE id=? AND project=?').run(r.id,project);
   else {if(op==='update')r.text=str(body.text,5000);else if(op==='move'){for(const k of ['offsetX','offsetY']){if(!Number.isFinite(body[k])||Math.abs(body[k])>4096)fail(400,'핀 위치를 확인해 주세요.');r.anchor[k]=body[k];}}else fail(400,'지원하지 않는 요청입니다.');r.revision++;r.updated=new Date().toISOString();r.updatedBy=user.name;save(project,r);}
   return json(200,{id:r.id});
  }catch(e){if(!res.headersSent)json(e.status||500,{error:e.status?e.message:'서버 요청 처리에 실패했습니다.'});else res.end();}
 });
 server.on('close',()=>db.close());return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)createApp().listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Study collaboration server started'));
