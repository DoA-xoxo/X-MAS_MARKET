import {createAdminSession,err} from '@/lib/server';
export async function POST(req){
 try{
  const {password}=await req.json();
  const expected=process.env.MARKET_ADMIN_PASSWORD;
  if(!expected)return err('MARKET_ADMIN_PASSWORD 환경 변수를 설정해 주세요.',500);
  if(typeof password!=='string'||password!==expected)return err('관리자 비밀번호가 올바르지 않습니다.',401);
  await createAdminSession();
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return err(e.message,e.status||500)}
}
