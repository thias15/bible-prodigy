/* ===================== ONLINE: playing together live (quiz duel, team boss) ===================== */
if(ON.avail) ON.live=(()=>{
  const CATS=['bible','math','verse','bible','words','math','bible','logic','verse','math'];
  let R=null, unsub=null, waitM=false, seenInv={};
  const pid=()=>S&&S.cloud&&S.cloud.pid;
  const ctx=()=>ON.ctxFor(S);
  function mulberry(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function seeded(seed,fn){ const mr=Math.random; const keep={grade:S.grade,shift:S.shift,srs:S.srs,recent:S.recent,vm:S.vm}; Math.random=mulberry(seed);
    try{ S.shift={}; S.srs={}; S.recent=[]; S.vm={}; if(R&&R.gr) S.grade=R.gr; return fn(); } finally{ Math.random=mr; Object.assign(S,keep); } }
  function free(){ return S&&mode==='world'&&!modalOpen&&!dialogOpen&&!qOpen; }
  /* ---------- invites ---------- */
  async function invite(f,kind){ if(!f||!f.p) return; if(!free()&&!modalOpen) return toast(t('on.busy'));
    const C=await ctx(), me=pid(); const rid=me.slice(0,6)+Date.now().toString(36);
    const room={a:me,b:f.id,kind,st:'wait',created:NET.now,nm:{[me]:S.cloud.nm,[f.id]:f.p.nm},an:{},dmg:{}};
    if(kind==='duel'){ room.seed=Math.floor(Math.random()*1e9); room.gr=Math.min(S.grade||5,f.p.gr||S.grade||5); }
    else { const k=Math.min(ORDER.filter(i=>S.chs[i]&&S.chs[i].stage>=4).length,f.p.frags||0); if(k<1){ toast(t('on.coopNeed')); return; } const mine=ORDER.slice(0,k).filter(i=>S.chs[i]&&S.chs[i].stage>=4); room.ch=mine[Math.floor(Math.random()*mine.length)]||ORDER[0]; }
    try{ await C.set('rooms/'+rid,room); await C.set('players/'+f.id+'/invites/'+me,{from:me,nm:S.cloud.nm,kind,room:rid,at:NET.now}); }catch(e){ toast(ON.errText(e)); return; }
    waitM=true; const cancel=async()=>{ waitM=false; if(unsub) unsub(); unsub=null; try{ await C.update('rooms/'+rid,{st:'gone'}); await C.del('players/'+f.id+'/invites/'+me); }catch(e){} };
    openModal(t(kind==='duel'?'on.duel':'on.coop'),`<p>${esc(t('on.waitFor',ON.nmText(f.p.nm)))}</p><div class="spinner"></div><button class="btn ghost" id="wvX">${esc(t('on.cancel'))}</button>`,
      m=>{ m.querySelector('#wvX').onclick=()=>{ cancel(); closeModal(); }; }, ()=>{ if(waitM) cancel(); });
    const to=setTimeout(()=>{ if(waitM){ cancel(); closeModal(); toast(t('on.noAnswer')); } },120000);
    unsub=C.listen('rooms/'+rid,r=>{ if(!r||!waitM) return; if(r.st==='no'){ waitM=false; clearTimeout(to); unsub(); unsub=null; closeModal(); toast(t('on.declined',ON.nmText(f.p.nm))); }
      if(r.st==='go'){ waitM=false; clearTimeout(to); unsub(); unsub=null; closeModal(); begin(rid,r); } }); }
  function incoming(x){ const d=x.data; if(seenInv[d.room]) return; seenInv[d.room]=1; const box=document.getElementById('invBox')||(()=>{ const b=document.createElement('div'); b.id='invBox'; document.getElementById('game').appendChild(b); return b; })();
    const el=document.createElement('div'); el.className='invite'; el.innerHTML=`<b>${ON.nmEmo(d.nm)} ${esc(t(d.kind==='duel'?'on.invDuel':'on.invCoop',ON.nmText(d.nm)))}</b><div><button class="btn sm gold">${esc(t('on.accept'))}</button><button class="btn sm ghost">${esc(t('on.decline'))}</button></div>`;
    box.appendChild(el); SFX.open&&SFX.open(); const [yes,no]=el.querySelectorAll('button'); const kill=()=>{ el.remove(); };
    const tmo=setTimeout(kill,90000);
    no.onclick=async()=>{ clearTimeout(tmo); kill(); try{ const C=await ctx(); await C.update('rooms/'+d.room,{st:'no'}); await C.del('players/'+pid()+'/invites/'+d.from); }catch(e){} };
    yes.onclick=async()=>{ if(!free()){ toast(t('on.busy')); return; } clearTimeout(tmo); kill(); try{ const C=await ctx(); const r=await C.get('rooms/'+d.room); await C.del('players/'+pid()+'/invites/'+d.from).catch(()=>{}); if(!r||r.st!=='wait'){ toast(t('on.inviteGone')); return; }
        await C.update('rooms/'+d.room,{st:'go',t0:NET.now}); begin(d.room,Object.assign(r,{st:'go'})); }catch(e){ toast(ON.errText(e)); } }; }
  function begin(rid,r){ R=Object.assign({id:rid},r); if(r.kind==='duel') duel(); else coop(); }
  /* ---------- quiz duel ---------- */
  function other(){ return R.a===pid()?R.b:R.a; }
  function duelBar(st){ let b=document.getElementById('duelBar'); if(!b){ b=document.createElement('div'); b.id='duelBar'; document.getElementById('game').appendChild(b); }
    const me=st.an[pid()]||{n:0,r:0}, ot=st.an[other()]||{n:0,r:0}; b.innerHTML=`<span>${ON.nmEmo(S.cloud.nm)} ${esc(t('on.you'))} <b>${me.r}</b> <small>(${me.n}/10)</small></span><span>⚔️</span><span>${ON.nmEmo(st.nm[other()])} ${esc(ON.nmText(st.nm[other()]))} <b>${ot.r}</b> <small>(${ot.n}/10)</small></span>`; b.hidden=false; }
  async function duel(){ const C=await ctx(), me=pid(); let st=Object.assign({an:{}},R); duelBar(st);
    const un=C.listen('rooms/'+R.id,r=>{ if(r){ st=r; duelBar(st); } });
    toast(t('on.duelGo'),true); await sleep(1600); let n=0, right=0, ms=0;
    for(let i=0;i<10;i++){ if(!S) break; const q=seeded(R.seed+i*7919,()=>makeQuestion(ORDER[0],CATS[i])); const ok=await ask(q,{}); n++; if(ok){ right++; SFX.coin&&SFX.coin(); } ms+=Math.round(q.ms||0);
      try{ await C.update('rooms/'+R.id,{['an.'+me]:{n,r:right,ms}}); }catch(e){} }
    const t0=Date.now(); while(Date.now()-t0<60000){ const ot=st.an&&st.an[other()]; if(ot&&ot.n>=10) break; await sleep(500); }
    un(); const bar=document.getElementById('duelBar'); if(bar) bar.hidden=true;
    const ot=(st.an&&st.an[other()])||{n:0,r:0,ms:0}; const win=right>ot.r||(right===ot.r&&ms<(ot.ms||1e12)&&ot.n>=10), tie=right===ot.r&&ot.n>=10&&ms===ot.ms;
    const coins=20+(win?20:0); S.coins+=coins; wkAdd(win?10:5,0,0); save(); updHUD(); if(win) SFX.win&&SFX.win();
    openModal(t('on.duelEnd'),`<div class="duelres"><div><div class="big">${ON.nmEmo(S.cloud.nm)}</div><b>${esc(t('on.you'))}</b><p class="score">${right}</p></div><div class="vs">⚔️</div><div><div class="big">${ON.nmEmo(R.nm[other()])}</div><b>${esc(ON.nmText(R.nm[other()]))}</b><p class="score">${ot.r}</p></div></div>
      <p style="text-align:center;font-weight:900;font-size:1.2rem">${esc(tie?t('on.tie'):win?t('on.youWin'):t('on.theyWin',ON.nmText(R.nm[other()])))}</p><p style="text-align:center">${esc(t('on.duelCoins',coins))}</p>`);
    try{ if(R.a===me) await C.update('rooms/'+R.id,{st:'done'}); }catch(e){} R=null; }
  /* ---------- team boss (co-op champion) ---------- */
  let coopUn=null, seen=0, pushQ=0, pushing=false, coopRid=null;
  async function coop(){ const C=await ctx(); if(mode!=='world'){ toast(t('on.busy')); return; }
    toast(t('on.coopGo',ON.nmText(R.nm[other()])),true);
    coopRid=R.id; startBattle(null,true,{champ:true,ch:R.ch,coop:{rid:R.id}});
    const f=B&&B.foes[0]; if(!f) return; seen=f.hp; pushQ=0; B.coopTotal=f.max;
    let p=document.getElementById('coopTag'); if(!p){ p=document.createElement('div'); p.id='coopTag'; document.getElementById('battle').appendChild(p); } p.hidden=false; p.textContent='🤝 '+t('on.team',ON.nmText(R.nm[other()]));
    coopUn=C.listen('rooms/'+R.id,r=>{ if(!r||!B||!B.coop) return; const total=B.coopTotal, dealt=Object.values(r.dmg||{}).reduce((a,b)=>a+(b||0),0); const hp=Math.max(0,total-dealt), f=B.foes[0];
      if(hp<f.hp){ f.hp=hp; seen=hp; updBattle(); if(hp<=0){ msg(t('on.teamWin')); if(B.wake) B.wake({t:'teamwin'}); } } }); }
  function coopTick(){ if(!B||!B.coop) return; const f=B.foes[0]; if(!f) return; if(f.hp<seen){ pushQ+=seen-f.hp; seen=f.hp; flush(); } else if(f.hp>seen) seen=f.hp; }
  async function flush(){ if(pushing||!pushQ||!coopRid) return; pushing=true; const n=pushQ, rid=coopRid; pushQ=0; try{ const C=await ctx(); await C.update('rooms/'+rid,{['dmg.'+pid()]:NET.inc(n)}); }catch(e){ pushQ+=n; } pushing=false; if(pushQ) flush(); }
  const _end=endBattle;
  endBattle=function(how){ const wasCoop=B&&B.coop; _end(how); if(wasCoop){ if(coopUn) coopUn(); coopUn=null; const p=document.getElementById('coopTag'); if(p) p.hidden=true;
      if(how==='win'){ S.coins+=30; wkAdd(10,0,0); save(); updHUD(); toast(t('on.coopBonus',30)); } R=null; flush(); setTimeout(()=>{ if(!pushQ&&!pushing) coopRid=null; },8000); } };
  return {invite,incoming,coopTick};
})();
if(ON.avail){ const _tt=toTitle; toTitle=function(){ if(ON.social) ON.social.stop(); const b=document.getElementById('bPals'); if(b) b.hidden=true; _tt(); }; }
