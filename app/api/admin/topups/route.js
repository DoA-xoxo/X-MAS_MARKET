import {db,admin,err} from '@/lib/server';
export async function GET(req){
 try{await admin();const s=db(),{data,error}=await s.from('market_topups').select('id,account_id,amount,created_at').eq('status','pending').order('created_at');if(error)throw error;const ids=[...new Set((data||[]).map(x=>x.account_id))];let names={};if(ids.length){const q=await s.from('event_users').select('id,nickname').in('id',ids);for(const u of q.data||[])names[u.id]=u.nickname}return Response.json({requests:(data||[]).map(x=>({...x,nickname:names[x.account_id]||'사용자'}))})}
 catch(e){return err(e.message,e.status||500)}
}
export async function PATCH(req){
 try{await admin();const {id,status}=await req.json();if(!['approved','rejected'].includes(status))return err('잘못된 처리 상태입니다.');const {data,error}=await db().rpc('market_review_topup',{p_request_id:id,p_status:status});if(error)throw error;return Response.json({ok:true,result:data})}
 catch(e){return err(e.message,e.status||500)}
}