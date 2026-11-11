import {db,needAccount,err} from '@/lib/server';
export const runtime='nodejs';

export async function GET(req){
 try{
  const a=await needAccount(),id=new URL(req.url).searchParams.get('id'),s=db();
  if(!id)return err('다운로드할 상품을 선택해 주세요.');
  const {data:o,error}=await s.from('market_orders').select('id,buyer_account_id,recipient_account_id,item_id,item_name').eq('id',id).maybeSingle();
  if(error)throw error;
  if(!o||(o.buyer_account_id!==a.id&&o.recipient_account_id!==a.id))return err('다운로드 권한이 없습니다.',403);
  const {data:i,error:ie}=await s.from('market_items').select('image_path').eq('id',o.item_id).single();
  if(ie)throw ie;
  const {data,error:se}=await s.storage.from('market-items').createSignedUrl(i.image_path,60);
  if(se)throw se;
  const image=await fetch(data.signedUrl);
  if(!image.ok)throw Error('상품 이미지를 가져오지 못했습니다.');
  const bytes=await image.arrayBuffer();
  const safeName=String(o.item_name||'nutty-xmas-item').replace(/[\\/:*?"<>|]/g,'_').slice(0,80);
  return new Response(bytes,{headers:{
   'Content-Type':'image/png',
   'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(safeName+'.png'),
   'Cache-Control':'private, no-store'
  }});
 }catch(e){return err(e.message,e.status||500)}
}