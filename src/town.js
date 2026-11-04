/* ===================== PILGRIM'S REST GROWS: THE NEW QUARTER ===================== */
/* Resources come from the Land, the islands and the Tower; buildings are paid for with them (plus a few shekels from level 2).
   State lives in S.town only; while you are in the quarter the save still says 'hub' (see M.ext). */
const RES={wood:'🪵',stone:'🪨',wool:'🧶',fish:'🐟',oil:'🫒'};
const TB=[
  {id:'well',e:'⛲',k:'fountain',w:2,h:2,cost:{stone:20}},
  {id:'bakery',e:'🍞',k:'house',awn:'#c0703a',cost:{wood:15,stone:10}},
  {id:'workshop',e:'🔨',k:'barn',cost:{wood:20}},
  {id:'pen',e:'🐑',k:'farmhouse',cost:{wood:15,wool:10}},
  {id:'school',e:'📖',k:'tent',cost:{stone:20,oil:10}},
  {id:'market',e:'⚖️',k:'house',awn:'#7b3fa0',cost:{wood:25,stone:25}},
  {id:'guest',e:'🛏️',k:'home',awn:'#2f8f8a',cost:{wood:30,wool:10,fish:10}},
  {id:'lighthouse',e:'🗼',k:'granary',cost:{stone:30,oil:20}}];
const TBI=Object.fromEntries(TB.map(b=>[b.id,b]));
const CRAFT=[{id:'stool',lv:1,c:{wood:5}},{id:'basket',lv:1,c:{wood:3,wool:2}},{id:'bench',lv:1,c:{wood:8}},{id:'table',lv:1,c:{wood:10}},
  {id:'shelf',lv:2,c:{wood:8,stone:4}},{id:'chest',lv:2,c:{wood:10}},{id:'jars',lv:2,c:{stone:6}},{id:'lamp',lv:2,c:{stone:4,oil:2}},
  {id:'bed',lv:3,c:{wood:15,wool:6}},{id:'rug',lv:3,c:{wool:10}},{id:'plant',lv:3,c:{stone:4,wood:2}}];
const FEMO={stool:'🪑',basket:'🧺',bench:'🪵',table:'🍽️',shelf:'📚',chest:'🧰',jars:'🏺',lamp:'🪔',bed:'🛏️',rug:'🟫',plant:'🪴'};
const SELL={wood:2,stone:2,wool:3,fish:3,oil:6};
function TS_(){ const T_=S.town||(S.town={}); T_.lv=T_.lv||{}; T_.res=T_.res||{}; return T_; }
const tLv=id=>S&&S.town&&S.town.lv&&S.town.lv[id]||0;
const townLevel=()=>S&&S.town&&S.town.lv?Object.values(S.town.lv).reduce((a,b)=>a+b,0):0;
const townTitle=()=>{ const n=townLevel(); return t(n>=18?'tn.t3':n>=10?'tn.t2':n>=4?'tn.t1':'tn.t0'); };
function townHP(){ const l=tLv('well'); return l>=3?30:l>=2?15:0; }
function pracCoin(){ return 3+tLv('school')*2; }
function resAdd(k,n,quiet){ const T_=TS_(); T_.res[k]=(T_.res[k]||0)+n; if(!quiet){ SFX.coin(); toast(`+${n} ${RES[k]} ${t('tn.r.'+k)}`); } }
const resHave=c=>Object.entries(c).every(([k,n])=>k==='coins'?S.coins>=n:(TS_().res[k]||0)>=n);
const resPay=c=>{ for(const [k,n] of Object.entries(c)){ if(k==='coins') S.coins-=n; else TS_().res[k]-=n; } };
const costTxt=c=>Object.entries(c).map(([k,n])=>k==='coins'?`🪙 ${n}`:`${RES[k]} ${n}`).join('  ');
const resLine=()=>Object.keys(RES).map(k=>`${RES[k]} ${TS_().res[k]||0}`).join('  ');
function bCost(b,lv){ const m=lv===1?1:lv===2?2:3; const c={}; for(const k in b.cost) c[k]=b.cost[k]*m; if(lv>1) c.coins=lv===2?100:250; return c; }

