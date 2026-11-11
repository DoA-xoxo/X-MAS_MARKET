import {db,needAccount,err} from '@/lib/server';
export const runtime='nodejs';

export async function GET(){
 try{
  const a=await needAccount(),s=db();
  const {data,error}=await s.from('market_cart_items').select('item_id,quantity').eq('account_id',a.id);
  if(error)throw error;
  const rows=data||[],ids=rows.map(x=>x.item_id);
  if(!ids.length)return Response.json({lines:[]});
  const {data:items,error:itemError}=await s.from('market_items').select('id,name,description,price,image_path,active').in('id',ids);
  if(itemError)throw itemError;
  const byId=new Map((items||[]).filter(x=>x.active).map(x=>[x.id,x]));
  const lines=rows.filter(x=>byId.has(x.item_id)).map(x=>{const item=byId.get(x.item_id);return {...item,quantity:x.quantity,image_url:s.storage.from('market-items').getPublicUrl(item.image_path).data.publicUrl}});
  const stale=rows.filter(x=>!byId.has(x.item_id)).map(x=>x.item_id);
  if(stale.length){const {error:cleanError}=await s.from('market_cart_items').delete().eq('account_id',a.id).in('item_id',stale);if(cleanError)throw cleanError}
  return Response.json({lines});
 }catch(e){return err(e.message,e.status||500)}
}

export async function PUT(req){
 try{
  const a=await needAccount(),body=await req.json(),lines=Array.isArray(body.lines)?body.lines:[];
  if(lines.length>30)return err('장바구니 상품은 30종류까지 담을 수 있습니다.');
  const normalized=new Map();
  for(const line of lines){
   const id=String(line.item_id||''),quantity=Number(line.quantity);
   if(!id||!Number.isInteger(quantity)||quantity<1||quantity>99)return err('장바구니 수량을 확인해 주세요.');
   normalized.set(id,Math.min(99,(normalized.get(id)||0)+quantity));
  }
  const s=db(),ids=[...normalized.keys()];
  if(ids.length){
   const {data:items,error}=await s.from('market_items').select('id').eq('active',true).in('id',ids);
   if(error)throw error;
   if((items||[]).length!==ids.length)return err('판매 종료되었거나 존재하지 않는 상품이 포함되어 있습니다.');
  }
  const {error:deleteError}=await s.from('market_cart_items').delete().eq('account_id',a.id);
  if(deleteError)throw deleteError;
  if(ids.length){
   const {error:insertError}=await s.from('market_cart_items').insert(ids.map(item_id=>({account_id:a.id,item_id,quantity:normalized.get(item_id)})));
   if(insertError)throw insertError;
  }
  return Response.json({ok:true});
 }catch(e){return err(e.message,e.status||500)}
}
