
/* =====================================================
   SKY, LIGHT
   ===================================================== */
(function(){
  var c=document.createElement('canvas'); c.width=4; c.height=512; var x=c.getContext('2d');
  var g=x.createLinearGradient(0,0,0,512);
  [[0,'#10143f'],[.24,'#2b2a70'],[.38,'#5f3f92'],[.455,'#b8689a'],[.492,'#f6b08c'],[.502,'#8f6fa6'],[1,'#8f6fa6']].forEach(function(s){ g.addColorStop(s[0],s[1]); });
  x.fillStyle=g; x.fillRect(0,0,4,512);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(400,24,16), new THREE.MeshBasicMaterial({map:canvasTex(c),side:THREE.BackSide,fog:false,depthWrite:false})));
  var n=220, p=new Float32Array(n*3), r=mkRng(91);
  for(var i=0;i<n;i++){ var th=r()*PI*2, ph=Math.acos(.25+r()*.75), R=380;
    p[i*3]=R*Math.sin(ph)*Math.cos(th); p[i*3+1]=R*Math.cos(ph); p[i*3+2]=R*Math.sin(ph)*Math.sin(th); }
  var sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(p,3));
  scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xfff3e0,size:1.5,sizeAttenuation:false,fog:false,transparent:true,opacity:.85})));
  var moon=new THREE.Mesh(G.sph,new THREE.MeshBasicMaterial({color:0xfff3d6,fog:false})); moon.scale.set(14,14,14); moon.position.set(-120,150,-300); scene.add(moon);
  var mh=glow(0xffe9c0,110,.4); mh.material.fog=false; mh.position.copy(moon.position); scene.add(mh);
  /* clouds */
  var cm=new THREE.MeshBasicMaterial({color:0xf5c6d6,fog:false,transparent:true,opacity:.9});
  var clouds=[];
  for(i=0;i<8;i++){ var cg=new THREE.Group(), k=3+((r()*3)|0);
    for(var j=0;j<k;j++) lo(cg,cm,7+r()*6,3+r()*2,5+r()*3,(j-k/2)*8+r()*3,r()*2,r()*4);
    bake(cg); cg.position.set(-180+r()*360,46+r()*30,-170+r()*340); scene.add(cg); clouds.push(cg); }
  onTick(function(t,dt){ for(var i=0;i<clouds.length;i++){ var c=clouds[i]; c.position.x+=dt*(1.1+i*.12); if(c.position.x>190) c.position.x=-190; } });
})();
scene.add(new THREE.HemisphereLight(0xd4c8ff,0x4a6a5a,.9));
var sun=new THREE.DirectionalLight(0xffd6ae,.8); sun.position.set(-30,42,24); scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff,.2));

/* =====================================================
   GROUND (one painted texture, reused by the minimap)
   ===================================================== */
