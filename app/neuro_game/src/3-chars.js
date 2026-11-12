
/* =====================================================
   CHARACTERS: chibi bipeds + little quadrupeds
   ===================================================== */
var PINK=0xff9bb0;
function critter(o){
  var g=new THREE.Group(), c=o.color, bodyM=T(c,o.em), limbM=T(o.limb||c,o.em);
  var legs=[-1,1].map(function(s){ var L=grp(g,s*.17,.36,0), st=new THREE.Group();
    cy(st,limbM,.105,.34,0,-.17,0); ball(st,T(o.foot||o.limb||c),.13,.08,.18,0,-.33,.05); bake(st); L.add(st); return L; });
  var body=grp(g,0,.36,0), bs=new THREE.Group();
  ball(bs,bodyM,.37,.43,.33,0,.42,0); if(o.belly!==null) ball(bs,T(o.belly||0xfff3e0),.27,.3,.2,0,.37,.17);
  if(o.body) o.body(bs); bake(bs); body.add(bs);
  var arms=[-1,1].map(function(s){ var A=grp(body,s*.36,.62,0), st=new THREE.Group();
    if(o.wing){ ball(st,T(o.wing),.08,.32,.22,s*.04,-.24,0); }
    else { ball(st,limbM,.095,.21,.095,0,-.17,0); ball(st,T(o.hand||o.limb||c),.105,.105,.105,0,-.37,0); }
    bake(st); A.add(st); A.rotation.z=s*.25; return A; });
  var head=grp(body,0,.84,0), hs=new THREE.Group();
  if(o.headShape) o.headShape(hs);
  else { ball(hs,T(o.headColor||c,o.em),.45,.41,.42,0,.36,0);
    [-1,1].forEach(function(s){ ball(hs,B(PINK),.075,.05,.03,s*.275,.25,.35); });
    if(o.mouth!==false) ball(hs,B(DARK),.035,.018,.02,0,.24,.415); }
  if(o.head) o.head(hs); bake(hs); head.add(hs);
  var ex=o.eyeX||.17, ey=o.eyeY||.39, ez=o.eyeZ||.39, er=o.eyeR||.062;
  var eyes=[-1,1].map(function(s){ var E=grp(head,s*ex,ey,ez), st=new THREE.Group();
    ball(st,B(o.eyeColor||DARK),er,er*1.18,er*.6,0,0,0); ball(st,B(0xffffff),er*.36,er*.36,er*.25,er*.3,er*.42,er*.5); bake(st); E.add(st); return E; });
  shadow(g,.52);
  var ch={g:g,body:body,head:head,arms:arms,legs:legs,eyes:eyes,ph:rand()*10,blink:1+rand()*3,walk:0,wave:0,talk:false,headYaw:0,extra:null};
  if(o.extra) ch.extra=o.extra(ch);
  return ch;
}
function animChar(ch,t,dt){
  var ph=ch.ph, w=ch.walk, sw=Math.sin(t*9+ph)*.7*w;
  ch.legs[0].rotation.x=sw; ch.legs[1].rotation.x=-sw;
  ch.body.position.y=.36+Math.abs(Math.sin(t*9+ph))*.05*w+(reduceMotion?0:Math.sin(t*2+ph)*.012);
  ch.body.scale.y=1+Math.sin(t*2+ph)*.014;
  var aL=ch.arms[0], aR=ch.arms[1];
  aL.rotation.x=-sw*.8; aR.rotation.x=sw*.8;
  var zl=-.25-Math.sin(t*1.7+ph)*.05, zr=.25+Math.sin(t*1.7+ph)*.05;
  if(ch.talk){ zl=-.55-Math.sin(t*5)*.3; zr=.55+Math.sin(t*5+1)*.3; aL.rotation.x=-.5+Math.sin(t*4)*.2; aR.rotation.x=-.5+Math.cos(t*4)*.2; }
  else if(ch.wave>0){ ch.wave-=dt; zr=2.5+Math.sin(t*11)*.35; }
  aL.rotation.z+=(zl-aL.rotation.z)*Math.min(1,dt*10); aR.rotation.z+=(zr-aR.rotation.z)*Math.min(1,dt*10);
  ch.head.rotation.z=Math.sin(t*.9+ph)*.06;
  ch.head.rotation.x=ch.talk?Math.sin(t*6)*.07:Math.sin(t*.6+ph)*.03;
  ch.head.rotation.y+=(ch.headYaw-ch.head.rotation.y)*Math.min(1,dt*5);
  ch.blink-=dt; var sy=1; if(ch.blink<0){ sy=.12; if(ch.blink<-.13) ch.blink=2.2+rand()*3.5; }
  ch.eyes[0].scale.y=sy; ch.eyes[1].scale.y=sy;
  if(ch.extra) ch.extra(t,dt);
}
function angDiff(a,b){ var d=(a-b)%(PI*2); if(d>PI) d-=PI*2; if(d<-PI) d+=PI*2; return d; }

