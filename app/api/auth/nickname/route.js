import {db,needAccount,loginSession,err} from '@/lib/server';

export async function PATCH(req){
 try{
  const account=await needAccount();
  const body=await req.json();
  const nickname=String(body.nickname||'').trim();
  if(!nickname||nickname.length>20)return err('닉네임은 1~20자로 입력해 주세요.');
  const normalized=nickname.toLocaleLowerCase();
  const s=db();
  const {data:existing,error:checkError}=await s.from('event_users')
   .select('id').eq('nickname_normalized',normalized).neq('id',account.id).maybeSingle();
  if(checkError)throw checkError;
  if(existing)return err('이미 사용 중인 닉네임이에요.',409);
  const {data:user,error}=await s.from('event_users')
   .update({nickname,nickname_normalized:normalized}).eq('id',account.id)
   .select('id,nickname').single();
  if(error){
   if(error.code==='23505')return err('이미 사용 중인 닉네임이에요.',409);
   throw error;
  }
  await loginSession(user);
  const {data:wallet,error:walletError}=await s.from('market_wallets')
   .select('coins').eq('account_id',account.id).single();
  if(walletError)throw walletError;
  return Response.json({ok:true,user:{...user,coins:wallet.coins}},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return err(e.message,e.status||500)}
}
