// Tiny in-memory stand-in for Firebase (Firestore + Auth) used by automated tests.
// Rules are NOT enforced here; they are tested against the real project.
const http=require('http');
const store=new Map();            // path -> object
const cards=new Map();            // email -> {pw, uid}
let google={uid:'g-parent1',email:'parent@example.test',name:'Test Parent'};
const linked=new Set();
const now=()=>Date.now();
function apply(base,d){ const o=JSON.parse(JSON.stringify(base||{}));
  for(const k in d){ const v=d[k]; const parts=k.split('.'); let t=o; for(let i=0;i<parts.length-1;i++){ t[parts[i]]=t[parts[i]]&&typeof t[parts[i]]==='object'?t[parts[i]]:{}; t=t[parts[i]]; } const last=parts[parts.length-1];
    t[last]=val(v,t[last]); if(t[last]===undefined) delete t[last]; }
  return o; }
function val(v,old){ if(v&&typeof v==='object'&&!Array.isArray(v)){ if(v.__now) return now(); if(v.__inc!=null) return (typeof old==='number'?old:0)+v.__inc; if(v.__del) return undefined; if(v.__union){ const a=Array.isArray(old)?old.slice():[]; v.__union.forEach(x=>{ if(!a.some(y=>JSON.stringify(y)===JSON.stringify(x))) a.push(x); }); return a; }
    const o={}; for(const k in v){ const r=val(v[k],old&&old[k]); if(r!==undefined) o[k]=r; } return o; } return v; }
function set(p,d,merge){ store.set(p, merge? deepMerge(store.get(p)||{}, val(d,store.get(p))) : val(d)); }
function deepMerge(a,b){ const o=Object.assign({},a); for(const k in b){ if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&o[k]&&typeof o[k]==='object') o[k]=deepMerge(o[k],b[k]); else o[k]=b[k]; } return o; }
function getF(o,f){ return f.split('.').reduce((a,k)=>a==null?a:a[k],o); }
function match(d,id,w){ return (w||[]).every(([f,op,v])=>{ const x=f==='__id'?id:getF(d,f); switch(op){ case '==':return x===v; case '!=':return x!==v; case '>':return x>v; case '>=':return x>=v; case '<':return x<v; case '<=':return x<=v; case 'in':return v.includes(x); case 'array-contains':return Array.isArray(x)&&x.includes(v); } return false; }); }
function query(c,w,o,group){ const depth=c.split('/').length; let out=[];
  for(const [p,d] of store){ const parts=p.split('/');
    if(group){ if(parts.length<2||parts[parts.length-2]!==c) continue; }
    else { if(parts.length!==depth+1||!p.startsWith(c+'/')) continue; }
    const id=parts[parts.length-1]; if(match(d,id,w)) out.push(group?{id,path:p,data:d}:{id,data:d}); }
  if(o&&o.order){ const [f,dir]=o.order; out.sort((a,b)=>{ const x=getF(a.data,f),y=getF(b.data,f); return (x>y?1:x<y?-1:0)*(dir==='desc'?-1:1); }); }
  if(o&&o.limit) out=out.slice(0,o.limit); return out; }
function op(a){ switch(a.op){
  case 'get': return store.has(a.p)?store.get(a.p):null;
  case 'set': set(a.p,a.d,a.merge); return true;
  case 'update': if(!store.has(a.p)) throw 'not-found'; store.set(a.p,apply(store.get(a.p),a.d)); return true;
  case 'del': store.delete(a.p); return true;
  case 'query': return query(a.c,a.w,a.o,false);
  case 'group': return query(a.c,a.w,a.o,true);
  case 'batch': a.ops.forEach(o=>{ if(o.op==='set') set(o.path,o.data,o.merge); else if(o.op==='update'){ if(!store.has(o.path)) throw 'not-found'; store.set(o.path,apply(store.get(o.path),o.data)); } else store.delete(o.path); }); return true;
  case 'google': return Object.assign({},google,{exists:linked.has(google.uid)||store.has('users/'+google.uid)});
  case 'linkGoogle': linked.add(a.g.uid); return true;
  case 'card': { const c=cards.get(a.email); if(!c||c.pw!==a.pw) throw 'auth/invalid-credential'; return c.uid; }
  case 'newCard': { if(cards.has(a.email)) throw 'auth/email-already-in-use'; const uid='c'+Math.random().toString(36).slice(2,12); cards.set(a.email,{pw:a.pw,uid}); return uid; }
  case 'newPw': { const c=cards.get(a.email); if(!c) throw 'auth/user-not-found'; c.pw=a.pw; return true; }
  case 'setGoogle': google=a.g; return true;
  case 'dump': return Object.fromEntries(store);
  case 'reset': store.clear(); cards.clear(); linked.clear(); return true;
  } throw 'bad-op'; }
http.createServer((req,res)=>{ res.setHeader('access-control-allow-origin','*'); res.setHeader('access-control-allow-headers','content-type');
  if(req.method==='OPTIONS'){ res.end(); return; }
  let body=''; req.on('data',c=>body+=c); req.on('end',()=>{ let out; try{ out={v:op(JSON.parse(body||'{}'))}; }catch(e){ out={err:String(e)}; } res.setHeader('content-type','application/json'); res.end(JSON.stringify(out)); });
}).listen(+process.argv[2]||8787,()=>console.log('mockfb on',+process.argv[2]||8787));
