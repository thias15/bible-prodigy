/* ===================== AFTER THE JOURNEY: THE LAND, THE GREAT SEA, THE TOWER ===================== */
/* Everything here lives in its own maps (ids 101+, never in ORDER). Saves only gain S.land and S.party;
   while you are out there the save still says 'hub', so an older version of the game can always load it. */
const XLAND=[101,102,103,104,105], XCAVE={101:111,102:112,103:113,104:114,105:115}, XISLE=[121,122,123,124];
const XCAVEOF={111:101,112:102,113:103,114:104,115:105};
const XPOS={101:[1,0],102:[2,1],103:[2,2],104:[0,1],105:[1,2]};
const XROAD={101:[102,104],102:[101,103],103:[102,105],104:[101,105],105:[103,104]};
const FRAG={101:2,111:4,102:3,112:5,103:8,113:6,104:7,114:10,105:9,115:1,123:11,124:12};
const isX=id=>!!(CH[id]&&(CH[id].land||CH[id].cave||CH[id].sail||CH[id].isle||CH[id].tower||CH[id].town));
const xday=()=>{ const d=new Date(); return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); };
function xr(...a){ let h=2166136261>>>0; const s=a.join('|'); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return mulberry32(h); }
function XS(){ const XL=S.land||(S.land={}); XL.frag=XL.frag||[]; XL.req=XL.req||{}; XL.isle=XL.isle||{}; XL.shy=XL.shy||{}; XL.tw=XL.tw||{best:0,cp:0}; XL.chest=XL.chest||{}; XL.seen=XL.seen||{}; return XL; }
const landOpen=()=>allDone(), towerOpen=()=>doneCount()>=10;
const isNight=()=>Math.floor(Date.now()/60000)%12>=8;
const WXS={101:['sun','sun','rain','mist'],102:['sun','sun','rain'],103:['sun','sun','wind'],104:['sun','wind','rain','mist'],105:['sun','sun','rain'],120:['sun','wind','storm'],121:['sun','sun','rain'],122:['sun','wind','sun'],123:['sun','storm','rain'],124:['sun','sun','rain']};
const WXE={sun:'☀️',rain:'🌧️',mist:'🌫️',wind:'💨',storm:'⛈️'};
function xWeather(id){ const a=WXS[id]; if(!a) return 'sun'; return a[Math.floor(xr('wx',id,xday())()*a.length)]; }
let HUBX={land:{x:29,y:14},tower:{x:29,y:14}}, XARR=null, XT=null;
for(const id in CH){ if(isX(+id)&&CH[id].mus&&TRACKS[CH[id].mus]) TRACKS['c'+id]=TRACKS[CH[id].mus]; }

/* ---- localisation of the new places and animals (they are data, so refresh after every language switch) ---- */
function xLoc(){ for(const id in CH){ const R=CH[id]; if(!isX(+id)) continue; const n=STR[LANG]&&STR[LANG]['lx.'+id]||STR.en['lx.'+id]; if(n) R.name=n;
    if(R.guide&&STR.en['lg.'+id]) R.guide.name=t('lg.'+id); (R.flav||[]).forEach((f,i)=>{ if(STR.en['ln.'+id+'.'+i]) f.name=t('ln.'+id+'.'+i); }); }
  for(const k in COMPS){ if(COMPS[k].wild&&STR.en['wc.'+k]){ COMPS[k].name=t('wc.'+k); COMPS[k].desc=t('wc.'+k+'.d'); } } }
{ const _al=applyLang; applyLang=function(l){ _al(l); xLoc(); }; }

/* ---- placement helpers ---- */
function xFree(m,rnd,o){ o=o||{}; const W=m.W, gap=o.gap||2;
  const c=(m.reach||[]).filter(k=>{ const x=k%W,y=(k/W)|0; if(o.min&&Math.abs(x-m.spawn.x)+Math.abs(y-m.spawn.y)<o.min) return false;
    if(m.ents.some(e=>Math.abs(e.x-x)<=gap&&Math.abs(e.y-y)<=gap)) return false; if(o.f&&!o.f(x,y)) return false; return true; });
  if(!c.length) return null; const k=c[Math.floor(rnd()*c.length)]; return {x:k%W,y:(k/W)|0}; }
function xEdge(m,dx,dy){ const W=m.W; let best=null, bs=-1e9;
  (m.reach||[]).forEach(k=>{ const x=k%W,y=(k/W)|0; if(Math.abs(x-m.spawn.x)+Math.abs(y-m.spawn.y)<8) return; if(m.ents.some(e=>Math.abs(e.x-x)<=2&&Math.abs(e.y-y)<=2)) return;
    const s=dx*x/W+dy*y/m.H+hash(x,y)*.02; if(s>bs){ bs=s; best={x,y}; } }); return best; }
