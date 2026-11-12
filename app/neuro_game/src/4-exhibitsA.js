
/* =====================================================
   shared exhibit kit: canvas boards + 3D toggle buttons
   ===================================================== */
function panel(o){
  var c=document.createElement('canvas'); c.width=o.pw; c.height=o.ph; var tex=canvasTex(c);
  var g=grp(scene,o.x,o.y,o.z,o.ry);
  var pl=new THREE.Mesh(new THREE.PlaneGeometry(o.w,o.h),new THREE.MeshBasicMaterial({map:tex})); pl.position.z=.14; g.add(pl);
  var f=grp(ST,o.x,o.y,o.z,o.ry), fm=T(o.frame||WOOD);
  bx(f,fm,o.w+.34,o.h+.34,.24,0,0,0);
  if(o.posts!==false){ var hb=o.y-o.h/2; [-1,1].forEach(function(s){ cy(f,fm,.09,hb,s*(o.w/2-.12),-o.h/2-hb/2,-.02); }); }
  interactables.push(pl);
  return {c:c,ctx:c.getContext('2d'),tex:tex,plane:pl};
}
function toggle3d(x,y,z,ry,w,h,fn){
  var p=panel({x:x,y:y,z:z,ry:ry,w:w,h:h,pw:320,ph:Math.round(320*h/w)});
  p.set=function(title,value){ var c=p.ctx, W=p.c.width, H=p.c.height;
    c.fillStyle='#1b1e4d'; c.fillRect(0,0,W,H); rr(c,6,6,W-12,H-12,18); c.strokeStyle='#fde725'; c.lineWidth=5; c.stroke();
    c.textAlign='center'; c.textBaseline='middle';
    c.fillStyle='#b3add8'; c.font='600 30px '+FONT; c.fillText(title,W/2,H*.24);
    c.fillStyle='#fde725'; c.font='600 '+Math.round(H*.3)+'px "IBM Plex Mono",'+FONT; c.fillText(value,W/2,H*.54);
    c.fillStyle='#f1efff'; c.font='24px '+FONT; c.fillText('点击切换',W/2,H*.84); p.tex.needsUpdate=true; };
  p.plane.userData.tap=fn; return p;
}

/* =====================================================
   1. NEURAL NETWORK PLAZA — a real 3-5-5-3 MLP
   ===================================================== */
var SIZES=[3,5,5,3], Wt=[], Bs=[], nrnd=mkRng(11);
function initNet(){ Wt=[]; Bs=[];
  for(var l=0;l<3;l++){ var wl=[]; for(var j=0;j<SIZES[l+1];j++){ var r=[]; for(var i=0;i<SIZES[l];i++) r.push((nrnd()*2-1)*0.9); wl.push(r); }
    Wt.push(wl); Bs.push(new Array(SIZES[l+1]).fill(0)); } }
function forward(x){ var acts=[x.slice()], a=x;
  for(var l=0;l<3;l++){ var z=[];
    for(var j=0;j<SIZES[l+1];j++){ var s=Bs[l][j]; for(var i=0;i<a.length;i++) s+=Wt[l][j][i]*a[i]; z.push(s); }
    if(l<2) a=z.map(Math.tanh);
    else { var m=Math.max.apply(null,z), e=z.map(function(v){return Math.exp(v-m);}), sum=e.reduce(function(p,q){return p+q;},0); a=e.map(function(v){return v/sum;}); }
    acts.push(a); }
  return acts; }
var DATA=[[[0,0,0],[1/3,1/3,1/3]],[[1,0,0],[1,0,0]],[[0,1,0],[0,1,0]],[[0,0,1],[0,0,1]],
          [[1,1,0],[.7,.3,0]],[[1,0,1],[.9,0,.1]],[[0,1,1],[0,.4,.6]],[[1,1,1],[.8,.1,.1]]];