var GW=110, GP=1024, mpp=GP/GW, gcan=document.createElement('canvas'); gcan.width=gcan.height=GP;
function w2p(v){ return (v+GW/2)*mpp; }
var PATHS=[[0,44,0,14],[-13,2,-23,2],[13,2,17,2],[0,-11,0,-20],[0,-16,-17,-20],[0,-16,19,-14.5],[0,21,-19,21],[0,21,18,21],[18,21,22,25]];
var ZONES=[[0,2,15],[-26,-2,14.5],[24,2,12],[0,-28,12.5],[-22,-24.5,9.5],[26,-24,12],[-25,19,11],[23,29,6.5],[35,30,4],[0,31,5]];
(function(){
  var x=gcan.getContext('2d'), r=mkRng(5), i;
  x.fillStyle='#4f9f7e'; x.fillRect(0,0,GP,GP);
  for(i=0;i<1400;i++){ x.fillStyle=r()<.5?'rgba(110,190,140,.16)':'rgba(50,120,105,.16)'; x.beginPath(); x.arc(r()*GP,r()*GP,4+r()*16,0,7); x.fill(); }
  /* paddock dirt, yard grid, field edge */
  x.fillStyle='#b99f78'; x.beginPath(); x.arc(w2p(26),w2p(-24),8.7*mpp,0,7); x.fill();
  x.fillStyle='rgba(120,95,70,.35)'; for(i=0;i<160;i++){ var a=r()*7, d=r()*8.4; x.beginPath(); x.arc(w2p(26+Math.cos(a)*d),w2p(-24+Math.sin(a)*d),1+r()*2.5,0,7); x.fill(); }
  x.fillStyle='#5c9fa0'; x.fillRect(w2p(16),w2p(-8),16*mpp,20*mpp);
  x.strokeStyle='rgba(255,255,255,.28)'; x.lineWidth=1.2;
  for(i=0;i<=16;i++){ x.beginPath(); x.moveTo(w2p(16+i),w2p(-8)); x.lineTo(w2p(16+i),w2p(12)); x.stroke(); }
  for(i=0;i<=20;i++){ x.beginPath(); x.moveTo(w2p(16),w2p(-8+i)); x.lineTo(w2p(32),w2p(-8+i)); x.stroke(); }
  /* paths */
  x.lineCap='round'; x.lineJoin='round';
  [['#bfa77e',3.5],['#e6d6ae',3.0]].forEach(function(st){ x.strokeStyle=st[0]; x.lineWidth=st[1]*mpp;
    PATHS.forEach(function(p){ x.beginPath(); x.moveTo(w2p(p[0]),w2p(p[1])); x.lineTo(w2p(p[2]),w2p(p[3])); x.stroke(); }); });
  x.fillStyle='rgba(170,145,105,.5)';
  PATHS.forEach(function(p){ var L=Math.hypot(p[2]-p[0],p[3]-p[1]); for(var k=0;k<L*2.2;k++){ var u=r(), o=(r()-.5)*2.4, nx=-(p[3]-p[1])/L, nz=(p[2]-p[0])/L;
    x.beginPath(); x.ellipse(w2p(p[0]+(p[2]-p[0])*u+nx*o),w2p(p[1]+(p[3]-p[1])*u+nz*o),1.6+r()*2,1.2+r()*1.4,r()*3,0,7); x.fill(); } });
  /* plaza paving */
  var px=w2p(0), pz=w2p(2);
  x.fillStyle='#bfa77e'; x.beginPath(); x.arc(px,pz,13.4*mpp,0,7); x.fill();
  x.fillStyle='#e2d3b4'; x.beginPath(); x.arc(px,pz,13*mpp,0,7); x.fill();
  x.strokeStyle='rgba(160,135,100,.55)'; x.lineWidth=1.4;
  for(i=1;i<=6;i++){ x.beginPath(); x.arc(px,pz,i*2.1*mpp,0,7); x.stroke(); }
  for(i=0;i<36;i++){ var an=i/36*PI*2; x.beginPath(); x.moveTo(px+Math.cos(an)*2.1*mpp,pz+Math.sin(an)*2.1*mpp); x.lineTo(px+Math.cos(an)*13*mpp,pz+Math.sin(an)*13*mpp); x.stroke(); }
  x.fillStyle='rgba(253,231,37,.35)'; x.beginPath(); x.arc(px,pz,2.1*mpp,0,7); x.fill();
  /* pond shore */
  x.fillStyle='#e6d6ae'; x.beginPath(); x.arc(w2p(23),w2p(29),5.4*mpp,0,7); x.fill();
})();
var ground=(function(){
  var t=new THREE.CanvasTexture(gcan); t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  var m=new THREE.Mesh(new THREE.PlaneGeometry(GW,GW), new THREE.MeshBasicMaterial({map:t}));
  m.rotation.x=-PI/2; scene.add(m);
  var o=new THREE.Mesh(new THREE.PlaneGeometry(900,900), new THREE.MeshBasicMaterial({color:0x4f9f7e})); o.rotation.x=-PI/2; o.position.y=-.03; scene.add(o);
  return m;
})();
function distSeg(x,z,p){ var dx=p[2]-p[0], dz=p[3]-p[1], t=clamp(((x-p[0])*dx+(z-p[1])*dz)/(dx*dx+dz*dz),0,1); return Math.hypot(x-p[0]-dx*t,z-p[1]-dz*t); }
function freeSpot(x,z,pm,zm){ var i;
  for(i=0;i<ZONES.length;i++) if(Math.hypot(x-ZONES[i][0],z-ZONES[i][1])<ZONES[i][2]+(zm||0)) return false;
  for(i=0;i<PATHS.length;i++) if(distSeg(x,z,PATHS[i])<pm) return false;
  for(i=0;i<rects.length;i++){ var q=rects[i]; if(x>q.x0-1.5&&x<q.x1+1.5&&z>q.z0-1.5&&z<q.z1+1.5) return false; }
  for(i=0;i<interiors.length;i++){ q=interiors[i]; if(x>q.x0-1&&x<q.x1+1&&z>q.z0-1&&z<q.z1+1) return false; }
  return true; }

/* =====================================================
   VILLAGE: cottages, gate, windmill, pond, lamps
   ===================================================== */
var smokes=[], lampGlows=[];
function addRect(x,z,hw,hd){ rects.push({x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd}); }
function win(g,x,y,z,ry){ var q=grp(g,x,y,z,ry), w=T(WOOD);
  bx(q,w,.98,.98,.08,0,0,0); bx(q,B(0xffd98a),.78,.78,.1,0,0,0); bx(q,w,.06,.78,.12,0,0,0); bx(q,w,.78,.06,.12,0,0,0);
  bx(q,w,1.0,.17,.22,0,-.58,.1);
  [-.32,0,.32].forEach(function(dx,i){ lo(q,B([0xff8fa8,0xfde725,0xffffff][i]),.1,.1,.1,dx,-.44,.13); lo(q,T(0x4fae7a),.13,.07,.1,dx,-.5,.12); }); }