function xNear(x,y){ for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) if(walkable(x+dx,y+dy)) return {x:x+dx,y:y+dy}; return null; }
function xPlace(p){ P.x=P.tx=p.x; P.y=P.ty=p.y; P.fx=P.x; P.fy=P.y; P.mv=false; P.path=[]; P.pend=null; P.inv=1.5; CPS.forEach((c,i)=>{ c.fx=P.x; c.fy=P.y+1+i*.3; }); trail=[];
  M.foes=M.foes.filter(f=>Math.abs(f.x-P.x)+Math.abs(f.y-P.y)>5); if(R3.ok&&R3.snap) R3.snap(); }
const spot=(m,p,o)=>{ if(!p) return null; const e=Object.assign({kind:'spot',x:p.x,y:p.y},o); m.ents.push(e); return e; };
function xGo(id,near){ flash(); XARR=near||null; enterMap(id); }

/* ---- shared talk helpers ---- */
const xWho=e=>({name:e.name,look:e.look,angel:e.angel,opts:{staff:e.staff}});
function xQuiz(n,need,done){ (async()=>{ let ok=0; for(let i=0;i<n;i++){ const q=makeQuestion(pick(ORDER.filter(isOpen))); const r=await ask(q,{n:i+1,of:n,exit:true}); if(r==='exit') return done(false,true); if(r) ok++; if(ok+(n-i-1)<need) break; } done(ok>=need); })(); }
function xReward(coins,xp,item){ S.coins+=coins; const lv=gainXP(xp); if(item) addItem(item,1); wkAdd(5,0,0); SFX.coin(); updHUD(); save();
  toast(t('x.reward',coins,xp)+(item?' · '+ITEMS[item].e:''),true); if(lv) setTimeout(()=>toast(t('win.lvl',S.level)),1200); }
function xJoin(k){ const c=COMPS[k]; S.comps[k]={lvl:Math.max(1,S.level-3),xp:0}; const p=team(); if(p.length<partySlots()){ S.party=p.concat(k); team(); } SFX.lvl(); toast(t('toast.joined',c.e,c.name),true); save(); }
function xFrag(n){ const XL=XS(); if(XL.frag.includes(n)) return; XL.frag.push(n); SFX.trumpet(); save(); updTrack();
  const all=XL.frag.length>=12;
  openModal(t('ps.found',XL.frag.length),`<p class="verse" style="font-size:1.15rem">“${esc(t('ps.'+n))}”<cite>${esc(t('ps.ref'))}</cite></p>${psalmHTML()}<p>${esc(all?t('ps.allP'):t('ps.moreP'))}</p>`,null,()=>{ if(all&&!XL.psalm){ XL.psalm=1; S.coins+=300; const h=S.house; h.inv.trophy=(h.inv.trophy||0)+1; if(!h.got.includes('trophy')) h.got.push('trophy'); gainXP(200); save(); updHUD(); toast(t('ps.reward'),true); } }); }
function psalmHTML(){ const XL=XS(); return `<div class="psalm">${Array.from({length:12},(_,i)=>i+1).map(n=>XL.frag.includes(n)?`<span class="got">${esc(t('ps.'+n))}</span>`:`<span class="miss">${n} · · ·</span>`).join(' ')}</div>`; }

/* ---- daily traveller requests ---- */
const TVN=['merchant','shepherd','fisher','widow','potter','pilgrim','scribe','vine'], TVE={merchant:'🧺',shepherd:'🐑',fisher:'🐟',widow:'🪙',potter:'🏺',pilgrim:'👡',scribe:'🪶',vine:'🍇'};
const TVLOOK=[[1,'#5a3418','#7a5a3a','#e9d8a6',{beard:'#5a3418'}],[2,'#2a1a10','#6a7a3a','#e9d8a6'],[3,'#1a1a1a','#3a6a8a','#c8a46a',{beard:'#1a1a1a'}],[1,'#8a8a8a','#5a4a6a','#e9d8a6',{hs:1,wrap:'#e8dcc0'}],[2,'#3a2414','#a0603a','#e9d8a6',{hs:2}],[0,'#c08a4a','#8a6a3a','#e9d8a6'],[2,'#1a1a1a','#e9e2cf','#4a6ab0',{beard:'#1a1a1a'}],[4,'#1a1a1a','#7b3fa0','#e3b64a',{hs:1}]];
function xReq(id){ const XL=XS(), d=xday(); let q=XL.req[id];
  if(!q||q.d!==d){ const r=xr('req',id,d); const ty=['find','quiz','hunt','food'][Math.floor(r()*4)]; const tv=Math.floor(r()*TVN.length);
    q=XL.req[id]={d,ty,tv,st:0,n:ty==='find'?3+Math.floor(r()*2):ty==='quiz'?3:ty==='hunt'?4+Math.floor(r()*3):1,got:[],c:0}; }
  return q; }
