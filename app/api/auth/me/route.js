import {account,db,err} from '@/lib/server';
export async function GET(){
 try{
  const a=await account();
  if(!a)return Response.json({user:null},{headers:{'Cache-Control':'no-store'}});
  const s=db();
  const {data,error}=await s.from('point_wallets').select('balance').eq('account_id',a.id).maybeSingle();
  if(error)throw error;
  return Response.json({user:{...a,points:data?.balance??0}},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return err(e.message,500)}
}
