/* ===================== ONLINE: friends, gifts, stickers, leaderboards, groups, house visits ===================== */
if(ON.avail) ON.social=(()=>{
  const GIFTS=[{id:'coins',e:'🪙',n:15},{id:'bread',e:'🍞'},{id:'fish',e:'🐟'},{id:'honey',e:'🍯'}];
  const STK=['🎉','🙏','😊','👍','💪','🌟','❤️','🕊️'];
  const ONLINE_MS=150000;
  let unsub=[], inbox=[], reqs=[], lastPid=null;
  const me=()=>S&&S.cloud&&S.cloud.pid;
  const day=()=>today();
  const ctx=()=>ON.ctxFor(S);
  const giftName=g=>{ const G=GIFTS.find(x=>x.id===g); if(!G) return ''; return G.id==='coins'?t('on.giftCoins',G.n):(ITEMS[G.id]?ITEMS[G.id].name:G.id); };
  const isOnline=p=>p&&p.on&&Date.now()-p.on<ONLINE_MS;
  /* ---------- live badges ---------- */
  function badge(){ const b=document.getElementById('bPals'); if(!b) return; b.hidden=!(ON.on&&S&&S.cloud); const n=inbox.length+reqs.length; let d=b.querySelector('.nbadge'); if(!d){ d=document.createElement('span'); d.className='nbadge'; b.appendChild(d); } d.textContent=n||''; d.hidden=!n; const mb=document.getElementById('bMenu'); if(mb){ let e=mb.querySelector('.nbadge'); if(!e){ e=document.createElement('span'); e.className='nbadge'; mb.appendChild(e); } e.textContent=n||''; e.hidden=!n||!(ON.on&&S&&S.cloud); } }
  async function start(){ stop(); badge(); if(!ON.on||!S||!S.cloud) return; const pid=me(); lastPid=pid; const C=await ctx(); if(!C) return;
    unsub.push(C.listen('players/'+pid+'/inbox',v=>{ inbox=v||[]; badge(); if(document.getElementById('palsBox')&&palsTab==='g') renderTab(); }));
    unsub.push(C.listen('players/'+pid+'/friends',v=>{ const was=reqs.length; reqs=(v||[]).filter(x=>x.data.s==='asked'); badge(); if(reqs.length>was&&was>=0&&!document.getElementById('palsBox')) toast(t('on.reqNew')); },[['s','==','asked']]));
    unsub.push(C.listen('players/'+pid+'/invites',v=>{ (v||[]).forEach(x=>{ if(ON.live&&Date.now()-(x.data.at||0)<180000) ON.live.incoming(x); }); })); }
  function stop(){ unsub.forEach(f=>{ try{ f(); }catch(e){} }); unsub=[]; inbox=[]; reqs=[]; }
  /* ---------- friends ---------- */
  async function loadFriends(){ const C=await ctx(); const pid=me(); const rows=await C.query('players/'+pid+'/friends');
    const out=[]; for(const r of rows){ let p=null; try{ p=await C.get('players/'+r.id); }catch(e){} out.push({id:r.id,s:r.data.s,p}); } return out; }
  function avatar(look,sz){ const c=document.createElement('canvas'); c.width=sz; c.height=sz*1.15; const x=c.getContext('2d'); if(look) drawPerson(x,sz/2,sz*1.12,sz,look,{dir:'down'}); return c; }
  let palsTab='f', cache=null;
  function openPals(tab){ if(!S||!S.cloud) return; palsTab=tab||palsTab; cache=null;
    openModal(t('on.pals'),`<div class="tabs" id="palsTabs">${[['f',t('on.tFriends')],['g',t('on.tGifts')],['b',t('on.tBoard')],['c',t('on.tGroups')],['a',t('on.tAdd')]].map(([k,l])=>`<button data-tab="${k}">${esc(l)}</button>`).join('')}</div><div id="palsBox"><p>${esc(t('on.loading'))}</p></div>`,
      m=>{ m.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ palsTab=b.dataset.tab; renderTab(); }); renderTab(); }); }
  async function renderTab(){ const box=document.getElementById('palsBox'); if(!box) return; document.querySelectorAll('#palsTabs [data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===palsTab));
    const k=palsTab; try{ if(k==='f') await tabFriends(box); else if(k==='g') tabGifts(box); else if(k==='b') await tabBoard(box); else if(k==='c') await tabGroups(box); else tabAdd(box); }catch(e){ console.warn(e); if(palsTab===k) box.innerHTML=`<p>${esc(ON.errText(e))}</p>`; } }
  async function tabFriends(box){ box.innerHTML=`<p>${esc(t('on.loading'))}</p>`; const fr=cache||(cache=await loadFriends()); if(palsTab!=='f') return;
    const asked=fr.filter(f=>f.s==='asked'), friends=fr.filter(f=>f.s==='friends'&&f.p), pend=fr.filter(f=>f.s==='pending');
    const sent=(S.gifted&&S.gifted[day()])||{};
    box.innerHTML=(asked.length?`<div class="sect">${esc(t('on.reqs'))}</div>`+asked.map(f=>`<div class="row"><div class="big">${ON.nmEmo(f.p&&f.p.nm)}</div><div class="grow"><h4>${esc(ON.nmText(f.p&&f.p.nm))}</h4><p>${esc(t('on.wantsFriend'))}</p></div><button class="btn sm gold" data-acc="${f.id}">${esc(t('on.accept'))}</button><button class="btn sm ghost" data-rm="${f.id}">${esc(t('on.decline'))}</button></div>`).join(''):'')
      +(friends.length?`<div class="cards pals">${friends.map(f=>{ const p=f.p, on=isOnline(p); return `<div class="card pal" data-f="${f.id}"><div class="av"></div><b>${esc(ON.nmText(p.nm))}</b><small>${esc(t('title.lv',p.lvl||1,p.frags||0,NCH))}</small><small class="${on?'live':''}">${on?'● '+esc(t('on.isOnline')):(COMPS[p.comp]?COMPS[p.comp].e:'')}</small>
          <div class="pact"><button class="btn sm" data-gift="${f.id}" ${sent[f.id]?'disabled':''} title="${esc(t('on.gift'))}">🎁</button><button class="btn sm" data-stk="${f.id}" title="${esc(t('on.sticker'))}">💬</button><button class="btn sm" data-visit="${f.id}" title="${esc(t('on.visit'))}">🏠</button>
          <button class="btn sm" data-duel="${f.id}" ${on?'':'disabled'} title="${esc(t('on.duel'))}">⚔️</button><button class="btn sm" data-coop="${f.id}" ${on?'':'disabled'} title="${esc(t('on.coop'))}">🤝</button><button class="btn sm ghost" data-rm="${f.id}" title="${esc(t('on.remove'))}">✕</button></div></div>`; }).join('')}</div>`
        :`<p>${esc(t('on.noFriends'))}</p><button class="btn gold" data-goadd>${esc(t('on.tAdd'))}</button>`)
      +(pend.length?`<div class="sect">${esc(t('on.waiting'))}</div>`+pend.map(f=>`<div class="row"><div class="big">${ON.nmEmo(f.p&&f.p.nm)}</div><div class="grow"><h4>${esc(ON.nmText(f.p&&f.p.nm))}</h4><p>${esc(t('on.waitingP'))}</p></div><button class="btn sm ghost" data-rm="${f.id}">✕</button></div>`).join(''):'');
    box.querySelectorAll('.card.pal').forEach(c=>{ const f=friends.find(x=>x.id===c.dataset.f); c.querySelector('.av').appendChild(avatar(f.p.look,64)); });
    const q=s=>box.querySelectorAll(s);
    q('[data-acc]').forEach(b=>b.onclick=()=>accept(b.dataset.acc)); q('[data-rm]').forEach(b=>b.onclick=()=>removeFriend(b.dataset.rm,fr.find(x=>x.id===b.dataset.rm)));
    q('[data-gift]').forEach(b=>b.onclick=()=>giftUI(friends.find(x=>x.id===b.dataset.gift))); q('[data-stk]').forEach(b=>b.onclick=()=>stickerUI(friends.find(x=>x.id===b.dataset.stk)));
    q('[data-visit]').forEach(b=>b.onclick=()=>visit(friends.find(x=>x.id===b.dataset.visit)));
    q('[data-duel]').forEach(b=>b.onclick=()=>ON.live&&ON.live.invite(friends.find(x=>x.id===b.dataset.duel),'duel'));
    q('[data-coop]').forEach(b=>b.onclick=()=>ON.live&&ON.live.invite(friends.find(x=>x.id===b.dataset.coop),'coop'));
    const ga=box.querySelector('[data-goadd]'); if(ga) ga.onclick=()=>{ palsTab='a'; renderTab(); }; }
  async function accept(fid){ const C=await ctx(), pid=me(); try{ await C.batch([{op:'update',path:'players/'+pid+'/friends/'+fid,data:{s:'friends',at:NET.now}},{op:'update',path:'players/'+fid+'/friends/'+pid,data:{s:'friends',at:NET.now}}]); SFX.coin(); toast(t('on.nowFriends')); cache=null; renderTab(); }catch(e){ toast(ON.errText(e)); } }
  function removeFriend(fid,f){ const nm=f&&f.p?ON.nmText(f.p.nm):'';
    openModal(t('on.remove'),`<p>${esc(t('on.removeP',nm))}</p><div style="display:flex;gap:8px"><button class="btn gold" id="rmY">${esc(t('on.remove'))}</button><button class="btn ghost" id="rmN">${esc(t('create.back'))}</button></div>`,
      m=>{ m.querySelector('#rmN').onclick=()=>openPals('f'); m.querySelector('#rmY').onclick=async()=>{ const C=await ctx(), pid=me(); try{ await C.batch([{op:'del',path:'players/'+pid+'/friends/'+fid},{op:'del',path:'players/'+fid+'/friends/'+pid}]); }catch(e){ toast(ON.errText(e)); } openPals('f'); }; }); }
  function tabAdd(box){ box.innerHTML=`<p>${esc(t('on.myCodeP'))}</p><div class="code big">${esc(S.cloud.code||'')}</div>
      <div class="sect">${esc(t('on.addT'))}</div><p>${esc(t('on.addP'))}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="fcIn" maxlength="10" autocomplete="off" placeholder="ABCD-1234" style="font-size:1.2rem;letter-spacing:.1em;text-transform:uppercase;width:9em"><button class="btn gold" id="fcGo">${esc(t('on.addBtn'))}</button></div><p id="fcMsg" style="font-weight:800"></p>`;
    const go=async()=>{ const raw=box.querySelector('#fcIn').value.toUpperCase().replace(/[^A-Z0-9]/g,''); const code=raw.slice(0,4)+'-'+raw.slice(4); const msg=box.querySelector('#fcMsg'); if(raw.length!==8){ msg.textContent=t('on.codeBadF'); return; }
      try{ const C=await ctx(), pid=me(); const c=await C.get('codes/'+code); if(!c){ msg.textContent=t('on.codeBadF'); return; } if(c.pid===pid){ msg.textContent=t('on.codeSelf'); return; }
        const ex=await C.get('players/'+pid+'/friends/'+c.pid); if(ex){ msg.textContent=ex.s==='friends'?t('on.already'):t('on.waitingP'); return; }
        await C.batch([{op:'set',path:'players/'+pid+'/friends/'+c.pid,data:{s:'pending',at:NET.now}},{op:'set',path:'players/'+c.pid+'/friends/'+pid,data:{s:'asked',at:NET.now}}]);
        const p=await C.get('players/'+c.pid); msg.textContent=t('on.reqSent',ON.nmText(p&&p.nm)); box.querySelector('#fcIn').value=''; cache=null; SFX.coin();
      }catch(e){ msg.textContent=ON.errText(e); } };
    box.querySelector('#fcGo').onclick=go; box.querySelector('#fcIn').onkeydown=e=>{ if(e.key==='Enter') go(); }; }
  /* ---------- gifts + stickers ---------- */
  function giftUI(f){ if(!f) return; openModal(t('on.gift'),`<p>${esc(t('on.giftP',ON.nmText(f.p.nm)))}</p><div class="cards">${GIFTS.map(g=>`<button class="card" data-g="${g.id}"><div class="emo">${g.e}</div><b>${esc(giftName(g.id))}</b></button>`).join('')}</div>
      <div class="sect">${esc(t('on.addSticker'))}</div><div class="emogrid" id="gStk">${STK.map((e,i)=>`<button data-k="${i}" title="${esc(t('stk.'+i))}">${e}</button>`).join('')}</div>`,
    m=>{ let k=-1; m.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{ k=+b.dataset.k; m.querySelectorAll('[data-k]').forEach(x=>x.classList.toggle('on',x===b)); });
      m.querySelectorAll('[data-g]').forEach(b=>b.onclick=async()=>{ b.disabled=true; try{ await send(f.id,b.dataset.g,k); S.gifted=S.gifted||{}; const d=day(); for(const x in S.gifted) if(x!==d) delete S.gifted[x]; (S.gifted[d]=S.gifted[d]||{})[f.id]=1; save(); SFX.coin(); toast(t('on.giftSent',ON.nmText(f.p.nm))); openPals('f'); }catch(e){ b.disabled=false; toast(/exists|permission/i.test(String(e.code||e.message))?t('on.giftOnce'):ON.errText(e)); } }); }); }
  function stickerUI(f,thanks){ if(!f) return; openModal(t('on.sticker'),`<p>${esc(t('on.stickerP',ON.nmText(f.p.nm)))}</p><div class="cards">${STK.map((e,i)=>`<button class="card" data-k="${i}"><div class="emo">${e}</div><small>${esc(t('stk.'+i))}</small></button>`).join('')}</div>`,
    m=>m.querySelectorAll('[data-k]').forEach(b=>b.onclick=async()=>{ try{ await send(f.id,'',+b.dataset.k); toast(t('on.stkSent')); }catch(e){ toast(/exists|permission/i.test(String(e.code||e.message))?t('on.stkLimit'):ON.errText(e)); } openPals(thanks?'g':'f'); })); }
  async function send(to,g,k){ const C=await ctx(), pid=me(), d=day();
    // the rules only allow creating these documents, so writing one that already exists is refused
    if(g) return C.set('players/'+to+'/inbox/'+pid+'_'+d,{from:pid,nm:S.cloud.nm,g,k:k>=0?k:-1,d,at:NET.now});
    return sendSticker(to,{k}); }
  async function sendSticker(to,extra){ const C=await ctx(), pid=me(), d=day(); S.stk=S.stk||{}; if(S.stk.d!==d) S.stk={d}; let n=S.stk[to]||0, last=null;
    for(;n<3;n++){ try{ await C.set('players/'+to+'/inbox/'+pid+'_'+d+'_s'+n,Object.assign({from:pid,nm:S.cloud.nm,g:'',d,at:NET.now},extra)); S.stk[to]=n+1; return; }catch(e){ last=e; } }
    S.stk[to]=3; throw Object.assign(new Error('exists'),{code:'exists'}); }
  function tabGifts(box){ const list=inbox.slice().sort((a,b)=>(b.data.at||0)-(a.data.at||0));
    box.innerHTML=list.length?list.map(x=>{ const d=x.data; const G=GIFTS.find(g=>g.id===d.g); return `<div class="row"><div class="big">${G?G.e:(STK[d.k]||'💌')}</div><div class="grow"><h4>${esc(ON.nmText(d.nm))}</h4><p>${G?esc(giftName(d.g)):''}${d.k>=0?(G?' · ':'')+STK[d.k]+' '+esc(t('stk.'+d.k)):''}${d.h?' · 🏠':''}</p></div><button class="btn sm gold" data-open="${x.id}">${esc(G?t('on.open'):t('on.ok'))}</button></div>`; }).join('')
      :`<p>${esc(t('on.noGifts'))}</p>`;
    box.querySelectorAll('[data-open]').forEach(b=>b.onclick=async()=>{ const x=inbox.find(i=>i.id===b.dataset.open); if(!x) return; b.disabled=true; const d=x.data, G=GIFTS.find(g=>g.id===d.g);
      try{ const C=await ctx(); await C.del('players/'+me()+'/inbox/'+x.id); inbox=inbox.filter(i=>i!==x); badge();
        if(G){ if(G.id==='coins') S.coins+=G.n; else S.items[G.id]=(S.items[G.id]||0)+1; save(); updHUD(); SFX.coin(); toast(t('on.gotGift',giftName(G.id))); }
        if(G) openModal(t('on.thankT'),`<p>${esc(t('on.thankP',ON.nmText(d.nm)))}</p><div style="display:flex;gap:8px"><button class="btn gold" id="tkY">❤️ ${esc(t('stk.6'))}</button><button class="btn ghost" id="tkN">${esc(t('create.back'))}</button></div>`,
          m=>{ m.querySelector('#tkN').onclick=()=>openPals('g'); m.querySelector('#tkY').onclick=async()=>{ try{ await send(d.from,'',6); toast(t('on.stkSent')); }catch(e){} openPals('g'); }; });
        else renderTab(); }catch(e){ b.disabled=false; toast(ON.errText(e)); } }); }
  /* ---------- weekly leaderboard ---------- */
  function boardRows(list){ const w=ON.week(); return list.map(p=>({p,wk:p.p&&p.p.wk&&p.p.wk.w===w?p.p.wk:{p:0,r:0,v:0}})).sort((a,b)=>b.wk.p-a.wk.p); }
  async function tabBoard(box){ box.innerHTML=`<p>${esc(t('on.loading'))}</p>`; const fr=cache||(cache=await loadFriends()); if(palsTab!=='b') return;
    const mine={id:me(),me:1,p:{nm:S.cloud.nm,wk:S.wk&&S.wk.w===ON.week()?S.wk:{p:0,r:0,v:0},look:S.look}}; const rows=boardRows([mine].concat(fr.filter(f=>f.s==='friends'&&f.p)));
    box.innerHTML=`<p>${esc(t('on.boardP'))}</p><table class="board"><tr><th>#</th><th></th><th>⭐</th><th>✔</th><th>📜</th></tr>${rows.map((r,i)=>`<tr class="${r.p.me?'me':''}"><td>${i+1}</td><td>${ON.nmEmo(r.p.p.nm)} ${esc(ON.nmText(r.p.p.nm))}</td><td>${r.wk.p||0}</td><td>${r.wk.r||0}</td><td>${r.wk.v||0}</td></tr>`).join('')}</table><p style="color:var(--muted);font-size:.85rem">${esc(t('on.boardKey'))}</p>`+towerBoard([mine].concat(fr.filter(f=>f.s==='friends'&&f.p))); }
  function towerBoard(list){ const myTw=S.land&&S.land.tw&&S.land.tw.best||0; const rows=list.map(r=>({r,tw:r.me?myTw:(r.p.tw||0)})).filter(x=>x.tw>0).sort((a,b)=>b.tw-a.tw); if(!rows.length) return '';
    return `<div class="sect">${esc(t('tw.board'))}</div><table class="board">${rows.map((x,i)=>`<tr class="${x.r.me?'me':''}"><td>${i+1}</td><td>${ON.nmEmo(x.r.p.nm)} ${esc(ON.nmText(x.r.p.nm))}</td><td>🪜 ${x.tw}</td></tr>`).join('')}</table>`; }
  /* ---------- groups ---------- */
  async function tabGroups(box){ box.innerHTML=`<p>${esc(t('on.loading'))}</p>`; const C=await ctx(); const gs=S.cloud.groups||[]; const out=[];
    for(const g of gs){ try{ const d=await C.get('groups/'+g); if(d) out.push({id:g,d}); }catch(e){} } if(palsTab!=='c') return;
    box.innerHTML=(out.length?out.map(g=>`<div class="row"><div class="big">${ON.WD[g.d.nm[1]]}${ON.AN[g.d.nm[0]]}</div><div class="grow"><h4>${esc(groupName(g.d.nm))}</h4><p>${esc(t('on.groupCode'))}: <b>${esc(g.id)}</b></p></div><button class="btn sm gold" data-g="${g.id}">${esc(t('on.open'))}</button></div>`).join(''):`<p>${esc(t('on.noGroups'))}</p>`)
      +`<div class="sect">${esc(t('on.joinT'))}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="gIn" maxlength="7" autocomplete="off" placeholder="GRP123" style="font-size:1.2rem;letter-spacing:.1em;text-transform:uppercase;width:8em"><button class="btn gold" id="gJoin">${esc(t('on.join'))}</button><button class="btn ghost" id="gNew">${esc(t('on.groupNew'))}</button></div><p id="gMsg" style="font-weight:800"></p>`;
    box.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>openGroup(b.dataset.g));
    box.querySelector('#gJoin').onclick=async()=>{ const code=box.querySelector('#gIn').value.toUpperCase().replace(/[^A-Z0-9]/g,''); const msg=box.querySelector('#gMsg'); if(code.length!==6){ msg.textContent=t('on.codeBadG'); return; }
      try{ const d=await C.get('groups/'+code); if(!d){ msg.textContent=t('on.codeBadG'); return; } await joinGroup(code); openGroup(code); }catch(e){ msg.textContent=ON.errText(e); } };
    box.querySelector('#gNew').onclick=()=>ON.gate(createGroup,()=>openPals('c')); }
  const groupName=nm=>String(t('nm.gfmt')).replace('{a}',(t('nm.a')||[])[nm[0]]||'').replace('{w}',(t('nm.w')||[])[nm[1]]||'');
  async function joinGroup(code){ const C=await ctx(); S.cloud.groups=S.cloud.groups||[]; if(S.cloud.groups.length>=3&&!S.cloud.groups.includes(code)) throw new Error(t('on.groupMax'));
    await C.set('groups/'+code+'/members/'+me(),memberDoc(),true); if(!S.cloud.groups.includes(code)) S.cloud.groups.push(code); save(); }
  function memberDoc(){ const w=ON.week(); return {nm:S.cloud.nm,look:S.look,wk:S.wk&&S.wk.w===w?S.wk:{w,p:0,r:0,v:0},at:NET.now}; }
  function createGroup(){ const nm=[0,0];
    openModal(t('on.groupNew'),`<p>${esc(t('on.groupNewP'))}</p><div class="nmprev"><span id="gE"></span><b id="gT"></b></div><div class="sect">${esc(t('on.nameW'))}</div><div class="emogrid">${ON.WD.map((e,i)=>`<button data-w="${i}">${e}</button>`).join('')}</div>
      <div class="sect">${esc(t('on.nameA'))}</div><div class="emogrid">${ON.AN.map((e,i)=>`<button data-a="${i}">${e}</button>`).join('')}</div><button class="btn gold" id="gMk" style="margin-top:10px">${esc(t('on.groupMake'))}</button>`,
      m=>{ const draw=()=>{ m.querySelector('#gE').textContent=ON.WD[nm[1]]+ON.AN[nm[0]]; m.querySelector('#gT').textContent=groupName(nm); m.querySelectorAll('[data-a]').forEach(b=>b.classList.toggle('on',+b.dataset.a===nm[0])); m.querySelectorAll('[data-w]').forEach(b=>b.classList.toggle('on',+b.dataset.w===nm[1])); };
        m.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ nm[0]=+b.dataset.a; draw(); }); m.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{ nm[1]=+b.dataset.w; draw(); }); draw();
        m.querySelector('#gMk').onclick=async()=>{ try{ const C=await ctx(); const L='BCDFGHJKLMNPQRSTVWXZ23456789'; let code=''; for(let i=0;i<6;i++){ code=Array.from({length:6},()=>L[Math.floor(Math.random()*L.length)]).join(''); if(!(await C.get('groups/'+code))) break; }
            await C.set('groups/'+code,{nm,owner:S.cloud.fid,goal:300,created:NET.now}); await joinGroup(code); openGroup(code); }catch(e){ toast(ON.errText(e)); } }; }); }
  async function openGroup(code){ const C=await ctx(); let g, mem; try{ g=await C.get('groups/'+code); mem=await C.query('groups/'+code+'/members'); }catch(e){ toast(ON.errText(e)); return; } if(!g) return;
    const w=ON.week(); const rows=mem.map(x=>({id:x.id,d:x.data,wk:x.data.wk&&x.data.wk.w===w?x.data.wk:{p:0,r:0,v:0}})); const mine=rows.find(r=>r.id===me()); if(mine) mine.wk=S.wk&&S.wk.w===w?S.wk:mine.wk;
    rows.sort((a,b)=>b.wk.p-a.wk.p); const total=rows.reduce((a,r)=>a+(r.wk.r||0),0), goal=g.goal||300, done=total>=goal; const claimed=S.grw&&S.grw[code+w];
    openModal(groupName(g.nm),`<p>${esc(t('on.groupCode'))}: <b class="code">${esc(code)}</b> · ${esc(t('on.groupShare'))}</p>
      <div class="sect">${esc(t('on.challenge'))}</div><p>${esc(t('on.challengeP',goal))}</p><div class="bar"><i style="width:${Math.min(100,total/goal*100)}%"></i></div><p><b>${total} / ${goal}</b> ${done?(claimed?'✓ '+esc(t('on.claimed')):`<button class="btn sm gold" id="gClaim">${esc(t('on.claim',100))}</button>`):''}</p>
      <div class="sect">${esc(t('on.tBoard'))}</div><table class="board"><tr><th>#</th><th></th><th>⭐</th><th>✔</th><th>📜</th></tr>${rows.map((r,i)=>`<tr class="${r.id===me()?'me':''}"><td>${i+1}</td><td>${ON.nmEmo(r.d.nm)} ${esc(ON.nmText(r.d.nm))}</td><td>${r.wk.p||0}</td><td>${r.wk.r||0}</td><td>${r.wk.v||0}</td></tr>`).join('')}</table>
      <div style="display:flex;gap:8px;margin-top:10px"><button class="btn ghost" id="gBack">${esc(t('create.back'))}</button><button class="btn ghost" id="gLeave">${esc(t('on.leave'))}</button></div>`,
      m=>{ m.querySelector('#gBack').onclick=()=>openPals('c'); const cl=m.querySelector('#gClaim'); if(cl) cl.onclick=()=>{ S.grw=S.grw||{}; S.grw[code+w]=1; S.coins+=100; save(); updHUD(); SFX.win&&SFX.win(); toast(t('on.claimedT',100)); openGroup(code); };
        m.querySelector('#gLeave').onclick=async()=>{ try{ await C.del('groups/'+code+'/members/'+me()); }catch(e){} S.cloud.groups=(S.cloud.groups||[]).filter(x=>x!==code); save(); openPals('c'); }; }); }
  function extraOps(st){ return (st.cloud.groups||[]).map(g=>({op:'set',path:'groups/'+g+'/members/'+st.cloud.pid,data:{nm:st.cloud.nm,look:st.look,wk:st.wk&&st.wk.w===ON.week()?st.wk:{w:ON.week(),p:0,r:0,v:0},at:NET.now},merge:true})); }
  /* ---------- house visits ---------- */
  async function visit(f){ if(!f||!f.p) return; let p=f.p; try{ const C=await ctx(); p=await C.get('players/'+f.id)||p; }catch(e){}
    const items=(p.house||[]).filter(i=>i&&FURN_OK(i.id)); closeModal();
    if(!R3.ok){ openModal(t('on.visitT',ON.nmText(p.nm)),items.length?items.map(i=>`<div class="row"><div class="grow"><h4>${esc(t('furn.'+i.id))}</h4></div></div>`).join(''):`<p>${esc(t('on.emptyHouse'))}</p>`); return; }
    window.HOUSE_VIEW={items:items.map(i=>({id:i.id,x:i.x,z:i.z,rot:i.rot||0})),inv:{},got:[],init:1}; document.body.classList.add('visiting'); visiting=f;
    const hb=document.querySelector('#hbar .hhead b'); if(hb){ hb.dataset.own=hb.textContent; hb.textContent=t('on.visitT',ON.nmText(p.nm)); }
    let sb=document.getElementById('hSticker'); if(!sb){ sb=document.createElement('button'); sb.id='hSticker'; sb.className='btn sm gold'; document.querySelector('#hbar .hhead').insertBefore(sb,document.getElementById('hLeave')); } sb.hidden=false; sb.textContent='💬 '+t('on.leaveSticker');
    sb.onclick=()=>{ const fr=visiting; stickerHouse(fr); };
    openHouse(); }
  let visiting=null;
  const FURN_OK=id=>typeof id==='string'&&id.length<24;
  function stickerHouse(f){ const box=document.createElement('div'); box.className='stkpop'; box.innerHTML=STK.map((e,i)=>`<button data-k="${i}">${e}</button>`).join(''); document.getElementById('hbar').appendChild(box);
    box.querySelectorAll('[data-k]').forEach(b=>b.onclick=async()=>{ box.remove(); try{ await sendSticker(f.id,{k:+b.dataset.k,h:1}); toast(t('on.stkSent')); }catch(e){ toast(/exists|permission/i.test(String(e.code||e.message))?t('on.stkLimit'):ON.errText(e)); } }); }
  const _leave=leaveHouse;
  leaveHouse=function(silent){ _leave(silent); if(window.HOUSE_VIEW){ window.HOUSE_VIEW=null; visiting=null; document.body.classList.remove('visiting'); const hb=document.querySelector('#hbar .hhead b'); if(hb&&hb.dataset.own) hb.textContent=hb.dataset.own; const sb=document.getElementById('hSticker'); if(sb) sb.hidden=true; } };
  const bp=document.getElementById('bPals'); if(bp) bp.onclick=()=>{ ac(); if(modalOpen||dialogOpen) return; openPals(); };
  return {start,stop,openPals,extraOps,badge,send,GIFTS,STK};
})();