const reqDone=q=>q.ty==='find'?q.got.length>=q.n:q.ty==='hunt'?q.c>=q.n:false;
function reqText(q){ const k=TVN[q.tv]; return q.ty==='find'?t('rq.q.find',TVE[k],q.got.length,q.n):q.ty==='hunt'?t('rq.q.hunt',q.c,q.n):q.ty==='quiz'?t('rq.q.quiz'):t('rq.q.food'); }
function travTalk(who,e){ const id=M.id, q=xReq(id), k=TVN[q.tv], nm=e.name, it=TVE[k];
  const pay=()=>{ q.st=2; const lv=S.level; xReward(25+Math.round(lv*1.6)+(q.ty==='food'?20:0),30+lv*3,Math.random()<.4?pick(['bread','fish']):null); resAdd(['wood','stone','wool','fish'][q.tv%4],4); L2().done=(L2().done||0)+1; enterMap(id,{x:P.x,y:P.y}); };
  const L2=XS;
  if(q.st===2) return talk([L(who,t('rq.again'))]);
  if(q.ty==='quiz'){ return talk([L(who,t('rq.'+k)),L(who,t('rq.hi.quiz'))],()=>xQuiz(3,isJunior()?2:2,(ok,ex)=>{ if(ex) return; if(ok){ talk([L(who,t('rq.thanks'))],pay); } else talk([L(who,t('rq.quizNo'))]); })); }
  if(q.ty==='food'){ const has=['bread','fish','honey'].find(f=>S.items[f]>0); let gave=false;
    if(!has) return talk([L(who,t('rq.'+k)),L(who,t('rq.hi.food')),L(who,t('rq.noFood'))]);
    return talk([L(who,t('rq.'+k)),{who,text:t('rq.hi.food'),choice:[t('rq.give',ITEMS[has].e+' '+ITEMS[has].name),t('rq.notNow')],onPick:i=>{ if(i===0){ gave=true; S.items[has]--; return [L(who,t('rq.thanksFood'))]; } return [L(who,t('rq.ok'))]; }}],()=>{ if(gave) pay(); }); }
  if(q.st===0){ q.st=1; save(); talk([L(who,t('rq.'+k)),L(who,q.ty==='find'?t('rq.hi.find',q.n,it):t('rq.hi.hunt',q.n))],()=>{ enterMap(id,{x:P.x,y:P.y}); updTrack(); }); return; }
  if(reqDone(q)) return talk([L(who,t('rq.thanks'))],pay);
  talk([L(who,t('rq.wait',reqText(q)))]); }

/* ---- wild animals (only out here) ---- */
function xWild(id){ const k=Object.keys(COMPS).find(k=>COMPS[k].wild===id); if(!k||S.comps[k]) return null; if(XS().shy[k]===xday()) return null;
  if(XLAND.includes(id)&&k!=='badger'&&xr('wild',k,xday())()>.7) return null; return k; }
function wildTalk(e){ const k=e.wild, c=COMPS[k], who={name:c.name,look:null};
  talk([L(NARR(),t('wild.hi',c.e,c.name)),L(NARR(),t('wild.how',isJunior()?2:3))],()=>xQuiz(3,isJunior()?2:3,(ok,ex)=>{ if(ex) return;
    if(ok){ M.ents=M.ents.filter(x=>x!==e); xJoin(k); talk([L(NARR(),t('wild.yes',c.e,c.name))]); }
    else { XS().shy[k]=xday(); M.ents=M.ents.filter(x=>x!==e); save(); talk([L(NARR(),t('wild.no',c.name))]); } })); }

