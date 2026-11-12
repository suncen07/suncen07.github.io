
/* =====================================================
   2D icon kit (used on the R-CNN and VLM boards)
   ===================================================== */
function icoTree(c,x,y,s){ c.fillStyle='#8a5a3c'; c.fillRect(x-6*s,y-40*s,12*s,40*s);
  c.fillStyle='#3d9a5a'; [[0,-70,34],[-22,-52,26],[22,-52,26]].forEach(function(p){ c.beginPath(); c.arc(x+p[0]*s,y+p[1]*s,p[2]*s,0,7); c.fill(); });
  c.fillStyle='#5ec962'; c.beginPath(); c.arc(x-8*s,y-78*s,14*s,0,7); c.fill(); }
function icoHouse(c,x,y,s){ c.fillStyle='#b86a5a'; c.fillRect(x+18*s,y-88*s,12*s,26*s);
  c.fillStyle='#f6e7cf'; c.fillRect(x-40*s,y-50*s,80*s,50*s);
  c.fillStyle='#e8695c'; c.beginPath(); c.moveTo(x-50*s,y-50*s); c.lineTo(x,y-90*s); c.lineTo(x+50*s,y-50*s); c.fill();
  c.fillStyle='#8a5a3c'; c.fillRect(x-8*s,y-28*s,16*s,28*s);
  c.fillStyle='#ffd98a'; c.fillRect(x-32*s,y-36*s,16*s,14*s); c.fillRect(x+16*s,y-36*s,16*s,14*s); }
function icoCat(c,x,y,s){ c.strokeStyle='#f2a65a'; c.lineWidth=7*s; c.lineCap='round'; c.beginPath(); c.arc(x+22*s,y-22*s,16*s,-1.2,1.3); c.stroke();
  c.fillStyle='#f2a65a'; c.beginPath(); c.ellipse(x,y-22*s,24*s,22*s,0,0,7); c.fill(); c.beginPath(); c.arc(x,y-54*s,18*s,0,7); c.fill();
  [-1,1].forEach(function(k){ c.beginPath(); c.moveTo(x+k*17*s,y-62*s); c.lineTo(x+k*13*s,y-82*s); c.lineTo(x+k*3*s,y-69*s); c.fill(); });
  c.fillStyle='#fff3e0'; c.beginPath(); c.ellipse(x,y-18*s,13*s,14*s,0,0,7); c.fill();
  c.fillStyle='#2a2440'; [-1,1].forEach(function(k){ c.beginPath(); c.arc(x+k*7*s,y-56*s,2.6*s,0,7); c.fill(); });
  c.fillStyle='#ff9bb0'; c.beginPath(); c.arc(x,y-50*s,2.2*s,0,7); c.fill(); }
function icoSheep(c,x,y,s){ c.fillStyle='#4a4058'; [-14,-5,6,15].forEach(function(d){ c.fillRect(x+d*s-2*s,y-18*s,4.5*s,18*s); });
  c.fillStyle='#fdf6ec'; [[0,-30,20],[-16,-28,15],[16,-28,15],[-8,-40,14],[9,-40,14]].forEach(function(p){ c.beginPath(); c.arc(x+p[0]*s,y+p[1]*s,p[2]*s,0,7); c.fill(); });
  c.fillStyle='#4a4058'; c.beginPath(); c.ellipse(x+27*s,y-36*s,10*s,12*s,0,0,7); c.fill();
  c.fillStyle='#fff'; c.beginPath(); c.arc(x+30*s,y-39*s,2.4*s,0,7); c.fill(); }
function icoBg(c,x,y,w,h,night){ var g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#aee0f6'); g.addColorStop(.72,'#e6f6fb'); g.addColorStop(.721,'#9ed59a'); g.addColorStop(1,'#7cc486');
  c.fillStyle=g; c.fillRect(x,y,w,h); c.fillStyle='#ffe58a'; c.beginPath(); c.arc(x+w*.84,y+h*.17,h*.075,0,7); c.fill();
  c.fillStyle='rgba(255,255,255,.9)'; [[.2,.16,.05],[.26,.14,.065],[.32,.17,.045]].forEach(function(p){ c.beginPath(); c.arc(x+w*p[0],y+h*p[1],h*p[2],0,7); c.fill(); }); }
function iouB(a,b){ var x0=Math.max(a[0],b[0]), y0=Math.max(a[1],b[1]), x1=Math.min(a[0]+a[2],b[0]+b[2]), y1=Math.min(a[1]+a[3],b[1]+b[3]);
  var i=Math.max(0,x1-x0)*Math.max(0,y1-y0); return i/(a[2]*a[3]+b[2]*b[3]-i); }

/* =====================================================
   4. R-CNN WORKSHOP — three generations of two-stage detectors
   ===================================================== */
