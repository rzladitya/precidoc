declare module 'mammoth/mammoth.browser.js' {
 const mammoth:{convertToHtml(input:{arrayBuffer:ArrayBuffer},options?:{externalFileAccess?:boolean,convertImage?:unknown}):Promise<{value:string,messages:{message:string,type:string}[]}>,images:{imgElement(callback:(image:unknown)=>Promise<{src:string}>):unknown}};
 export default mammoth;
}
