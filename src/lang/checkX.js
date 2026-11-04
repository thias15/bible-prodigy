// node lang/checkO.js <de|es|el> — validates lang/<l>/X.json against the English ext strings
const fs=require('fs'); const L=process.argv[2]; const en=JSON.parse(fs.readFileSync(__dirname+'/src/X.json')); let o;
try{ o=JSON.parse(fs.readFileSync(__dirname+'/'+L+'/X.json')); }catch(e){ console.log('CANNOT READ',e.message); process.exit(1); }
const err=[], ph=s=>(String(s).match(/\{\w+\}/g)||[]).sort().join(' ');
for(const k in en){ if(!(k in o)){ err.push('missing '+k); continue; } const a=en[k], b=o[k];
  if(Array.isArray(a)){ if(!Array.isArray(b)||b.length!==a.length) err.push(k+': array of '+a.length+' needed'); else if(new Set(b).size!==b.length) err.push(k+': duplicates'); continue; }
  if(typeof b!=='string'||!b.trim()) err.push(k+': empty'); else if(ph(a)!==ph(b)) err.push(k+': placeholders '+ph(a)+' vs '+ph(b)); }
for(const k in o) if(!(k in en)) err.push('unexpected '+k);
console.log(err.length?err.length+' ERRORS\n'+err.join('\n'):'OK'); process.exit(err.length?1:0);