var RC={mode:0,t:0,acc:0,props:[],fin:[]};
var RGT=[{n:'房子',b:[55,155,150,135],col:'#ff8a5c'},{n:'树',b:[229,102,182,198],col:'#5ec962'},{n:'猫',b:[470,211,72,94],col:'#fde725'}];
var RTITLE=['R-CNN 2014 · 每个候选框单独过一次 CNN','Fast R-CNN 2015 · 整图过一次 CNN + RoI 池化','Faster R-CNN 2015 · 候选框由 RPN 网络提出'];
var pRC=panel({x:-22,y:3.75,z:-27.2,ry:0,w:7.2,h:4.5,pw:640,ph:400});
function rcGen(){
  var r=mkRng(31+RC.mode*7), m=RC.mode, P=[], i;
  RGT.forEach(function(g){ for(var k=0;k<(m===2?4:3);k++){ var w=g.b[2]*(.8+r()*.4), h=g.b[3]*(.8+r()*.4);
    P.push([g.b[0]+g.b[2]/2-w/2+(r()-.5)*g.b[2]*.3, g.b[1]+g.b[3]/2-h/2+(r()-.5)*g.b[3]*.3, w, h]); } });
  for(i=0;i<(m===2?5:34);i++){ var w=40+r()*170, h=40+r()*150; P.push([r()*(640-w),r()*(340-h),w,h]); }
  for(i=P.length-1;i>0;i--){ var j=(r()*(i+1))|0, t=P[i]; P[i]=P[j]; P[j]=t; }
  RC.props=P.map(function(b){ var best=0, bi=-1; RGT.forEach(function(g,gi){ var u=iouB(b,g.b); if(u>best){ best=u; bi=gi; } });
    return {b:b,g:best>=.5?bi:-1,s:best>=.5?.55+.45*(best-.5)/.5:0,iou:best}; });
  RC.fin=RGT.map(function(g,gi){ var top=null; RC.props.forEach(function(p){ if(p.g===gi&&(!top||p.s>top.s)) top=p; });
    return top?{g:gi,s:top.s,b:top.b.map(function(v,k){ return v+(g.b[k]-v)*.75; })}:null; }).filter(Boolean);
  RC.t=0;
}
function rcDraw(){
  var c=pRC.ctx, m=RC.mode, N=RC.props.length, tau=RC.t;
  var a=m>0?1.0:0, b=a+(m===0?.8:(m===1?.5:.7)), per=m===0?.2:.05, e=b+N*per, i;
  if(tau>e+4.5){ RC.t=0; tau=0; }
  icoBg(c,0,0,640,340); icoHouse(c,130,290,1.5); icoTree(c,320,300,1.9); icoCat(c,500,305,1.15);
  if(m>0&&tau<a){ var rr2=mkRng(3); for(var gy=0;gy<9;gy++) for(var gx=0;gx<17;gx++){ c.fillStyle=virCss(rr2()); c.globalAlpha=.25+.45*Math.abs(Math.sin(tau*6+gx*.6+gy)); c.fillRect(gx*38,gy*38,37,37); }
    c.globalAlpha=1; c.fillStyle='rgba(20,22,58,.85)'; c.fillRect(150,150,340,44); c.fillStyle='#fde725'; c.font='600 22px '+FONT; c.textAlign='center'; c.textBaseline='middle'; c.fillText('整张图过一次 CNN → 特征图',320,173); }
  var vis=tau<a?0:Math.ceil(N*clamp((tau-a)/(b-a),0,1)), done=clamp(Math.floor((tau-b)/per),0,N);
  c.textAlign='left'; c.textBaseline='alphabetic';
  for(i=0;i<vis;i++){ var p=RC.props[i], q=p.b;
    if(i<done){ if(tau>=e) continue; if(p.g>=0){ c.strokeStyle=RGT[p.g].col; c.lineWidth=2.5; c.setLineDash([]); } else { c.strokeStyle='rgba(60,60,90,.28)'; c.lineWidth=1; c.setLineDash([]); } }
    else if(i===done&&tau>=b){ c.strokeStyle='#fde725'; c.lineWidth=5; c.setLineDash([]);
      c.fillStyle='rgba(20,22,58,.9)'; c.fillRect(q[0],q[1]-24,m===0?74:106,24); c.fillStyle='#fde725'; c.font='600 16px '+FONT; c.fillText(m===0?'→ CNN':'→ RoI 池化',q[0]+6,q[1]-7); }
    else { c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=1.5; c.setLineDash([6,5]); }
    c.strokeRect(q[0],q[1],q[2],q[3]); }
  c.setLineDash([]);
  if(tau>=e) RC.fin.forEach(function(f){ var g=RGT[f.g], q=f.b; c.strokeStyle=g.col; c.lineWidth=5; c.strokeRect(q[0],q[1],q[2],q[3]);
    var tx=g.n+' '+f.s.toFixed(2); c.font='600 20px '+FONT; var tw=c.measureText(tx).width+12; c.fillStyle=g.col; c.fillRect(q[0]-2,q[1]-28,tw,28); c.fillStyle='#1a1630'; c.fillText(tx,q[0]+4,q[1]-8); });
  c.fillStyle='#14163a'; c.fillRect(0,340,640,60);
  c.fillStyle='#fde725'; c.font='600 20px '+FONT; c.fillText(RTITLE[m],14,364);
  var sim=m===0?47*done/N:(m===1?2.3:0.2)*clamp(tau/e,0,1);
  c.fillStyle='#f1efff'; c.font='17px '+FONT;
  c.fillText('候选 '+done+'/'+N+'(代表约 '+(m===2?300:2000)+' 个)· 模拟用时 '+sim.toFixed(1)+' 秒'+(tau>=e?' · 完成':'')+' · 点击换代',14,389);
  pRC.tex.needsUpdate=true;
}
function rcNext(){ RC.mode=(RC.mode+1)%3; rcGen(); rcDraw(); doneTask('rcnn'); toast(RTITLE[RC.mode].split(' · ')[0]+':看候选框的数量和处理速度'); }
pRC.plane.userData.tap=rcNext; rcGen(); rcDraw();
onTick(function(t,dt){ if(!near(-22,-24,42)) return; RC.t+=dt; RC.acc+=dt; if(RC.acc>.08){ RC.acc=0; rcDraw(); } });
(function(){
  bx(ST,T(0xcdbfa6),10,.14,6.4,-22,.07,-25.2); bx(ST,T(0xf3dcc0),9.6,6.6,.3,-22,3.3,-27.75);
  var roof=bx(ST,T(0x2a9d8f),10.6,.26,7.2,-22,6.95,-25.3); roof.rotation.x=.14;
  [-4.7,4.7].forEach(function(s){ cy(ST,T(WOOD),.18,6.2,-22+s,3.1,-22.3); obstacles.push({x:-22+s,z:-22.3,r:.4}); });
  addRect(-22,-27.8,5,.6);
  /* the "CNN" machine with a spinning gear */
  var g=grp(ST,-15.6,0,-25.2); bx(g,T(0x2a9d8f),1.8,2.1,1.5,0,1.05,0); bx(g,T(0x1f7f76),2.0,.2,1.7,0,2.2,0); cy(g,T(DARK),.2,1.0,.5,2.8,-.3); cy(g,T(STONE),.26,.12,.5,3.35,-.3);
  bx(g,T(DARK),1.2,.6,.06,0,1.5,.76); [-.4,0,.4].forEach(function(x,i){ lo(g,B([0xfde725,0x5ec962,0xff8a5c][i]),.08,.08,.05,x,.7,.78); }); shadow(g,1.6);
  obstacles.push({x:-15.6,z:-25.2,r:1.3});
  var gear=new THREE.Group(); add(gear,G.torus,T(0xf2c14e),.42,.42,.5,0,0,0); for(var i=0;i<8;i++){ var t=bx(gear,T(0xf2c14e),.16,.22,.12,Math.cos(i*PI/4)*.52,Math.sin(i*PI/4)*.52,0); t.rotation.z=i*PI/4-PI/2; }
  cy(gear,T(DARK),.1,.14,0,0,0).rotation.x=PI/2; bake(gear); gear.position.set(-15.6,1.5,-24.38); scene.add(gear);
  onTick(function(t){ gear.rotation.z=t*(RC.mode===0?.8:3); });
  label('CNN',-15.6,3.0,-24.3,{h:.42,color:'#fde725'});
  [[-26.4,-23.2,.9],[-25.6,-22.6,.6]].forEach(function(p){ var e=edgeBox(p[2],p[2],p[2],0xffffff,.05,ST); e.position.set(p[0],p[2]/2+.05,p[1]); });
  bx(ST,T(WOOD2),1.1,.7,1.1,-26.2,.35,-24.6); obstacles.push({x:-26.1,z:-23.5,r:1.3});
  label('R-CNN 工坊',-22,8.6,-25,{h:1.0,color:HOT.color,border:HOT.border});
})();

