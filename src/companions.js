/* More animal friends, and a staggered shop: each animal unlocks after a number of finished worlds. */
Object.assign(COMPS,{
  chick:{name:'Chick',e:'🐥',type:'heal',p:8,desc:'A fluffy little helper that cheers you back to health.'},
  hen:{name:'Mother Hen',e:'🐔',type:'shield',p:38,desc:'Gathers you under her wings and softens the next hit (Matthew 23:37).'},
  puppy:{name:'Puppy',e:'🐕',type:'attack',p:11,desc:'Loyal and brave. Bounds in to help every turn.'},
  ant:{name:'Ant',e:'🐜',type:'coins',p:8,desc:'Hard-working: gathers extra shekels after each win (Proverbs 6:6).'},
  donkey:{name:'Donkey',e:'🐴',type:'shield',p:50,desc:'Humble and strong. Jesus rode a donkey into Jerusalem (Matthew 21:7).'},
  raven:{name:'Raven',e:'🐦‍⬛',type:'stun',p:38,desc:'Clever bird that can freeze a foe. Ravens brought Elijah food (1 Kings 17:6).'},
  locust:{name:'Locust',e:'🦗',type:'all',p:9,desc:'Hops across the battlefield and hits every foe. John ate locusts and honey (Mark 1:6).'},
  leopard:{name:'Leopard',e:'🐆',type:'attack',p:19,desc:'Fast and fierce, yet gentle with friends: "the leopard will lie down with the young goat" (Isaiah 11:6).'},
  wolf:{name:'Peaceful Wolf',e:'🐺',type:'attack',p:21,desc:'"The wolf will live with the lamb" (Isaiah 11:6). Strong, and on your side.'},
  butterfly:{name:'Butterfly',e:'🦋',type:'heal',p:15,desc:'A sign of new life. Gentle healing every turn.'},
  hippo:{name:'Behemoth',e:'🦛',type:'shield',p:58,desc:'Mighty river giant that blocks big hits (Job 40:15).'}
});
['owl','bee','turtle'].forEach(k=>{ if(COMPS[k]) delete COMPS[k].price; });
const COMP_SHOP={sparrow:[60,0],goat:[120,1],chick:[150,2],hen:[220,3],puppy:[300,4],deer:[380,5],fox:[450,6],ant:[520,7],donkey:[600,8],peacock:[700,9],raven:[800,10],locust:[900,11],leopard:[1000,12],wolf:[1150,13],butterfly:[1300,14],eagle:[1450,15],hippo:[1650,16],whale:[1900,18]};
for(const k in COMP_SHOP){ if(COMPS[k]){ COMPS[k].price=COMP_SHOP[k][0]; COMPS[k].req=COMP_SHOP[k][1]; } }
Object.assign(DE.COMPS,{
  chick:{name:'Küken',desc:'Ein flauschiger kleiner Helfer, der dich wieder fit macht.'},
  hen:{name:'Glucke',desc:'Nimmt dich unter ihre Flügel und mildert den nächsten Treffer (nach Matthäus 23,37).'},
  puppy:{name:'Welpe',desc:'Treu und mutig. Springt jede Runde zu Hilfe.'},
  ant:{name:'Ameise',desc:'Fleißig: sammelt nach jedem Sieg Extra-Schekel (nach Sprüche 6,6).'},
  donkey:{name:'Esel',desc:'Demütig und stark. Jesus ritt auf einem Esel nach Jerusalem (nach Matthäus 21,7).'},
  raven:{name:'Rabe',desc:'Ein kluger Vogel, der einen Gegner erstarren lassen kann. Raben brachten Elia Essen (nach 1. Könige 17,6).'},
  locust:{name:'Heuschrecke',desc:'Hüpft übers Kampffeld und trifft alle Gegner. Johannes aß Heuschrecken und Honig (nach Markus 1,6).'},
  leopard:{name:'Leopard',desc:'Schnell und stark, aber sanft zu Freunden: „Der Leopard liegt beim Böckchen“ (nach Jesaja 11,6).'},
  wolf:{name:'Friedlicher Wolf',desc:'„Der Wolf wohnt beim Lamm“ (nach Jesaja 11,6). Stark und auf deiner Seite.'},
  butterfly:{name:'Schmetterling',desc:'Ein Zeichen für neues Leben. Sanfte Heilung jede Runde.'},
  hippo:{name:'Behemot',desc:'Ein mächtiger Flussriese, der große Treffer abhält (nach Hiob 40,15).'}
});