function trainStep(lr){ var loss=0;
  for(var s=0;s<DATA.length;s++){ var x=DATA[s][0], t=DATA[s][1], acts=forward(x), out=acts[3];
    for(var k=0;k<3;k++) if(t[k]>0) loss-=t[k]*Math.log(out[k]+1e-9);
    var delta=out.map(function(o,k){return o-t[k];});
    for(var l=2;l>=0;l--){ var ap=acts[l], nd=new Array(SIZES[l]).fill(0);
      for(var j=0;j<SIZES[l+1];j++){ for(var i=0;i<SIZES[l];i++){ nd[i]+=Wt[l][j][i]*delta[j]; Wt[l][j][i]-=lr*delta[j]*ap[i]; } Bs[l][j]-=lr*delta[j]; }
      if(l>0) delta=nd.map(function(v,i){return v*(1-ap[i]*ap[i]);}); } }
  return loss/DATA.length; }
initNet(); var lastLoss=0; for(var it=0;it<1600;it++) lastLoss=trainStep(0.12);

var inputs=[1,0,0], IN_NAMES=['尖耳朵','条纹','圆轮廓'], OUT_NAMES=['猫','斑马','球'];
var neurons=[], edges=[], inLabels=[], outLabels=[], training=0, trainTick=0, curActs=null;
function npos(l,j){ var n=SIZES[l]; return new THREE.Vector3(-6.9+l*4.6, 4.2+((n-1)/2-j)*1.7, 0); }
(function(){
  var sphG=new THREE.SphereGeometry(0.45,24,16), UP=new THREE.Vector3(0,1,0), l,j,i;
  for(l=0;l<4;l++){ neurons.push([]);
    for(j=0;j<SIZES[l];j++){ var p=npos(l,j);
      var m=new THREE.Mesh(sphG,new THREE.MeshBasicMaterial({color:0xffffff})); m.position.copy(p); scene.add(m);
      var halo=glow(0xffffff,2.3,.55); halo.position.copy(p); scene.add(halo);
      neurons[l].push({m:m,halo:halo});
      if(l===0){ (function(j){ hitSphere(scene,.95,p.x,p.y,p.z,function(){ inputs[j]=inputs[j]?0:1; updateActs(); doneTask('input'); }); })(j);
        var lb=label(IN_NAMES[j],p.x-2.5,p.y,0,{h:.72}); inLabels.push(lb); }
      if(l===3) outLabels.push(label(OUT_NAMES[j],p.x+2.4,p.y,0,{h:.72}));
      if(p.y<1.7){ obstacles.push({x:p.x,z:p.z,r:.85}); }
      /* little stand under the bottom neuron of each layer */
      if(j===SIZES[l]-1){ cy(ST,T(STONE),.5,.3,p.x,.15,0); cy(ST,T(0xcfc8dc),.07,p.y-.75,p.x,(p.y-.45)/2+.15,0); shadow(ST,.7,p.x,0); if(p.y>=1.7) obstacles.push({x:p.x,z:0,r:.6}); }
    } }
  for(l=0;l<3;l++) for(j=0;j<SIZES[l+1];j++) for(i=0;i<SIZES[l];i++){
    var a=npos(l,i), b=npos(l+1,j), d=b.clone().sub(a), len=d.length();
    var c=new THREE.Mesh(G.cyl,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false}));
    c.position.copy(a).add(b).multiplyScalar(.5); c.quaternion.setFromUnitVectors(UP,d.normalize());
    c.userData.len=len; scene.add(c); edges.push({m:c,l:l,j:j,i:i,a:a,b:b}); }
  ['输入层','隐藏层 1','隐藏层 2','输出层'].forEach(function(t,l){ label(t,-6.9+l*4.6,8.95,0,{h:.6,color:'#d8d2ff'}); });
  label('点输入球:开 / 关',-6.9,1.15,.6,{h:.56,color:HOT.color,border:HOT.border});
  /* retrain console */
  var g=grp(ST,0,0,6.5); cy(g,T(STONE),.62,.3,0,.15,0); add(g,G.taper,T(0x6f57a0),.5,.9,.5,0,.75,0); cy(g,T(DARK),.42,.08,0,1.22,0); shadow(g,.8);
  var btn=cy(scene,B(0xfde725),.3,.14,0,1.32,6.5);
  hitSphere(scene,.9,0,1.0,6.5,function(){ retrain(); });
  label('点我:重新训练',0,2.0,6.5,{h:.46}); obstacles.push({x:0,z:6.5,r:.8});
  onTick(function(t){ btn.position.y=1.32+(training>0?Math.sin(t*20)*.02:0); });
})();
var lossLabel=label('loss',0,10.3,0,{h:.8,color:'#fde725'});
function updateEdges(){ edges.forEach(function(e){ var w=Wt[e.l][e.j][e.i], k=Math.min(1,Math.abs(w)/2.6);
  e.m.material.color.setHex(w>=0?0xfde725:0x8a63e6); e.m.material.opacity=.14+.75*k;
  var r=.014+.05*k; e.m.scale.set(r,e.m.userData.len,r); }); }