/* =====================================================
   5. YOLO FIELD + THRESHOLD GATE — real thresholding, NMS, precision / recall
   ===================================================== */
var YF={x0:-6,z0:-34,size:12,S:6,thrI:2,nms:true};
var YTHR=[.1,.25,.5,.75,.9], YCLS=['南瓜','稻草人','木桶','干草'], YCOL=['#ff9f43','#fde725','#d9a066','#9be36a'];
var YGT=[{c:0,x:-3.2,z:-31.2,w:1.7,d:1.7,base:.96},{c:0,x:3.9,z:-30.1,w:.95,d:.95,base:.42},{c:1,x:.6,z:-27.3,w:1.5,d:1.2,base:.91},{c:2,x:-3.6,z:-24.6,w:1.3,d:1.3,base:.88},{c:3,x:3.3,z:-24.4,w:2.2,d:1.5,base:.93}];
var ycand=[], ystat={};
(function(){ var r=mkRng(808);
  YGT.forEach(function(g){ var j;
    for(j=0;j<3;j++){ var jt=.05+.09*j, sz=.08+.12*j; ycand.push({c:g.c,x:g.x+(r()-.5)*2*jt,z:g.z+(r()-.5)*2*jt,w:g.w*(1+(r()-.5)*sz),d:g.d*(1+(r()-.5)*sz),s:Math.max(.12,g.base-j*.12)}); }
    for(j=0;j<2;j++){ var a=r()*PI*2; ycand.push({c:g.c,x:g.x+Math.cos(a)*g.w*.42,z:g.z+Math.sin(a)*g.d*.42,w:g.w*(.85+r()*.3),d:g.d*(.85+r()*.3),s:.14+r()*.2}); } });
  [[2,1.5,-32.3,1.1,1.1,.58],[0,-.8,-22.9,.9,.9,.35],[3,-1.2,-29.6,1.6,1.0,.22],[1,4.7,-27.4,.9,1.3,.13]].forEach(function(f){ ycand.push({c:f[0],x:f[1],z:f[2],w:f[3],d:f[4],s:f[5]}); });
  ycand.sort(function(a,b){ return b.s-a.s; });
})();
function iouG(a,b){ var x0=Math.max(a.x-a.w/2,b.x-b.w/2), x1=Math.min(a.x+a.w/2,b.x+b.w/2), z0=Math.max(a.z-a.d/2,b.z-b.d/2), z1=Math.min(a.z+a.d/2,b.z+b.d/2);
  var i=Math.max(0,x1-x0)*Math.max(0,z1-z0); return i/(a.w*a.d+b.w*b.d-i); }
