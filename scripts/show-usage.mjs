import {neon} from '@neondatabase/serverless';
const url=process.env.DATABASE_URL_UNPOOLED??process.env.DATABASE_URL;
if(!url)throw new Error('Set DATABASE_URL before reading aggregate statistics.');
const sql=neon(url);
const since=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
const rows=await sql`SELECT day,event,duration,total FROM precidoc_usage_daily WHERE day >= ${since} ORDER BY day DESC,event,duration LIMIT 1000`;
console.log(JSON.stringify({since,notes:'Opt-in aggregate counts only. No individual journey attribution; first-document counts are per workspace session.',rows},null,2));