function updateActs(){
  curActs=forward(inputs);
  for(var l=0;l<4;l++) for(var j=0;j<SIZES[l];j++){ var a=curActs[l][j], t=(l===1||l===2)?(a+1)/2:a, n=neurons[l][j];
    virSet(n.m.material.color,t); virSet(n.halo.material.color,t); n.halo.material.opacity=.2+.6*t; }
  inLabels.forEach(function(lb,j){ lb.setText(IN_NAMES[j]+'  '+inputs[j]); });
  outLabels.forEach(function(lb,j){ lb.setText(OUT_NAMES[j]+'  '+Math.round(curActs[3][j]*100)+'%'); });
}
function retrain(){ nrnd=mkRng((Date.now()&0xffff)|1); initNet(); training=1800; updateEdges(); updateActs(); toast('权重已打乱,正在重新训练…'); }
updateEdges(); updateActs(); lossLabel.setText('训练完成 · loss '+lastLoss.toFixed(3));
(function(){
  var geo=new THREE.BufferGeometry(), pos=new Float32Array(edges.length*3), col=new Float32Array(edges.length*3);
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  var pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.6,map:glowTex,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));
  pts.frustumCulled=false; scene.add(pts);
  onTick(function(time){
    if(training>0){ for(var s=0;s<5;s++) lastLoss=trainStep(0.12); training-=5; trainTick++;
      if(trainTick%6===0||training<=0){ updateEdges(); updateActs(); lossLabel.setText((training>0?'训练中 · loss ':'训练完成 · loss ')+lastLoss.toFixed(3)); } }
    var p=(time*0.8)%3.5, li=Math.floor(p), f=p-li;
    for(var k=0;k<edges.length;k++){ var e=edges[k], o=k*3;
      if(e.l!==li){ pos[o+1]=-50; continue; }
      var st=Math.min(1,Math.abs(Wt[e.l][e.j][e.i]*curActs[e.l][e.i])/1.4);
      pos[o]=e.a.x+(e.b.x-e.a.x)*f; pos[o+1]=e.a.y+(e.b.y-e.a.y)*f; pos[o+2]=0;
      var c=vir(.35+.65*st); col[o]=c[0]/255*st; col[o+1]=c[1]/255*st; col[o+2]=c[2]/255*st; }
    geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
  });
})();

/* =====================================================
   2. CNN PAVILION — real convolution with stride / padding + max-pool
   ===================================================== */
var CAT=["................","..##........##..","..###......###..","..####....####..","..############..",".##############.",".##############.",".###..####..###.",
         ".###..####..###.",".##############.",".######..######.",".##############.","..###.####.###..","..####....####..","...##########...","....########...."];
