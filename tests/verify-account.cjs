const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const Module=require('node:module');const ts=require('typescript');const {DatabaseSync}=require('node:sqlite');
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_thin_excalibur.sql','utf8'));
let requestHeaders=new Headers();
const binding={prepare(sql){let values=[];return{bind(...args){values=args;return this;},async first(){return sqlite.prepare(sql).get(...values)??null;},async run(){sqlite.prepare(sql).run(...values);return{success:true};}};}};
const env={DB:binding};
const originalResolve=Module._resolveFilename;Module._resolveFilename=function(request,parent,...args){if(request.startsWith('@/'))request=path.resolve(request.slice(2));return originalResolve.call(this,request,parent,...args);};
const originalLoad=Module._load;Module._load=function(request,parent,...args){
 if(request==='cloudflare:workers')return{env};
 if(request==='next/headers')return{headers:async()=>requestHeaders};
 if(request==='next/navigation')return{redirect:path=>{throw Object.assign(new Error('Redirect'),{redirect:path});}};
 if(request==='@/components/workspace')return{Workspace:()=>null};
 if(request==='@/components/registration')return{Registration:()=>null};
 return originalLoad.call(this,request,parent,...args);
};
for(const extension of ['.ts','.tsx'])require.extensions[extension]=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
const {POST}=require('../app/api/account/route.ts');const App=require('../app/app/page.tsx').default;const Register=require('../app/register/page.tsx').default;
const {getChatGPTUser,chatGPTSignInPath}=require('../app/chatgpt-auth.ts');
function actor(id,email){requestHeaders=new Headers(id?{'oai-authenticated-user-id':id,'oai-authenticated-user-email':email}:{});}
function request(data,{origin='https://precidoc.test',type='application/json'}={}){return new Request('https://precidoc.test/api/account',{method:'POST',headers:{origin,'content-type':type},body:typeof data==='string'?data:JSON.stringify(data)});}
(async()=>{
 actor();assert.equal((await POST(request({name:'Guest'}))).status,401);await assert.rejects(App(),error=>error.redirect==='/register');const guest=await Register();assert.equal(guest.props.user,null);assert(guest.props.signInHref.startsWith('/signin-with-chatgpt'));
 actor('user-one','verified@example.test');assert.equal((await POST(request({name:'Attacker'},{origin:'https://evil.test'}))).status,403);assert.equal((await POST(request({name:'A'}))).status,400);assert.equal((await POST(request('{bad'))).status,400);assert.equal((await POST(request({name:'User'},{type:'text/plain'}))).status,415);
 await assert.rejects(App(),error=>error.redirect==='/register');
 const created=await POST(request({name:'Rizal Example',userId:'forged-user',email:'forged@example.test'}));assert.equal(created.status,200);const profile=await created.json();assert.equal(profile.account.email,'verified@example.test');assert.equal(sqlite.prepare('SELECT COUNT(*) AS total FROM precidoc_accounts').get().total,1);assert.equal(sqlite.prepare('SELECT user_id FROM precidoc_accounts').get().user_id,'user-one');
 const full=await App();assert.equal(full.props.accountName,'Rizal Example');assert.equal(full.props.trial,undefined);await assert.rejects(Register(),error=>error.redirect==='/app');
 await POST(request({name:'Changed name'}));assert.equal(sqlite.prepare('SELECT COUNT(*) AS total FROM precidoc_accounts').get().total,1);assert.equal((await App()).props.accountName,'Rizal Example');
 actor('user-two','other@example.test');await assert.rejects(App(),error=>error.redirect==='/register');
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS total FROM precidoc_accounts').get().total,1);
 requestHeaders.set('oai-authenticated-user-full-name','Rizal%20Aditya');requestHeaders.set('oai-authenticated-user-full-name-encoding','percent-encoded-utf-8');assert.equal((await getChatGPTUser()).fullName,'Rizal Aditya');
 assert.equal(chatGPTSignInPath('//evil.test'),'/signin-with-chatgpt?return_to=%2F');
 env.DB=undefined;const unavailable=await App();assert.equal(unavailable.props.unavailable,true);
 sqlite.close();console.log('Passed registration/authentication: migration, verified identity, unauthorized and cross-origin rejection, validation, prepared SQL, idempotent registration, account isolation, protected workspace redirect, and fail-closed database failure.');
})().catch(error=>{console.error(error);process.exitCode=1;});
