MTX.es={
 frac:(n,d,w)=>`¿Cuánto es ${n}/${d} de ${w}?`, fracEx:(w,d,k,n,a)=>`${w} ÷ ${d} = ${k}, y ${k} × ${n} = ${a}`,
 fadd:(x,y,s,a)=>`El denominador es el mismo, así que se suman los numeradores: ${x} + ${y} = ${s}. Resultado: ${a}`, dec:(x,y,s)=>`Alinea los puntos decimales: ${x} + ${y} = ${s}`,
 pct:(p,n)=>`¿Cuánto es el ${p} % de ${n}?`, pctEx:(p,n,a)=>`${p} % significa ${p} de cada 100. ${n} × ${p}/100 = ${a}`,
 half:n=>`¿Cuánto es el 50 % de ${n}?`, halfEx:(n,a)=>`La mitad de ${n} es ${a}`,
 sale:(n,p)=>`Una tienda de campaña cuesta ${n} siclos. Tiene un ${p} % de descuento. ¿Cuál es el precio rebajado?`, saleEx:(p,n,o,a)=>`El ${p} % de ${n} es ${o}. ${n} − ${o} = ${a}`,
 ops:(y,z,x,a)=>`Primero se multiplica: ${y} × ${z} = ${y*z}. Luego ${x} + ${y*z} = ${a}`,
 eqA:(k,s)=>`x + ${k} = ${s}. ¿Cuánto vale x?`, eqAEx:(k,x)=>`Resta ${k} en los dos lados: x = ${x}`, eqM:(m,s)=>`${m}x = ${s}. ¿Cuánto vale x?`, eqMEx:(m,x)=>`Divide los dos lados entre ${m}: x = ${x}`,
 eq2:(m,b,s)=>`${m}x + ${b} = ${s}. ¿Cuánto vale x?`, eq2Ex:(b,m,mx,x)=>`Resta ${b}: ${m}x = ${mx}. Divide entre ${m}: x = ${x}`,
 eqb:s=>`${s}. ¿Cuánto vale x?`, eqbEx:(a,b,x)=>`Junta los términos con x: ${a}x = ${b}, así que x = ${x}`,
 sqrtEx:(r)=>`${r} × ${r} = ${r*r}`, pyth:(a,b)=>`Un triángulo rectángulo tiene catetos de ${a} y ${b}. ¿Cuánto mide la hipotenusa?`, pythEx:(a,b,c)=>`${a}² + ${b}² = ${a*a+b*b} = ${c}², así que mide ${c}`,
 slope:(a,b,c,d)=>`¿Cuál es la pendiente de la recta que pasa por (${a}, ${b}) y (${c}, ${d})?`, slopeEx:(r,n,m)=>`Lo que sube entre lo que avanza: ${r} ÷ ${n} = ${m}`,
 area:(l,w)=>`Un jardín mide ${l} m de largo y ${w} m de ancho. ¿Cuál es su área en metros cuadrados?`, areaEx:(l,w,a)=>`Área = largo × ancho = ${l} × ${w} = ${a}`,
 peri:(l,w)=>`Un corral de ovejas mide ${l} m de largo y ${w} m de ancho. ¿Cuánta cerca hace falta para rodearlo entero?`, periEx:(l,w,a)=>`Perímetro = ${l} + ${w} + ${l} + ${w} = ${a}`,
 groups:(x,y,a)=>`${x} grupos de ${y} son ${a}`, divEx:(y,z,x)=>`${y} × ${z} = ${x}, así que ${x} ÷ ${y} = ${z}`,
 word:[
  n=>[`Noé llevó ${n} parejas de animales al arca. ¿Cuántos animales son?`,2*n,`${n} parejas × 2 = ${2*n}`],
  (x,y)=>[`David tenía ${x} ovejas. Luego nacieron ${y} corderos. ¿Cuántas ovejas tiene ahora?`,x+y,`${x} + ${y} = ${x+y}`],
  x=>[`Jesús tenía 12 discípulos. Si ${x} se fueron a pescar, ¿cuántos se quedaron en la orilla?`,12-x,`12 − ${x} = ${12-x}`],
  (x,y)=>[`Pedro pescó ${x} peces y Andrés pescó ${y}. ¿Cuántos peces pescaron en total?`,x+y,`${x} + ${y} = ${x+y}`],
  (k,b)=>[`Se reparten ${k*b} panes en partes iguales entre ${b} familias. ¿Cuántos panes recibe cada familia?`,k,`${k*b} ÷ ${b} = ${k}`],
  ()=>[`Israel marchó alrededor de Jericó una vez al día durante 6 días, y 7 veces el día 7. ¿Cuántas vueltas dieron en total?`,13,`6 + 7 = 13`],
  ()=>[`Un pastor tenía 100 ovejas y una se perdió. ¿Cuántas le quedaron?`,99,`100 − 1 = 99`],
  x=>[`José guardó ${x} graneros de trigo cada año durante 7 años. ¿Cuántos graneros de trigo son?`,7*x,`7 × ${x} = ${7*x}`]],
 word2:[
  ()=>[`El arca medía 300 codos de largo y 50 codos de ancho. ¿Cuál era el área de su piso?`,15000,`300 × 50 = 15 000 codos cuadrados (Génesis 6:15)`],
  ()=>[`El templo de Salomón medía 60 codos de largo y 20 codos de ancho. ¿Cuál era su área?`,1200,`60 × 20 = 1200 codos cuadrados (1 Reyes 6:2)`],
  ()=>[`Matusalén vivió 969 años y Noé vivió 950 años. ¿Cuántos años más vivió Matusalén?`,19,`969 − 950 = 19 (Génesis 5:27; 9:29)`],
  (d,k)=>[`Los sabios de Oriente viajaron ${d} km al día durante ${k} días. ¿Qué distancia recorrieron?`,d*k,`${d} × ${k} = ${d*k} km`],
  (n,c)=>[`Los constructores de Nehemías repararon ${c} metros de muralla cada día durante ${n} días. ¿Cuántos metros repararon en total?`,c*n,`${c} × ${n} = ${c*n}`],
  ()=>[`Después de dar de comer a 5000 personas, sobraron 12 cestas. Si en cada cesta había 25 pedazos, ¿cuántos pedazos sobraron?`,300,`12 × 25 = 300`]]
};
LPX.es=(()=>{
 const NUM=['cero','un','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte','veintiún','veintidós','veintitrés','veinticuatro'];
 const DEN={2:'medio',3:'tercio',4:'cuarto',5:'quinto',6:'sexto',7:'séptimo',8:'octavo',9:'noveno',10:'décimo',11:'onceavo',12:'doceavo',13:'treceavo',14:'catorceavo',15:'quinceavo',16:'dieciseisavo',18:'dieciochoavo',20:'veinteavo',22:'veintidosavo',24:'veinticuatroavo'};
 return {
  sayFrac:(a,b)=>{ const n=parseInt(a,10), d=parseInt(b,10), w=DEN[d];
   if(!w) return `${a} entre ${b}`;
   const num=NUM[n]!==undefined?NUM[n]:a;
   return `${num} ${n===1?w:w+'s'}`; },
  vowels:'aeiouáéíóú',
  swaps:[['b','v'],['v','b'],['ll','y'],['y','ll'],['c','s'],['z','s'],['s','c'],['g','j'],['j','g'],['h',''],['rr','r'],['cc','c'],['á','a'],['é','e'],['í','i'],['ó','o'],['ú','u']]
 };
})();
