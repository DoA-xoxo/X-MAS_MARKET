import {db,needAccount,err} from '@/lib/server';
export async function GET(){
 try{
  const a=await needAccount(),s=db();
  const {data,error}=await s.from('market_orders').select('id,item_id,buyer_account_id,recipient_account_id,sender_account_id,item_name,quantity,kind,is_anonymous,message,created_at').or('buyer_account_id.eq.'+a.id+',recipient_account_id.eq.'+a.id).order('created_at',{ascending:false});
  if(error)throw error;
  const rows=data||[],ids=[...new Set(rows.filter(x=>x.kind==='gift'&&x.sender_account_id!==a.id).map(x=>x.sender_account_id))];let names={};
  if(ids.length){const q=await s.from('event_users').select('id,nickname').in('id',ids);for(const u of q.data||[])names[u.id]=u.nickname}
  const itemIds=[...new Set(rows.map(x=>x.item_id))];let images={};
  if(itemIds.length){
   const q=await s.from('market_items').select('id,image_path').in('id',itemIds);
   if(q.error)throw q.error;
   for(const item of q.data||[])images[item.id]=s.storage.from('market-items').getPublicUrl(item.image_path).data.publicUrl;
  }
  const purchases=rows.filter(x=>x.kind==='purchase'&&x.buyer_account_id===a.id),grouped=new Map();
  for(const x of purchases){const key=x.item_id;if(!grouped.has(key))grouped.set(key,{...x,quantity:0,image_url:images[x.item_id]||null});grouped.get(key).quantity+=x.quantity;}
  return Response.json({
   purchases:[...grouped.values()],
   gifts:rows.filter(x=>x.kind==='gift'&&x.recipient_account_id===a.id).map(x=>({...x,image_url:images[x.item_id]||null,sender_nickname:names[x.sender_account_id]||'산타'}))
  });
 }catch(e){return err(e.message,e.status||500)}
}