function yEval(){
  var thr=YTHR[YF.thrI], kept=[], pass=0;
  ycand.forEach(function(b){ if(b.s<thr){ b.st=0; return; } pass++;
    if(YF.nms&&kept.some(function(k){ return k.c===b.c&&iouG(k,b)>.5; })) b.st=1; else { b.st=2; kept.push(b); } });
  var used={}, tp=0;
  kept.forEach(function(b){ for(var i=0;i<YGT.length;i++){ if(!used[i]&&YGT[i].c===b.c&&iouG(YGT[i],b)>=.5){ used[i]=1; tp++; return; } } });
  ystat={thr:thr,n:ycand.length,pass:pass,kept:kept.length,tp:tp,P:kept.length?tp/kept.length:1,R:tp/YGT.length};
}
var yGround=document.createElement('canvas'); yGround.width=yGround.height=512; var yGTex=new THREE.CanvasTexture(yGround);
(function(){ var m=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.MeshBasicMaterial({map:yGTex})); m.rotation.x=-PI/2; m.position.set(0,.05,-28); scene.add(m); })();
var pY=panel({x:0,y:5.3,z:-36.7,ry:0,w:6.6,h:7.73,pw:512,ph:600});
var tgT=toggle3d(-2.5,1.5,-20.4,0,1.7,1.25,function(){ YF.thrI=(YF.thrI+1)%YTHR.length; drawYolo(); doneTask('thr'); toast('置信度阈值 '+YTHR[YF.thrI].toFixed(2)+' → 精确率 '+Math.round(ystat.P*100)+'%,召回率 '+Math.round(ystat.R*100)+'%'); });
var tgN=toggle3d(2.5,1.5,-20.4,0,1.7,1.25,function(){ YF.nms=!YF.nms; drawYolo(); toast(YF.nms?'NMS 开:重叠超过 0.5 的同类框只留分数最高的':'NMS 关:同一个物体上叠着好几个框'); });
function drawYolo(){
  yEval();
  var c=yGround.getContext('2d'), k=512/YF.size, cell=512/YF.S, i;
  function X(v){ return (v-YF.x0)*k; } function Z(v){ return (v-YF.z0)*k; }
  c.setLineDash([]); c.fillStyle='#7d6652'; c.fillRect(0,0,512,512); c.fillStyle='#8a735e'; for(i=0;i<512;i+=20) c.fillRect(0,i,512,9);
  YGT.forEach(function(g){ c.fillStyle='rgba(253,231,37,.2)'; c.fillRect(Math.floor(X(g.x)/cell)*cell,Math.floor(Z(g.z)/cell)*cell,cell,cell); });
  c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=2; for(i=0;i<=YF.S;i++){ c.beginPath(); c.moveTo(i*cell,0); c.lineTo(i*cell,512); c.moveTo(0,i*cell); c.lineTo(512,i*cell); c.stroke(); }
  YGT.forEach(function(g){ c.fillStyle='rgba(30,20,50,.35)'; c.beginPath(); c.ellipse(X(g.x),Z(g.z),g.w*k/2,g.d*k/2,0,0,7); c.fill(); c.fillStyle=YCOL[g.c]; c.beginPath(); c.arc(X(g.x),Z(g.z),5,0,7); c.fill(); });
  [0,1,2].forEach(function(st){ ycand.forEach(function(b){ if(b.st!==st) return;
    var x=X(b.x-b.w/2), z=Z(b.z-b.d/2), w=b.w*k, d=b.d*k;
    if(st===0){ c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=1.5; c.setLineDash([5,6]); }
    else if(st===1){ c.strokeStyle='rgba(255,95,130,.95)'; c.lineWidth=2.5; c.setLineDash([9,5]); }
    else { c.strokeStyle=YCOL[b.c]; c.lineWidth=4.5; c.setLineDash([]); }
    c.strokeRect(x,z,w,d);
    if(st===2){ var tx=YCLS[b.c]+' '+b.s.toFixed(2); c.font='600 15px '+FONT; var tw=c.measureText(tx).width+8, ty=z>22?z-20:z+d; c.fillStyle=YCOL[b.c]; c.fillRect(x-2,ty,tw,20); c.fillStyle='#1a1630'; c.textBaseline='middle'; c.textAlign='left'; c.fillText(tx,x+2,ty+11); } }); });
  c.setLineDash([]); yGTex.needsUpdate=true;
  var b=pY.ctx; b.drawImage(yGround,0,0); b.fillStyle='#14163a'; b.fillRect(0,512,512,88); b.textAlign='left'; b.textBaseline='alphabetic';
  b.fillStyle='#fde725'; b.font='600 21px '+FONT; b.fillText('候选 '+ystat.n+' → 过阈值 '+ystat.pass+' → 保留 '+ystat.kept,12,540);
  b.fillStyle='#f1efff'; b.font='600 21px '+FONT; b.fillText('精确率 '+Math.round(ystat.P*100)+'% · 召回率 '+Math.round(ystat.R*100)+'%(共 '+YGT.length+' 个真目标)',12,568);
  b.fillStyle='#b3add8'; b.font='15px '+FONT; b.fillText('粗实线 保留 · 红虚线 被 NMS 压掉 · 白虚线 低于阈值',12,590);
  pY.tex.needsUpdate=true;
  tgT.set('置信度阈值',YTHR[YF.thrI].toFixed(2)); tgN.set('NMS 去重',YF.nms?'开':'关');
}
drawYolo();
(function(){
  /* "one look" pulse over the whole grid */
  var pm=new THREE.MeshBasicMaterial({color:0xfde725,transparent:true,opacity:0,depthWrite:false}), pl=new THREE.Mesh(new THREE.PlaneGeometry(12,12),pm);
  pl.rotation.x=-PI/2; pl.position.set(0,.08,-28); scene.add(pl);
  onTick(function(t){ var u=(t%3)/3; pm.opacity=u<.12?.3*(1-u/.12):0; });
  /* field props */
  function pumpkin(x,z,s){ var g=grp(ST,x,0,z); for(var i=0;i<5;i++){ var a=i/5*PI; var p=lo(g,T(0xff9f43),.5*s,.42*s,.3*s,0,.4*s,0); p.rotation.y=a; } cy(g,T(0x5a9a5a),.06*s,.2*s,0,.86*s,0); lo(g,T(0x4fae7a),.2*s,.03*s,.14*s,.2*s,.8*s,0); shadow(g,.6*s); obstacles.push({x:x,z:z,r:.55*s}); }
  pumpkin(-3.2,-31.2,1.5); pumpkin(3.9,-30.1,.8);
  var sc=grp(ST,.6,0,-27.3); cy(sc,T(WOOD),.06,2.3,0,1.15,0); cy(sc,T(WOOD),.05,1.5,0,1.55,0).rotation.z=PI/2; bx(sc,T(0xe8695c),.6,.7,.3,0,1.35,0); bx(sc,T(0x3a7bd5),.5,.12,.32,0,1.0,0);
  lo(sc,T(0xf1d9b5),.26,.26,.26,0,2.0,0); cn(sc,T(0xe8c46a),.4,.36,0,2.36,0); cy(sc,T(0xe8c46a),.48,.03,0,2.2,0); lo(sc,B(DARK),.035,.035,.03,.09,2.03,.24); lo(sc,B(DARK),.035,.035,.03,-.09,2.03,.24);
  [-1,1].forEach(function(s){ lo(sc,T(0xe8c46a),.12,.1,.1,s*.78,1.55,0); }); shadow(sc,.7); obstacles.push({x:.6,z:-27.3,r:.5});
  var br=grp(ST,-3.6,0,-24.6); cy(br,T(0xb07a4f),.5,1.0,0,.5,0); [.2,.8].forEach(function(y){ cy(br,T(DARK),.52,.07,0,y,0); }); cy(br,T(0x8a5a3c),.44,.04,0,1.0,0); shadow(br,.7); obstacles.push({x:-3.6,z:-24.6,r:.7});
  var hy=grp(ST,3.3,0,-24.4); var h1=cy(hy,T(0xe8c46a),.6,1.9,0,.6,0); h1.rotation.z=PI/2; [-.5,.5].forEach(function(x){ var b2=cy(hy,T(0xc9a64f),.62,.07,x,.6,0); b2.rotation.z=PI/2; }); shadow(hy,1.2); obstacles.push({x:3.3,z:-24.4,r:1.0});
  fence(line(-6.4,-21.6,-6.4,-34.4,8)); fence(line(-6.4,-34.4,6.4,-34.4,8)); fence(line(6.4,-34.4,6.4,-21.6,8));
  /* watchtower */
  var w=grp(ST,-10,0,-23.5); [-1,1].forEach(function(a){ [-1,1].forEach(function(b){ cy(w,T(WOOD),.12,5.2,a*1.1,2.6,b*1.1); }); });
  bx(w,T(WOOD2),3,.18,3,0,5.2,0); [-1,1].forEach(function(a){ bx(w,T(WOOD),3,.1,.1,0,6.0,a*1.45); bx(w,T(WOOD),.1,.1,3,a*1.45,6.0,0); [-1,1].forEach(function(b){ cy(w,T(WOOD),.06,.8,a*1.45,5.6,b*1.45); }); });
  add(w,G.pyr,T(0xf2c14e),2.4,1.5,2.4,0,8.0,0); [-1,1].forEach(function(a){ [-1,1].forEach(function(b){ cy(w,T(WOOD),.07,1.6,a*1.3,6.5,b*1.3); }); });
  [-.3,.3].forEach(function(x){ cy(w,T(WOOD),.04,5.2,x,2.6,1.25); }); for(var i=0;i<9;i++) bx(w,T(WOOD),.6,.05,.05,0,.5+i*.55,1.25);
  var tele=cy(w,T(0x3a4a7a),.12,1.0,.6,5.9,1.1); tele.rotation.x=1.1; shadow(w,2.2); obstacles.push({x:-10,z:-23.5,r:1.8});
  label('YOLO 瞭望田',0,10.4,-36,{h:1.0,color:HOT.color,border:HOT.border});
  label('每格只看一次',0,1.0,-21.3,{h:.36,color:'#d8d2ff'});
})();