/* species kits */
function earsRound(col,inner){ return function(hs){ [-1,1].forEach(function(s){ ball(hs,T(col),.15,.15,.09,s*.33,.7,0); ball(hs,T(inner||PINK),.085,.085,.05,s*.33,.7,.06); }); }; }
function snout(hs,col,nose){ ball(hs,T(col),.15,.11,.1,0,.27,.38); ball(hs,B(nose||DARK),.045,.035,.03,0,.31,.475); }
var KIT={
  percy:{color:0xfde725,em:.35,belly:0xfff6b0,foot:0xf2a93b,
    head:function(hs){ cy(hs,T(0xf2a93b),.02,.3,0,.9,0); ball(hs,B(0x8a63e6),.07,.07,.07,0,1.07,0); },
    extra:function(ch){ var orbs=[0x21918c,0x5ec962,0x8a63e6].map(function(c){ var o=ball(ch.body,B(c),.09,.09,.09,0,0,0); var gl=glow(c,.6,.5); o.add(gl); gl.scale.set(6,6,1); return o; });
      return function(t){ orbs.forEach(function(o,i){ var a=t*1.3+i*2.094; o.position.set(Math.cos(a)*.85,.75+Math.sin(a*1.7)*.2,Math.sin(a)*.85); }); }; }},
  kern:{color:0xb9a3ee,belly:0xe9e0ff,foot:0x7a5fd0,eyeX:.3,eyeY:.36,eyeZ:.16,eyeR:.055,
    headShape:function(hs){ var ks=[-1,0,1,-2,0,2,-1,0,1];
      for(var j=0;j<3;j++) for(var i=0;i<3;i++){ var v=ks[j*3+i], c=v>0?0xfde725:(v<0?0x7a5fd0:0xfff3e0); bx(hs,T(c,v?0.25:0),.27,.27,.27,(i-1)*.3,.36+(1-j)*.3,0); }
      ball(hs,B(PINK),.06,.04,.03,.3,.27,.14); ball(hs,B(PINK),.06,.04,.03,-.3,.27,.14); ball(hs,B(DARK),.04,.02,.02,0,.3,.14); }},
  bear:{color:0xb07a4f,belly:0xf1d9b5,foot:0x8a5a3c,
    head:function(hs){ earsRound(0xb07a4f,0xf1d9b5)(hs); snout(hs,0xf1d9b5);
      ball(hs,T(0xfde725),.4,.2,.38,0,.66,0); bx(hs,T(0xfde725),.5,.04,.2,0,.6,.36); },
    body:function(bs){ bx(bs,T(0xfff3e0),.44,.42,.06,0,.34,.3); bx(bs,T(0x2a9d8f),.16,.12,.04,0,.34,.34); }},
  rabbit:{color:0xfdfbff,belly:0xfff0f4,foot:0xffd6e0,
    head:function(hs){ [-1,1].forEach(function(s){ var e=ball(hs,T(0xfdfbff),.085,.34,.06,s*.17,1.0,0); e.rotation.z=-s*.14; var i=ball(hs,T(PINK),.045,.25,.03,s*.17,1.0,.04); i.rotation.z=-s*.14; });
      ball(hs,B(PINK),.04,.03,.03,0,.3,.42);
      [-1,1].forEach(function(s){ var gg=add(hs,G.torus,T(0x3a4a7a),.1,.1,.1,s*.14,.66,.3); gg.rotation.x=-.5; }); bx(hs,T(0x3a4a7a),.9,.05,.05,0,.62,.05); },
    body:function(bs){ var sc=add(bs,G.torus,T(0xe8695c),.26,.26,.3,0,.8,0); sc.rotation.x=PI/2; bx(bs,T(0xe8695c),.12,.34,.05,.16,.62,.28); ball(bs,T(0xfdfbff),.12,.12,.12,0,.2,-.32); }},
  frog:{color:0x7ccf6a,belly:0xe6f7c8,foot:0x5aae58,eyeX:.21,eyeY:.74,eyeZ:.25,eyeR:.07,mouth:false,
    head:function(hs){ [-1,1].forEach(function(s){ ball(hs,T(0x7ccf6a),.16,.16,.16,s*.21,.7,.08); ball(hs,B(0xffffff),.11,.11,.08,s*.21,.72,.16); });
      bx(hs,B(DARK),.34,.02,.02,0,.22,.41);
      cn(hs,T(0xe8c46a),.62,.3,0,.96,0); cy(hs,T(0xe8c46a),.75,.03,0,.82,0); cy(hs,T(0xe8695c),.4,.06,0,.87,0); }},
  dog:{color:0xf2a65a,belly:0xfff3e0,foot:0xfff3e0,hand:0xfff3e0,
    head:function(hs){ [-1,1].forEach(function(s){ var e=ball(hs,T(0xc97a3a),.11,.24,.13,s*.43,.46,-.02); e.rotation.z=s*.25; }); snout(hs,0xfff3e0); ball(hs,T(0xfff3e0),.1,.14,.05,0,.56,.36); },
    body:function(bs){ var sc=add(bs,G.torus,T(0x3a7bd5),.25,.25,.3,0,.8,0); sc.rotation.x=PI/2; ball(bs,B(0xfde725),.055,.055,.04,0,.72,.3); },
    extra:function(ch){ var tl=grp(ch.body,0,.2,-.3); var t1=ball(tl,T(0xf2a65a),.07,.2,.07,0,.16,-.06); ball(tl,T(0xfff3e0),.075,.09,.075,0,.34,-.1); tl.rotation.x=-.5;
      return function(t){ tl.rotation.z=Math.sin(t*(ch.talk||ch.wave>0?16:6))*.5; }; }},
  owl:{color:0x8a6fb5,belly:0xf1e3ff,foot:0xf2a93b,wing:0x6f57a0,eyeR:.07,eyeX:.18,eyeY:.42,eyeZ:.43,mouth:false,
    head:function(hs){ [-1,1].forEach(function(s){ var d=add(hs,G.cyl,B(0xffffff),.165,.03,.165,s*.18,.42,.4); d.rotation.x=PI/2; var rg=add(hs,G.torus,T(0xf2c14e),.17,.17,.17,s*.18,.42,.405);
        var tf=cn(hs,T(0x6f57a0),.09,.26,s*.3,.8,0); tf.rotation.z=-s*.4; });
      var bk=cn(hs,T(0xf2a93b),.06,.14,0,.3,.44); bk.rotation.x=PI*.75; bx(hs,T(0x2a2440),.56,.04,.56,0,.8,0); bx(hs,T(0x2a2440),.3,.1,.3,0,.75,0); lo(hs,B(0xfde725),.04,.04,.04,.26,.7,.26); },
    body:function(bs){ for(var i=0;i<3;i++) ball(bs,T(0xd9c6f2),.06,.04,.02,(i-1)*.12,.5-(i%2)*.1,.345); }},
  robot:{color:0xdfe6f2,belly:0x8fd3ff,foot:0x7a8aa8,limb:0x9aa8c2,eyeColor:0xfde725,eyeY:.38,eyeZ:.335,eyeX:.15,eyeR:.07,
    headShape:function(hs){ bx(hs,T(0xdfe6f2),.78,.6,.6,0,.38,0); bx(hs,T(0x2a2440),.62,.3,.06,0,.38,.3); edgeBox(.9,.72,.72,0xff8a5c,.05,hs).position.y=.38;
      cy(hs,T(0x9aa8c2),.025,.26,0,.8,0); ball(hs,B(0xff8a5c),.06,.06,.06,0,.95,0); [-1,1].forEach(function(s){ cy(hs,T(0x9aa8c2),.07,.1,s*.42,.38,0).rotation.z=PI/2; }); }},
  cat:{color:0xb8bcd0,belly:0xf5f5fa,
    head:function(hs){ [-1,1].forEach(function(s){ var e=cn(hs,T(0xb8bcd0),.13,.24,s*.27,.76,0); e.rotation.z=-s*.25; var e2=cn(hs,T(PINK),.07,.15,s*.27,.74,.05); e2.rotation.z=-s*.25; });
      ball(hs,B(PINK),.035,.028,.03,0,.3,.42); [-1,1].forEach(function(s){ bx(hs,B(0xffffff),.2,.012,.012,s*.3,.29,.36); }); },
    extra:function(ch){ var tl=grp(ch.body,0,.14,-.3); ball(tl,T(0xb8bcd0),.055,.26,.055,0,.22,-.08); tl.rotation.x=-.7; return function(t){ tl.rotation.z=Math.sin(t*2.2)*.4; }; }},
  fox:{color:0xf08a4b,belly:0xfff3e0,foot:0x5a3a2a,hand:0x5a3a2a,
    head:function(hs){ [-1,1].forEach(function(s){ var e=cn(hs,T(0xf08a4b),.13,.28,s*.27,.78,0); e.rotation.z=-s*.2; var e2=cn(hs,T(0x5a3a2a),.06,.12,s*.275,.88,.01); e2.rotation.z=-s*.2; }); snout(hs,0xfff3e0); },
    body:function(bs){ bx(bs,T(0x2a9d8f),.5,.3,.05,0,.3,.3); },
    extra:function(ch){ var tl=grp(ch.body,0,.2,-.3); ball(tl,T(0xf08a4b),.12,.26,.12,0,.2,-.1); ball(tl,T(0xfff3e0),.1,.12,.1,0,.42,-.16); tl.rotation.x=-.9; return function(t){ tl.rotation.z=Math.sin(t*2.6)*.3; }; }},
  panda:{color:0xfdfbff,belly:0xfdfbff,limb:0x2f2a3a,foot:0x2f2a3a,
    head:function(hs){ earsRound(0x2f2a3a,0x2f2a3a)(hs); [-1,1].forEach(function(s){ var p=ball(hs,T(0x2f2a3a),.11,.13,.04,s*.17,.39,.365); p.rotation.z=s*.3; }); snout(hs,0xfdfbff); },
    body:function(bs){ var sc=add(bs,G.torus,T(0xfde725),.26,.26,.3,0,.8,0); sc.rotation.x=PI/2; }}
};
KIT.panda.eyeColor=0xffffff;