/* ---- hub: the tower and the road out into the Land ---- */
function xHub(m){ const W=m.W, tx=W-14;
  for(let y=3;y<=7;y++) for(let x=tx-1;x<=tx+4;x++) m.set(x,y,y<6&&x>=tx&&x<tx+4?T.L:T.G);
  m.lms.push({k:'gatehouse',x:tx,y:3,w:4,h:3});
  HUBX.tower={x:tx+2,y:7}; spot(m,{x:tx+2,y:6},{e:'🪜',big:0,label:t('x.tower'),act:towerOpen()?t('x.towerGo'):t('x.locked'),on:()=>{ if(!towerOpen()) return toast(t('x.towerLock',10)); xGo(130); }});
  const lx=W-6; for(let y=14;y<=16;y++) for(let x=lx-1;x<=lx+1;x++) m.set(x,y,T.G);
  HUBX.land={x:lx,y:17}; spot(m,{x:lx,y:16},{e:'🧭',label:t('x.land'),act:landOpen()?t('x.landGo'):t('x.locked'),on:()=>{ if(!landOpen()) return toast(t('x.landLock'));
    const XL=XS(), go=()=>xGo(XL.last&&XLAND.includes(XL.last)?XL.last:101);
    if(!XL.seen.land){ XL.seen.land=1; save(); return talk([1,2,3,4].map(i=>L_(SIMEON,t('land.intro'+i))),go); } go(); }});
}
const L_=(who,txt)=>L({name:who.name,look:who.look},txt);

