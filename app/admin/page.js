'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,LogOut,Settings,Upload,Trash2,Archive,Check,X,RefreshCw} from 'lucide-react';

const fmt=n=>new Intl.NumberFormat('ko-KR').format(Number(n||0));

export default function AdminPage(){
 const uploadForm=useRef(null);
 const [ready,R]=useState(false),[authenticated,A]=useState(false),[password,P]=useState(''),[message,M]=useState(''),[busy,B]=useState(false);
 const [items,I]=useState([]),[requests,Q]=useState([]),[product,PR]=useState({name:'',description:'',price:'100',file:null});
 async function api(url,opt={}){
  const response=await fetch(url,{...opt,cache:'no-store',headers:{...(opt.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(opt.headers||{})}});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'요청을 처리하지 못했어요.');
  return data;
 }
 async function loadData(){
  const [products,topups]=await Promise.all([api('/api/admin/items'),api('/api/admin/topups')]);
  I(products.items||[]);Q(topups.requests||[]);
 }
 useEffect(()=>{
  let live=true;
  api('/api/admin/session').then(async d=>{
   if(!live)return;
   A(!!d.authenticated);
   if(d.authenticated){try{await loadData()}catch(e){if(live)M(e.message)}}
  }).catch(e=>{if(live)M(e.message)}).finally(()=>{if(live)R(true)});
  return()=>{live=false};
 },[]);
 async function login(e){
  e.preventDefault();B(true);
  try{await api('/api/admin/login',{method:'POST',body:JSON.stringify({password})});A(true);P('');await loadData();M('관리자 로그인 상태가 유지됩니다.')}
  catch(e){M(e.message)}
  finally{B(false)}
 }
 async function logout(){
  try{await api('/api/admin/logout',{method:'POST'});A(false);I([]);Q([]);M('관리자 로그아웃했어요.')}
  catch(e){M(e.message)}
 }
 async function refresh(){try{await loadData();M('목록을 새로고침했어요.')}catch(e){M(e.message)}}
 async function removeItem(id,mode){
  const hard=mode==='hard';
  if(!confirm(hard?'상품과 장바구니, 구매/선물 기록까지 완전히 삭제할까요? 되돌릴 수 없습니다.':'상품을 판매 종료하고 구매/선물 기록은 보존할까요?'))return;
  try{await api('/api/admin/items?id='+encodeURIComponent(id)+'&mode='+mode,{method:'DELETE'});await loadData();M(hard?'상품과 관련 기록을 완전히 삭제했어요.':'상품을 판매 종료했어요.')}
  catch(e){M(e.message)}
 }
 async function upload(e){
  e.preventDefault();if(!product.file){M('PNG 파일을 선택해 주세요.');return}
  const form=new FormData();form.append('name',product.name);form.append('description',product.description);form.append('price',product.price);form.append('file',product.file);
  try{await api('/api/admin/items',{method:'POST',body:form});PR({name:'',description:'',price:'100',file:null});uploadForm.current?.reset();await loadData();M('상품을 등록했어요.')}
  catch(e){M(e.message)}
 }
 async function review(id,status){
  try{await api('/api/admin/topups',{method:'PATCH',body:JSON.stringify({id,status})});await loadData();M(status==='approved'?'충전을 승인했어요.':'충전 신청을 거절했어요.')}
  catch(e){M(e.message)}
 }
 if(!ready)return <main className="auth-loading"/>;
 return <main className="admin-page">
  <header className="admin-page-header">
   <button className="secondary" onClick={()=>window.location.assign('/')}><ArrowLeft size={15}/> 상점으로</button>
   <div><Settings size={18}/><span>MARKET ADMIN</span></div>
   {authenticated&&<button className="secondary" onClick={logout}><LogOut size={14}/> 로그아웃</button>}
  </header>
  {!authenticated?<section className="admin-login-card">
   <div className="admin-login-mark">✦</div><small>THE CHRISTMAS TOY SHOP</small>
   <h1>관리자 로그인</h1><p>관리자 비밀번호를 입력해 주세요.</p>
   <form onSubmit={login}><input type="password" autoComplete="current-password" placeholder="관리자 비밀번호" value={password} onChange={e=>P(e.target.value)} required/><button className="primary" disabled={busy}>{busy?'확인 중…':'로그인'}</button></form>
  </section>:<section className="admin-dashboard">
   <div className="admin-dashboard-title"><div><small>THE CHRISTMAS TOY SHOP</small><h1>관리자 페이지</h1><p>상품과 코인 충전 신청을 관리합니다.</p></div><button className="secondary" onClick={refresh}><RefreshCw size={14}/> 새로고침</button></div>
   <section className="admin-panel"><h2>상품 PNG 등록</h2><form ref={uploadForm} className="admin-upload-form" onSubmit={upload}>
    <input placeholder="상품명" value={product.name} onChange={e=>PR({...product,name:e.target.value})} required/>
    <input placeholder="상품 설명" value={product.description} onChange={e=>PR({...product,description:e.target.value})}/>
    <input type="number" min="1" placeholder="가격" value={product.price} onChange={e=>PR({...product,price:e.target.value})} required/>
    <label className="admin-file-label"><Upload size={15}/> {product.file?.name||'PNG 파일 선택'}<input type="file" accept="image/png" onChange={e=>PR({...product,file:e.target.files?.[0]||null})} required/></label>
    <button className="primary">상품 등록</button>
   </form></section>
   <section className="admin-panel"><h2>등록된 상품 <span>{items.length}</span></h2>
    <div className="admin-products">{items.length?items.map(x=><article className="admin-product" key={x.id}>{x.image_url&&<img src={x.image_url} alt=""/>}<div className="admin-product-info"><b>{x.name}</b><small>{fmt(x.price)} C · {x.active?'판매 중':'판매 종료'}</small></div><div className="admin-product-actions">{x.active&&<button className="delete-product" onClick={()=>removeItem(x.id,'archive')}><Archive size={12}/> 기록 보존</button>}<button className="delete-product hard-delete" onClick={()=>removeItem(x.id,'hard')}><Trash2 size={12}/> 완전 삭제</button></div></article>):<p className="admin-empty">등록된 상품이 없어요.</p>}</div>
   </section>
   <section className="admin-panel"><h2>코인 충전 신청 <span>{requests.length}</span></h2>
    {requests.length?requests.map(x=><div className="admin-topup-row" key={x.id}><div><b>{x.nickname}</b><small>{fmt(x.amount)} C · {new Date(x.created_at).toLocaleString('ko-KR')}</small></div><button className="topup-approve" onClick={()=>review(x.id,'approved')}><Check size={13}/> 승인</button><button className="topup-reject" onClick={()=>review(x.id,'rejected')}><X size={13}/> 거절</button></div>):<p className="admin-empty">대기 중인 충전 신청이 없어요.</p>}
   </section>
  </section>}
  {message&&<button className="toast" onClick={()=>M('')}>{message} <X size={14}/></button>}
 </main>;
}