/* ---- the quarter's map ---- */
const PLOTS=[[4,3],[13,3],[22,3],[31,3],[4,12],[13,12],[22,12],[31,12]];
function xTown(id){ const R=CH[id], W=R.w, H=R.h, tt=new Uint8Array(W*H).fill(T.G), rnd=mulberry32(R.seed);
  const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H, get=(x,y)=>inb(x,y)?tt[y*W+x]:T.B, set=(x,y,v)=>{ if(inb(x,y)) tt[y*W+x]=v; };
  const m={id,W,H,t:tt,R,th:R.th,ents:[],foes:[],lms:[],items:[],get,set,xland:1};
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ if(x<2||y<2||x>=W-2||y>=H-2) set(x,y,T.B); else if(rnd()<.1) set(x,y,T.D); }
  for(let x=2;x<W-2;x++){ set(x,9,T.P); set(x,18,T.P); } for(let y=9;y<=18;y++){ set(2,y,T.P); set(W-3,y,T.P); set(20,y,T.P); }
  const T_=TS_(); m.spawn={x:3,y:9}; m.ext={hx:HUBX.town.x,hy:HUBX.town.y}; m.wx='sun';
  m.ents.push({kind:'exit',x:2,y:10});
  TB.forEach((b,i)=>{ const [px,py]=PLOTS[i], lv=T_.lv[b.id]||0, fx=px+2, fy=py+4;
    for(let y=py;y<py+4;y++) for(let x=px;x<px+5;x++) set(x,y,lv?T.G:T.P);
    if(lv){ const bw=b.w||5, bh=b.h||4, lx=px+Math.floor((5-bw)/2), ly=py+(4-bh); m.lms.push({k:b.k,x:lx,y:ly,w:bw,h:bh,sign:'tn.b.'+b.id,awn:b.awn}); for(let y=ly;y<ly+bh;y++) for(let x=lx;x<lx+bw;x++) set(x,y,T.L); }
    set(fx,fy,T.G); spot(m,{x:fx,y:fy},{e:lv?b.e:'🏗️',still:1,glow:!lv?false:undefined,label:lv?`${t('tn.b.'+b.id)} ${'★'.repeat(lv)}`:t('tn.plot'),act:lv?t('tn.open',t('tn.b.'+b.id)):t('tn.build'),on:()=>bMenu(b)}); });
  spot(m,{x:10,y:8},{e:'📋',still:1,label:t('tn.board'),act:t('tn.boardGo'),on:boardMenu});
  if(tLv('well')) spot(m,{x:7,y:20},{e:'💧',still:1,label:t('tn.drink'),act:t('tn.drinkGo'),on:()=>{ S.hp=maxHP(); SFX.heal(); updHUD(); toast(t('tn.drunk')); }});
  const vs=villagers(); vs.forEach((v,i)=>{ const x=6+i*4, y=i%2?17:10; m.ents.push({kind:'npc',role:'flavor',x,y,name:v.name,look:v.look,lk:'vl.'+v.line,lines:['…']}); });
  m.reach=[]; m.xm={exitL:t('x.toRest'),back:()=>{ flash(); enterMap('hub',HUBX.town); }, quest:()=>`🏘️ ${townTitle()} · ${resLine()}`};
  return m; }
function villagers(){ const done=XS().done||0, n=Math.min(Math.floor(done/3),tLv('guest')*2); const out=[];
  for(let i=0;i<n;i++){ const r=xr('vill',S.id||'',i); const tv=Math.floor(r()*TVN.length), lk2=TVLOOK[Math.floor(r()*TVLOOK.length)];
    out.push({name:t('tv.'+TVN[tv]),look:lk({skin:SK[lk2[0]],hair:lk2[1],robe:lk2[2],sash:lk2[3]},lk2[4]),line:Math.floor(r()*8)}); } return out; }

