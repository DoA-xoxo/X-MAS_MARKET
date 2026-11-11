import {isAdmin} from '@/lib/server';
export async function GET(){
 return Response.json({authenticated:await isAdmin()},{headers:{'Cache-Control':'no-store, max-age=0'}});
}
