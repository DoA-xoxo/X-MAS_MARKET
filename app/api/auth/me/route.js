import {account,db,err} from '@/lib/server';
export async function GET(){
 try{
  const a=await account();
  if(!a)return Response.json({user:null},{headers:{'Cache-Control':'no-store'}});
  const s=db();
  let {data,error}=await s.from('market_wallets').select('coins').eq('account_id',a.id).maybeSingle();
  if(error)throw error;
  if(!data){
   const created=await s.from('market_wallets').upsert({account_id:a.id},{onConflict:'account_id',ignoreDuplicates:true});
   if(created.error)throw created.error;
   const retry=await s.from('market_wallets').select('coins').eq('account_id',a.id).single();
   if(retry.error)throw retry.error;
   data=retry.data;
  }
  return Response.json({user:{...a,coins:data.coins}},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return err(e.message,500)}
}