/* ---- daily produce, collected when you walk into the quarter ---- */
function townMorning(){ const T_=TS_(); if(T_.day===xday()) return; T_.day=xday(); const got=[];
  const b=tLv('bakery'); if(b){ addItem('bread',b>=2?2:1); got.push('🍞 ×'+(b>=2?2:1)); if(b>=3){ addItem('honey',1); got.push('🍯 ×1'); } }
  const p=tLv('pen'); if(p){ const xp=[0,10,25,50][p]; const tm=team(); let n=0; for(const k in S.comps){ if(tm.includes(k)||!COMPS[k]) continue; const cs=S.comps[k]; cs.xp+=xp; while(cs.xp>=40+cs.lvl*30){ cs.xp-=40+cs.lvl*30; cs.lvl++; } n++; } if(n) got.push(t('tn.penGot',n,xp)); }
  villagers().forEach((v,i)=>{ const r=xr('gift',xday(),i); const k=Object.keys(RES)[Math.floor(r()*4)]; resAdd(k,2,true); got.push(`${v.name}: ${RES[k]} 2`); });
  save(); if(got.length) setTimeout(()=>openModal(t('tn.morning'),`<p>${esc(t('tn.morningP'))}</p>${got.map(g=>`<div class="row"><div class="grow"><h4>${esc(g)}</h4></div></div>`).join('')}`),400); }

/* ---- menus ---- */
function boardMenu(){ const T_=TS_();
  openModal(t('tn.board'),`<p><b>${esc(t('tn.lvl',townLevel(),townTitle()))}</b></p><div class="sect">${esc(t('tn.res'))}</div><div class="cards">${Object.keys(RES).map(k=>`<div class="card"><div class="emo">${RES[k]}</div><b>${T_.res[k]||0}</b><small>${esc(t('tn.r.'+k))}</small><small>${esc(t('tn.from.'+k))}</small></div>`).join('')}</div>
    <div class="sect">${esc(t('tn.blds'))}</div>${TB.map(b=>`<div class="row"><div class="big">${b.e}</div><div class="grow"><h4>${esc(t('tn.b.'+b.id))} ${'★'.repeat(tLv(b.id))||'—'}</h4><p>${esc(t('tn.d.'+b.id))}</p></div></div>`).join('')}`); }
function bMenu(b){ const lv=tLv(b.id), need=b.id!=='well'&&!tLv('well');
  const render=box=>{ const lv2=tLv(b.id), nx=lv2+1, c=nx<=3?bCost(b,nx):null, can=c&&!need&&resHave(c);
    let extra='';
    if(lv2&&b.id==='workshop') extra=`<div class="sect">${esc(t('tn.craft'))}</div><div class="cards">${CRAFT.map(f=>{ const ok=f.lv<=lv2; return `<button class="card" data-cr="${f.id}" ${ok&&resHave(f.c)?'':'disabled'}><div class="emo">${FEMO[f.id]}</div><b>${esc(t('furn.'+f.id))}</b><small>${ok?esc(costTxt(f.c)):esc(t('tn.needLv',f.lv))}</small></button>`; }).join('')}</div>`;
    if(lv2&&b.id==='market'){ const k=1+(lv2-1)*.5; extra=`<div class="sect">${esc(t('tn.sell'))}</div><div class="cards">${Object.keys(RES).map(r=>`<button class="card" data-sell="${r}" ${(TS_().res[r]||0)>=5?'':'disabled'}><div class="emo">${RES[r]}</div><b>5 → 🪙 ${Math.round(SELL[r]*5*k)}</b></button>`).join('')}</div>`;
      const r=xr('deal',xday()), dk=Object.keys(RES)[Math.floor(r()*5)], dp=Math.round(SELL[dk]*5*2.2); const bought=TS_().deal===xday();
      extra+=`<div class="sect">${esc(t('tn.deal'))}</div><div class="row"><div class="big">${RES[dk]}</div><div class="grow"><h4>5 ${esc(t('tn.r.'+dk))}</h4><p>🪙 ${dp}</p></div><button class="btn sm" id="tnDeal" ${bought||S.coins<dp?'disabled':''}>${esc(bought?t('tn.dealDone'):t('shop.buy'))}</button></div>`;
      box._deal=[dk,dp]; }
    box.innerHTML=`<p>${esc(t('tn.d.'+b.id))}</p><p><b>${esc(lv2?t('tn.now',lv2):t('tn.notYet'))}</b>${lv2?' · '+esc(t('tn.e.'+b.id+'.'+lv2)):''}</p>
      ${nx<=3?`<div class="sect">${esc(lv2?t('tn.up',nx):t('tn.buildIt'))}</div><p>${esc(t('tn.e.'+b.id+'.'+nx))}</p><p style="font-size:1.1rem">${costTxt(c)}</p>${need?`<p class="tag">${esc(t('tn.wellFirst'))}</p>`:''}<button class="btn gold" id="tnUp" ${can?'':'disabled'}>${esc(lv2?t('tn.upBtn'):t('tn.buildBtn'))}</button>`:`<p class="tag ok">${esc(t('tn.max'))}</p>`}
      ${extra}<p style="color:var(--muted);font-size:.85rem">${esc(resLine())} · 🪙 ${S.coins}</p>`;
    const up=box.querySelector('#tnUp'); if(up) up.onclick=()=>{ if(!resHave(c)||need) return; resPay(c); TS_().lv[b.id]=nx; SFX.trumpet(); save(); updHUD(); toast(t('tn.built',t('tn.b.'+b.id),nx),true); closeModal(); enterMap(140,{x:P.x,y:P.y}); };
    box.querySelectorAll('[data-cr]').forEach(x=>x.onclick=()=>{ const f=CRAFT.find(q=>q.id===x.dataset.cr); if(!resHave(f.c)) return; resPay(f.c); const h=S.house||(S.house={items:[],inv:{},got:[]}); h.inv[f.id]=(h.inv[f.id]||0)+1; SFX.coin(); toast(t('tn.crafted',FEMO[f.id],t('furn.'+f.id))); save(); render(box); });
    box.querySelectorAll('[data-sell]').forEach(x=>x.onclick=()=>{ const r=x.dataset.sell, k=1+(tLv('market')-1)*.5; if((TS_().res[r]||0)<5) return; TS_().res[r]-=5; S.coins+=Math.round(SELL[r]*5*k); SFX.coin(); save(); updHUD(); render(box); });
    const dl=box.querySelector('#tnDeal'); if(dl) dl.onclick=()=>{ const [dk,dp]=box._deal; if(S.coins<dp) return; S.coins-=dp; TS_().deal=xday(); resAdd(dk,5); save(); updHUD(); render(box); };
  };
  openModal(`${b.e} ${t('tn.b.'+b.id)}`,'',render); }