/* =====================================================
   6. TRACKING PADDOCK — a real tracking-by-detection loop
   ===================================================== */
var TK={cx:26,cz:-24,R:8.6,shed:{x:26,z:-29.6,hw:1.6,hd:1.75},predict:true,tracks:[],nextId:1,dets:[],acc:0,sw:0};
var TCOL=['#fde725','#5ec962','#4ac0e0','#ff8a5c','#c59bff','#ff9bb0','#9be36a','#ffffff'];
var animals=[['sheep',5.8,.17],['sheep',4.9,-.2],['sheep',6.4,.125],['chick',5.3,.26],['chick',4.6,-.3]].map(function(a,i){
  var q=quad(a[0]); scene.add(q.g); return {q:q,r:a[1],w:a[2],a:i*1.3+.4,x:0,z:0,last:0}; });
var tkR=mkRng(4242);
function gauss(){ return (tkR()+tkR()+tkR()+tkR()-2)*.87; }
var pT=panel({x:26,y:5.2,z:-35.6,ry:0,w:6.4,h:7.31,pw:420,ph:480});
var tgK=toggle3d(19.6,2.0,-13.6,0,2.2,1.4,function(){ TK.predict=!TK.predict; TK.tracks=[]; TK.sw=0; TK.nextId=1; animals.forEach(function(a){ a.last=0; }); tgK.set('运动预测',TK.predict?'开':'关'); if(!TK.predict) doneTask('track');
  toast(TK.predict?'预测开:进棚后框会按速度继续滑行,出来还是原来的 ID':'预测关:盯住穿过棚子的羊,出来后 ID 会变'); });