/* ---- region maps of the Land ---- */
function xMap(m){ const R=m.R, id=m.id, XL=XS(), rs=mulberry32(R.seed*3+1), rd=xr('day',id,xday());
  m.items=[]; m.ents=m.ents.filter(e=>!(e.kind==='npc'&&e.role==='side')&&!(e.kind==='npc'&&e.role==='flavor'&&R.cave));
  let fi=0; m.ents.forEach(e=>{ if(e.kind==='npc'&&e.role==='flavor'){ const f=(R.flav||[])[fi++]; if(f&&f.lk) e.lk=f.lk; } });
  const home=R.tower?HUBX.tower:HUBX.land; m.ext={hx:home.x,hy:home.y}; m.wx=R.cave||R.tower?'sun':xWeather(id); m.xland=1;
  const guide=m.ents.find(e=>e.kind==='npc'&&e.role==='guide');
  const fragSpot=(hidden,o)=>{ const n=FRAG[id]; if(!n||XL.frag.includes(n)) return; const p=xFree(m,rs,Object.assign({min:hidden?12:6},o)); spot(m,p,{e:'📜',label:hidden?'':t('x.frag'),act:t('x.fragGo'),secret:hidden,hide:hidden,on:e=>{ M.ents=M.ents.filter(x=>x!==e); xFrag(n); }}); };
  const wildSpot=()=>{ const k=xWild(id); if(!k) return; const p=xFree(m,rd,{min:8}); spot(m,p,{e:COMPS[k].e,wild:k,label:t('x.wild'),act:t('x.wildGo',COMPS[k].name),night:k==='badger',hide:k==='badger'&&!isNight(),gc:'rgba(180,255,200,.55)',on:wildTalk}); };
  if(R.land){ XL.last=id;
    if(guide){ const q=xReq(id); const lk2=TVLOOK[q.tv]; guide.name=t('tv.'+TVN[q.tv]); guide.look=lk({skin:SK[lk2[0]],hair:lk2[1],robe:lk2[2],sash:lk2[3]},lk2[4]); guide.role='trav'; guide.staff=0;
      guide.xon=travTalk; guide.markF=()=>{ const q2=xReq(id); return q2.st===0?'!':q2.st===1&&reqDone(q2)?'?':null; }; }
    XROAD[id].forEach(to=>{ const a=XPOS[id], b=XPOS[to]; spot(m,xEdge(m,b[0]-a[0],b[1]-a[1]),{e:'🧭',road:to,label:t('x.roadTo',CH[to].name),act:t('x.roadGo',CH[to].name),on:()=>xGo(to,{road:id})}); });
    spot(m,xFree(m,rs,{min:10,gap:3}),{e:'🕳️',cave:XCAVE[id],still:1,glow:false,label:t('x.cave'),act:t('x.caveGo'),on:()=>xGo(XCAVE[id])});
    if(id===104) spot(m,xEdge(m,.25,1),{e:'⛵',big:1,still:1,label:t('x.ship'),act:t('x.shipGo'),on:()=>{ const go=()=>xGo(120,{home:1}); if(!XL.seen.sea){ XL.seen.sea=1; save(); return talk([1,2,3].map(i=>L(NARR(),t('sea.intro'+i))),go); } go(); }});
    fragSpot(true); wildSpot();
    const q=xReq(id); if(q.ty==='find'&&q.st===1){ const it=TVE[TVN[q.tv]]; for(let i=0;i<q.n;i++){ const p=xFree(m,xr('it',id,xday(),i),{min:6}); if(!p||q.got.includes(i)) continue; spot(m,p,{e:it,still:0,act:t('x.pick'),on:e=>{ q.got.push(i); M.ents=M.ents.filter(x=>x!==e); SFX.coin(); toast(t('found',it,q.got.length,q.n)); if(q.got.length>=q.n) toast(t('rq.back',guide?guide.name:'')); save(); updTrack(); }}); } }
    if(id===101&&m.wx==='rain'&&XL.rain!==xday()) spot(m,xFree(m,rd,{min:8}),{e:'🌈',big:1,label:t('x.rainbow'),act:t('x.rainbowGo'),on:e=>{ XL.rain=xday(); M.ents=M.ents.filter(x=>x!==e); S.hp=maxHP(); xReward(40,20,null); talk([L(NARR(),t('x.rainbowT'))]); }});
    m.xm={back:()=>{ flash(); XARR=null; enterMap('hub',HUBX.land); }, quest:()=>{ const q2=xReq(id); return `${WXE[m.wx]}${isNight()?'🌙':''} ${R.name} · ${q2.st===0?t('rq.q.new'):q2.st===2?t('rq.q.done'):reqText(q2)} · 📜 ${XL.frag.length}/12`; }};
  }
  else if(R.cave){ const from=XCAVEOF[id];
    fragSpot(false,{min:10});
    if(XL.chest[id]!==xday()) spot(m,xFree(m,rd,{min:8}),{e:'🧰',label:t('x.chest'),act:t('x.chestGo'),on:e=>{ XL.chest[id]=xday(); M.ents=M.ents.filter(x=>x!==e); const it=pick(['bread','fish','honey']); xReward(20+Math.round(S.level),15,it); if(landOpen()) resAdd('stone',3); }});
    m.xm={exitL:t('x.leaveCave'),back:()=>xGo(from,{cave:id}), quest:()=>`🕯️ ${R.name} · 📜 ${XL.frag.length}/12`};
  }
  else if(R.isle){ const st=XL.isle[id]||(XL.isle[id]={st:0,got:[],c:0});
    if(guide){ guide.role='isle'; guide.xon=isleTalk; guide.markF=()=>st.st===0?'!':(isleDone(id)&&st.st===1)?'?':null; }
    wildSpot();
    if(id===122||id===123){ const it=id===122?'🏺':'🪵'; const n=id===122?3:4; if(st.st===1) for(let i=0;i<n;i++){ if(st.got.includes(i)) continue; const p=xFree(m,mulberry32(R.seed+i*7),{min:6}); spot(m,p,{e:it,act:t('x.pick'),on:e=>{ st.got.push(i); M.ents=M.ents.filter(x=>x!==e); SFX.coin(); toast(t('found',it,st.got.length,n)); save(); updTrack(); }}); } }
    m.xm={exitL:id===124?t('x.toHarbor'):t('x.toShip'),back:()=>xGo(120,{isle:id}), quest:()=>`${WXE[m.wx]} ${R.name} · ${isleQuest(id)}`};
  }
  else if(R.tower){ const front=m.bossPos||{x:m.W-6,y:6};
    if(guide){ guide.role='tower'; guide.xon=(who)=>talk([L(who,t('tw.hi1')),L(who,t('tw.hi2'))],towerMenu); }
    spot(m,{x:front.x,y:front.y},{e:'🪜',big:1,still:1,label:t('tw.stairs'),act:t('tw.climb'),on:towerMenu});
    m.xm={back:()=>{ flash(); enterMap('hub',HUBX.tower); }, quest:()=>t('tw.quest',XL.tw.best||0)};
    m.reach=[];
  }
  return m;
}
const lk=(o,x)=>Object.assign(o,x||{});

