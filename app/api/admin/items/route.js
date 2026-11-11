import {db,admin,err} from '@/lib/server';
export const runtime='nodejs';

export async function GET(req){
  try{
    admin(req);
    const s=db();
    const {data,error}=await s.from('market_items').select('id,name,price,image_path,active,created_at').order('sort_order',{ascending:true});
    if(error)throw error;
    return Response.json({items:(data||[]).map(x=>({...x,image_url:s.storage.from('market-items').getPublicUrl(x.image_path).data.publicUrl}))});
  }catch(e){return err(e.message,e.status||500)}
}

export async function POST(req){
  try{
    admin(req);
    const f=await req.formData(),name=String(f.get('name')||'').trim(),description=String(f.get('description')||''),price=Number(f.get('price')),file=f.get('file');
    if(!name||!Number.isSafeInteger(price)||price<1||!file||file.type!=='image/png')return err('상품명, 가격, PNG 파일을 확인해 주세요.');
    if(file.size>5242880)return err('PNG는 5MB 이하만 등록할 수 있습니다.');
    const s=db(),path=crypto.randomUUID()+'.png',up=await s.storage.from('market-items').upload(path,file,{contentType:'image/png'});
    if(up.error)throw up.error;
    const q=await s.from('market_items').select('sort_order').order('sort_order',{ascending:false}).limit(1).maybeSingle();
    const {error}=await s.from('market_items').insert({name,description,price,image_path:path,sort_order:(q.data?.sort_order||0)+1});
    if(error){await s.storage.from('market-items').remove([path]);throw error}
    return Response.json({ok:true});
  }catch(e){return err(e.message,e.status||500)}
}

export async function DELETE(req){
  try{
    admin(req);
    const url=new URL(req.url),id=url.searchParams.get('id'),mode=url.searchParams.get('mode')||'archive';
    if(!id)return err('삭제할 상품을 선택해 주세요.');
    if(!['archive','hard'].includes(mode))return err('삭제 방식을 확인해 주세요.');
    const s=db();
    const {data:item,error:findError}=await s.from('market_items').select('id,image_path,active').eq('id',id).maybeSingle();
    if(findError)throw findError;
    if(!item)return err('상품을 찾을 수 없습니다.',404);
    if(mode==='archive'){
      const {error}=await s.from('market_items').update({active:false}).eq('id',id);
      if(error)throw error;
      return Response.json({ok:true,archived:true,deleted:false});
    }
    const {error:cartError}=await s.from('market_cart_items').delete().eq('item_id',id);
    if(cartError)throw cartError;
    const {error:orderError}=await s.from('market_orders').delete().eq('item_id',id);
    if(orderError)throw orderError;
    const {error:deleteError}=await s.from('market_items').delete().eq('id',id);
    if(deleteError)throw deleteError;
    if(item.image_path){
      const {error:storageError}=await s.storage.from('market-items').remove([item.image_path]);
      if(storageError)throw storageError;
    }
    return Response.json({ok:true,archived:false,deleted:true});
  }catch(e){return err(e.message,e.status||500)}
}