function lantern(p,x,y,z){ bx(p,T(DARK),.2,.06,.2,x,y+.16,z); bx(p,B(0xffd98a),.16,.24,.16,x,y,z); bx(p,T(DARK),.2,.05,.2,x,y-.15,z); }
var interiors=[];
function addRectL(x,z,ry,lx,lz,hw,hd){ var sn=Math.sin(ry), cs=Math.cos(ry), sw=Math.abs(sn)>.5; addRect(x+lx*cs+lz*sn,z-lx*sn+lz*cs,sw?hd:hw,sw?hw:hd); }
function cottage(x,z,ry,wall,roof,w,d,inn){
  var g=grp(ST,x,0,z,ry), wd=T(WOOD), st=T(STONE), wm=T(wall), fh=inn?.08:.36, th=.18, dw=1.5, sd=(w-dw)/2;
  function L(a,b,c){ return new THREE.Vector3(a,b,c).applyMatrix4(g.matrixWorld); }
  g.updateMatrixWorld(true);
  bx(g,st,w+.36,fh,d+.36,0,fh/2,0);
  if(!inn){ bx(g,wm,w,2.5,d,0,1.6,0); bx(g,wd,w+.04,.1,d+.04,0,.42,0); }
  else {
    bx(g,wm,w,2.8,th,0,1.45,-d/2+th/2);
    [-1,1].forEach(function(s){ bx(g,wm,th,2.8,d,s*(w/2-th/2),1.45,0); bx(g,wm,sd,2.8,th,s*(dw/2+sd/2),1.45,d/2-th/2);
      bx(g,B(0xffe2a0),.78,.78,.02,s*(w/2-1.0),1.8,d/2-th-.012); bx(g,B(0xffe2a0),.02,.78,.78,s*(w/2-th-.012),1.8,0); bx(g,wd,.12,2.2,th+.06,s*(dw/2+.02),1.15,d/2-th/2); });
    bx(g,wm,dw,.62,th,0,2.54,d/2-th/2); bx(g,wd,dw+.2,.12,th+.06,0,2.24,d/2-th/2);
    bx(g,T(0xb89068),w-.3,.06,d-.3,0,.11,0); bx(g,T(0xe9dcc6),w-.2,.1,d-.2,0,2.9,0);
    for(var k=1;k<6;k++) bx(g,T(0xa67f5a),.03,.065,d-.34,-w/2+k*w/6,.11,0);
  }
  [-1,1].forEach(function(sx){ [-1,1].forEach(function(sz){ bx(g,wd,.17,inn?2.8:2.5,.17,sx*w/2,inn?1.45:1.6,sz*d/2); }); });
  bx(g,wd,w+.12,.15,.17,0,2.85,d/2); bx(g,wd,w+.12,.15,.17,0,2.85,-d/2); bx(g,wd,.17,.15,d+.12,w/2,2.85,0); bx(g,wd,.17,.15,d+.12,-w/2,2.85,0);
  add(g,gable(w+1,1.95,d+1),T(roof),1,1,1,0,2.9,0);
  [-1,1].forEach(function(s){ add(g,gable(w+.25,1.55,.05),wm,1,1,1,0,2.92,s*(d/2+.51));
    var a=add(g,G.cyl,B(0xffe2a0),.27,.06,.27,0,3.55,s*(d/2+.54)); a.rotation.x=PI/2;
    add(g,G.torus,wd,.29,.29,.29,0,3.55,s*(d/2+.55)); });
  bx(g,T(roof===0xe8695c?0xc9544a:WOOD),.16,.16,d+1.1,0,4.86,0);
  if(!inn){ bx(g,T(0x9a6a46),.98,1.7,.1,0,1.25,d/2+.03); var arch=add(g,G.cyl,T(0x9a6a46),.49,.1,.49,0,2.1,d/2+.03); arch.rotation.x=PI/2;
    bx(g,wd,1.14,.1,.14,0,.44,d/2+.05); lo(g,B(0xfde725),.055,.055,.055,.3,1.2,d/2+.1); bx(g,st,1.5,.2,.6,0,.1,d/2+.45); }
  [-1,1].forEach(function(s){ win(g,s*(w/2-1.0),1.8,d/2+.02,0); });
  win(g,w/2+.02,1.8,0,PI/2); win(g,-w/2-.02,1.8,0,-PI/2);
  bx(g,T(0xb86a5a),.52,1.7,.52,w/4,4.0,-d/4); bx(g,st,.66,.14,.66,w/4,4.9,-d/4);
  lantern(g,.9,2.3,d/2+.2); bx(g,T(DARK),.05,.05,.24,.9,2.5,d/2+.1);
  [-1,1].forEach(function(s){ lo(g,T(0x4fae7a),.42,.34,.38,s*(w/2-.5),.5,d/2+.5); lo(g,B(0xff8fa8),.08,.08,.08,s*(w/2-.4),.82,d/2+.6); lo(g,B(0xfff3d6),.07,.07,.07,s*(w/2-.68),.74,d/2+.75); });
  if(!inn) shadow(g,Math.max(w,d)*.78,0,0);
  smokes.push(L(w/4,5.05,-d/4));
  var gl=glow(0xffc870,2.2,.5); gl.position.copy(L(.9,2.3,d/2+.25)); scene.add(gl); lampGlows.push(gl);
  var sw=Math.abs(Math.sin(ry))>.5;
  if(!inn){ addRect(x,z,(sw?d:w)/2+.35,(sw?w:d)/2+.35); return; }
  interiors.push({x0:x-(sw?d:w)/2,x1:x+(sw?d:w)/2,z0:z-(sw?w:d)/2,z1:z+(sw?w:d)/2});
  addRectL(x,z,ry,0,-d/2+.09,w/2+.3,.31); addRectL(x,z,ry,w/2-.09,0,.31,d/2+.3); addRectL(x,z,ry,-w/2+.09,0,.31,d/2+.3);
  [-1,1].forEach(function(s){ addRectL(x,z,ry,s*(dw/2+sd/2),d/2-.09,sd/2+.1,.31); });
  /* a door that swings open when you walk up */
  var piv=new THREE.Group(), leaf=new THREE.Group(); piv.position.copy(L(-dw/2+.08,0,d/2-th/2)); piv.rotation.y=ry;
  bx(leaf,T(0x9a6a46),dw-.18,2.06,.08,(dw-.18)/2,1.13,0); bx(leaf,wd,dw-.3,.08,.1,(dw-.18)/2,1.6,0); bx(leaf,wd,dw-.3,.08,.1,(dw-.18)/2,.6,0); lo(leaf,B(0xfde725),.06,.06,.06,dw-.38,1.15,.07); lo(leaf,B(0xfde725),.06,.06,.06,dw-.38,1.15,-.07);
  bake(leaf); piv.add(leaf); scene.add(piv);
  var dc=L(0,0,d/2), open=0;
  onTick(function(t,dt){ var tg=Math.hypot(PL.x-dc.x,PL.z-dc.z)<3.4?1:0; open+=(tg-open)*Math.min(1,dt*5); piv.rotation.y=ry-open*1.75; });
  bx(g,B(0xffd98a),.15,.18,.15,0,2.6,0); bx(g,T(DARK),.19,.04,.19,0,2.71,0); bx(g,T(DARK),.03,.16,.03,0,2.8,0);
  inn(g,L,x,z,ry,w,d);
}
/* interior 1: the village history room, with a timeline poster */
function innHistory(g,L,x,z,ry,w,d){
  var wd=T(WOOD);
  disc(g,T(0xe58aa8),1.25,0,.15,.2); disc(g,T(0xf6c9d6),.85,0,.16,.2);
  bx(g,wd,1.5,2.1,.42,-1.55,1.19,-d/2+.42); var BK=[0xe8695c,0x2a9d8f,0xf2c14e,0x9b7fd1,0x4a6fc0,0xff9bb0];
  for(var r=0;r<3;r++){ bx(g,T(0xe9dcc6),1.34,.5,.3,-1.55,.52+r*.64,-d/2+.5); for(var i=0;i<6;i++) bx(g,T(BK[(i+r*2)%6]),.15,.34+((i*7+r)%3)*.05,.24,-2.1+i*.21,.46+r*.64,-d/2+.56); }
  addRectL(x,z,ry,-1.55,-d/2+.45,.85,.35);
  bx(g,wd,.75,.08,1.5,w/2-.6,.86,-.35); [-1,1].forEach(function(s){ bx(g,wd,.08,.72,.08,w/2-.3,.5,-.35+s*.65); bx(g,wd,.08,.72,.08,w/2-.9,.5,-.35+s*.65); });
  lo(g,T(0x4a9fd6),.2,.2,.2,w/2-.6,1.2,-.7); lo(g,T(0x5ec962),.1,.08,.12,w/2-.52,1.26,-.56); cy(g,wd,.04,.14,w/2-.6,.96,-.7); cy(g,wd,.14,.03,w/2-.6,.91,-.7);
  bx(g,T(0xfff3e0),.34,.03,.46,w/2-.6,.915,-.05); bx(g,T(0xe8695c),.3,.05,.22,w/2-.62,.94,.4);
  cy(g,wd,.22,.46,w/2-1.35,.37,-.35); cy(g,T(0xe58aa8),.24,.06,w/2-1.35,.63,-.35);
  addRectL(x,z,ry,w/2-.6,-.35,.45,.8);
  var c=L(.75,1.75,-d/2+.24), p=panel({x:c.x,y:c.y,z:c.z,ry:ry,w:2.5,h:1.56,pw:640,ph:400,posts:false}), k=p.ctx;
  k.fillStyle='#fff6e2'; k.fillRect(0,0,640,400); k.fillStyle='#2a2440'; k.font='600 28px '+FONT; k.textBaseline='middle'; k.fillText('计算机视觉小年表',24,34);
  k.strokeStyle='#e8695c'; k.lineWidth=4; k.beginPath(); k.moveTo(112,66); k.lineTo(112,386); k.stroke();
  [['1998','LeNet:卷积识别手写数字'],['2012','AlexNet:深度学习起飞'],['2014','R-CNN · VGG'],['2015','ResNet · Fast / Faster R-CNN · YOLO'],['2016','SORT:卡尔曼 + 匈牙利追踪'],['2017','Mask R-CNN · Focal Loss · Transformer'],['2020','ViT · DETR'],['2021','CLIP · ByteTrack'],['2023','LLaVA · SAM']].forEach(function(e,i){ var y=84+i*36;
    k.fillStyle='#e8695c'; k.beginPath(); k.arc(112,y,7,0,7); k.fill(); k.fillStyle='#8a6044'; k.font='600 22px "IBM Plex Mono",monospace'; k.fillText(e[0],30,y); k.fillStyle='#2a2440'; k.font='21px '+FONT; k.fillText(e[1],134,y); });
  p.tex.needsUpdate=true; p.plane.userData.tap=function(){ toast('年表上的每一项,村里都有居民能讲给你听'); };
  var s=label('村史馆 · 请进',0,0,0,{h:.36,color:'#fde725'}); s.position.copy(L(0,3.05,d/2+.9));
}
/* interior 2: the grey cat's home, with a fireplace and a notebook of trivia */
function innCat(g,L,x,z,ry,w,d){
  var wd=T(WOOD), st=T(STONE);
  bx(g,T(0x2a9d8f),2.3,.03,1.6,.1,.155,.3); bx(g,T(0xf2c14e),1.9,.035,1.2,.1,.16,.3); bx(g,T(0x2a9d8f),1.6,.04,.9,.1,.165,.3);
  bx(g,wd,1.25,.36,2.05,-w/2+.85,.32,-d/2+1.25); bx(g,T(0xfff3e0),1.15,.2,1.95,-w/2+.85,.6,-d/2+1.25); bx(g,T(0xffffff),.8,.14,.42,-w/2+.85,.76,-d/2+.5); bx(g,T(0xe8695c),1.18,.22,1.2,-w/2+.85,.63,-d/2+1.65); bx(g,wd,1.25,.9,.1,-w/2+.85,.6,-d/2+.26);
  addRectL(x,z,ry,-w/2+.85,-d/2+1.25,.7,1.1);
  bx(g,st,.55,1.5,1.5,w/2-.46,.89,-.5); bx(g,T(DARK),.1,.72,.84,w/2-.72,.54,-.5); bx(g,st,.7,.12,1.7,w/2-.5,1.7,-.5); bx(g,st,.42,1.2,.7,w/2-.42,2.3,-.5);
  [[-.2,.3],[0,.42],[.2,.26]].forEach(function(f){ cn(g,B(0xff9f43),.1,f[1],w/2-.66,.3+f[1]/2,-.5+f[0]); }); cn(g,B(0xfde725),.06,.2,w/2-.64,.36,-.5);
  bx(g,wd,.12,.12,.6,w/2-.7,.24,-.5).rotation.y=.4; addRectL(x,z,ry,w/2-.46,-.5,.4,.85);
  lo(g,T(0xf2c14e),.1,.1,.1,w/2-.5,1.86,-.9); bx(g,T(0x9b7fd1),.08,.3,.2,w/2-.5,1.9,-.2);
  cy(g,wd,.5,.07,-1.2,.74,1.15); cy(g,wd,.07,.62,-1.2,.42,1.15); cy(g,wd,.26,.05,-1.2,.13,1.15);
  lo(g,T(0xfff3e0),.14,.12,.14,-1.4,.9,1.05); cn(g,T(0xfff3e0),.035,.12,-1.22,.9,1.05).rotation.z=-1.2; lo(g,T(0xe8695c),.05,.03,.05,-1.4,1.03,1.05); cy(g,T(0xfff3e0),.06,.08,-1.05,.82,1.38);
  bx(g,T(0xfde725),.32,.045,.24,-.98,.8,.98).rotation.y=.3; obstacles.push({x:L(-1.2,0,1.15).x,z:L(-1.2,0,1.15).z,r:.55});
  disc(g,T(0xff9bb0),.5,1.45,.17,1.3); add(g,G.torus,T(0xf6c9d6),.46,.46,.5,1.45,.24,1.3).rotation.x=PI/2; lo(g,T(0x9b7fd1),.13,.13,.13,.85,.29,1.5);
  var fg=glow(0xff9f43,1.3,.6); fg.position.copy(L(w/2-.9,.6,-.5)); scene.add(fg); onTick(function(t){ fg.material.opacity=.5+Math.sin(t*9)*.12+Math.sin(t*23)*.07; });
  var TIPS=['ImageNet 的 1000 个类别里,有一百多个是不同品种的狗。','卷积网络的灵感来自 1959 年 Hubel 和 Wiesel 对猫视觉皮层的实验。','卡尔曼滤波发表于 1960 年,后来用在了阿波罗飞船的导航上。','MNIST 手写数字集有 6 万张训练图,每张只有 28×28 像素。','YOLO 是 “You Only Look Once” 的缩写:整张图只看一次。'], ti=0;
  var c=L(-.98,.95,.98); hitSphere(scene,.5,c.x,c.y,c.z,function(){ toast(TIPS[ti%TIPS.length]); ti++; });
  var s=label('冷知识本 · 点我',c.x,1.5,c.z,{h:.26}); s=label('阿灰的家 · 请进',0,0,0,{h:.36,color:'#fde725'}); s.position.copy(L(0,3.05,d/2+.9));
}
cottage(-8.5,25,PI/2,CREAM,0xe8695c,5,4.4,innHistory);
cottage(8.5,25,-PI/2,0xf3dcc0,0x2a9d8f,5,4.4,innCat);
cottage(14,14.5,0,0xf9e9d2,0xf2c14e,5.4,4.4);
cottage(31,21,-PI/2,CREAM,0x9b7fd1,5,4.4);
cottage(-9,14.5,0,0xf3dcc0,0xe58aa8,5,4.2);

