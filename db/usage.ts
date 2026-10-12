import {getAccountDb} from './index';
import type {UsageEvent} from '@/lib/usage';
export async function recordUsage(event:UsageEvent,duration:string){
  const sql=getAccountDb();
  const day=new Date().toISOString().slice(0,10);
  const oldest=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
  await sql`DELETE FROM precidoc_usage_daily WHERE day < ${oldest}`;
  await sql`INSERT INTO precidoc_usage_daily (day,event,duration,total) VALUES (${day},${event},${duration},1)
    ON CONFLICT (day,event,duration) DO UPDATE SET total=precidoc_usage_daily.total+1`;
}
