/* ===================== ONLINE: accounts + cloud saves =====================
   Everything here is off until a grown-up turns it on. The local save is always written
   first; the cloud copy follows. A local save is never replaced without first keeping a
   backup copy on the device (Settings → Online → earlier copies). */
const ON=(()=>{
  const api={avail:NET.avail,on:false};
  if(!NET.avail) return api;
  const DKEY=(window.FBPFX?'solb':'sol')+'.online', BKEY=id=>(window.FBPFX?'solb':'sol')+'.bak.'+id;
  const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a, rid=n=>{ const c='abcdefghijkmnopqrstuvwxyz23456789'; let s=''; for(let i=0;i<n;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; };
  let D={}; try{ D=JSON.parse(localStorage.getItem(DKEY))||{}; }catch(e){}
  if(!D.dev){ D.dev=rid(10); }
  const saveD=()=>{ try{ localStorage.setItem(DKEY,JSON.stringify(D)); }catch(e){} };
  saveD(); api.on=!!D.on;
  api.D=D;
  const PICS=['⭐','🐑','⛵','🎺','🕊️','🌈','🍞','🐟','🔥','🌿','👑','📜','🦁','🍇','🪔','🛡️'];
  const AN=['🐑','🦁','🕊️','🦅','🐫','🐴','🦊','🦌','🐻','🦉','🐟','🐋','🐦','🐐','🐂','🐎','🐇','🐸','🐝','🐜','🐢','🦋','🐔','🐥','🐶','🐱','🦔','🦚','🐏','🐆'];
  const WD=['⭐','☀️','🌙','🌈','🌊','🌲','🌿','🎵','👑','🪔','🛡️','⛰️','🔥','☁️','✨','❄️','🍯','🍞','🍇','🌻','🎺','📜','🌹','🌷','🌴','🌾','🌧️','🌱','🔔','💎'];
  const MAILD='@players.bible-prodigy.firebaseapp.com';
  const nmText=nm=>!nm?'?':String(t('nm.fmt')).replace('{a}',(t('nm.a')||[])[nm[0]]||'?').replace('{w}',(t('nm.w')||[])[nm[1]]||'?').replace('{n}',nm[2]);
  const nmEmo=nm=>nm?WD[nm[1]]+AN[nm[0]]:'';
  const nmKey=nm=>nm[0]+'-'+nm[1]+'-'+nm[2];
  const nmMail=nm=>'p'+nm[0]+'x'+nm[1]+'x'+nm[2]+MAILD;
  const picPw=(nm,p)=>'SoL.'+p.join('.')+'.'+nmKey(nm);
  api.nmText=nmText; api.nmEmo=nmEmo; api.AN=AN; api.WD=WD; api.PICS=PICS;

  /* ---------- small helpers ---------- */
  const week=()=>{ const d=new Date(); const t0=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=t0.getUTCDay()||7; t0.setUTCDate(t0.getUTCDate()+4-day); const y0=new Date(Date.UTC(t0.getUTCFullYear(),0,1)); return t0.getUTCFullYear()+'-W'+String(Math.ceil(((t0-y0)/86400000+1)/7)).padStart(2,'0'); };
  api.week=week;
  function hashStr(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h.toString(36)+'.'+s.length; }
  function snapshot(st){ const o=Object.assign({},st); delete o.cloud; return JSON.stringify(o); }
  const VOL=['cloud','savedAt','px','py','map','log','lastBackup','hp','gifted'];
  function progress(st){ return JSON.stringify([st.level,st.xp,st.coins,st.answered,st.correct,ORDER.map(i=>st.chs&&st.chs[i]?[st.chs[i].stage,st.chs[i].side]:0),st.items,Object.keys(st.comps||{}).sort().map(k=>[k,st.comps[k].lvl]),st.house&&[(st.house.items||[]).length,st.house.inv,st.house.got],st.vm,st.armor,st.look,st.name]); }
  function hashOf(st){ const o=Object.assign({},st); VOL.forEach(k=>delete o[k]); return hashStr(JSON.stringify(o)); }
  const frags=st=>ORDER.filter(i=>st.chs&&st.chs[i]&&st.chs[i].stage>=4).length;
  function busy(){ return !S||mode!=='world'||modalOpen||dialogOpen||qOpen; }
  function errText(e){ const c=(e&&(e.code||e.message))||''; if(/offline|unavailable|network/i.test(c)) return t('on.errNet'); if(/permission/i.test(c)) return t('on.errPerm'); if(/popup/i.test(c)) return t('on.errPopup'); return t('on.err'); }
  api.errText=errText;

  /* ---------- grown-up check ---------- */
  function gate(cb,back){ const a=rnd(12,49), b=rnd(3,9);
    openModal(t('on.gateT'),`<p>${esc(t('on.gateP'))}</p><p style="font-size:1.25rem;font-weight:900">${a} × ${b} = ?</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="gA" type="number" inputmode="numeric" autocomplete="off" style="font-size:1.2rem;width:7em"><button class="btn gold" id="gGo">${esc(t('on.ok'))}</button>${back?`<button class="btn ghost" id="gBack">${esc(t('create.back'))}</button>`:''}</div><p id="gMsg" style="color:#ff9a8a;font-weight:800"></p>`,
      m=>{ const inp=m.querySelector('#gA'); const go=()=>{ if(+inp.value===a*b){ cb(); } else { m.querySelector('#gMsg').textContent=t('on.gateNo'); inp.value=''; } };
        m.querySelector('#gGo').onclick=go; inp.onkeydown=e=>{ if(e.key==='Enter') go(); }; if(back) m.querySelector('#gBack').onclick=back; setTimeout(()=>inp.focus(),60); }); }
  api.gate=gate;

  /* ---------- device login (family) ---------- */
  async function mainCtx(){ const C=await NET.ctx('main'); if(!C.u) await C.anon(); return C; }
  async function familyOf(C){ const u=await C.get('users/'+C.u.uid); return u||null; }
  async function ensureFamily(C){ let u=await familyOf(C); if(u&&u.fid) return u;
    const fid=rid(16); await C.batch([{op:'set',path:'families/'+fid,data:{owner:C.u.uid,created:NET.now,gname:C.u.anon?'':(C.u.name||'')}},{op:'set',path:'users/'+C.u.uid,data:{fid,role:'all'}}]);
    return {fid,role:'all'}; }
  async function ctxFor(st){ const c=st&&st.cloud; if(!c) return null; const C=await NET.ctx(c.ctx||'main'); if(!C.u) return null; return C; }
  api.ctxFor=ctxFor;

  /* ---------- names (player name = animal + word + number) ---------- */
  async function nameFree(C,nm){ try{ return !(await C.get('names/'+nmKey(nm))); }catch(e){ return true; } }
  function nameUI(title,preset,cb,C){ let nm=preset?preset.slice():[rnd(0,AN.length-1),rnd(0,WD.length-1),rnd(10,99)];
    openModal(title,`<p style="margin-top:0">${esc(t('on.nameP'))}</p><div class="nmprev"><span id="nE"></span><b id="nT"></b></div>
      <div class="sect">${esc(t('on.nameA'))}</div><div class="emogrid" id="nA">${AN.map((e,i)=>`<button data-a="${i}" title="${esc((t('nm.a')||[])[i]||'')}">${e}</button>`).join('')}</div>
      <div class="sect">${esc(t('on.nameW'))}</div><div class="emogrid" id="nW">${WD.map((e,i)=>`<button data-w="${i}" title="${esc((t('nm.w')||[])[i]||'')}">${e}</button>`).join('')}</div>
      <div class="sect">${esc(t('on.nameN'))}</div><div class="numrow"><button class="btn sm" id="nM">−</button><b id="nN"></b><button class="btn sm" id="nP">+</button><button class="btn sm ghost" id="nR">🎲 ${esc(t('on.nameRnd'))}</button></div>
      <p id="nMsg" style="font-weight:800;min-height:1.2em"></p><button class="btn gold" id="nGo">${esc(t('on.nameUse'))}</button>`,
      m=>{ const draw=()=>{ m.querySelector('#nE').textContent=nmEmo(nm); m.querySelector('#nT').textContent=nmText(nm); m.querySelector('#nN').textContent=nm[2];
          m.querySelectorAll('[data-a]').forEach(b=>b.classList.toggle('on',+b.dataset.a===nm[0])); m.querySelectorAll('[data-w]').forEach(b=>b.classList.toggle('on',+b.dataset.w===nm[1])); m.querySelector('#nMsg').textContent=''; };
        m.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ nm[0]=+b.dataset.a; draw(); }); m.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{ nm[1]=+b.dataset.w; draw(); });
        m.querySelector('#nM').onclick=()=>{ nm[2]=nm[2]<=10?99:nm[2]-1; draw(); }; m.querySelector('#nP').onclick=()=>{ nm[2]=nm[2]>=99?10:nm[2]+1; draw(); };
        m.querySelector('#nR').onclick=()=>{ nm=[rnd(0,AN.length-1),rnd(0,WD.length-1),rnd(10,99)]; draw(); };
        m.querySelector('#nGo').onclick=async()=>{ const b=m.querySelector('#nGo'); b.disabled=true;
          if(C&&!(await nameFree(C,nm))){ m.querySelector('#nMsg').textContent=t('on.nameTaken'); nm[2]=rnd(10,99); draw(); m.querySelector('#nMsg').textContent=t('on.nameTaken'); b.disabled=false; return; }
          cb(nm.slice()); };
        draw(); }); }
  function picsUI(title,intro,cb,backFn){ let sel=[];
    openModal(title,`<p style="margin-top:0">${esc(intro)}</p><div class="picslots" id="pS"></div><div class="emogrid big" id="pG">${PICS.map((e,i)=>`<button data-p="${i}">${e}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn ghost" id="pC">${esc(t('on.picsClear'))}</button>${backFn?`<button class="btn ghost" id="pB">${esc(t('create.back'))}</button>`:''}</div><p id="pMsg" style="font-weight:800;min-height:1.2em"></p>`,
      m=>{ const draw=()=>{ m.querySelector('#pS').innerHTML=[0,1,2,3].map(i=>`<span>${sel[i]!=null?PICS[sel[i]]:''}</span>`).join(''); };
        m.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{ if(sel.length>=4) return; sel.push(+b.dataset.p); draw(); if(sel.length===4) setTimeout(()=>cb(sel.slice(),msg=>{ m.querySelector('#pMsg').textContent=msg||''; sel=[]; draw(); }),180); });
        m.querySelector('#pC').onclick=()=>{ sel=[]; draw(); }; if(backFn) m.querySelector('#pB').onclick=backFn; draw(); }); }

  /* ---------- player record ---------- */
  function pub(st){ const wk=st.wk&&st.wk.w===week()?st.wk:{w:week(),p:0,r:0,v:0}; return {nm:st.cloud.nm||null,look:st.look,lvl:st.level,frags:frags(st),comp:st.comp||'',lang:st.lang||LANG,gr:st.grade||5,wk,on:NET.now,
    house:((st.house&&st.house.items)||[]).slice(0,60)}; }
  async function uniqueCode(C){ const L='BCDFGHJKLMNPQRSTVWXZ'; for(let i=0;i<8;i++){ const c=Array.from({length:4},()=>L[rnd(0,L.length-1)]).join('')+'-'+rnd(1000,9999); if(!(await C.get('codes/'+c))) return c; } return 'X'+rid(8).toUpperCase(); }
  async function createPlayer(C,fam,st,nm){ const pid=rid(16), code=await uniqueCode(C), data=snapshot(st);
    st.cloud={ctx:C.name,pid,fid:fam.fid,rev:1,h:hashOf(st),at:Date.now(),nm,code};
    await C.batch([{op:'set',path:'names/'+nmKey(nm),data:{pid,fid:fam.fid}},
      {op:'set',path:'players/'+pid,data:Object.assign({fid:fam.fid,code},pub(st))},
      {op:'set',path:'codes/'+code,data:{pid}},
      {op:'set',path:'saves/'+pid,data:{fid:fam.fid,data,rev:1,at:NET.now,dev:D.dev}},
      {op:'update',path:'families/'+fam.fid,data:{kids:NET.union(pid)}}]);
    lsSet(SKEY(st.id),JSON.stringify(st)); return pid; }

  /* ---------- local backups (never lose a local save) ---------- */
  function backupLocal(st,why){ try{ let a=[]; try{ a=JSON.parse(localStorage.getItem(BKEY(st.id)))||[]; }catch(e){} a.unshift({at:Date.now(),why:why||'',lvl:st.level,frags:frags(st),data:JSON.stringify(st)}); a=a.slice(0,3);
      let s=JSON.stringify(a); while(a.length>1&&s.length>2.5e6){ a.pop(); s=JSON.stringify(a); } localStorage.setItem(BKEY(st.id),s); return true; }catch(e){ return false; } }
  function backups(id){ try{ return JSON.parse(localStorage.getItem(BKEY(id)))||[]; }catch(e){ return []; } }
  api.backups=backups;

  /* ---------- sync ---------- */
  let upT=null, upBusy=false, lastUp=0, hbT=0, pulling=false;
  api.onSave=()=>{ if(!D.on||!S||!S.cloud) return; S.savedAt=Date.now(); if(upT) return; const wait=Date.now()-lastUp>60000?8000:30000; upT=setTimeout(()=>{ upT=null; upload(); },wait); };
  async function upload(force){ if(!D.on||!S||!S.cloud||upBusy) return; const st=S, c=st.cloud; const data=snapshot(st), h=hashOf(st);
    if(!force&&h===c.h&&Date.now()-hbT<120000) return;
    upBusy=true; try{ const C=await ctxFor(st); if(!C) return;
      if(h!==c.h){ if(data.length>900000){ setStatus('big'); return; }
        const r=await C.tx(async tr=>{ const cur=await tr.get('saves/'+c.pid); if(cur&&cur.rev!==c.rev&&!force){ let o=null; try{ o=JSON.parse(cur.data); }catch(e){} if(!(o&&progress(o)===progress(st))) return {conflict:cur}; }
          const rev=(cur?cur.rev:c.rev)+1; tr.set('saves/'+c.pid,{fid:c.fid,data,rev,at:NET.now,dev:D.dev}); return {rev}; });
        if(r&&r.conflict){ if(S===st) remoteNewer(st,r.conflict); return; }
        c.rev=r.rev; c.h=h; c.at=Date.now(); lsSet(SKEY(st.id),JSON.stringify(st)); }
      const ops=[{op:'update',path:'players/'+c.pid,data:pub(st)}];
      const d=today(), lg=st.log&&st.log[d]; if(lg) ops.push({op:'set',path:'logs/'+c.pid+'/days/'+d,data:{fid:c.fid,sec:Math.round(lg.sec),q:lg.q,r:lg.r,lvl:st.level,lang:st.lang||LANG,hr:Object.fromEntries(Object.entries(lg.hr||{}).map(([k,v])=>[k,Math.round(v)])),at:NET.now},merge:true});
      if(api.social) ops.push(...api.social.extraOps(st));
      await C.batch(ops); hbT=Date.now(); lastUp=Date.now(); setStatus('ok');
    }catch(e){ setStatus('err',e); console.warn('upload',e); } finally{ upBusy=false; } }
  api.upload=upload;
  let status={k:'',at:0};
  function setStatus(k,e){ status={k,at:Date.now(),e}; const el=document.getElementById('onStat'); if(el) el.textContent=statusText(); }
  function statusText(){ if(!S||!S.cloud) return ''; if(status.k==='err') return t('on.stErr'); if(status.k==='big') return t('on.stBig'); const at=S.cloud.at; if(!at) return t('on.stNever'); const m=Math.round((Date.now()-at)/60000); return m<1?t('on.stNow'):t('on.stMin',m); }
  async function pull(st,quiet){ if(!D.on||!st||!st.cloud||pulling) return 'skip'; pulling=true; try{ const C=await ctxFor(st); if(!C) return 'nologin';
      const r=await C.getFresh('saves/'+st.cloud.pid); if(!r){ return 'missing'; }
      if(r.rev>st.cloud.rev){ const mine=hashOf(st)!==st.cloud.h; if(!mine){ adopt(st,r,'cloud'); return 'adopted'; }
        let o=null; try{ o=JSON.parse(r.data); }catch(e){} if(o&&progress(o)===progress(st)){ st.cloud.rev=r.rev; st.cloud.h=''; lsSet(SKEY(st.id),JSON.stringify(st)); upload(); return 'same'; }
        remoteNewer(st,r); return 'conflict'; }
      return 'same'; }catch(e){ if(!quiet) setStatus('err',e); return 'err'; } finally{ pulling=false; } }
  api.pull=pull;
  function adopt(st,r,why){ backupLocal(st,why||'cloud'); let n; try{ n=JSON.parse(r.data); }catch(e){ return; } n.id=st.id; n.cloud=Object.assign({},st.cloud,{rev:r.rev,h:hashOf(n),at:Date.now()});
    lsSet(SKEY(n.id),JSON.stringify(n)); const p=getProfiles(); const it=p.list.find(x=>x.id===n.id); if(it) Object.assign(it,summary(n)); setProfiles(p);
    if(S===st){ const wasWorld=mode==='world'; S=n; if(wasWorld){ if(modalOpen) closeModal(); startProfile(); } toast(t('on.gotNewer')); } }
  function remoteNewer(st,r){ let o=null; try{ o=JSON.parse(r.data); }catch(e){}
    if(!o){ return; } const card=(x,when)=>`<div class="card"><b>${esc(t('title.lv',x.level||1,frags(x),NCH))}</b><small>🪙 ${x.coins||0} · ✔ ${x.correct||0}</small><small>${esc(t('on.lastPlayed',new Date(when||0).toLocaleString(LC[LANG].loc)))}</small></div>`;
    openModal(t('on.confT'),`<p>${esc(t('on.confP'))}</p><div class="cards"><div><div class="sect">${esc(t('on.confHere'))}</div>${card(st,st.savedAt)}<button class="btn gold" id="cfL">${esc(t('on.keepThis'))}</button></div>
      <div><div class="sect">${esc(t('on.confCloud'))}</div>${card(o,r.at)}<button class="btn gold" id="cfR">${esc(t('on.keepThis'))}</button></div></div><p style="color:var(--muted)">${esc(t('on.confSafe'))}</p>`,
      m=>{ m.querySelector('#cfR').onclick=()=>{ closeModal(); adopt(st,r,'conflict'); };
        m.querySelector('#cfL').onclick=async()=>{ closeModal(); try{ const C=await ctxFor(st); await C.set('saves/'+st.cloud.pid+'/old/'+Date.now(),{fid:st.cloud.fid,data:r.data,rev:r.rev,at:r.at||0}); }catch(e){} st.cloud.rev=r.rev; st.cloud.h=''; await upload(true); toast(t('on.keptHere')); }; }); }

  function updOnline(){ if(api.social) api.social.start(); }
  /* ---------- turning online on for the current player ---------- */
  async function enableFor(st,after){ try{ const C=await mainCtx(); const fam=await ensureFamily(C); D.on=true; api.on=true; saveD();
      if(st&&!st.cloud){ nameUI(t('on.nameT'),null,async nm=>{ try{ await createPlayer(C,fam,st,nm); toast(t('on.ready',nmText(nm))); updOnline(); if(after) after(); else openOnline(); }catch(e){ toast(errText(e)); } },C); }
      else { updOnline(); if(after) after(); else openOnline(); } }catch(e){ toast(errText(e)); } }
  api.enableFor=enableFor;

  /* ---------- one-time invitation (new players after the intro, existing players once) ---------- */
  function invite(){ const st=S; if(!st||st.cloud||st.onAsk) return;
    const show=()=>{ if(S!==st||st.cloud) return; if(busy()){ setTimeout(show,1500); return; } st.onAsk=1; save(); askUI(st); };
    setTimeout(show,1200); }
  function askUI(st){ openModal(t('on.askT'),`<div class="askon"><div class="big">☁️ 🤝 🎁</div><p>${esc(t('on.askP'))}</p>
      <ul><li>☁️ ${esc(t('on.askB1'))}</li><li>📲 ${esc(t('on.askB2'))}</li><li>🎁 ${esc(t('on.askB3'))}</li></ul>
      <p style="color:var(--muted);font-size:.85rem">${esc(t('on.privacyLine'))} <a href="privacy.html" target="_blank" rel="noopener">${esc(t('on.privacy'))}</a></p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn gold" id="akY">${esc(t('on.askYes'))}</button><button class="btn ghost" id="akN">${esc(t('on.askNo'))}</button></div></div>`,
    m=>{ m.querySelector('#akN').onclick=()=>{ closeModal(); toast(t('on.askLater')); };
      m.querySelector('#akY').onclick=()=>gate(()=>enableFor(st,()=>cardNow(st)),()=>askUI(st)); }); }
  function cardNow(st){ openModal(t('on.cardNowT'),`<p>${esc(t('on.cardNowP',nmText(st.cloud.nm)))}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn gold" id="cnY">🪪 ${esc(t('on.cardT'))}</button><button class="btn ghost" id="cnN">${esc(t('on.later'))}</button></div>`,
    m=>{ m.querySelector('#cnY').onclick=()=>makeCard(st); m.querySelector('#cnN').onclick=()=>{ closeModal(); toast(t('on.askLater')); }; }); }
  api.invite=invite;

  /* ---------- login card ---------- */
  async function makeCard(st){ const c=st.cloud; const C=await ctxFor(st); if(!C) return toast(t('on.errPerm'));
    picsUI(t('on.cardT'),t('on.cardPicsP'),async(p,fail)=>{ try{
        const email=nmMail(c.nm), pw=picPw(c.nm,p); const K=await NET.ctx('k-'+nmKey(c.nm)); let uid;
        const old=await C.get('families/'+c.fid+'/cards/'+c.pid);
        if(old&&old.uid){ await K.card(email,picPw(c.nm,old.pics)); await K.newPw(pw); uid=K.u.uid; } else uid=await K.newCard(email,pw);
        await C.set('families/'+c.fid+'/cards/'+c.pid,{uid,pics:p,nm:c.nm,at:NET.now});
        await C.update('families/'+c.fid,{['cards.'+uid]:c.pid});
        await K.set('users/'+uid,{fid:c.fid,pid:c.pid,role:'kid'});
        await NET.drop('k-'+nmKey(c.nm));
        st.cloud.card=1; lsSet(SKEY(st.id),JSON.stringify(st)); showCard(st,p);
      }catch(e){ console.warn(e); fail(errText(e)); } }); }
  function showCard(st,pics){ const c=st.cloud;
    openModal(t('on.cardT'),`<div class="logincard" id="lcard"><div class="lc-h">${esc(t('title.h1').replace('<br>',' '))}</div><div class="lc-e">${nmEmo(c.nm)}</div><div class="lc-n">${esc(nmText(c.nm))}</div>
      <div class="lc-l">${esc(t('on.cardPics'))}</div><div class="lc-p">${pics.map(i=>PICS[i]).join(' ')}</div><div class="lc-f">${esc(t('on.cardHow'))}</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn gold" id="lcP">${esc(t('on.print'))}</button><button class="btn ghost" id="lcN">${esc(t('on.cardNew'))}</button></div>`,
      m=>{ m.querySelector('#lcP').onclick=()=>{ document.body.classList.add('printcard'); setTimeout(()=>{ window.print(); setTimeout(()=>document.body.classList.remove('printcard'),400); },50); };
        m.querySelector('#lcN').onclick=()=>makeCard(st); }); }
  async function openCard(st){ const C=await ctxFor(st); try{ const d=await C.get('families/'+st.cloud.fid+'/cards/'+st.cloud.pid); if(d) showCard(st,d.pics); else makeCard(st); }catch(e){ toast(errText(e)); } }

  /* ---------- continue code (move to another device) ---------- */
  async function continueCode(st){ const C=await ctxFor(st); if(!C) return; const L='BCDFGHJKLMNPQRSTVWXZ23456789'; const code=Array.from({length:8},()=>L[rnd(0,L.length-1)]).join('');
    try{ await upload(true); await C.set('xfer/'+code,{fid:st.cloud.fid,pid:st.cloud.pid,exp:Date.now()+10*60000,by:C.u.uid});
      const url=location.origin+location.pathname+'?go='+code; let qr='';
      try{ if(window.FB&&window.FB.qr){ const q=window.FB.qr(0,'M'); q.addData(url); q.make(); qr=q.createSvgTag({cellSize:5,margin:2,scalable:true}); } }catch(e){}
      openModal(t('on.xferT'),`<p>${esc(t('on.xferP'))}</p><div class="xfer">${qr?`<div class="qr">${qr}</div>`:''}<div><div class="lc-l">${esc(t('on.xferCode'))}</div><div class="code">${code.slice(0,4)} ${code.slice(4)}</div><small>${esc(t('on.xferExp'))}</small></div></div>`);
    }catch(e){ toast(errText(e)); } }

  /* ---------- bring a player onto this device ---------- */
  function profilesFull(){ return getProfiles().list.length>=4; }
  async function installPlayer(C,pid,ctxName){ const s=await C.getFresh('saves/'+pid); if(!s) throw new Error('missing'); const p=await C.get('players/'+pid);
    const local=getProfiles().list.map(x=>loadProfile(x.id)).find(x=>x&&x.cloud&&x.cloud.pid===pid);
    D.on=true; api.on=true; saveD();
    if(local){ S=local; S.cloud.ctx=ctxName; lsSet(SKEY(S.id),JSON.stringify(S)); if(S.lang) applyLang(S.lang); await pull(S,true); if(mode==='title') startProfile(); return; }
    if(profilesFull()){ toast(t('on.full')); return; }
    const o=JSON.parse(s.data); const id='p'+Date.now(); o.id=id; o.cloud={ctx:ctxName,pid,fid:s.fid,rev:s.rev,h:hashOf(o),at:Date.now(),nm:p&&p.nm,code:p&&p.code};
    lsSet(SKEY(id),s.data); lsSet(SKEY(id),JSON.stringify(o)); const pr=getProfiles(); pr.list.push(summary(o)); pr.last=id; setProfiles(pr);
    S=o; if(S.lang) applyLang(S.lang); startProfile(); toast(t('toast.welcome',S.name)); }
  function alreadyPlay(){ if(modalOpen) closeModal();
    openModal(t('on.haveT'),`<p style="margin-top:0">${esc(t('on.haveP'))}</p><div class="mtiles">
      <button class="mtile" id="hvN"><span class="big">${nmEmo([0,0,0])}</span><b>${esc(t('on.haveName'))}</b><small>${esc(t('on.haveNameD'))}</small></button>
      <button class="mtile" id="hvC"><span class="big">🔢</span><b>${esc(t('on.haveCode'))}</b><small>${esc(t('on.haveCodeD'))}</small></button>
      <button class="mtile" id="hvG"><span class="big">👪</span><b>${esc(t('on.haveGrown'))}</b><small>${esc(t('on.haveGrownD'))}</small></button></div>`,
      m=>{ m.querySelector('#hvN').onclick=()=>kidLogin(); m.querySelector('#hvC').onclick=()=>codeLogin(''); m.querySelector('#hvG').onclick=()=>gate(()=>grownLogin(),alreadyPlay); }); }
  function kidLogin(){ nameUI(t('on.haveName'),null,nm=>{ picsUI(t('on.havePicsT'),t('on.havePicsP'),async(p,fail)=>{ const name='k-'+nmKey(nm);
      try{ const K=await NET.ctx(name); await K.card(nmMail(nm),picPw(nm,p)); const u=await K.get('users/'+K.u.uid); if(!u||!u.pid) throw new Error('permission');
        closeModal(); await installPlayer(K,u.pid,name); }catch(e){ await NET.drop(name); fail(/credential|password|user-not-found|invalid/i.test(String(e.code||e.message))?t('on.wrongPics'):errText(e)); } },()=>kidLogin()); },null); }
  function codeLogin(pre){ openModal(t('on.haveCode'),`<p style="margin-top:0">${esc(t('on.codeP'))}</p><input id="cIn" maxlength="9" autocomplete="off" style="font-size:1.4rem;letter-spacing:.15em;text-transform:uppercase;width:10em" value="${esc(pre||'')}"> <button class="btn gold" id="cGo2">${esc(t('on.ok'))}</button><p id="cMsg" style="font-weight:800"></p>`,
    m=>{ const go=async()=>{ const code=m.querySelector('#cIn').value.toUpperCase().replace(/[^A-Z0-9]/g,''); if(code.length!==8) return; const b=m.querySelector('#cGo2'); b.disabled=true; const name='x-'+code;
        try{ const X=await NET.ctx(name); if(!X.u) await X.anon(); const x=await X.get('xfer/'+code); if(!x||x.exp<Date.now()) throw new Error('expired');
          await X.set('users/'+X.u.uid,{fid:x.fid,pid:x.pid,role:'kid',via:code}); closeModal(); await installPlayer(X,x.pid,name);
        }catch(e){ await NET.drop(name); m.querySelector('#cMsg').textContent=/expired|permission/i.test(String(e.code||e.message))?t('on.codeBad'):errText(e); b.disabled=false; } };
      m.querySelector('#cGo2').onclick=go; m.querySelector('#cIn').onkeydown=e=>{ if(e.key==='Enter') go(); }; }); }
  async function grownLogin(){ try{ const C=await NET.ctx('main'); const r=await C.google();
      if(r.inUse) await C.withCred(r.cred);
      const u=await familyOf(C); D.on=true; api.on=true; saveD();
      if(!u){ await ensureFamily(C); toast(t('on.signedIn',C.u.name||C.u.email)); closeModal(); renderProfiles(); return; }
      await C.update('families/'+u.fid,{gname:C.u.name||''}).catch(()=>{});
      const kids=await C.query('players',[['fid','==',u.fid]]);
      const here=getProfiles().list.map(x=>loadProfile(x.id)).filter(x=>x&&x.cloud).map(x=>x.cloud.pid);
      openModal(t('on.famT'),`<p style="margin-top:0">${esc(t('on.famP',C.u.name||C.u.email))}</p><div class="cards">${kids.map(k=>`<button class="card" data-k="${k.id}" ${here.includes(k.id)?'disabled':''}><div class="emo">${nmEmo(k.data.nm)}</div><b>${esc(nmText(k.data.nm))}</b><small>${esc(t('title.lv',k.data.lvl||1,k.data.frags||0,NCH))}</small>${here.includes(k.id)?`<span class="tag">${esc(t('on.onDevice'))}</span>`:''}</button>`).join('')||`<p>${esc(t('on.famNone'))}</p>`}</div>`,
        m=>m.querySelectorAll('[data-k]').forEach(b=>b.onclick=async()=>{ closeModal(); try{ await installPlayer(C,b.dataset.k,'main'); }catch(e){ toast(errText(e)); } }));
    }catch(e){ console.warn(e); toast(errText(e)); } }
  api.alreadyPlay=alreadyPlay; api.codeLogin=codeLogin;

  /* ---------- grown-up Google sign-in on a device that already plays as guest ---------- */
  async function linkGoogle(){ try{ const C=await NET.ctx('main'); const r=await C.google();
      if(r.linked){ const u=await familyOf(C); if(u) await C.update('families/'+u.fid,{gname:C.u.name||''}).catch(()=>{}); toast(t('on.signedIn',C.u.name||C.u.email)); openOnline(); return; }
      if(r.inUse){ // this Google account already has a family elsewhere: move this device's players into it
        const mine=await familyOf(C); const G=await NET.ctx('g-merge'); await G.withCred(r.cred); const gu=await familyOf(G);
        if(gu&&mine&&gu.fid!==mine.fid){ await G.update('families/'+gu.fid,{['join.'+C.u.uid]:true});
          const locals=getProfiles().list.map(x=>loadProfile(x.id)).filter(x=>x&&x.cloud&&x.cloud.fid===mine.fid);
          for(const st of locals){ await C.batch([{op:'update',path:'players/'+st.cloud.pid,data:{fid:gu.fid}},{op:'update',path:'saves/'+st.cloud.pid,data:{fid:gu.fid}},{op:'update',path:'names/'+nmKey(st.cloud.nm),data:{fid:gu.fid}}]);
            await G.update('families/'+gu.fid,{kids:NET.union(st.cloud.pid)}); st.cloud.fid=gu.fid; lsSet(SKEY(st.id),JSON.stringify(st)); if(S&&S.id===st.id) S.cloud.fid=gu.fid; } }
        await NET.drop('g-merge'); await C.withCred(r.cred); toast(t('on.signedIn',C.u.name||C.u.email)); openOnline(); } }
    catch(e){ console.warn(e); toast(errText(e)); } }

  /* ---------- settings section ---------- */
  function sectionHTML(){ const st=S; if(!api.on||!st||!st.cloud) return `<div class="sect">${esc(t('on.sect'))}</div><div class="onbox"><p>${esc(t('on.offP'))}</p><p style="color:var(--muted);font-size:.85rem">${esc(t('on.privacyLine'))} <a href="privacy.html" target="_blank" rel="noopener">${esc(t('on.privacy'))}</a></p><button class="btn gold" id="onOn">${esc(t('on.turnOn'))}</button></div>`;
    return `<div class="sect">${esc(t('on.sect'))}</div><div class="onbox"><p><b>${nmEmo(st.cloud.nm)} ${esc(nmText(st.cloud.nm))}</b> · <span id="onStat">${esc(statusText())}</span></p><button class="btn gold" id="onOpen">${esc(t('on.manage'))}</button></div>`; }
  api.sectionHTML=sectionHTML;
  api.sectionMount=m=>{ const on=m.querySelector('#onOn'); if(on) on.onclick=()=>gate(()=>enableFor(S),()=>{ closeModal(); openSettings(); }); const op=m.querySelector('#onOpen'); if(op) op.onclick=()=>openOnline(); };
  async function openOnline(){ if(!S) return; const st=S; if(!st.cloud){ return enableFor(st); }
    const C=await ctxFor(st).catch(()=>null); const isMain=(st.cloud.ctx||'main')==='main'; const guest=C&&C.u&&C.u.anon&&isMain;
    const bks=backups(st.id);
    openModal(t('on.sect'),`<div class="onbox"><p style="margin:0"><b style="font-size:1.15rem">${nmEmo(st.cloud.nm)} ${esc(nmText(st.cloud.nm))}</b></p><p style="margin:4px 0 0">${esc(t('on.friendCode'))}: <b>${esc(st.cloud.code||'')}</b></p>
        <p style="margin:4px 0 0"><span id="onStat">${esc(statusText())}</span> <button class="btn sm" id="onSync">${esc(t('on.syncNow'))}</button></p></div>
      <div class="sect">${esc(t('on.acct'))}</div><p>${C&&C.u?esc(guest?t('on.guest'):C.u.anon?t('on.viaCode'):C.u.email&&C.u.email.endsWith(MAILD)?t('on.viaCard'):t('on.signedAs',C.u.name||C.u.email)):esc(t('on.signedOut'))}</p>
      <div class="mtiles">
        ${guest?`<button class="mtile" id="onG"><span class="big">👪</span><b>${esc(t('on.linkG'))}</b><small>${esc(t('on.linkGD'))}</small></button>`:''}
        <button class="mtile" id="onCard"><span class="big">🪪</span><b>${esc(t('on.cardT'))}</b><small>${esc(t('on.cardD'))}</small></button>
        <button class="mtile" id="onX"><span class="big">📲</span><b>${esc(t('on.xferT'))}</b><small>${esc(t('on.xferD'))}</small></button>
      </div>
      ${bks.length?`<div class="sect">${esc(t('on.bakT'))}</div>${bks.map((b,i)=>`<div class="row"><div class="grow"><h4>${esc(t('title.lv',b.lvl||1,b.frags||0,NCH))}</h4><p>${esc(new Date(b.at).toLocaleString(LC[LANG].loc))}</p></div><button class="btn sm" data-bk="${i}">${esc(t('on.bakUse'))}</button></div>`).join('')}`:''}
      <div class="sect">${esc(t('on.more'))}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm ghost" id="onOut">${esc(t('on.signOut'))}</button><button class="btn sm ghost" id="onDel">${esc(t('on.delete'))}</button></div>
      <p style="color:var(--muted);font-size:.85rem">${esc(t('on.privacyLine'))} <a href="privacy.html" target="_blank" rel="noopener">${esc(t('on.privacy'))}</a></p>`,
      m=>{ m.querySelector('#onSync').onclick=async()=>{ const r=await pull(st); if(r==='same'||r==='missing') await upload(true); const el=m.querySelector('#onStat'); if(el) el.textContent=statusText(); };
        const g=m.querySelector('#onG'); if(g) g.onclick=()=>gate(linkGoogle,openOnline);
        m.querySelector('#onCard').onclick=()=>gate(()=>openCard(st),openOnline);
        m.querySelector('#onX').onclick=()=>continueCode(st);
        m.querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>{ const bk=bks[+b.dataset.bk]; gate(()=>{ backupLocal(st,'restore'); const o=JSON.parse(bk.data); o.id=st.id; o.cloud=st.cloud; S=o; lsSet(SKEY(o.id),JSON.stringify(o)); closeModal(); startProfile(); upload(true); toast(t('toast.loaded')); },openOnline); });
        m.querySelector('#onOut').onclick=()=>signOutUI(st); m.querySelector('#onDel').onclick=()=>gate(()=>deleteUI(st),openOnline); }); }
  api.openOnline=openOnline;
  function signOutUI(st){ const guest=(st.cloud.ctx||'main')==='main';
    openModal(t('on.signOut'),`<p>${esc(guest?t('on.outMainP'):t('on.outKidP'))}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn gold" id="soK">${esc(t('on.outKeep'))}</button><button class="btn ghost" id="soR">${esc(t('on.outRemove'))}</button><button class="btn ghost" id="soB">${esc(t('create.back'))}</button></div>`,
      m=>{ const doIt=async remove=>{ await upload(true); const name=st.cloud.ctx||'main';
          const others=getProfiles().list.map(x=>loadProfile(x.id)).filter(x=>x&&x.cloud&&x.id!==st.id&&(x.cloud.ctx||'main')===name);
          if(!others.length) await NET.drop(name);
          if(remove){ const p=getProfiles(); p.list=p.list.filter(x=>x.id!==st.id); if(p.last===st.id) p.last=null; setProfiles(p); lsDel(SKEY(st.id)); try{ localStorage.removeItem(BKEY(st.id)); }catch(e){} }
          else { delete st.cloud; lsSet(SKEY(st.id),JSON.stringify(st)); }
          closeModal(); toTitle(); toast(t('on.signedOutT')); };
        m.querySelector('#soK').onclick=()=>doIt(false); m.querySelector('#soR').onclick=()=>doIt(true); m.querySelector('#soB').onclick=openOnline; }); }
  function deleteUI(st){ openModal(t('on.delete'),`<p>${esc(t('on.delP',nmText(st.cloud.nm)))}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn gold" id="dlY">${esc(t('on.delYes'))}</button><button class="btn ghost" id="dlN">${esc(t('create.back'))}</button></div>`,
    m=>{ m.querySelector('#dlN').onclick=openOnline; m.querySelector('#dlY').onclick=async()=>{ try{ await deleteOnline(st); delete st.cloud; lsSet(SKEY(st.id),JSON.stringify(st)); closeModal(); toast(t('on.deleted')); }catch(e){ toast(errText(e)); } }; }); }
  async function deleteOnline(st){ const C=await ctxFor(st); const c=st.cloud, pid=c.pid; const ops=[];
    const sub=async col=>{ try{ return await C.query(col); }catch(e){ return []; } };
    for(const f of await sub('players/'+pid+'/friends')){ ops.push({op:'del',path:'players/'+pid+'/friends/'+f.id}); ops.push({op:'del',path:'players/'+f.id+'/friends/'+pid}); }
    for(const x of await sub('players/'+pid+'/inbox')) ops.push({op:'del',path:'players/'+pid+'/inbox/'+x.id});
    for(const x of await sub('players/'+pid+'/invites')) ops.push({op:'del',path:'players/'+pid+'/invites/'+x.id});
    for(const x of await sub('logs/'+pid+'/days')) ops.push({op:'del',path:'logs/'+pid+'/days/'+x.id});
    for(const x of await sub('saves/'+pid+'/old')) ops.push({op:'del',path:'saves/'+pid+'/old/'+x.id});
    (st.cloud.groups||[]).forEach(g=>ops.push({op:'del',path:'groups/'+g+'/members/'+pid}));
    for(let i=0;i<ops.length;i+=5){ try{ await C.batch(ops.slice(i,i+5)); }catch(e){ console.warn('delete part',e); } }
    try{ await C.del('families/'+c.fid+'/cards/'+pid); }catch(e){}
    await C.batch([{op:'del',path:'codes/'+c.code},{op:'del',path:'names/'+nmKey(c.nm)},{op:'del',path:'saves/'+pid}]);
    await C.del('players/'+pid); }

  /* ---------- hooks into the game ---------- */
  api.onStart=()=>{ if(api.social) api.social.badge(); if(S&&!S.cloud&&!S.onAsk) invite(); if(!D.on||!S||!S.cloud) return; setTimeout(async()=>{ const st=S; const r=await pull(st,true); if(r==='same'||r==='missing') upload(r==='missing'); if(api.social) api.social.start(); },800); };
  document.addEventListener('visibilitychange',()=>{ if(!D.on||!S||!S.cloud) return; if(document.hidden){ clearTimeout(upT); upT=null; upload(); } else if(!busy()) pull(S,true); });
  setInterval(()=>{ if(D.on&&S&&S.cloud&&!document.hidden&&Date.now()-hbT>120000) upload(); },30000);
  { const b=$('#tOnline'); if(b){ b.hidden=false; b.onclick=()=>{ ac(); alreadyPlay(); }; } }
  const go=new URLSearchParams(location.search).get('go'); if(go) setTimeout(()=>{ if(mode==='title') codeLogin(go); },900);
  return api;
})();