function mkImg(fn){ var d=new Float32Array(256); for(var y=0;y<16;y++) for(var x=0;x<16;x++) d[y*16+x]=fn(x,y); return d; }
var IMAGES=[
  {name:'猫脸',d:mkImg(function(x,y){ return CAT[y].charAt(x)==='#'?0.92:0.04; })},
  {name:'圆环',d:mkImg(function(x,y){ var r=Math.hypot(x-7.5,y-7.5); return (r>3.6&&r<6.2)?0.95:0.04; })},
  {name:'方框',d:mkImg(function(x,y){ var o=x>=3&&x<=12&&y>=3&&y<=12, i=x>=5&&x<=10&&y>=5&&y<=10; return (o&&!i)?0.95:0.04; })},
  {name:'斜条纹',d:mkImg(function(x,y){ return ((x+y)%6<3)?0.9:0.06; })}
];
var KERNELS=[
  {name:'垂直边缘 Sobel-X',k:[-1,0,1,-2,0,2,-1,0,1],zero:true},
  {name:'水平边缘 Sobel-Y',k:[-1,-2,-1,0,0,0,1,2,1],zero:true},
  {name:'轮廓 Laplacian',k:[0,-1,0,-1,4,-1,0,-1,0],zero:true},
  {name:'模糊 均值',k:[1/9,1/9,1/9,1/9,1/9,1/9,1/9,1/9,1/9],zero:false,txt:'1/9'},
  {name:'锐化',k:[0,-1,0,-1,5,-1,0,-1,0],zero:false}
];
var cv={s:1,p:0,img:0,ker:0,fN:14,pN:7,feat:null,pool:null,scan:0,t:0};
var PXS=320, CX=-27, CZ=-4;
var pIn=panel({x:CX,y:3.3,z:9.5+CZ,ry:PI/2,w:5,h:5,pw:PXS,ph:PXS}), pFeat=panel({x:CX,y:3.3,z:1.7+CZ,ry:PI/2,w:5,h:5,pw:PXS,ph:PXS}),
    pPool=panel({x:CX,y:3.3,z:-5.8+CZ,ry:PI/2,w:5,h:5,pw:PXS,ph:PXS}), pKer=panel({x:CX,y:3.6,z:5.6+CZ,ry:PI/2,w:1.7,h:1.7,pw:PXS,ph:PXS,posts:false});
var lbIn=label('',CX+.5,6.55,9.5+CZ,{h:.44}), lbFeat=label('',CX+.5,6.55,1.7+CZ,{h:.44}), lbPool=label('',CX+.5,6.55,-5.8+CZ,{h:.44}), lbKer=label('',CX+.5,4.85,5.6+CZ,{h:.34});
label('2×2 取最大 ⟶',CX+.5,3.3,-2.05+CZ,{h:.34,color:'#d8d2ff'});
var tgS=toggle3d(CX+.1,1.95,6.3+CZ,PI/2,1.2,.9,function(){ cv.s=cv.s===1?2:1; conv(); drawGallery(true); doneTask('stride'); toast('步幅 S='+cv.s+':卷积核每次移动 '+cv.s+' 格'); });
var tgP=toggle3d(CX+.1,1.95,4.9+CZ,PI/2,1.2,.9,function(){ cv.p=cv.p===0?1:0; conv(); drawGallery(true); doneTask('stride'); toast(cv.p?'填充 P=1:四周补一圈 0,边缘也能被扫到':'填充 P=0:不补边,图会缩小'); });
function conv(){
  var img=IMAGES[cv.img].d, K=KERNELS[cv.ker], S=cv.s, P=cv.p, n=Math.floor((16+2*P-3)/S)+1, mx=1e-6, x,y,i,j;
  cv.fN=n; cv.feat=new Float32Array(n*n);
  for(y=0;y<n;y++) for(x=0;x<n;x++){ var s=0;
    for(j=0;j<3;j++) for(i=0;i<3;i++){ var iy=y*S+j-P, ix=x*S+i-P; if(iy>=0&&iy<16&&ix>=0&&ix<16) s+=img[iy*16+ix]*K.k[j*3+i]; }
    if(K.zero){ s=Math.abs(s); if(s>mx) mx=s; } else s=clamp(s,0,1); cv.feat[y*n+x]=s; }
  if(K.zero) for(i=0;i<n*n;i++) cv.feat[i]/=mx;
  var m=Math.floor(n/2); cv.pN=m; cv.pool=new Float32Array(m*m);
  for(y=0;y<m;y++) for(x=0;x<m;x++) cv.pool[y*m+x]=Math.max(cv.feat[2*y*n+2*x],cv.feat[2*y*n+2*x+1],cv.feat[(2*y+1)*n+2*x],cv.feat[(2*y+1)*n+2*x+1]);
  cv.scan=0;
}
function gridDraw(ctx,n,fn){ var cs=PXS/n; ctx.fillStyle='#0c0f2c'; ctx.fillRect(0,0,PXS,PXS);
  for(var y=0;y<n;y++) for(var x=0;x<n;x++){ ctx.fillStyle=fn(x,y); ctx.fillRect(x*cs+1,y*cs+1,cs-2,cs-2); } }
