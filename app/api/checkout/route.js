import {db,needAccount,err} from '@/lib/server';
export async function POST(req){
 try{
  const a=await needAccount(),b=await req.json(),s=db();
  const {data,error}=await s.rpc('market_checkout',{p_account_id:a.id,p_lines:b.lines,p_kind:b.kind==='gift'?'gift':'purchase',p_recipient_nickname:b.recipient_nickname||null,p_anonymous:!!b.anonymous,p_message:String(b.message||'').slice(0,180)});
  if(error)throw error;
  const {error:cartError}=await s.from('market_cart_items').delete().eq('account_id',a.id);
  if(cartError)throw cartError;
  return Response.json({ok:true,result:data});
 }catch(e){return err(e.message,e.status||500)}
}
