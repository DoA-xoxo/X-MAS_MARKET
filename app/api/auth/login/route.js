import {db,loginSession,err} from '@/lib/server';
import {verifySharedPassword} from '@/lib/shared-password';
export const runtime='nodejs';
export async function POST(req){
 try{
  const {nickname,password}=await req.json(),n=String(nickname||'').trim();
  if(!n||typeof password!=='string'||password.length>128)return err('아이디와 비밀번호를 입력해 주세요.');
  const s=db(),{data:a,error}=await s.from('event_users').select('id,nickname,password_hash').eq('nickname_normalized',n.toLocaleLowerCase()).maybeSingle();
  if(error)throw error;
  if(!a||!(await verifySharedPassword(password,a.password_hash)))return err('아이디 또는 비밀번호가 올바르지 않습니다.',401);
  await loginSession(a);
  const {data:w,error:we}=await s.from('point_wallets').select('balance').eq('account_id',a.id).maybeSingle();
  if(we)throw we;
  return Response.json({user:{id:a.id,nickname:a.nickname,points:w?.balance??0}},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return err(e.message,e.status||500)}
}
