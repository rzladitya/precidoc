import {getAuth} from '@/lib/auth/server';
export const dynamic='force-dynamic';
export async function GET(){
  const headers={'Cache-Control':'private, no-store'};
  try {
    const {data,error}=await getAuth().getSession();
    if(error&&[401,403].includes(error.status))return Response.json({error:'sign_in_required'},{status:401,headers});
    if(error)return Response.json({error:'session_unavailable'},{status:503,headers});
    const user=data?.user?.emailVerified?data.user:null;
    return Response.json(user?{userId:user.id}:{error:'sign_in_required'},{status:user?200:401,headers});
  }catch{return Response.json({error:'session_unavailable'},{status:503,headers});}
}