tgK.set('运动预测','开');
var tkSprites=[], tkDots;
(function(){
  for(var i=0;i<8;i++){ var c=document.createElement('canvas'); c.width=c.height=128; var s=new THREE.Sprite(new THREE.SpriteMaterial({map:canvasTex(c),transparent:true,depthWrite:false})); s.visible=false; s.userData={c:c,key:''}; scene.add(s); tkSprites.push(s); }
  tkDots=new Inst(G.disc,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,depthWrite:false}),200); tkDots.m.count=0;
  /* shed (the occluder), fence, trough */
  var sh=grp(ST,TK.shed.x,0,TK.shed.z,PI/2); [-1,1].forEach(function(s){ bx(sh,T(0xd9534f),.16,1.9,3.2,s*1.75,.95,0); bx(sh,T(0xfff3e0),.18,.14,3.3,s*1.75,1.9,0); bx(sh,T(0xfff3e0),.18,1.9,.14,s*1.75,.95,1.6); bx(sh,T(0xfff3e0),.18,1.9,.14,s*1.75,.95,-1.6); });
  add(sh,gable(4.2,1.3,3.6),T(0x8a3d3a),1,1,1,0,1.95,0);
  var pts=[]; for(i=0;i<=30;i++){ var a=PI/2+.28+i/30*(PI*2-.56); pts.push([TK.cx+Math.cos(a)*8.9,TK.cz+Math.sin(a)*8.9]); } fence(pts);
  var tr=grp(ST,22.5,0,-19.5,.5); bx(tr,T(WOOD),1.6,.3,.5,0,.25,0); bx(tr,B(0x58b6d6),1.4,.04,.36,0,.4,0);
  var hb=grp(ST,30.5,0,-19.8); var h=cy(hb,T(0xe8c46a),.5,1.2,0,.5,0); h.rotation.x=PI/2; shadow(hb,.8);
  /* camera pole */
  var cp=grp(ST,17.2,0,-17.5); cy(cp,T(DARK),.08,4.6,0,2.3,0); bx(cp,T(0xdfe6f2),.34,.3,.6,.2,4.5,-.2).rotation.set(.35,-.9,0); lo(cp,B(0xff5a5a),.05,.05,.05,.33,4.55,-.02); obstacles.push({x:17.2,z:-17.5,r:.3});
  obstacles.push({x:TK.cx,z:TK.cz,r:9.3});
  label('追踪牧场',26,10.2,-35,{h:1.0,color:HOT.color,border:HOT.border});
  label('棚子 = 遮挡区',26,3.7,-29.6,{h:.36,color:'#d8d2ff'});
})();
function tkStep(DT){
  var s=TK.shed, i, j;
  TK.dets=[];
  animals.forEach(function(a,ai){ if(Math.abs(a.x-s.x)<s.hw&&Math.abs(a.z-s.z)<s.hd) return; if(tkR()<.05) return; TK.dets.push({x:a.x+gauss()*.14,z:a.z+gauss()*.14,src:ai,used:false}); });
  TK.tracks.forEach(function(tr){ if(TK.predict){ tr.x+=tr.vx*DT; tr.z+=tr.vz*DT; } tr.m=null; });
  var pairs=[];
  for(i=0;i<TK.tracks.length;i++) for(j=0;j<TK.dets.length;j++){ var tr=TK.tracks[i], d=Math.hypot(tr.x-TK.dets[j].x,tr.z-TK.dets[j].z), gate=TK.predict?1.5+Math.min(tr.miss,40)*.04:1.6; if(d<gate) pairs.push([d,i,j]); }
  pairs.sort(function(a,b){ return a[0]-b[0]; });
  pairs.forEach(function(p){ var tr=TK.tracks[p[1]], de=TK.dets[p[2]]; if(tr.m||de.used) return; tr.m=de; de.used=true; });
  TK.tracks.forEach(function(tr){ var de=tr.m;
    if(de){ var rx=de.x-tr.x, rz=de.z-tr.z; tr.x+=.55*rx; tr.z+=.55*rz;
      if(TK.predict){ tr.vx=clamp(tr.vx+.06*rx/DT,-2.2,2.2); tr.vz=clamp(tr.vz+.06*rz/DT,-2.2,2.2); }
      tr.miss=0; tr.hits++; var an=animals[de.src]; if(an.last&&an.last!==tr.id) TK.sw++; an.last=tr.id; }
    else tr.miss++;
    tr.hist.push(tr.x,tr.z); if(tr.hist.length>44) tr.hist.splice(0,2); });
  TK.tracks=TK.tracks.filter(function(tr){ return tr.miss<=45; });
  TK.dets.forEach(function(de){ if(de.used||TK.tracks.length>=8) return; var id=TK.nextId++, an=animals[de.src]; if(an.last) TK.sw++; an.last=id;
    TK.tracks.push({id:id,x:de.x,z:de.z,vx:0,vz:0,miss:0,hits:1,hist:[],m:null}); });
}
function tkDraw(){
  var c=pT.ctx, k=200/TK.R, s=TK.shed, i;
  function X(v){ return 210+(v-TK.cx)*k; } function Z(v){ return 210+(v-TK.cz)*k; }
  c.setLineDash([]); c.fillStyle='#14163a'; c.fillRect(0,0,420,480); c.fillStyle='#2a2f66'; c.beginPath(); c.arc(210,210,200,0,7); c.fill();
  c.strokeStyle='rgba(255,255,255,.12)'; c.lineWidth=1; [5,6].forEach(function(r){ c.beginPath(); c.arc(210,210,r*k,0,7); c.stroke(); });
  c.fillStyle='rgba(217,83,79,.5)'; c.fillRect(X(s.x-s.hw),Z(s.z-s.hd),s.hw*2*k,s.hd*2*k); c.fillStyle='#f1efff'; c.font='14px '+FONT; c.textAlign='center'; c.textBaseline='middle'; c.fillText('遮挡',X(s.x),Z(s.z));
  TK.dets.forEach(function(d){ c.strokeStyle='#ffffff'; c.lineWidth=2; c.beginPath(); c.moveTo(X(d.x)-5,Z(d.z)-5); c.lineTo(X(d.x)+5,Z(d.z)+5); c.moveTo(X(d.x)+5,Z(d.z)-5); c.lineTo(X(d.x)-5,Z(d.z)+5); c.stroke(); });
  TK.tracks.forEach(function(tr){ var col=TCOL[(tr.id-1)%8]; c.strokeStyle=col; c.lineWidth=2.5; c.globalAlpha=.7; c.beginPath();
    for(i=0;i<tr.hist.length;i+=2){ if(i===0) c.moveTo(X(tr.hist[i]),Z(tr.hist[i+1])); else c.lineTo(X(tr.hist[i]),Z(tr.hist[i+1])); } c.stroke(); c.globalAlpha=1;
    if(tr.miss>0) c.setLineDash([5,4]); c.lineWidth=3; c.strokeRect(X(tr.x)-13,Z(tr.z)-13,26,26); c.setLineDash([]);
    if(TK.predict){ c.beginPath(); c.moveTo(X(tr.x),Z(tr.z)); c.lineTo(X(tr.x+tr.vx*1.2),Z(tr.z+tr.vz*1.2)); c.stroke(); }
    c.fillStyle=col; c.font='600 15px "IBM Plex Mono",monospace'; c.fillText(tr.id,X(tr.x),Z(tr.z)-22); });
  c.textAlign='left'; c.textBaseline='alphabetic'; c.fillStyle='#fde725'; c.font='600 19px '+FONT;
  c.fillText('真实 5 只 · 已发出 ID '+(TK.nextId-1)+' 个 · ID 切换 '+TK.sw+' 次',12,446);
  c.fillStyle='#b3add8'; c.font='14px '+FONT; c.fillText('× 当前帧检测 · 方框 轨迹(虚线 = 丢失中'+(TK.predict?',靠预测滑行':',原地等待')+')',12,468);
  pT.tex.needsUpdate=true;
  /* 3D overlays */
  tkDots.n=0;
  for(i=0;i<8;i++){ var sp=tkSprites[i], tr=TK.tracks[i]; if(!tr){ sp.visible=false; continue; }
    var col=TCOL[(tr.id-1)%8], kk=tr.id+(tr.miss>0?'m':''); sp.visible=true; sp.position.set(tr.x,.85,tr.z); sp.scale.set(1.9,1.9,1); sp.material.opacity=tr.miss>0?.6:1;
    if(sp.userData.key!==kk){ sp.userData.key=kk; var x=sp.userData.c.getContext('2d'); x.clearRect(0,0,128,128); x.strokeStyle=col; x.lineWidth=6; x.setLineDash(tr.miss>0?[12,9]:[]); rr(x,6,30,116,92,10); x.stroke(); x.setLineDash([]);
      x.fillStyle=col; rr(x,6,2,70,30,8); x.fill(); x.fillStyle='#1a1630'; x.font='600 22px "IBM Plex Mono",monospace'; x.textBaseline='middle'; x.textAlign='left'; x.fillText('ID '+tr.id,13,18); sp.material.map.needsUpdate=true; }
    var hex=parseInt(col.slice(1),16); for(var h=0;h<tr.hist.length;h+=4) tkDots.add(tr.hist[h],.06,tr.hist[h+1],.07,1,.07,0,hex); }
  tkDots.done();
}
onTick(function(t,dt){
  for(var i=0;i<animals.length;i++){ var a=animals[i]; a.a+=a.w*dt; var rr3=a.r+Math.sin(t*.3+i*2)*.22; a.x=TK.cx+Math.cos(a.a)*rr3; a.z=TK.cz+Math.sin(a.a)*rr3;
    a.q.g.position.set(a.x,0,a.z); a.q.g.rotation.y=a.w>0?-a.a:-a.a+PI; animQuad(a.q,t,1); }
  TK.acc+=dt; if(TK.acc>=.1){ TK.acc=0; tkStep(.1); if(near(TK.cx,TK.cz,44)) tkDraw(); }
});

