import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApp} from './index.mjs';
test('Optional OAuth and anonymous CRUD, project isolation and revision conflict',async()=>{
 let allowed=true;
 const projects={hekim:{repository:'owner/repo',returnUrl:'https://example.com/hekim/'},mjha:{repository:'owner/repo',returnUrl:'https://example.com/mjha/'}};
 const fetcher=async url=>Response.json(String(url).includes('access_token')?{access_token:'test-only-token'}:String(url).endsWith('/user')?{login:'tester'}:{permissions:{push:allowed}});
 const server=createApp({dbPath:':memory:',projects,clientId:'test',clientSecret:'test',publicUrl:'https://server.example',fetcher});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const call=(body,token)=>fetch(base+'/api/collab',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({project:'hekim',...body})});
 try{
 assert.equal((await fetch(base+'/health')).status,200);
 assert.equal((await fetch(base+'/api/collab?op=list&project=hekim&screen=HOME-01',{headers:{Origin:'https://evil.example'}})).status,403);
 assert.equal((await call({op:'create'})).status,400);
 const verifier='a'.repeat(64),challenge=createHash('sha256').update(verifier).digest('base64url');
 const start=await fetch(base+'/api/github/start?'+new URLSearchParams({project:'hekim',screen:'HOME-01',challenge}),{redirect:'manual'});
 const state=new URL(start.headers.get('location')).searchParams.get('state');
 assert.equal((await fetch(base+'/api/github/callback?state=wrong&code=x',{redirect:'manual'})).status,400);
 const callback=await fetch(base+'/api/github/callback?'+new URLSearchParams({state,code:'github-code'}),{redirect:'manual'});
 const code=new URL(callback.headers.get('location')).searchParams.get('annotation_code');assert.ok(code);
 assert.equal((await call({op:'exchange',code,verifier:'wrong'})).status,401);
 const exchange=await call({op:'exchange',code,verifier});const {token,user}=await exchange.json();assert.equal(user.editor,true);assert.ok(token);
 assert.equal((await call({op:'exchange',code,verifier})).status,401);
 assert.equal((await call({op:'update',project:'mjha',id:'missing',revision:1,text:'x'})).status,404);
 const result=await call({op:'create',screen:'HOME-01',text:'description',anchor:{selector:'#content',x:0,y:0}});assert.equal(result.status,200);const {id}=await result.json();
 const list=()=>fetch(base+'/api/collab?op=list&project=hekim&screen=HOME-01').then(r=>r.json());
 assert.equal((await list()).records[0].text,'description');
 assert.equal((await call({op:'update',id,revision:1,text:'edited'})).status,200);
 assert.equal((await call({op:'update',id,revision:1,text:'stale'})).status,409);
 assert.equal((await call({op:'move',id,revision:2,offsetX:10,offsetY:20})).status,200);
 assert.equal((await list()).records[0].anchor.offsetX,10);
 allowed=false;
 assert.equal((await call({op:'delete',id,revision:3})).status,200);assert.equal((await list()).records.length,0);
 assert.equal((await call({op:'logout'})).status,200);assert.equal((await call({op:'create'})).status,400);
 }finally{await new Promise(r=>server.close(r));}
});