function lampPost(x,z){ var g=grp(ST,x,0,z);
  cy(g,T(DARK),.07,3.1,0,1.55,0); cy(g,T(DARK),.14,.2,0,.1,0); bx(g,T(DARK),.5,.06,.06,.22,3.05,0); lantern(g,.45,2.78,0); shadow(g,.3);
  var gl=glow(0xffc870,3.2,.55); gl.position.set(x+.45,2.78,z); scene.add(gl); lampGlows.push(gl); obstacles.push({x:x,z:z,r:.3}); }
[[2.3,27],[-2.3,19],[2.3,-13.5],[-2.3,-18.5],[-15,3.9],[15,.2],[-9,-19.5],[10,-13.5],[-10,22.9],[9,22.9],[-13.5,-9],[13.5,-9],[-13.5,13],[12.5,10]].forEach(function(p){ lampPost(p[0],p[1]); });

/* gate with bunting */
(function(){
  var g=grp(ST,0,0,31), wd=T(WOOD);
  [-1,1].forEach(function(s){ cy(g,wd,.24,4.4,s*2.9,2.2,0); cy(g,T(STONE),.36,.5,s*2.9,.25,0); lantern(g,s*2.9,3.2,.42); obstacles.push({x:s*2.9,z:31,r:.5});
    var gl=glow(0xffc870,2.8,.5); gl.position.set(s*2.9,3.2,31.45); scene.add(gl); lampGlows.push(gl); });
  bx(g,wd,6.9,.34,.34,0,4.45,0); bx(g,T(WOOD2),4.4,1.0,.14,0,3.55,0); bx(g,wd,.08,.5,.08,-1.8,4.1,0); bx(g,wd,.08,.5,.08,1.8,4.1,0);
  var cols=[0xe8695c,0xfde725,0x2a9d8f,0xff9bb0,0x9b7fd1];
  for(var i=0;i<11;i++){ var u=i/10, x=-2.7+u*5.4, y=2.95-Math.sin(u*PI)*.42; var f=add(g,G.pyr,T(cols[i%5]),.17,.3,.03,x,y,.02); f.rotation.x=PI; }
  label('神经视界村',0,3.55,31.3,{h:.72,color:'#fde725',bg:'rgba(20,22,58,.0)',border:'rgba(0,0,0,0)'});
})();