/* ---- the Great Sea ---- */
const ISLES={121:{c:[52,11],r:[6,3.4],dock:[46,12]},122:{c:[33,30],r:[9,3],dock:[33,26]},123:{c:[15,23],r:[3.2,2.6],dock:[19,23]},124:{coast:1,dock:[8,9]}};
function xSea(id){ const R=CH[id], W=R.w, H=R.h, rnd=mulberry32(R.seed), tt=new Uint8Array(W*H).fill(T.W);
  const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H, get=(x,y)=>inb(x,y)?tt[y*W+x]:T.B, set=(x,y,v)=>{ if(inb(x,y)) tt[y*W+x]=v; };
  const m={id,W,H,t:tt,R,th:R.th,ents:[],foes:[],lms:[],items:[],get,set,sail:1,xland:1};
  const land=(x,y)=>{ set(x,y,T.G); };
  for(const k in ISLES){ const I=ISLES[k]; if(I.coast) continue; for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const d=((x-I.c[0])/I.r[0])**2+((y-I.c[1])/I.r[1])**2; if(d<1+(hash(x+k,y)-.5)*.35) land(x,y); } }
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ if(x<=6-Math.round(y*.25)+Math.round(Math.sin(y*.7))&&y<20) land(x,y); if(x>=W-3+Math.round(Math.sin(y*.5)*.6)) land(x,y); if(y===0||y===H-1||x===0) set(x,y,T.B); }
  for(let i=0;i<W*H;i++){ if(tt[i]===T.G){ const x=i%W,y=(i/W)|0; let inner=true; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(get(x+dx,y+dy)===T.W) inner=false; if(inner){ const r=rnd(); if(r<.35) tt[i]=T.B; else if(r<.55) tt[i]=T.D; } } }
  const XL=XS(); m.ext={hx:HUBX.land.x,hy:HUBX.land.y}; m.wx=xWeather(id);
  const dock=(k,ax,ay,o)=>{ let best=null,bd=1e9; for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){ if(get(x,y)!==T.W) continue; if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>get(x+dx,y+dy)===T.G||get(x+dx,y+dy)===T.D||get(x+dx,y+dy)===T.B)) continue; const d=Math.abs(x-ax)+Math.abs(y-ay); if(d<bd){ bd=d; best={x,y}; } } return spot(m,best,o); };
  for(const k in ISLES){ const I=ISLES[k], st=XL.isle[k]; dock(+k,I.dock[0],I.dock[1],{e:'⚓',isle:+k,label:CH[k].name+(st&&st.st===2?' ✓':''),act:t('x.landAt',CH[k].name),on:()=>xGo(+k)}); }
  const homeD=dock(0,W-4,22,{e:'🏠',home:1,label:CH[104].name,act:t('x.sailHome'),on:()=>xGo(104,{ship:1})});
  m.spawn=homeD?{x:homeD.x-1,y:homeD.y}:{x:W-6,y:22}; if(get(m.spawn.x,m.spawn.y)!==T.W) m.spawn={x:W-7,y:22};
  const seen=new Set([m.spawn.y*W+m.spawn.x]), q=[[m.spawn.x,m.spawn.y]]; while(q.length){ const [x,y]=q.shift(); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy,k=ny*W+nx; if(!seen.has(k)&&get(nx,ny)===T.W&&!entAt(m,nx,ny)){ seen.add(k); q.push([nx,ny]); } } }
  m.reach=[...seen].filter(k=>Math.abs(k%W-m.spawn.x)+Math.abs(((k/W)|0)-m.spawn.y)>8);
  const wk=xWild(id); if(wk){ const p=xFree(m,xr('dol',xday()),{min:12}); spot(m,p,{e:COMPS[wk].e,wild:wk,label:t('x.wild'),act:t('x.wildGo',COMPS[wk].name),gc:'rgba(180,255,200,.55)',on:wildTalk}); }
  m.xm={back:()=>xGo(104,{ship:1}), quest:()=>`${WXE[m.wx]}${isNight()?'🌙':''} ${R.name} · ${t('sea.q',XISLE.filter(i=>XL.isle[i]&&XL.isle[i].st===2).length)}`};
  return m; }

/* ---- the islands: Paul's journeys (Acts 13 and 27–28) ---- */
const isleDone=id=>{ const st=XS().isle[id]; if(!st) return false; return id===121?st.c>=4:id===122?st.got.length>=3:id===123?st.got.length>=4:false; };
function isleQuest(id){ const st=XS().isle[id]||{st:0}; if(st.st===2) return t('is.done'); if(st.st===0) return t('is.q0',CH[id].guide.name);
  return id===121?t('rq.q.hunt',st.c,4):id===122?t('rq.q.find','🏺',st.got.length,3):id===123?t('rq.q.find','🪵',st.got.length,4):t('rq.q.quiz'); }
function isleTalk(who){ const id=M.id, st=XS().isle[id], ls=k=>[1,2,3].map(i=>STR.en['is.'+id+'.'+k+i]?L(who,t('is.'+id+'.'+k+i)):null).filter(Boolean);
  const finish=()=>{ st.st=2; const n=FRAG[id]; xReward(60+S.level*2,50+S.level*3,null); resAdd(id===124?'oil':'fish',8); talk(ls('b'),()=>{ if(n) xFrag(n); enterMap(id,{x:P.x,y:P.y}); }); };
  if(st.st===2) return talk(ls('d'));
  if(id===124){ return talk(st.st===0?ls('a'):[L(who,t('is.124.w1'))],()=>{ st.st=1; save(); xQuiz(4,3,(ok,ex)=>{ if(ex) return; if(ok) finish(); else talk([L(who,t('is.124.no'))]); }); }); }
  if(st.st===0){ st.st=1; save(); return talk(ls('a'),()=>{ enterMap(id,{x:P.x,y:P.y}); updTrack(); }); }
  if(isleDone(id)) return finish();
  talk(ls('w')); }

