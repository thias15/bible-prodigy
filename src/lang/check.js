// Usage: node check.js <es|el> <A|B|C|D>   — validates a translated chunk against the German template
const fs=require('fs'); const [L,C]=process.argv.slice(2);
const src=JSON.parse(fs.readFileSync(__dirname+'/src/'+C+'.json'));
let out; try{ out=JSON.parse(fs.readFileSync(__dirname+'/'+L+'/'+C+'.json')); }catch(e){ console.log('CANNOT READ/PARSE',e.message); process.exit(1); }
const errs=[], warns=[];
const ph=s=>(s.match(/\{\w+\}/g)||[]).sort().join(' '), tags=s=>(s.match(/<\/?[a-z][^>]*>/gi)||[]).map(x=>x.replace(/\s.*>/,'>')).sort().join('');
function cmp(t,o,p,en){
  if(typeof t==='string'){ if(typeof o!=='string'||(!o.trim()&&t.trim())) return errs.push(p+': expected non-empty string');
    if(ph(t)!==ph(o)) errs.push(p+`: placeholders differ (de "${ph(t)}" vs "${ph(o)}")`);
    if(tags(t)!==tags(o)) errs.push(p+': HTML tags differ');
    if(t.includes('___')!==o.includes('___')) errs.push(p+': ___ blank mismatch');
    if(typeof en==='string'&&en===o&&o.length>12&&/[a-z]{4} [a-z]{3}/i.test(o)) warns.push(p+': identical to English (untranslated?)');
    return; }
  if(typeof t==='number'||typeof t==='boolean'||t==null){ if(o!==t) errs.push(p+`: must stay ${JSON.stringify(t)}`); return; }
  if(Array.isArray(t)){ if(!Array.isArray(o)) return errs.push(p+': expected array'); if(o.length!==t.length) errs.push(p+`: array length ${o.length}, expected ${t.length}`);
    t.forEach((v,i)=>cmp(v,o[i],p+'['+i+']',en&&en[i])); return; }
  if(typeof o!=='object'||o==null||Array.isArray(o)) return errs.push(p+': expected object');
  for(const k of Object.keys(t)) if(!(k in o)) errs.push(p+'.'+k+': missing'); else cmp(t[k],o[k],p+'.'+k,en&&en[k]);
  for(const k of Object.keys(o)) if(!(k in t)) errs.push(p+'.'+k+': unexpected key');
}
const need=(o,k)=>{ if(!(k in o)) errs.push('missing top-level '+k); return k in o; };
if(C==='A'){
  if(need(out,'STR')){ const T={},E={}; for(const k in src.STR){ T[k]=src.STR[k].de??src.STR[k].en; E[k]=src.STR[k].en; } cmp(T,out.STR,'STR',E); }
  if(need(out,'MG')) cmp(src.MG.de,out.MG,'MG',src.MG.en);
  if(need(out,'STORY')) cmp(src.STORY.de,out.STORY,'STORY',src.STORY.en);
  if(need(out,'BOOKS')){ if(!Array.isArray(out.BOOKS)||out.BOOKS.length!==66) errs.push('BOOKS must list 66 books'); }
  if(need(out,'BOOK')){ for(const b of [...src.BOOKS.en,'Psalm']) if(typeof out.BOOK[b]!=='string') errs.push('BOOK missing English key '+b); }
  if(need(out,'VOCAB')){ if(!Array.isArray(out.VOCAB)||out.VOCAB.length<28) errs.push('VOCAB needs ≥28 rows'); else out.VOCAB.forEach((r,i)=>{ if(!(r.length===3&&typeof r[0]==='string'&&typeof r[1]==='string'&&[1,2,3].includes(r[2]))) errs.push('VOCAB['+i+'] must be [word,definition,1|2|3]'); }); }
  if(need(out,'SPELL')){ if(!Array.isArray(out.SPELL)||out.SPELL.length<30) errs.push('SPELL needs ≥30 rows'); else { out.SPELL.forEach((r,i)=>{ if(!(r.length===2&&typeof r[0]==='string'&&[1,2,3].includes(r[1]))) errs.push('SPELL['+i+'] must be [word,1|2|3]'); }); for(const l of [1,2,3]) if(out.SPELL.filter(r=>r[1]===l).length<8) errs.push('SPELL needs ≥8 words of level '+l); } }
  if(need(out,'GROUPS')){ const g=out.GROUPS; if(Object.keys(g).length<6) errs.push('GROUPS needs 6 groups'); for(const k in g) if(!Array.isArray(g[k])||g[k].length<6) errs.push('GROUPS '+k+' needs ≥6 items'); }
  if(need(out,'MISC')){ cmp(src.MISC.fallbackVerse.de,out.MISC.fallbackVerse,'MISC.fallbackVerse'); cmp(src.MISC.bookOpts.de,out.MISC.bookOpts,'MISC.bookOpts'); }
  for(const k of Object.keys(out)) if(!['STR','MG','STORY','BOOKS','BOOK','VOCAB','SPELL','GROUPS','MISC'].includes(k)) errs.push('unexpected top-level '+k);
  if(!fs.existsSync(__dirname+'/'+L+'/mtx.js')) errs.push('missing '+L+'/mtx.js');
  else { try{ const vm=require('vm'); const ctx={MTX:{},LPX:{}}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(__dirname+'/'+L+'/mtx.js','utf8'),ctx);
    const m=ctx.MTX[L], de=require('vm').runInNewContext('('+fs.readFileSync(__dirname+'/../i18n.js','utf8').match(/const MTX = (\{[\s\S]*?\n\}\});/)[1].replace(/\}\);$/,'}')+')'), d=de.de;
    if(!m) errs.push('mtx.js must set MTX.'+L); else { for(const k in d){ if(!(k in m)) errs.push('MTX missing '+k); else if(Array.isArray(d[k])){ if(m[k].length!==d[k].length) errs.push('MTX.'+k+' length'); else m[k].forEach((f,i)=>{ const r=f(3,4); const r2=d[k][i](3,4); if(r[1]!==r2[1]) errs.push(`MTX.${k}[${i}] answer ${r[1]} != ${r2[1]}`); }); } else if(typeof m[k](3,4,5,6,7)!=='string') errs.push('MTX.'+k+' must return string'); } }
    const x=ctx.LPX[L]; if(!x) errs.push('mtx.js must set LPX.'+L); else { if(typeof x.sayFrac!=='function') errs.push('LPX.sayFrac missing'); if(typeof x.vowels!=='string') errs.push('LPX.vowels missing'); }
  }catch(e){ errs.push('mtx.js error: '+e.message); } }
}
if(C==='B') cmp(Object.fromEntries(Object.entries(src).map(([k,v])=>[k,v.de])),out,'',Object.fromEntries(Object.entries(src).map(([k,v])=>[k,v.en])));
if(C==='C'){ if(need(out,'BQ')) cmp(src.BQ.map(r=>[...r.de,r.ref]),out.BQ,'BQ',src.BQ.map(r=>[...r.en,r.ref]));
  if(need(out,'VQ')) cmp(src.VQ.map(r=>r.de),out.VQ,'VQ',src.VQ.map(r=>r.en)); }
if(C==='D'){ if(need(out,'QX')) cmp(src.QX.de,out.QX,'QX',src.QX.en); if(need(out,'CHOICES')) cmp(src.CHOICES.de,out.CHOICES,'CHOICES',src.CHOICES.en);
  if(need(out,'PLACES')) cmp(Object.fromEntries(Object.entries(src.PLACES).map(([k,v])=>[k,v.de])),out.PLACES,'PLACES'); }
console.log(errs.length?`${errs.length} ERRORS:\n`+errs.slice(0,60).join('\n'):'OK — structure valid');
if(warns.length) console.log(`${warns.length} warnings (check):\n`+warns.slice(0,30).join('\n'));
process.exit(errs.length?1:0);
