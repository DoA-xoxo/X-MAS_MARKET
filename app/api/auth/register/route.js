import {db,loginSession,err} from '@/lib/server';
import bcrypt from 'bcryptjs';
export const runtime='nodejs';

export async function POST(req){
  try{
    const body=await req.json();
    const nickname=String(body.nickname||'').trim();
    const password=body.password;
    if(!nickname||nickname.length>20)return err('닉네임은 1~20자로 입력해 주세요.');
    if(typeof password!=='string'||password.length<4||password.length>128)return err('비밀번호는 4~128자로 입력해 주세요.');
    const s=db();
    const {data:user,error}=await s.from('event_users')
      .insert({nickname,password_hash:await bcrypt.hash(password,12)})
      .select('id,nickname')
      .single();
    if(error){
      if(error.code==='23505')return err('이미 사용 중인 닉네임이에요.',409);
      throw error;
    }
    const {error:walletError}=await s.from('market_wallets')
      .upsert({account_id:user.id},{onConflict:'account_id',ignoreDuplicates:true});
    if(walletError)throw walletError;
    await loginSession(user);
    const {data:wallet,error:readError}=await s.from('market_wallets')
      .select('coins').eq('account_id',user.id).single();
    if(readError)throw readError;
    return Response.json({user:{id:user.id,nickname:user.nickname,coins:wallet.coins}});
  }catch(e){return err(e.message,e.status||500)}
}