/* ---- the Tower of the Watchman (Habakkuk 2:1): endless floors, checkpoint every 10 ---- */
function towerMenu(){ const XL=XS(), tw=XL.tw; const cps=[0]; for(let c=10;c<=tw.cp;c+=10) cps.push(c);
  openModal(t('tw.title'),`<p class="verse">${esc(t('tw.verse'))}<cite>Habakkuk 2:1</cite></p><p>${esc(t('tw.how'))}</p><p><b>${esc(t('tw.best',tw.best||0))}</b></p>
    <div class="cards">${cps.map(c=>`<button class="card" data-tw="${c+1}"><div class="emo">${c?'🚩':'🪜'}</div><b>${esc(t('tw.start',c+1))}</b>${c?`<small>${esc(t('tw.cp'))}</small>`:''}</button>`).join('')}</div>
    ${S.cloud?`<p style="color:var(--muted);font-size:.85rem">${esc(t('tw.friends'))}</p>`:''}`,b=>b.querySelectorAll('[data-tw]').forEach(x=>x.onclick=()=>{ closeModal(); XT={floor:+x.dataset.tw,start:+x.dataset.tw}; S.hp=maxHP(); towerFloor(); })); }
function towerFloor(){ if(!XT||mode!=='world') return; if(XT.floor%7===0) return sabbath(); const n=XT.floor, w=ORDER[(n-1)%ORDER.length], boss=n%5===0; TIER_OVR=1.3+n*.42;
  startBattle(null,boss,{ch:w}); if(!B){ TIER_OVR=null; return; }
  B.ext={tower:1,keepMap:1,note:t('tw.cleared',n),after:towerAfter}; $('#bWho').textContent=t('tw.floor',n)+' · '+$('#bWho').textContent; }
function sabbath(){ const n=XT.floor, XL=XS(), tw=XL.tw; S.hp=maxHP(); if(n>tw.best) tw.best=n; XT.floor=n+1; SFX.heal(); save(); updHUD();
  openModal(t('tw.sabT',n),`<p class="verse">${esc(t('tw.sabV'))}<cite>${esc(t('tw.sabR'))}</cite></p><p>${esc(t('tw.sabP'))}</p><p>${esc(t('tw.hp',Math.ceil(S.hp),maxHP()))}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn gold" id="twGo">${esc(t('tw.up'))}</button><button class="btn" id="twStop">${esc(t('tw.leave'))}</button></div>`,b=>{ b.querySelector('#twGo').onclick=()=>{ if(!modalOpen) return; closeModal(); towerFloor(); }; b.querySelector('#twStop').onclick=()=>{ XT=null; closeModal(); }; }); }
function towerAfter(how){ const XL=XS(), tw=XL.tw, n=XT&&XT.floor; if(!XT) return;
  if(how==='win'){ if(n>tw.best){ tw.best=n; if(typeof ON!=='undefined'&&ON.onSave) save(); }
    let extra=''; if(n%10===0&&n>tw.cp){ tw.cp=n; const c=50*n/10; S.coins+=c; const h=S.house; h.inv.trophy=(h.inv.trophy||0)+1; if(!h.got.includes('trophy')) h.got.push('trophy'); extra=t('tw.cpGot',n,c); if(typeof resAdd==='function') resAdd('oil',5,true); SFX.trumpet(); }
    let heal=''; if(n%5===0&&typeof resAdd==='function'){ resAdd('oil',2,true); heal=t('tw.oil',2); }
    save(); updHUD(); XT.floor=n+1;
    openModal(t('tw.done',n),`<p>${esc(t('tw.hp',Math.ceil(S.hp),maxHP()))}</p>${heal?`<p>${esc(heal)}</p>`:''}${extra?`<p class="tag ok">${esc(extra)}</p>`:''}<p>${esc(t('tw.next',n+1))}${(n+1)%7===0?' '+esc(t('tw.sabNext')):(n+1)%5===0?' '+esc(t('tw.bossNext')):''}</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn gold" id="twGo">${esc(t('tw.up'))}</button><button class="btn" id="twStop">${esc(t('tw.leave'))}</button></div>`,b=>{ b.querySelector('#twGo').onclick=()=>{ if(!modalOpen) return; closeModal(); towerFloor(); }; b.querySelector('#twStop').onclick=()=>{ XT=null; closeModal(); }; },()=>{ });
    return; }
  const best=tw.best; XT=null; if(how==='lose') openModal(t('tw.endT'),`<p>${esc(t('tw.end',n-1,best))}</p><p>${esc(t('tw.endP'))}</p>`); }