function drawGallery(all){
  var n=cv.fN, tot=n*n, idx=Math.min(cv.scan,tot-1), wx=idx%n, wy=(idx/n)|0, img=IMAGES[cv.img].d, P=cv.p, N=16+2*P, cs;
  gridDraw(pIn.ctx,N,function(x,y){ var ix=x-P, iy=y-P; if(ix<0||iy<0||ix>15||iy>15) return '#3a2f6e'; var g=(18+img[iy*16+ix]*230)|0; return 'rgb('+g+','+g+','+Math.min(255,g+12)+')'; });
  if(cv.scan<tot){ cs=PXS/N; pIn.ctx.strokeStyle='#fde725'; pIn.ctx.lineWidth=5; pIn.ctx.strokeRect(wx*cv.s*cs,wy*cv.s*cs,3*cs,3*cs); }
  pIn.tex.needsUpdate=true;
  gridDraw(pFeat.ctx,n,function(x,y){ return (y*n+x<=cv.scan)?virCss(cv.feat[y*n+x]):'#1a1f4a'; });
  if(cv.scan<tot){ cs=PXS/n; pFeat.ctx.strokeStyle='#ffffff'; pFeat.ctx.lineWidth=4; pFeat.ctx.strokeRect(wx*cs,wy*cs,cs,cs); }
  pFeat.tex.needsUpdate=true;
  var m=cv.pN; gridDraw(pPool.ctx,m,function(x,y){ return ((2*y+1)*n+2*x+1<=cv.scan)?virCss(cv.pool[y*m+x]):'#1a1f4a'; });
  pPool.tex.needsUpdate=true;
  if(all){
    var K=KERNELS[cv.ker], c=pKer.ctx, s=PXS/3;
    c.fillStyle='#0c0f2c'; c.fillRect(0,0,PXS,PXS); c.textAlign='center'; c.textBaseline='middle'; c.font='600 40px "IBM Plex Mono",monospace';
    for(var j=0;j<3;j++) for(var i=0;i<3;i++){ var v=K.k[j*3+i];
      c.fillStyle=v>0?'rgba(253,231,37,.9)':(v<0?'rgba(122,95,208,.95)':'#262b62'); c.fillRect(i*s+3,j*s+3,s-6,s-6);
      c.fillStyle=v>0?'#1a1630':'#f1efff'; c.fillText(K.txt||String(v),i*s+s/2,j*s+s/2+2); }
    pKer.tex.needsUpdate=true;
    lbKer.setText(K.name+' · 点击更换');
    lbIn.setText('输入 16×16 · '+IMAGES[cv.img].name+' · 点击换图');
    lbFeat.setText('特征图 '+n+'×'+n+' = (16+2×'+P+'−3)/'+cv.s+'+1');
    lbPool.setText('最大池化后 '+m+'×'+m);
    tgS.set('步幅 S',String(cv.s)); tgP.set('填充 P',String(P));
  }
}
function nextImage(){ cv.img=(cv.img+1)%IMAGES.length; conv(); drawGallery(true); toast('输入换成:'+IMAGES[cv.img].name); }
function nextKernel(){ cv.ker=(cv.ker+1)%KERNELS.length; conv(); drawGallery(true); doneTask('kernel'); toast('卷积核:'+KERNELS[cv.ker].name); }
pIn.plane.userData.tap=nextImage; pKer.plane.userData.tap=nextKernel; pFeat.plane.userData.tap=nextKernel;
conv(); drawGallery(true);
onTick(function(t,dt){ if(!near(-24,-2,46)) return; cv.t+=dt; var tot=cv.fN*cv.fN, step=clamp(11/tot,.05,.16);
  if(cv.t>step){ cv.t=0; cv.scan++; if(cv.scan>tot+34) cv.scan=0; if(cv.scan<=tot+1) drawGallery(false); } });
