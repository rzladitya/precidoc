const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const { parseHTML, DOMParser } = require('linkedom');
const { window, document } = parseHTML('<!doctype html><html><head><meta name="description" content=""></head><body><div id="root"></div></body></html>');
const storage = new Map();
Object.assign(globalThis, { window, document, HTMLElement: window.HTMLElement, HTMLInputElement: window.HTMLInputElement, HTMLTextAreaElement: window.HTMLTextAreaElement, Node: window.Node, MutationObserver: window.MutationObserver, Event: window.Event, CustomEvent: window.CustomEvent, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value) }, IS_REACT_ACT_ENVIRONMENT: true });
for(const name of ['HTMLFormElement','HTMLSelectElement','HTMLOptionElement','Element','DocumentFragment'])globalThis[name]=window[name]??window.HTMLElement;
globalThis.DocumentFragment=function(){return document.createDocumentFragment();};
window.location = { search: '', href: 'http://example.test/', origin: 'http://example.test' };
window.matchMedia = () => ({matches:true, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}});
window.getComputedStyle = () => ({display:'block',visibility:'visible',position:'static',direction:'ltr',paddingLeft:'0',paddingRight:'0',marginLeft:'0',marginRight:'0',getPropertyValue(){return ''}});
globalThis.getComputedStyle = window.getComputedStyle;
globalThis.requestAnimationFrame = window.requestAnimationFrame = callback => setTimeout(() => callback(Date.now()),0);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame = clearTimeout;
globalThis.ResizeObserver = class {observe(){} unobserve(){} disconnect(){}};
globalThis.IntersectionObserver = class {constructor(callback){this.callback=callback;} observe(){this.callback([{isIntersecting:true}]);} disconnect(){}};
window.HTMLElement.prototype.scrollIntoView = function(){};
window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.setPointerCapture = function(){};
window.HTMLElement.prototype.releasePointerCapture = function(){};
class BrowserDOMParser extends DOMParser {parseFromString(value,type){return super.parseFromString(type==='text/html'?`<html><head></head><body>${value}</body></html>`:value,type);}}
globalThis.DOMParser = BrowserDOMParser;
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request,parent,...args){if(request.startsWith('@/'))request=path.resolve(request.slice(2));return originalResolve.call(this,request,parent,...args);};
const originalLoad = Module._load;
let downloads = [];
let verified=false,invalidOtp=true,otpSent=0;
let resetRequest,resetSubmission,resetFails=false;
const authClient={signUp:{email:async()=>({data:{},error:null})},signIn:{email:async()=>({error:{code:'EMAIL_NOT_VERIFIED',message:'Verify your email'}})},getSession:async()=>({data:{user:{emailVerified:verified}}}),emailOtp:{verifyEmail:async({otp})=>{assert.equal(otp,'123456');if(invalidOtp)return{error:{message:'Invalid code'}};verified=true;return{error:null};},sendVerificationOtp:async({email,type})=>{assert.equal(email,'test@example.test');assert.equal(type,'email-verification');otpSent++;return{error:null};}}};
Module._load = function(request,parent,...args){
 if(request==='@/lib/auth/client')return{authClient:{...authClient,requestPasswordReset:async payload=>{resetRequest=payload;return{error:resetFails?{code:'FAILED'}:null};},resetPassword:async payload=>{resetSubmission=payload;return{error:resetFails?{code:'FAILED'}:null};}}};
 if(request==='next/navigation')return{usePathname:()=>'/auth/sign-in',useSearchParams:()=>new URLSearchParams(window.location.search)};
 if(request==='next/link') return {__esModule:true,default:props=>require('react').createElement('a',props,props.children)};
 if(request==='@/lib/download') return {downloadFile:(content,name,mime)=>downloads.push({content,name,mime})};
 return originalLoad.call(this,request,parent,...args);
};
for(const extension of ['.ts','.tsx']) require.extensions[extension] = (module,filename) => {
 let source=fs.readFileSync(filename,'utf8');
 module._compile(ts.transpileModule(source,{fileName:filename,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
};
const React = require('react');
const { createRoot } = require('react-dom/client');
const { LanguageProvider, useLanguage } = require('../components/language.tsx');
const { ProductDemo } = require('../components/product-demo.tsx');
const { Workspace } = require('../components/workspace.tsx');
const { Registration } = require('../components/registration.tsx');
const { AuthForm }=require('../components/auth-form.tsx');
const { PasswordRecovery }=require('../components/password-recovery.tsx');
const { act } = React;
const root = createRoot(document.getElementById('root'));
const tick = () => new Promise(resolve=>setTimeout(resolve,40));
async function click(node){assert(node,'Missing click target');await act(async()=>{const down=new window.Event('mousedown',{bubbles:true});Object.assign(down,{button:0,ctrlKey:false});node.dispatchEvent(down);node.dispatchEvent(new window.Event('click',{bubbles:true}));await tick();});}
function tab(value){return [...document.querySelectorAll('[role=tab]')].find(node=>node.getAttribute('aria-label')===value||node.textContent.includes(value));}
function button(value){return [...document.querySelectorAll('button')].find(node=>node.textContent===value);}
let setLocale; function Bridge({component,props}){setLocale=useLanguage().setLocale;return React.createElement(component,props);}
async function change(node,value){assert(node);const key=Object.keys(node).find(key=>key.startsWith('__reactProps$'));assert(node[key].onChange);await act(async()=>{node[key].onChange({target:{value}});await tick();});}
async function mount(component,props){await act(async()=>{root.render(React.createElement(LanguageProvider,null,React.createElement(Bridge,{component,props})));await tick();});await act(async()=>{await tick();});}
(async()=>{
 await mount(Workspace,{trial:true});
 assert.equal(document.querySelectorAll('.document-item').length,1);
 const input=document.querySelector('input[type=file]');
 assert.equal(input.hasAttribute('multiple'),false);
 async function upload(files){Object.defineProperty(input,'files',{configurable:true,value:files});await act(async()=>{input.dispatchEvent(new window.Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,150));});}
 await upload([new File(['A'],'a.txt'),new File(['B'],'b.txt')]);
 assert.equal(document.querySelectorAll('.document-item').length,1);assert(document.querySelector('.error-banner').textContent.includes('one document'));
 await upload([new File([new Uint8Array(6*1024*1024)],'large.txt')]);
 assert(document.querySelector('.error-banner').textContent.includes('5 MB'));assert(document.querySelector('.document-detail-head').textContent.includes('Database-Recovery.md'));
 await upload([new File(['# First document\n\nTrial text.'],'one.md')]);
 assert.equal(document.querySelectorAll('.document-item').length,1);assert(document.querySelector('.document-detail-head').textContent.includes('one.md'));
 await upload([new File(['# Second\n\nNot added.'],'two.md')]);assert(document.querySelector('.error-banner').textContent.includes('one document'));assert(document.querySelector('.document-detail-head').textContent.includes('one.md'));
 await click(tab('Source & output'));const editor=document.querySelector('.editor-text');await change(editor,editor.value+'\nTrial edited by user.');
 await click(tab('Chunks'));assert(document.querySelector('.chunk-card').textContent.includes('Trial edited by user.'));assert.equal(document.querySelector('.chunk-controls [role=combobox]').disabled,true);
 await click(tab('Export'));assert.equal(button('Export JSON'),undefined);assert.equal(button('Export Markdown').disabled,true);
 await click(document.querySelector('#approve-document'));await click(button('Export Markdown'));assert(downloads.at(-1).content.includes('Trial edited by user.'));assert(document.querySelector('.trial-upsell a').getAttribute('href')==='/register');
 await act(async()=>{setLocale('id');await tick();});assert(document.querySelector('.trial-banner').textContent.includes('1 dokumen'));assert(document.querySelector('.document-detail-head').textContent.includes('one.md'));
 await act(async()=>{setLocale('en');await tick();});
 await click(document.querySelector('[aria-label="Remove document from this tab"]'));await upload([new File(['Replacement'],'replacement.txt')]);assert.equal(document.querySelectorAll('.document-item').length,1);
 await act(async()=>{root.render(null);await tick();});
 await mount(Registration,{user:null,signInHref:'/auth/sign-in?returnTo=%2Fregister'});
 assert.equal(document.querySelector('h1').textContent,'Create your account');assert.equal(document.querySelectorAll('input').length,3);assert(document.querySelector('.account-art'));assert(document.querySelector('.account-switch').textContent.includes('Sign in'));
 await act(async()=>{root.render(null);await tick();});
 let posted,redirected;
 globalThis.fetch=async (url,options)=>{posted={url,options};return Response.json({account:{name:'Trial user',email:'verified@example.test'}});};
 window.location.assign=url=>redirected=url;
 await mount(Registration,{user:{name:'Trial user',email:'verified@example.test'},signInHref:'/auth/sign-in?returnTo=%2Fregister'});
 await act(async()=>{document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await tick();});
 assert.equal(posted.url,'/api/account');assert.deepEqual(JSON.parse(posted.options.body),{name:'Trial user'});assert.equal(redirected,'/app');
 globalThis.fetch=async()=>Response.json({error:'account_unavailable'},{status:503});
 await act(async()=>{document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await tick();});assert(document.querySelector('.account-error').textContent.includes('unavailable'));assert.equal(document.querySelector('input').value,'Trial user');
 await act(async()=>{root.render(null);await tick();});
 let cooldownCallback;const nativeTimeout=globalThis.setTimeout;globalThis.setTimeout=(fn,delay,...args)=>delay===1000?(cooldownCallback=fn,123456789):nativeTimeout(fn,delay,...args);
 await mount(AuthForm,{});
 assert(!document.body.textContent.includes('Google'));
 await click(button('Create an account'));
 await change(document.querySelector('input'),'Test User');
 await change(document.querySelector('input[type=email]'),'test@example.test');
 await change(document.querySelector('input[type=password]'),'password-test');
 async function submitAuth(){await act(async()=>{document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await tick();});}
 await submitAuth();assert(document.querySelector('h1').textContent.includes('Verify your email'));
 await change(document.querySelector('input'),'123456');
 await submitAuth();assert(document.querySelector('[role=alert]').textContent.includes('Invalid code'));assert.equal(verified,false);
 assert([...document.querySelectorAll('button')].some(node=>node.textContent.startsWith('Resend in')&&node.disabled));
 for(let i=0;i<30;i++)await act(async()=>{cooldownCallback();await tick();});
 globalThis.setTimeout=nativeTimeout;
 await click(button('Resend code'));assert.equal(otpSent,1);
 window.location.search='?returnTo=https%3A%2F%2Fevil.test';invalidOtp=false;
 await submitAuth();assert.equal(verified,true);assert.equal(redirected,'/register');
 await act(async()=>{root.render(null);await tick();});
 window.location.search='';
 await mount(PasswordRecovery,{});
 await change(document.querySelector('input[type=email]'),'test@example.test');
 resetFails=true;await submitAuth();assert(document.querySelector('[role=alert]').textContent.includes('Unable to continue'));assert.equal(document.querySelector('input').value,'test@example.test');
 resetFails=false;await submitAuth();assert.deepEqual(resetRequest,{email:'test@example.test',redirectTo:'http://example.test/auth/reset-password'});assert(document.querySelector('[role=status]').textContent.includes('If an account exists'));
 await act(async()=>{root.render(null);await tick();});
 await mount(PasswordRecovery,{reset:true});assert(document.querySelector('[role=alert]').textContent.includes('missing or invalid'));assert.equal(document.querySelector('form'),null);
 await act(async()=>{root.render(null);await tick();});
 window.location.search='?token=test-only-reset-token';await mount(PasswordRecovery,{reset:true});
 await change(document.querySelectorAll('input')[0],'replacement-test-password');await change(document.querySelectorAll('input')[1],'wrong-password');assert(button('Update password').disabled);assert.equal(resetSubmission,undefined);
 await change(document.querySelectorAll('input')[1],'replacement-test-password');resetFails=true;await submitAuth();assert(document.querySelector('[role=alert]').textContent.includes('Unable to continue'));
 resetFails=false;await submitAuth();assert.deepEqual(resetSubmission,{newPassword:'replacement-test-password',token:'test-only-reset-token'});assert(document.querySelector('[role=status]').textContent.includes('Password updated'));
 await act(async()=>root.unmount());
 console.log('Passed password recovery UI: safe request confirmation, preserved input on failure, missing-token rejection, confirmation mismatch, invalid token error, and successful reset submission.');
 console.log('Passed mocked email verification UI: signup to OTP, invalid code rejection, resend, verified session redirect, and external return URL rejection.');
 console.log('Passed trial/registration interactions: one-document batch limit, 5 MB cap, sample replacement, blocked second upload, edit/chunk/Markdown export, gated JSON/settings, bilingual UI, email/password sign-in link, registration submission, and preserved input on failure.');
})().catch(async error=>{console.error(error);await act(async()=>root.unmount());process.exitCode=1;});