/* windmill */
(function(){
  var ry=PI*1.25, g=grp(ST,35,0,30,ry);
  add(g,G.taper,T(CREAM),2,6,2,0,3,0); cn(g,T(0xe8695c),1.75,1.6,0,6.8,0); cy(g,T(STONE),2.15,.4,0,.2,0);
  bx(g,T(0x9a6a46),.9,1.6,.2,0,1.2,1.9); win(g,0,3.4,1.62,0); cy(g,T(WOOD),.16,1.0,0,5.3,1.5).rotation.x=PI/2; shadow(g,2.8);
  var bl=new THREE.Group();
  for(var i=0;i<4;i++){ var a=grp(bl,0,0,0); a.rotation.z=i*PI/2; bx(a,T(WOOD),.14,3.5,.07,0,1.85,0); bx(a,T(0xfff3e0),.8,2.5,.035,.47,2.2,0);
    for(var k=0;k<4;k++) bx(a,T(WOOD),.8,.05,.05,.47,1.2+k*.66,.02); }
  lo(bl,T(WOOD),.24,.24,.24,0,0,0); bake(bl);
  var piv=new THREE.Group(); piv.position.set(35+Math.sin(ry)*2.0,5.3,30+Math.cos(ry)*2.0); piv.rotation.y=ry; piv.add(bl); scene.add(piv);
  onTick(function(t){ bl.rotation.z=t*.5; });
  obstacles.push({x:35,z:30,r:2.4});
})();