(function(){
  var PZ=1.85+CZ; bx(ST,T(0xcdbfa6),7.2,.14,24.6,-24.5,.07,PZ); bx(ST,T(CREAM),.4,7.2,24,-27.6,3.6,PZ);
  var roof=bx(ST,T(0xe8695c),8.2,.26,25.4,-24.3,7.75,PZ); roof.rotation.z=.1; bx(ST,T(0xc9544a),.3,.3,25.6,-20.3,8.12,PZ);
  [-10+CZ,13.7+CZ].forEach(function(z){ cy(ST,T(WOOD),.2,8,-21.2,4,z); cy(ST,T(STONE),.32,.4,-21.2,.2,z); obstacles.push({x:-21.2,z:z,r:.45}); bx(ST,T(WOOD),6.4,.2,.2,-24.4,7.3,z); });
  bx(ST,T(WOOD),.12,.12,24,-27.19,7.0,PZ);
  addRect(-27.6,PZ,.7,12.2);
  label('CNN 卷积长廊',-22,9.6,PZ,{h:1.0,color:HOT.color,border:HOT.border});
})();

/* =====================================================
   3. BUILD YARD — voxels + a rule-based "detector"
   ===================================================== */
var BCOL=[0x7a5fd0,0x4a6fc0,0x21918c,0x5ec962,0xfde725];
var blockTex=(function(){ var c=document.createElement('canvas'); c.width=c.height=64; var x=c.getContext('2d');
  x.fillStyle='#fff'; x.fillRect(0,0,64,64); x.strokeStyle='rgba(0,0,0,.42)'; x.lineWidth=6; x.strokeRect(0,0,64,64);
  x.strokeStyle='rgba(0,0,0,.12)'; x.lineWidth=2; x.strokeRect(12,12,40,40); return new THREE.CanvasTexture(c); })();
var blockMats=BCOL.map(function(c){ return new THREE.MeshLambertMaterial({map:blockTex,color:c,emissive:c,emissiveIntensity:.3}); });
var blocks=new Map(), blockMeshes=[], curColor=4, erasing=false, mode='explore', userBuilt=false, lastDet=[];
function key(x,y,z){ return x+','+y+','+z; }
function addBlock(x,y,z,t,silent){
  var k=key(x,y,z);
  if(blocks.has(k)||y<0||y>11||Math.abs(x+.5)>LIMIT-1||Math.abs(z+.5)>LIMIT-1) return false;
  var m=new THREE.Mesh(unitBox,blockMats[t]); m.position.set(x+.5,y+.5,z+.5); m.userData.cell=[x,y,z];
  scene.add(m); blocks.set(k,{m:m,t:t,c:[x,y,z]}); blockMeshes.push(m);
  if(!silent) blocksChanged(); return true;
}
function removeBlock(x,y,z){ var k=key(x,y,z), b=blocks.get(k); if(!b) return;
  scene.remove(b.m); blockMeshes.splice(blockMeshes.indexOf(b.m),1); blocks.delete(k); blocksChanged(); }
