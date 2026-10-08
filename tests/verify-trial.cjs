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
window.location = { search: '', href: 'http://example.test/' };
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
Module._load = function(request,parent,...args){
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
const { act } = React;
const root = createRoot(document.getElementById('root'));
const tick = () => new Promise(resolve=>setTimeout(resolve,40));
async function click(node){assert(node,'Missing click target');await act(async()=>{const down=new window.Event('mousedown',{bubbles:true});Object.assign(down,{button:0,ctrlKey:false});node.dispatchEvent(down);node.dispatchEvent(new window.Event('click',{bubbles:true}));await tick();});}
function tab(value){return [...document.querySelectorAll('[role=tab]')].find(node=>node.textContent.includes(value));}
function button(value){return [...document.querySelectorAll('button')].find(node=>node.textContent===value);}
let setLocale; function Bridge({component,props}){setLocale=useLanguage().setLocale;return React.createElement(component,props);}
async function change(node,value){assert(node);const key=Object.keys(node).find(key=>key.startsWith('__reactProps$'));assert(node[key].onChange);await act(async()=>{node[key].onChange({target:{value}});await tick();});}
async function mount(component,props){await act(async()=>{root.render(React.createElement(LanguageProvider,null,React.createElement(Bridge,{component,props})));await tick();});}
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
 await mount(Registration,{user:null,signInHref:'/signin-with-chatgpt?return_to=%2Fregister'});
 const signIn=[...document.querySelectorAll('a')].find(a=>a.textContent==='Continue with ChatGPT');assert.equal(signIn.getAttribute('target'),'_top');assert(signIn.getAttribute('href').startsWith('/signin-with-chatgpt'));
 await act(async()=>{root.render(null);await tick();});
 let posted,redirected;
 globalThis.fetch=async (url,options)=>{posted={url,options};return Response.json({account:{name:'Trial user',email:'verified@example.test'}});};
 window.location.assign=url=>redirected=url;
 await mount(Registration,{user:{name:'Trial user',email:'verified@example.test'},signInHref:'/signin-with-chatgpt?return_to=%2Fregister'});
 await act(async()=>{document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await tick();});
 assert.equal(posted.url,'/api/account');assert.deepEqual(JSON.parse(posted.options.body),{name:'Trial user'});assert.equal(redirected,'/app');
 globalThis.fetch=async()=>Response.json({error:'account_unavailable'},{status:503});
 await act(async()=>{document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await tick();});assert(document.querySelector('.account-error').textContent.includes('unavailable'));assert.equal(document.querySelector('input').value,'Trial user');
 await act(async()=>root.unmount());
 console.log('Passed trial/registration interactions: one-document batch limit, 5 MB cap, sample replacement, blocked second upload, edit/chunk/Markdown export, gated JSON/settings, bilingual UI, ChatGPT sign-in link, registration submission, and preserved input on failure.');
})().catch(async error=>{console.error(error);await act(async()=>root.unmount());process.exitCode=1;});