/* quadrupeds: sheep, chick, cat */
function quad(kind){
  var g=new THREE.Group(), body=grp(g,0,0,0), st=new THREE.Group(), legs=[], head, s=1;
  if(kind==='sheep'){
    [[0,.72,0,.42,.36,.5],[.2,.86,.18,.24,.22,.26],[-.2,.86,-.1,.26,.22,.26],[0,.9,-.28,.26,.22,.24],[.18,.78,-.38,.22,.2,.2],[-.2,.74,.3,.22,.2,.22],[0,.98,.08,.24,.18,.26]].forEach(function(p){ ball(st,T(0xfdf6ec),p[3],p[4],p[5],p[0],p[1],p[2]); });
    ball(st,T(0xfdf6ec),.1,.1,.1,0,.8,-.56);
    head=grp(body,0,.86,.52); var hs=new THREE.Group(); ball(hs,T(0x4a4058),.19,.2,.22,0,0,.08); ball(hs,T(0xfdf6ec),.17,.1,.15,0,.17,0);
    [-1,1].forEach(function(q){ var e=ball(hs,T(0x4a4058),.05,.12,.06,q*.22,.04,.02); e.rotation.z=q*1.1; ball(hs,B(0xffffff),.04,.045,.03,q*.09,.05,.26); ball(hs,B(DARK),.022,.026,.02,q*.09,.05,.285); ball(hs,B(PINK),.035,.02,.02,q*.13,-.04,.24); });
    bake(hs); head.add(hs);
    [[-.2,.3],[.2,.3],[-.2,-.3],[.2,-.3]].forEach(function(p){ var L=grp(body,p[0],.46,p[1]), ls=new THREE.Group(); cy(ls,T(0x4a4058),.06,.44,0,-.22,0); bake(ls); L.add(ls); legs.push(L); });
    shadow(g,.62);
  } else if(kind==='chick'){
    ball(st,T(0xfde96a),.2,.19,.22,0,.3,0); ball(st,T(0xfde96a),.06,.1,.12,.19,.3,0); ball(st,T(0xfde96a),.06,.1,.12,-.19,.3,0); ball(st,T(0xfde96a),.06,.06,.08,0,.36,-.22);
    head=grp(body,0,.52,.1); hs=new THREE.Group(); ball(hs,T(0xfde96a),.15,.14,.15,0,0,0); var bk=cn(hs,T(0xff9f43),.045,.1,0,-.01,.16); bk.rotation.x=PI/2;
    [-1,1].forEach(function(q){ ball(hs,B(DARK),.022,.026,.02,q*.07,.03,.13); ball(hs,B(PINK),.03,.02,.02,q*.1,-.03,.115); }); ball(hs,T(0xff9f43),.03,.05,.05,0,.15,0);
    bake(hs); head.add(hs);
    [-.08,.08].forEach(function(x){ var L=grp(body,x,.14,0), ls=new THREE.Group(); cy(ls,T(0xff9f43),.018,.14,0,-.07,0); bx(ls,T(0xff9f43),.07,.015,.1,0,-.14,.03); bake(ls); L.add(ls); legs.push(L); });
    shadow(g,.26);
  } else {
    var c=0xf2a65a; ball(st,T(c),.2,.19,.36,0,.42,0); ball(st,T(0xfff3e0),.14,.12,.2,0,.36,.12);
    head=grp(body,0,.58,.36); hs=new THREE.Group(); ball(hs,T(c),.2,.18,.18,0,0,0);
    [-1,1].forEach(function(q){ var e=cn(hs,T(c),.07,.14,q*.12,.18,0); e.rotation.z=-q*.2; ball(hs,B(DARK),.025,.03,.02,q*.08,.02,.16); ball(hs,B(PINK),.03,.02,.02,q*.13,-.04,.14); }); ball(hs,B(PINK),.02,.016,.02,0,-.03,.18);
    bake(hs); head.add(hs);
    [[-.11,.22],[.11,.22],[-.11,-.22],[.11,-.22]].forEach(function(p){ var L=grp(body,p[0],.28,p[1]), ls=new THREE.Group(); cy(ls,T(0xfff3e0),.045,.28,0,-.14,0); bake(ls); L.add(ls); legs.push(L); });
    var tail=grp(body,0,.5,-.34); ball(tail,T(c),.04,.22,.04,0,.18,-.06); tail.rotation.x=-.6; g.userData.tail=tail;
    shadow(g,.4);
  }
  bake(st); body.add(st);
  return {g:g,body:body,head:head,legs:legs,kind:kind,ph:rand()*10};
}
function animQuad(q,t,speed){
  var f=q.kind==='chick'?16:10, a=speed>0.05?1:0;
  for(var i=0;i<q.legs.length;i++) q.legs[i].rotation.x=Math.sin(t*f+q.ph+((i===0||i===3)?0:PI))*.55*a;
  q.body.position.y=Math.abs(Math.sin(t*f+q.ph))*(q.kind==='chick'?.05:.025)*a;
  q.head.rotation.x=Math.sin(t*f*.5+q.ph)*.08*a+Math.sin(t*.7+q.ph)*.05;
  q.head.rotation.y=Math.sin(t*.5+q.ph*2)*.25;
  if(q.g.userData.tail) q.g.userData.tail.rotation.z=Math.sin(t*2.4+q.ph)*.5;
}

