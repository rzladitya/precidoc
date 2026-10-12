export async function smallJson(request: Request, maxBytes = 4096): Promise<{payload: unknown} | {error: string; status: number}> {
  if (request.headers.get('origin') !== new URL(request.url).origin) return {error:'invalid_origin',status:403};
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json') return {error:'invalid_request',status:415};
  if (Number(request.headers.get('content-length') || 0) > maxBytes) return {error:'invalid_request',status:413};
  const reader=request.body?.getReader();
  if(!reader)return {error:'invalid_request',status:400};
  let size=0;const chunks:Uint8Array[]=[];
  try {
    while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>maxBytes){await reader.cancel();return{error:'invalid_request',status:413};}chunks.push(part.value);}
    const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
    return {payload:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))};
  } catch {return{error:'invalid_request',status:400};}
  finally {reader.releaseLock();}
}