/* pond with ducks */
(function(){
  var px=23, pz=29;
  disc(ST,B(0x58b6d6),4.6,px,.05,pz); disc(ST,B(0x7fd0e6),3.2,px-.4,.06,pz+.3);
  [[1.8,1.2],[-2.2,-1.4],[.4,-2.6],[-1.2,2.6]].forEach(function(p,i){ disc(ST,T(0x4fae7a),.42,px+p[0],.08,pz+p[1]); if(i%2===0) lo(ST,B(0xff9bb0),.13,.1,.13,px+p[0]+.1,.16,pz+p[1]); });
  for(var i=0;i<9;i++){ var a=i/9*PI*2+.3; lo(ST,T(STONE),.4+rand()*.3,.24,.35+rand()*.3,px+Math.cos(a)*4.9,.12,pz+Math.sin(a)*4.9); }
  for(i=0;i<7;i++){ a=2.2+i*.22; var rx=px+Math.cos(a)*4.75, rz=pz+Math.sin(a)*4.75; cy(ST,T(0x5a9a5a),.035,1.3+rand()*.5,rx,.7,rz); lo(ST,T(0x7a5540),.07,.2,.07,rx,1.4+rand()*.3,rz); }
  obstacles.push({x:px,z:pz,r:4.7});
  var ducks=[0,1].map(function(i){ var d=new THREE.Group(), c=i?0xfff3d6:0xfde725;
    lo(d,T(c),.26,.2,.36,0,.14,0); lo(d,T(c),.17,.17,.17,0,.42,.24); cn(d,T(0xff9f43),.06,.16,0,.4,.44).rotation.x=PI/2;
    lo(d,T(c),.08,.1,.12,0,.24,-.34); lo(d,B(DARK),.03,.03,.03,.1,.47,.36); lo(d,B(DARK),.03,.03,.03,-.1,.47,.36); bake(d); scene.add(d); return d; });
  var rings=[0,1,2].map(function(i){ var m=new THREE.Mesh(new THREE.RingGeometry(.9,1,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.4,depthWrite:false}));
    m.rotation.x=-PI/2; m.position.set(px+(i-1)*1.6,.09,pz+(i%2?1:-1.2)); scene.add(m); return m; });
  onTick(function(t){ ducks.forEach(function(d,i){ var a=t*(.22+i*.07)*(i?-1:1)+i*2.5, r=2.1+i*.9; d.position.set(px+Math.cos(a)*r,.02+Math.sin(t*2.4+i)*.025,pz+Math.sin(a)*r);
      d.rotation.y=-a+(i?PI:0); d.rotation.z=Math.sin(t*1.7+i)*.06; });
    rings.forEach(function(m,i){ var u=(t*.35+i*.33)%1; m.scale.setScalar(.3+u*1.6); m.material.opacity=.45*(1-u); }); });
})();