/* =====================================================
   7. VLM OBSERVATORY — a toy shared image/text space + patch stream
   ===================================================== */
var VL={img:0,q:0};
var VIMG=['一只猫','一棵树','一座小屋','两只羊'], VCAP=['一只橘猫','一棵大树','一座小屋','草地上的两只羊'];
var VSIM=[[.30,.25,.25,.28],[.24,.30,.26,.25],[.25,.26,.30,.24],[.28,.26,.24,.31]];
var VQ=['图里是什么?','有几只动物?','是白天还是晚上?'];
var VA=[['一只橘色的猫,坐在草地上。','一只。','白天,有太阳。'],['一棵大树。','没有动物。','白天,有太阳。'],['一座带烟囱的小屋。','没有动物。','白天,有太阳。'],['两只绵羊站在草地上。','两只。','白天,有太阳。']];
var pV=panel({x:-21,y:3.4,z:14.6,ry:0,w:6.4,h:4,pw:640,ph:400});
var vQ=label('',-24.6,2.3,24.6,{h:.46}), vA=label('',-27.5,9.3,22.6,{h:.6,color:'#fde725',border:'rgba(253,231,37,.55)'});
var vPatch=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}),16), vTok=new THREE.InstancedMesh(G.box,new THREE.MeshBasicMaterial({color:0xffffff}),4);
vPatch.frustumCulled=false; vTok.frustumCulled=false; (function(){ var z=new THREE.Matrix4().makeScale(.0001,.0001,.0001), i; for(i=0;i<16;i++) vPatch.setMatrixAt(i,z); for(i=0;i<4;i++) vTok.setMatrixAt(i,z); })(); scene.add(vPatch); scene.add(vTok);
function drawVLM(){
  var c=pV.ctx, i, im=VL.img;
  c.setLineDash([]); c.fillStyle='#14163a'; c.fillRect(0,0,640,400);
  c.save(); c.beginPath(); c.rect(0,0,400,400); c.clip(); icoBg(c,0,0,400,400);
  if(im===0) icoCat(c,200,330,2.6); else if(im===1) icoTree(c,200,340,2.9); else if(im===2) icoHouse(c,200,330,2.9); else { icoSheep(c,125,325,2.2); icoSheep(c,270,335,2.2); }
  c.restore();
  var t4=document.createElement('canvas'); t4.width=t4.height=4; var tx=t4.getContext('2d'); tx.drawImage(pV.c,0,0,400,400,0,0,4,4); var px=tx.getImageData(0,0,4,4).data;
  for(i=0;i<16;i++) vPatch.setColorAt(i,tmpCol.setRGB(px[i*4]/255,px[i*4+1]/255,px[i*4+2]/255)); vPatch.instanceColor.needsUpdate=true;
  c.strokeStyle='rgba(255,255,255,.8)'; c.lineWidth=2; for(i=1;i<4;i++){ c.beginPath(); c.moveTo(i*100,0); c.lineTo(i*100,400); c.moveTo(0,i*100); c.lineTo(400,i*100); c.stroke(); }
  var lg=VSIM[im].map(function(v){ return v*100; }), mx=Math.max.apply(null,lg), ex=lg.map(function(v){ return Math.exp(v-mx); }), sm=ex.reduce(function(a,b){ return a+b; },0);
  c.textAlign='left'; c.textBaseline='alphabetic'; c.fillStyle='#fde725'; c.font='600 19px '+FONT; c.fillText('图文相似度 → softmax',414,34);
  for(i=0;i<4;i++){ var y=64+i*76, p=ex[i]/sm; c.fillStyle='#f1efff'; c.font='600 19px '+FONT; c.fillText('“'+VCAP[i]+'”',414,y+16);
    c.fillStyle='#2a2f66'; c.fillRect(414,y+26,212,16); c.fillStyle=virCss(.25+.75*p); c.fillRect(414,y+26,Math.max(3,212*p),16);
    c.fillStyle='#b3add8'; c.font='15px "IBM Plex Mono",monospace'; c.fillText('cos '+VSIM[im][i].toFixed(2)+'  →  '+(p*100).toFixed(1)+'%',414,y+60); }
  c.fillStyle='#b3add8'; c.font='15px '+FONT; c.fillText('点击换图 · 4×4 图块 = 16 个 token',414,388);
  pV.tex.needsUpdate=true;
  vQ.setText('问:'+VQ[VL.q]+'(点信箱换问题)'); vA.setText('答:'+VA[im][VL.q]);
}
pV.plane.userData.tap=function(){ VL.img=(VL.img+1)%4; drawVLM(); doneTask('vlm'); toast('换成:'+VIMG[VL.img]+'。看哪句话的相似度最高'); };
function vlmNextQ(){ VL.q=(VL.q+1)%VQ.length; drawVLM(); toast('问题换成:'+VQ[VL.q]); }
(function(){
  var tx=-29, tz=24, g=grp(ST,tx,0,tz);
  cy(g,T(STONE),3.0,.5,0,.25,0); cy(g,T(0xefe2cc),2.6,6.4,0,3.5,0); cy(g,T(0x8a6fb5),2.75,.3,0,6.8,0); cy(g,T(0x8a6fb5),2.72,.2,0,2.6,0);
  lo(g,T(0x6f57a0),2.6,2.2,2.6,0,6.9,0); bx(g,T(0x4a3a78),.5,2.2,2.2,1.6,7.4,-1.1).rotation.y=.6;
  var d=grp(g,2.56,0,0,PI/2); bx(d,T(0x9a6a46),1.0,1.8,.14,0,1.4,0); var ar=cy(d,T(0x9a6a46),.5,.14,0,2.3,0); ar.rotation.x=PI/2; lo(d,B(0xfde725),.06,.06,.06,.3,1.4,.1); bx(d,T(STONE),1.5,.2,.6,0,.6,.3);
  [[.9,4.4],[-.5,4.6],[2.3,4.2]].forEach(function(p){ win(g,Math.sin(p[0])*2.58,p[1],Math.cos(p[0])*2.58,p[0]); });
  shadow(g,3.6); obstacles.push({x:tx,z:tz,r:3.2});
  /* telescope aimed at the board */
  var lens=new THREE.Vector3(-27.3,7.9,21.9), tgt=new THREE.Vector3(-21,3.4,14.6), dir=tgt.clone().sub(lens).normalize();
  var tube=cy(ST,T(0x3a4a7a),.5,2.6,0,0,0); tube.position.copy(lens).addScaledVector(dir,-1.0); tube.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
  var rim=cy(ST,T(0xf2c14e),.56,.2,0,0,0); rim.position.copy(lens).addScaledVector(dir,.3); rim.quaternion.copy(tube.quaternion);
  var lg=glow(0x8fd3ff,2.4,.7); lg.position.copy(lens).addScaledVector(dir,.45); scene.add(lg);
  /* question mailbox */
  var mb=grp(ST,-24.6,0,24.6); cy(mb,T(WOOD),.07,1.1,0,.55,0); bx(mb,T(0xe8695c),.5,.4,.7,0,1.25,0); var top=cy(mb,T(0xe8695c),.25,.7,0,1.45,0); top.rotation.x=PI/2; bx(mb,T(0xfde725),.04,.3,.2,.28,1.5,.1); shadow(mb,.4);
  hitSphere(scene,.8,-24.6,1.2,24.6,vlmNextQ); obstacles.push({x:-24.6,z:24.6,r:.4});
  label('VLM 天文台',-27,11.4,22,{h:1.0,color:HOT.color,border:HOT.border});
  var m4=new THREE.Matrix4(), q4=new THREE.Quaternion(), s4=new THREE.Vector3(), p4=new THREE.Vector3(), door=new THREE.Vector3(-26.3,1.6,24), box0=new THREE.Vector3(-24.6,1.5,24.6);
  var TC=[0xfde725,0x5ec962,0x4ac0e0,0xff9bb0]; for(var i=0;i<4;i++) vTok.setColorAt(i,tmpCol.setHex(TC[i])); vTok.instanceColor.needsUpdate=true;
  onTick(function(t){
    if(!near(-24,20,44)) return;
    var cyc=t%6.5, i, u;
    for(i=0;i<16;i++){ var bxp=-24.2+((i%4)+.5)*1.0, byp=3.4+2-(((i/4)|0)+.5)*1.0; u=clamp((cyc-.6-i*.14)/2.2,0,1); var e=u*u*(3-2*u);
      p4.set(bxp+(lens.x-bxp)*e, byp+(lens.y-byp)*e+Math.sin(u*PI)*2.2, 14.76+(lens.z-14.76)*e);
      var sc=u<=0?.001:(1-.75*e)*.9; if(u>=1) sc=.001; s4.set(sc,sc,sc); q4.copy(camera.quaternion); m4.compose(p4,q4,s4); vPatch.setMatrixAt(i,m4); }
    vPatch.instanceMatrix.needsUpdate=true;
    for(i=0;i<4;i++){ u=clamp((cyc-1.2-i*.35)/1.4,0,1); p4.lerpVectors(box0,door,u); p4.y+=Math.sin(u*PI)*.9; sc=(u<=0||u>=1)?.001:.22; s4.set(sc,sc,sc); q4.set(0,0,0,1); m4.compose(p4,q4,s4); vTok.setMatrixAt(i,m4); }
    vTok.instanceMatrix.needsUpdate=true;
    lg.material.opacity=.45+.4*Math.abs(Math.sin(t*2)); vA.material.opacity=cyc>4.6||cyc<.6?1:.35;
  });
})();
drawVLM();
