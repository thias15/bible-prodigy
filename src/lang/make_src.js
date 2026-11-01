const fs=require('fs'); const {load,flat}=require('./extract.js'); const x=load();
const W=(f,o)=>fs.writeFileSync(__dirname+'/src/'+f,JSON.stringify(o,null,1));
// A: interface text, mini-games, word lists
const STR={}; for(const k of Object.keys(x.STR.en)) STR[k]={en:x.STR.en[k],de:x.STR.de[k]};
W('A.json',{STR,MG:{en:x.MGTXT.en,de:x.MGTXT.de},
  VOCAB:{en:x.VOCAB,de:x.VOCAB_DE},SPELL:{en:x.SPELL,de:x.SPELL_DE},GROUPS:{en:x.GROUPS,de:x.GROUPS_DE},
  BOOKS:{en:x.BOOKS,de:x.BOOKS_DE},BOOK:{de:x.BOOK_DE},STORY:{en:x.STORY_INTRO,de:x.STORY_DE},
  MISC:{fallbackVerse:{en:{t:'For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.',r:'John 3:16'},de:{t:'So sehr hat Gott die Welt geliebt, dass er seinen einzigen Sohn gab. Jeder, der an ihn glaubt, wird ewig leben.',r:'nach Johannes 3,16'}},
        bookOpts:{en:['Genesis','Exodus','Psalm','Proverbs','Isaiah','Matthew','Luke','John','Romans','Joshua','Daniel'],de:['1. Mose','2. Mose','Psalm','Sprüche','Jesaja','Matthäus','Lukas','Johannes','Römer','Josua','Daniel']}}});
// B: story content overlay (worlds, characters, items)
const base={HUB:x.HUB,SIMEON:x.SIMEON,HUBNPC:x.HUBNPC,ITEMS:x.ITEMS,ARMOR:x.ARMOR,SPELLS:x.SPELLS,DYES:x.DYES,COMPS:x.COMPS,CH:x.CH};
W('B.json',flat(x.DE,base,'',{}));
// C: Bible questions + memory verses
W('C.json',{BQ:x.BQ.map((q,i)=>({ch:q[0],diff:q[1],en:q.slice(2,7),ref:q[7],de:x.BQ_DE[i]})),
  VQ:x.VQ.map((v,i)=>({en:v,de:x.VQ_DE[i]}))});
// D: extra question types, story choices, places
const PL={}; for(const k in x.PLACES) PL[k]={en:x.PLACES[k].en,de:x.PLACES[k].de};
W('D.json',{QX:{en:x.QX.en,de:x.QX.de},CHOICES:{en:x.CHOICES.en,de:x.CHOICES.de},PLACES:PL});
console.log('ok');