/* ---- hooks: hub gate, map building, resources out in the Land ---- */
HUBX.town={x:29,y:14};
{ const _xh=xHub; xHub=function(m){ _xh(m); const x=m.W-10, y=16; for(let yy=15;yy<=16;yy++) for(let xx=x-1;xx<=x+1;xx++) m.set(xx,yy,T.G);
    HUBX.town={x,y:17}; spot(m,{x,y},{e:'🏘️',label:t('tn.quarter'),act:landOpen()?t('tn.quarterGo'):t('x.locked'),on:()=>{ if(!landOpen()) return toast(t('tn.lock'));
      const T_=TS_(); if(!T_.seen){ T_.seen=1; save(); return talk([1,2,3].map(i=>L_(SIMEON,t('tn.intro'+i))),()=>xGo(140)); } xGo(140); }}); }; }
{ const _bm2=buildMap; buildMap=function(id){ if(CH[id]&&CH[id].town) return xTown(id); return _bm2(id); }; }
{ const _em2=enterMap; enterMap=function(id,spawn){ _em2(id,spawn); if(M.R.town){ M.foes=[]; townMorning(); }
    if(M.sail&&tLv('lighthouse')) M.foes=M.foes.slice(0,Math.max(3,M.foes.length-tLv('lighthouse')*2)); }; }
/* gathering spots: a few each day in every region of the Land */
const GATHER={101:['wood','wool','wood'],102:['wood','fish','wool'],103:['stone','stone','wood'],104:['fish','fish','wood'],105:['stone','oil','wool']};
{ const _xm=xMap; xMap=function(m){ _xm(m); const id=m.id, G=GATHER[id]; if(!G||!landOpen()) return m; const T_=TS_(); T_.got=T_.got&&T_.got.d===xday()?T_.got:{d:xday()};
    G.forEach((k,i)=>{ const key=id+'_'+i; if(T_.got[key]) return; const p=xFree(m,xr('gat',id,xday(),i),{min:6}); spot(m,p,{e:RES[k],still:1,label:'',act:t('tn.gather',t('tn.r.'+k)),on:e=>{ T_.got[key]=1; M.ents=M.ents.filter(x=>x!==e); resAdd(k,(k==='oil'?2:4)+Math.floor(xr('gn',key,xday())()*3)); save(); }}); });
    if(CH[id].cave) {} return m; }; }
