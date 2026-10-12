import {smallJson} from '@/lib/request-body';
import {usageEvents,durationBuckets,type UsageEvent} from '@/lib/usage';
import {newsletterRateAllowed} from '@/db/newsletter';
import {recordUsage} from '@/db/usage';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  const input=await smallJson(request,512);
  if('error'in input)return Response.json({error:input.error},{status:input.status});
  const value=input.payload;
  if(!value||typeof value!=='object'||Array.isArray(value))return Response.json({error:'invalid_event'},{status:400});
  const data=value as Record<string,unknown>;
  if(Object.keys(data).some(key=>!['event','duration','consent'].includes(key))||data.consent!==true||!usageEvents.includes(data.event as UsageEvent)||!durationBuckets.includes(data.duration as typeof durationBuckets[number]))return Response.json({error:'invalid_event'},{status:400});
  if(request.headers.get('sec-gpc')==='1'||request.headers.get('dnt')==='1')return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
  try{
    if(!await newsletterRateAllowed(request.headers.get('cf-connecting-ip')??'local-preview','usage',60))return Response.json({error:'too_many_requests'},{status:429,headers:{'Retry-After':'600'}});
    await recordUsage(data.event as UsageEvent,data.duration as string);
    return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
  }catch{console.error('Optional usage statistics unavailable');return Response.json({error:'unavailable'},{status:503});}
}