/* benches + well on the plaza edge */
(function(){
  [[-9.5,11.2,.7],[9.5,11.2,-.7]].forEach(function(p){ var g=grp(ST,p[0],0,p[1],p[2]);
    bx(g,T(WOOD2),1.9,.1,.55,0,.5,0); bx(g,T(WOOD2),1.9,.5,.08,0,.9,-.25); [-.8,.8].forEach(function(s){ bx(g,T(WOOD),.1,.5,.5,s,.25,0); }); shadow(g,1.1); obstacles.push({x:p[0],z:p[1],r:.9}); });
  var w=grp(ST,-10.5,0,-6.5); cy(w,T(STONE),.95,.8,0,.4,0); cy(w,B(0x58b6d6),.75,.05,0,.79,0);
  [-1,1].forEach(function(s){ bx(w,T(WOOD),.12,1.9,.12,s*.85,1.4,0); }); add(w,gable(2.3,.7,1.4),T(0xe8695c),1,1,1,0,2.3,0); cy(w,T(WOOD),.06,1.7,0,2.0,0).rotation.z=PI/2; shadow(w,1.3);
  obstacles.push({x:-10.5,z:-6.5,r:1.2});
})();

/* =====================================================
   NATURE: trees, flowers, tufts, rocks, hills, fireflies
   ===================================================== */
