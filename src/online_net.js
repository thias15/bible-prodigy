/* ===================== ONLINE: data layer =====================
   One small interface over Firebase (real) or a local test server (mock), so the
   features in online.js never touch Firebase directly. Every login lives in its own
   named Firebase app, so several kids from different families can share a device. */
const NET=(()=>{
  const CONF=window.FBCONF||null, MOCK=window.FBMOCK||null;
  const avail=!!(CONF||MOCK);
  let fbReady=null;
  function loadFB(){ if(MOCK) return Promise.resolve(); if(window.FB) return Promise.resolve(); if(fbReady) return fbReady;
    fbReady=new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=window.FBJS||'fb.js'; s.onload=()=>window.FB?res():rej(new Error('fb')); s.onerror=()=>{ fbReady=null; rej(new Error('offline')); }; document.head.appendChild(s); });
    return fbReady; }
  const PFX=window.FBPFX||'';                       // 'beta-' on the test page
  const ctxs={};
  /* ---------- real Firebase context ---------- */
  function fbCtx(name){ const F=window.FB; const app=F.initializeApp(CONF,PFX+name); const auth=F.getAuth(app);
    const db=F.initializeFirestore(app,{localCache:F.memoryLocalCache()});
    const ref=p=>F.doc(db,...p.split('/'));
    const col=p=>F.collection(db,...p.split('/'));
    const conv=v=>{ if(v&&typeof v==='object'&&!Array.isArray(v)){ if(v.__now) return F.serverTimestamp(); if(v.__inc!=null) return F.increment(v.__inc); if(v.__del) return F.deleteField(); if(v.__union) return F.arrayUnion(...v.__union); const o={}; for(const k in v) o[k]=conv(v[k]); return o; } return v; };
    const out=s=>{ if(!s.exists()) return null; const d=s.data(); return fix(d); };
    const fix=v=>{ if(v&&typeof v==='object'){ if(typeof v.toMillis==='function') return v.toMillis(); if(Array.isArray(v)) return v.map(fix); const o={}; for(const k in v) o[k]=fix(v[k]); return o; } return v; };
    const q=(c,w,o)=>{ const a=[]; (w||[]).forEach(([f,op,val])=>a.push(F.where(f==='__id'?F.documentId():f,op,val))); if(o&&o.order) a.push(F.orderBy(o.order[0],o.order[1]||'asc')); if(o&&o.limit) a.push(F.limit(o.limit)); return F.query(c,...a); };
    let readyRes; const ready=new Promise(r=>readyRes=r); F.onAuthStateChanged(auth,u=>{ C.u=u?{uid:u.uid,anon:u.isAnonymous,email:u.email||'',name:u.displayName||''}:null; readyRes(); C.subs.forEach(f=>f(C.u)); });
    const C={name,u:null,subs:[],ready,
      onAuth(f){ C.subs.push(f); },
      anon:()=>F.signInAnonymously(auth),
      google:async()=>{ const p=new F.GoogleAuthProvider(); p.setCustomParameters({prompt:'select_account'});
        if(auth.currentUser&&auth.currentUser.isAnonymous){ try{ await F.linkWithPopup(auth.currentUser,p); await auth.currentUser.reload(); C.u=Object.assign({},C.u,{anon:false,email:auth.currentUser.email,name:auth.currentUser.displayName}); return {linked:true}; }
          catch(e){ if(e.code==='auth/credential-already-in-use'||e.code==='auth/email-already-in-use'){ const cred=F.GoogleAuthProvider.credentialFromError(e); return {inUse:true,cred}; } throw e; } }
        await F.signInWithPopup(auth,p); return {signedIn:true}; },
      withCred:cred=>F.signInWithCredential(auth,cred),
      card:(email,pw)=>F.signInWithEmailAndPassword(auth,email,pw),
      newCard:(email,pw)=>F.createUserWithEmailAndPassword(auth,email,pw).then(r=>r.user.uid),
      newPw:pw=>F.updatePassword(auth.currentUser,pw),
      signOut:()=>F.signOut(auth),
      get:async p=>out(await F.getDoc(ref(p))),
      getFresh:async p=>{ try{ return out(await F.getDocFromServer(ref(p))); }catch(e){ return out(await F.getDoc(ref(p))); } },
      set:(p,d,merge)=>F.setDoc(ref(p),conv(d),merge?{merge:true}:{}),
      update:(p,d)=>F.updateDoc(ref(p),conv(d)),
      del:p=>F.deleteDoc(ref(p)),
      query:async(c,w,o)=>{ const s=await F.getDocs(q(col(c),w,o)); return s.docs.map(d=>({id:d.id,data:fix(d.data())})); },
      group:async(c,w,o)=>{ const s=await F.getDocs(q(F.collectionGroup(db,c),w,o)); return s.docs.map(d=>({id:d.id,path:d.ref.path,data:fix(d.data())})); },
      listen:(p,cb,w,o)=>{ const isCol=p.split('/').length%2===1; return isCol? F.onSnapshot(q(col(p),w,o),s=>cb(s.docs.map(d=>({id:d.id,data:fix(d.data())}))),()=>{}) : F.onSnapshot(ref(p),s=>cb(out(s)),()=>{}); },
      batch:async ops=>{ const b=F.writeBatch(db); ops.forEach(o=>{ if(o.op==='set') b.set(ref(o.path),conv(o.data),o.merge?{merge:true}:{}); else if(o.op==='update') b.update(ref(o.path),conv(o.data)); else b.delete(ref(o.path)); }); await b.commit(); },
      tx:fn=>F.runTransaction(db,async tr=>fn({get:async p=>out(await tr.get(ref(p))),set:(p,d,m)=>tr.set(ref(p),conv(d),m?{merge:true}:{}),update:(p,d)=>tr.update(ref(p),conv(d)),del:p=>tr.delete(ref(p))})),
      close:()=>F.deleteApp(app).catch(()=>{}) };
    return C; }
  /* ---------- mock context (tests only; talks to lang-free node test server) ---------- */
  function mockCtx(name){ const K='mock.auth.'+PFX+name; let u=null; try{ u=JSON.parse(localStorage.getItem(K)); }catch(e){}
    const call=(op,a)=>fetch(MOCK+'/op',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({op,uid:C.u&&C.u.uid},a))}).then(r=>r.json()).then(r=>{ if(r.err){ const e=new Error(r.err); e.code=r.err; throw e; } return r.v; });
    const setU=v=>{ C.u=v; try{ v?localStorage.setItem(K,JSON.stringify(v)):localStorage.removeItem(K); }catch(e){} C.subs.forEach(f=>f(v)); };
    const C={name,u,subs:[],ready:Promise.resolve(),
      onAuth(f){ C.subs.push(f); },
      anon:async()=>setU({uid:'a'+Math.random().toString(36).slice(2,12),anon:true,email:'',name:''}),
      google:async()=>{ const g=await call('google',{}); if(C.u&&C.u.anon){ if(g.exists) return {inUse:true,cred:g}; await call('linkGoogle',{g}); setU(Object.assign({},C.u,{anon:false,email:g.email,name:g.name})); return {linked:true}; } setU({uid:g.uid,anon:false,email:g.email,name:g.name}); return {signedIn:true}; },
      withCred:async cred=>setU({uid:cred.uid,anon:false,email:cred.email,name:cred.name}),
      card:async(email,pw)=>{ const uid=await call('card',{email,pw}); setU({uid,anon:false,email,name:''}); },
      newCard:async(email,pw)=>{ const uid=await call('newCard',{email,pw}); setU({uid,anon:false,email,name:''}); return uid; },
      newPw:pw=>call('newPw',{email:C.u.email,pw}),
      signOut:async()=>setU(null),
      get:p=>call('get',{p}), getFresh:p=>call('get',{p}),
      set:(p,d,merge)=>call('set',{p,d,merge}), update:(p,d)=>call('update',{p,d}), del:p=>call('del',{p}),
      query:(c,w,o)=>call('query',{c,w,o}), group:(c,w,o)=>call('group',{c,w,o}),
      listen:(p,cb,w,o)=>{ let alive=true, lastS=''; const tick=async()=>{ if(!alive) return; try{ const v=p.split('/').length%2===1?await call('query',{c:p,w,o}):await call('get',{p}); const s=JSON.stringify(v); if(s!==lastS){ lastS=s; cb(v); } }catch(e){} if(alive) setTimeout(tick,350); }; tick(); return ()=>{ alive=false; }; },
      batch:ops=>call('batch',{ops}),
      tx:async fn=>{ const ops=[]; const r=await fn({get:p=>call('get',{p}),set:(p,d,m)=>ops.push({op:'set',path:p,data:d,merge:m}),update:(p,d)=>ops.push({op:'update',path:p,data:d}),del:p=>ops.push({op:'del',path:p})}); if(ops.length) await call('batch',{ops}); return r; },
      close:async()=>{} };
    return C; }
  async function ctx(name){ if(ctxs[name]) return ctxs[name]; await loadFB(); const c=MOCK?mockCtx(name):fbCtx(name); ctxs[name]=c; await c.ready; return c; }
  async function drop(name){ const c=ctxs[name]; if(!c) return; delete ctxs[name]; try{ await c.signOut(); }catch(e){} await c.close(); }
  const now={__now:1}, inc=n=>({__inc:n}), delF={__del:1}, union=(...a)=>({__union:a});
  return {avail,ctx,drop,now,inc,delF,union,loadFB,mock:!!MOCK};
})();