var detGroup=new THREE.Group(); scene.add(detGroup);
var CLS={ '方块':0x5ec962,'塔':0xfde725,'墙':0x4ac0e0,'平台':0x21918c,'房子':0xff8a5c,'长条':0x9bd1ff,'立方体':0xc59bff,'未知物体':0xe2557a };
function classify(w,h,d,n){
  var W=Math.max(w,d), D=Math.min(w,d), fill=n/(w*h*d);
  if(n===1) return '方块';
  if(h>=3&&h>=2*W&&fill>.6) return '塔';
  if(h===1&&n>=4&&D>=2&&fill>.7) return '平台';
  if(D===1&&W>=3&&h>=2&&fill>.6) return '墙';
  if(W>=3&&D>=3&&h>=2&&fill<.75) return '房子';
  if(D===1&&h===1) return '长条';
  if(fill>.9) return '立方体';
  return '未知物体';
}
function runDetection(){
  while(detGroup.children.length){ var ch=detGroup.children.pop(); if(ch.isSprite){ ch.material.map.dispose(); ch.material.dispose(); } }
  lastDet=[]; var seenB=new Set(), N6=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  blocks.forEach(function(b,k0){
    if(seenB.has(k0)) return;
    var q=[b.c], n=0, mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9]; seenB.add(k0);
    while(q.length){ var c=q.pop(); n++;
      for(var a=0;a<3;a++){ if(c[a]<mn[a]) mn[a]=c[a]; if(c[a]>mx[a]) mx[a]=c[a]; }
      for(var i=0;i<6;i++){ var nc=[c[0]+N6[i][0],c[1]+N6[i][1],c[2]+N6[i][2]], nk=key(nc[0],nc[1],nc[2]);
        if(blocks.has(nk)&&!seenB.has(nk)){ seenB.add(nk); q.push(nc); } } }
    var w=mx[0]-mn[0]+1, h=mx[1]-mn[1]+1, d=mx[2]-mn[2]+1, name=classify(w,h,d,n);
    var conf=name==='未知物体' ? .32+((n*13+w*7+h*5)%23)/100 : .80+((n*37+w*11+h*7+d*3)%19)/100;
    var col=CLS[name], box=edgeBox(w+.18,h+.18,d+.18,col,.07);
    box.position.set(mn[0]+w/2,mn[1]+h/2,mn[2]+d/2); detGroup.add(box);
    var hex=hexCss(col), lb=makeLabel(name+' '+conf.toFixed(2),{h:.42,color:hex,border:hex}); lb.position.set(mn[0]+w/2,mx[1]+1.55,mn[2]+d/2); detGroup.add(lb);
    lastDet.push({name:name,conf:conf});
  });
  if(userBuilt && lastDet.some(function(o){return o.name==='塔';})) doneTask('tower');
}
function blocksChanged(){ runDetection(); save(); }
function serialBlocks(){ var a=[]; blocks.forEach(function(b){ a.push([b.c[0],b.c[1],b.c[2],b.t]); }); return a; }
(function(){
  var init;
  if(store&&Array.isArray(store.blocks)) init=store.blocks;
  else { init=[[21,0,7,3]]; var x,y;
    for(x=23;x<=26;x++) for(y=0;y<2;y++) init.push([x,y,-4,2]);
    for(x=26;x<=27;x++) for(y=4;y<=5;y++) init.push([x,0,y,1]);
    init.push([19,0,-2,0],[19,1,-2,0],[20,0,-2,0]); }
  init.forEach(function(b){ addBlock(b[0],b[1],b[2],b[3]%5,true); });
  runDetection();
  label('检测工地 · 切到“搭建”放方块',24,7.6,2,{h:.8,color:HOT.color,border:HOT.border});
  fence(line(15.6,-8.5,32.5,-8.5,10)); fence(line(32.5,-8.5,32.5,12.5,12)); fence(line(32.5,12.5,15.6,12.5,10)); fence(line(15.6,12.5,15.6,4.6,5)); fence(line(15.6,-.6,15.6,-8.5,5));
  /* crane-ish sign post and crates */
  var g=grp(ST,17.2,0,-6.6); bx(g,T(WOOD2),1,1,1,0,.5,0); bx(g,T(WOOD2),.8,.8,.8,.2,1.4,.1); bx(g,T(WOOD),1.04,.08,1.04,0,.5,0); bx(g,T(0xfde725),.82,.82,.82,1.2,.41,.3); shadow(g,1.3,.4,0); obstacles.push({x:17.5,z:-6.5,r:1.1});
})();