/* NPC registry */
var npcs={}, npcList=[], dlgOpen=null, openDlg=function(){};
function makeNPC(id,name,x,z,kit,face){
  var ch=critter(KIT[kit]); ch.g.position.set(x,0,z); ch.g.rotation.y=face||0; scene.add(ch.g);
  hitSphere(ch.g,.95,0,1.0,0,function(){ openDlg(id); });
  var lb=makeLabel(name,{h:.38,color:'#fde725'}); lb.position.y=2.8; ch.g.add(lb);
  obstacles.push({x:x,z:z,r:.8});
  var n={id:id,name:name,ch:ch,x:x,z:z,face:face||0,wasNear:false}; npcs[id]=n; npcList.push(n); return n;
}
function tickNPC(n,t,dt){
  var ch=n.ch, dx=PL.x-n.ch.g.position.x, dz=PL.z-n.ch.g.position.z, d=Math.hypot(dx,dz), toP=Math.atan2(dx,dz);
  var target=d<9?toP:n.face;
  if(!n.walker||ch.walk<.1) ch.g.rotation.y+=angDiff(target,ch.g.rotation.y)*Math.min(1,dt*4);
  ch.headYaw=d<14?clamp(angDiff(toP,ch.g.rotation.y),-.7,.7):0;
  var isNear=d<5.2; if(isNear&&!n.wasNear) ch.wave=1.7; n.wasNear=isNear;
  ch.talk=(dlgOpen===n.id);
  animChar(ch,t,dt);
  return d;
}