/* ---- engine hooks ---- */
{ const _bm=buildMap; buildMap=function(id){ if(CH[id]&&CH[id].sail) return xSea(id); const m=_bm(id); if(id==='hub') xHub(m); else if(isX(id)) xMap(m); return m; }; }
{ const _em=enterMap; enterMap=function(id,spawn){
    if(isX(id)){ if(!S.chs[id]) S.chs[id]={stage:4,kills:0,side:2,got:[]}; const R=CH[id]; const nt=!R.cave&&!R.tower&&isNight();
      R.tier=Math.min(16,Math.max(5,2+S.level*.35))+(R.cave?1:0)+(nt?1:0); if(!R.cave) R.night=nt?1:0;
      R.book=R.town?t('tn.sub'):R.tower?'Habakkuk 2:1':R.isle||R.sail?CH[id].book0||(CH[id].book0=CH[id].book):t('x.sub',WXE[xWeather(id)]+(nt?' 🌙':'')); }
    _em(id,spawn);
    if(M.R.tower) M.foes=[];
    if(M.sail){ const n={sun:6,wind:9,storm:13}[M.wx]||7; M.foes=M.foes.slice(0,n); }
    if(XARR){ const a=XARR; XARR=null; let tg=null;
      if(a.road) tg=M.ents.find(e=>e.road===a.road); else if(a.cave) tg=M.ents.find(e=>e.cave===a.cave); else if(a.isle) tg=M.ents.find(e=>e.isle===a.isle); else if(a.ship||a.home) tg=M.ents.find(e=>a.ship?e.e==='⛵':e.home);
      const p=tg&&xNear(tg.x,tg.y); if(p) xPlace(p); }
    M.nightNow=isNight(); updTrack(); }; }
{ const _wk=walkable; walkable=function(x,y){ if(M&&M.sail){ const v=M.get(x,y); return (v===T.W||v===T.BR)&&!entAt(M,x,y); } return _wk(x,y); }; }
{ const _ia=interact; interact=function(e){
    if(M&&M.xm&&e.kind==='exit'){ ac(); P.path=[]; P.pend=null; M.xm.back(); return; }
    if(e.kind==='npc'&&e.xon){ ac(); P.path=[]; P.pend=null; keys.up=keys.down=keys.left=keys.right=false; return e.xon(xWho(e),e); }
    return _ia(e); }; }
{ const _qt=questText; questText=function(){ if(M&&M.xm) return M.xm.quest(); if(M&&M.id==='hub'&&S.flags.met&&allDone()&&S.flags.ending) return t('x.hubQ'); return _qt(); }; }
{ const _v=victory; victory=function(){ const ch=B&&B.ch, n=B?B.foes.length:0, ext=B&&B.ext; const r=_v();
    if(!ext&&S&&isX(ch)){ if(XLAND.includes(ch)){ const q=xReq(ch); if(q.ty==='hunt'&&q.st===1&&q.c<q.n){ q.c=Math.min(q.n,q.c+n); if(q.c>=q.n) setTimeout(()=>toast(t('rq.back',t('tv.'+TVN[q.tv]))),900); } }
      if(ch===121){ const st=XS().isle[121]; if(st&&st.st===1) st.c=Math.min(4,st.c+n); } save(); }
    return r; }; }
let wxShown='';
{ const _up=update; update=function(dt){ _up(dt);
    const want=mode==='world'&&M&&M.wx&&M.wx!=='sun'?M.wx:''; if(want!==wxShown){ wxShown=want; const el=$('#wx'); el.className=want; el.hidden=!want; }
    if(mode!=='world'||!M||!M.xland) return;
    const nt=isNight(); if(nt!==M.nightNow&&!M.R.cave&&!M.R.tower){ M.nightNow=nt; M.R.night=nt?1:0; toast(t(nt?'x.nightFalls':'x.morning')); M.ents.forEach(e=>{ if(e.night) e.hide=!nt; }); }
    for(const e of M.ents){ if(e.secret){ const near=Math.abs(e.x-P.x)+Math.abs(e.y-P.y)<=3; if(e.hide===near){ e.hide=!near; if(near){ SFX.open(); toast(t('x.secret')); } } } } }; }
xLoc();
