/* Gate order in Bible order. Worlds that are not part of this build are left out. */
ORDER.splice(0,ORDER.length,...[1,2,11,23,12,29,3,4,30,5,31,19,20,13,24,6,25,14,32,15,35,7,33,16,21,8,36,26,27,9,34,22,28,10,37,17,38,39,18,40].filter(id=>CH[id]));
HUB.w=Math.max(HUB.w,ORDER.length*3+6);
