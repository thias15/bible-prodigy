// Loads game content in Node and exposes it (used by extract + build of language packs)
const fs=require('fs'),vm=require('vm'),path=require('path');
const D=path.join(__dirname,'..');
function load(){
  const files=['data.js','i18n.js','worlds2.js','worlds3.js','companions.js','quiz_extra.js','worlds_order.js'];
  const src=files.map(f=>fs.readFileSync(path.join(D,f),'utf8')).join('\n;\n');
  const ctx={console}; vm.createContext(ctx);
  vm.runInContext(src+'\n;this.__x={DE,STR,BQ,BQ_DE,VQ,VQ_DE,VOCAB,VOCAB_DE,SPELL,SPELL_DE,GROUPS,GROUPS_DE,BOOKS,BOOKS_DE,BOOK_DE,STORY_DE,STORY_INTRO,QX,CHOICES,PLACES,CH,HUB,SIMEON,HUBNPC,ITEMS,ARMOR,COMPS,SPELLS,DYES,REF_FIX,ORDER}',ctx);
  const mg=fs.readFileSync(path.join(D,'minigames.js'),'utf8');
  const m=mg.match(/var TXT = (\{[\s\S]*?\n  \});/); ctx.__x.MGTXT=vm.runInNewContext('('+m[1]+')');
  return ctx.__x;
}
// flatten leaves of overlay o, pairing with base b (English)
function flat(o,b,pre,out){
  if(typeof o==='string'){ out[pre]={en:(typeof b==='string'?b:null),de:o}; return out; }
  if(o&&typeof o==='object') for(const k of Object.keys(o)) flat(o[k],b&&b[k],pre?pre+'.'+k:k,out);
  return out;
}
module.exports={load,flat};