(function(){
  var white=new THREE.MeshToonMaterial({color:0xffffff}), white2=new THREE.MeshBasicMaterial({color:0xffffff});
  var iTrunk=new Inst(G.cyl,T(0x7a5540),170), iLeaf=new Inst(G.lo,white,420), iPine=new Inst(G.cone,white,240);
  var LEAF=[0x4fae7a,0x66c08a,0x3d9a78,0x7ccf8f,0x58b890], PINE=[0x2f8a70,0x3a9a7a,0x2a7f72], r=mkRng(77);
  function tree(x,z,s,kind,col){
    if(kind){ iTrunk.add(x,.4*s,z,.15*s,.8*s,.15*s); var c=PINE[(r()*3)|0];
      iPine.add(x,1.5*s,z,1.0*s,1.6*s,1.0*s,0,c); iPine.add(x,2.35*s,z,.8*s,1.4*s,.8*s,0,c); iPine.add(x,3.1*s,z,.56*s,1.2*s,.56*s,0,c);
    } else { iTrunk.add(x,.7*s,z,.18*s,1.4*s,.18*s); c=col||LEAF[(r()*5)|0];
      iLeaf.add(x,2.15*s,z,1.08*s,1.0*s,1.08*s,0,c); iLeaf.add(x+.6*s,1.75*s,z+.2*s,.72*s,.66*s,.72*s,0,c); iLeaf.add(x-.52*s,1.85*s,z-.28*s,.78*s,.7*s,.78*s,0,c); }
    shadow(ST,1.0*s,x,z); obstacles.push({x:x,z:z,r:.42*s});
  }
  var i,x,z,a,d;
  for(i=0;i<64;i++){ a=i/64*PI*2+r()*.06; d=49.5+r()*4.5; tree(Math.cos(a)*d,Math.sin(a)*d,1.1+r()*.6,r()<.45?1:0); }
  for(i=0;i<300&&iTrunk.n<118;i++){ x=(r()-.5)*90; z=(r()-.5)*90; if(Math.hypot(x,z)>46||!freeSpot(x,z,3.2,1)) continue;
    tree(x,z,.85+r()*.5,r()<.3?1:0,r()<.14?0xf4a6c0:undefined); }
  iTrunk.done(); iLeaf.done(); iPine.done();
  var iFl=new Inst(G.lo,white2,330), iTuft=new Inst(G.cone,white,560), FL=[0xff8fa8,0xfde725,0xffffff,0xc59bff,0xffb26b,0x8fd3ff];
  for(i=0;i<1400&&iFl.n<320;i++){ x=(r()-.5)*96; z=(r()-.5)*96; if(!freeSpot(x,z,1.9,-1.2)) continue; var c=FL[(r()*6)|0], k=1+((r()*3)|0);
    for(var j=0;j<k;j++) iFl.add(x+(r()-.5)*.7,.14+r()*.08,z+(r()-.5)*.7,.09,.075,.09,0,c); }
  for(i=0;i<36;i++){ a=i/36*PI*2; if(Math.abs(Math.sin(a))>.97||Math.abs(Math.cos(a))>.97) continue; iFl.add(Math.cos(a)*14.1,.16,2+Math.sin(a)*14.1,.12,.1,.12,0,FL[i%6]); }
  for(i=0;i<2400&&iTuft.n<550;i++){ x=(r()-.5)*104; z=(r()-.5)*104; if(!freeSpot(x,z,1.7,-.5)) continue; iTuft.add(x,.14,z,.07,.3,.07,0,[0x6fbf8a,0x5aae82,0x86cf96][(r()*3)|0]); iTuft.add(x+.1,.11,z+.06,.06,.22,.06,0,0x6fbf8a); }
  iFl.done(); iTuft.done();
  for(i=0;i<16;i++){ x=(r()-.5)*84; z=(r()-.5)*84; if(!freeSpot(x,z,2.4,0)) continue; lo(ST,T(STONE),.35+r()*.4,.22+r()*.2,.3+r()*.35,x,.12,z); if(r()<.6) lo(ST,T(0xb8b2c6),.2,.15,.2,x+.45,.08,z+.2); }
  for(i=0;i<12;i++){ x=(r()-.5)*80; z=(r()-.5)*80; if(!freeSpot(x,z,2.2,0)) continue; cy(ST,T(0xfff3e0),.06,.2,x,.1,z); var cap=lo(ST,T(0xe8695c),.17,.12,.17,x,.22,z); lo(ST,B(0xffffff),.035,.03,.035,x+.07,.31,z+.04); lo(ST,B(0xffffff),.03,.03,.03,x-.08,.29,z-.05); }
  for(i=0;i<18;i++){ a=i/18*PI*2+r()*.2; d=82+r()*26; lo(ST,T([0x3f8a78,0x4a947f,0x39806f][i%3]),20+r()*16,8+r()*9,20+r()*14,Math.cos(a)*d,-2.5,Math.sin(a)*d); }
  /* fireflies */
  var n=70, base=new Float32Array(n*3), pos=new Float32Array(n*3);
  for(i=0;i<n;i++){ base[i*3]=(r()-.5)*84; base[i*3+1]=.6+r()*2.6; base[i*3+2]=(r()-.5)*84; }
  var fg=new THREE.BufferGeometry(); fg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  var ff=new THREE.Points(fg,new THREE.PointsMaterial({size:.5,map:glowTex,color:0xfff08a,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false})); ff.frustumCulled=false; scene.add(ff);
  onTick(function(t){ for(var i=0;i<n;i++){ var o=i*3; pos[o]=base[o]+Math.sin(t*.4+i)*1.6; pos[o+1]=base[o+1]+Math.sin(t*.7+i*2.1)*.5; pos[o+2]=base[o+2]+Math.cos(t*.33+i*1.3)*1.6; }
    fg.attributes.position.needsUpdate=true; ff.material.opacity=.65+Math.sin(t*2.2)*.25; });
})();

/* chimney smoke + lamp flicker */
(function(){
  var puffs=[];
  smokes.forEach(function(v,si){ for(var k=0;k<4;k++){ var s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xf3e6f0,transparent:true,depthWrite:false,opacity:.4})); scene.add(s); puffs.push({s:s,v:v,ph:k/4+si*.13}); } });
  onTick(function(t){ for(var i=0;i<puffs.length;i++){ var p=puffs[i], u=(t*.16+p.ph)%1; p.s.position.set(p.v.x+Math.sin(u*5+i)*.3+u*.8,p.v.y+u*3.2,p.v.z); var sc=.5+u*1.5; p.s.scale.set(sc,sc,1); p.s.material.opacity=.42*(1-u); }
    for(i=0;i<lampGlows.length;i++) lampGlows[i].material.opacity=.5+Math.sin(t*5+i*1.7)*.05+Math.sin(t*13+i)*.03; });
})();

/* fences */
var iPost=new Inst(G.cyl,T(WOOD2),260), iRail=new Inst(G.box,T(WOOD2),520);
function fence(pts){ for(var i=0;i<pts.length;i++){ var p=pts[i]; iPost.add(p[0],.45,p[1],.07,.9,.07);
  if(i<pts.length-1&&!p[2]){ var q=pts[i+1], dx=q[0]-p[0], dz=q[1]-p[1], L=Math.hypot(dx,dz), ry=-Math.atan2(dz,dx);
    iRail.add((p[0]+q[0])/2,.72,(p[1]+q[1])/2,L,.08,.05,ry); iRail.add((p[0]+q[0])/2,.4,(p[1]+q[1])/2,L,.08,.05,ry); } } }
function line(x0,z0,x1,z1,n){ var a=[]; for(var i=0;i<=n;i++) a.push([x0+(x1-x0)*i/n,z0+(z1-z0)*i/n]); return a; }
