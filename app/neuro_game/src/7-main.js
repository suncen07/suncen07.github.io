
/* =====================================================
   finalize static scenery
   ===================================================== */
iPost.done(); iRail.done();
bake(ST); scene.add(ST);
[['神经网络广场',0,12.2,0]].forEach(function(z){ label(z[0],z[1],z[2],z[3],{h:1.0,color:HOT.color,border:HOT.border}); });

save=function(){ try{ localStorage.setItem('nv-world-v2',JSON.stringify({v:2,blocks:serialBlocks(),tasks:tasks,seen:seen})); }catch(e){} };

/* =====================================================
   PLAYER + INPUT
   ===================================================== */
var keys={}, joy={x:0,y:0}, nearNpc=null, jumpQ=false;
PL.y=(saved.pos&&saved.pos[4])||0; PL.vy=0; PL.ground=true;
window.addEventListener('keydown',function(e){ keys[e.code]=true;
  if(e.code==='Space'){ jumpQ=true; e.preventDefault(); }
  if(e.code==='Escape') closeDlg();
  if(e.code==='KeyE'&&nearNpc&&!dlgOpen) openDlg(nearNpc.id);
  if(e.code==='KeyB') setMode(mode==='build'?'explore':'build'); });
window.addEventListener('keyup',function(e){ keys[e.code]=false; });
window.addEventListener('blur',function(){ keys={}; });

var stick=$('stick'), knob=$('knob'), stickId=null;
function stickMove(e){ var r=stick.getBoundingClientRect(), dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2), m=Math.hypot(dx,dy), R=40;
  if(m>R){ dx*=R/m; dy*=R/m; } knob.style.transform='translate('+dx+'px,'+dy+'px)'; joy.x=dx/R; joy.y=-dy/R; }
stick.addEventListener('pointerdown',function(e){ stickId=e.pointerId; try{ stick.setPointerCapture(e.pointerId); }catch(_){} stickMove(e); e.preventDefault(); });
stick.addEventListener('pointermove',function(e){ if(e.pointerId===stickId) stickMove(e); });
function stickEnd(e){ if(e.pointerId!==stickId) return; stickId=null; joy.x=joy.y=0; knob.style.transform=''; }
stick.addEventListener('pointerup',stickEnd); stick.addEventListener('pointercancel',stickEnd);

var ptrs=new Map();
canvas.addEventListener('pointerdown',function(e){ ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,moved:0,t:performance.now()}); try{ canvas.setPointerCapture(e.pointerId); }catch(_){} });
canvas.addEventListener('pointermove',function(e){ var p=ptrs.get(e.pointerId); if(!p) return;
  var dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY; p.moved+=Math.abs(dx)+Math.abs(dy);
  if(p.moved>6){ PL.yaw-=dx*0.0052; PL.pitch=clamp(PL.pitch-dy*0.0052,-1.35,1.35); } });
canvas.addEventListener('pointerup',function(e){ var p=ptrs.get(e.pointerId); ptrs.delete(e.pointerId);
  if(p&&p.moved<12&&performance.now()-p.t<450) tap(e.clientX,e.clientY); });
canvas.addEventListener('pointercancel',function(e){ ptrs.delete(e.pointerId); });
canvas.addEventListener('contextmenu',function(e){ e.preventDefault(); });

function solidAt(x,z,r){ var i;
  for(i=0;i<obstacles.length;i++){ var o=obstacles[i]; if(Math.hypot(x-o.x,z-o.z)<o.r+r) return true; }
  for(i=0;i<rects.length;i++){ var q=rects[i]; if(x>q.x0-r&&x<q.x1+r&&z>q.z0-r&&z<q.z1+r) return true; }
  return false; }
function bodyHits(x,z,y){ var y0=Math.floor(y+.05), y1=Math.floor(y+1.6);
  for(var a=-1;a<=1;a+=2) for(var b=-1;b<=1;b+=2){ var fx=Math.floor(x+a*.3), fz=Math.floor(z+b*.3);
    for(var yy=y0;yy<=y1;yy++) if(blocks.has(key(fx,yy,fz))) return true; }
  return false; }
function support(x,z,y){ var best=0;
  for(var a=-1;a<=1;a+=2) for(var b=-1;b<=1;b+=2){ var fx=Math.floor(x+a*.3), fz=Math.floor(z+b*.3);
    for(var yy=Math.min(11,Math.floor(y+.05)-1);yy>=0;yy--) if(blocks.has(key(fx,yy,fz))){ if(yy+1>best) best=yy+1; break; } }
  return best; }
function indoors(x,z){ for(var i=0;i<interiors.length;i++){ var q=interiors[i]; if(x>q.x0&&x<q.x1&&z>q.z0&&z<q.z1) return true; } return false; }
function blocked(x,z){
  if(Math.hypot(x,z)>LIMIT) return true;
  if(bodyHits(x,z,PL.y)&&!bodyHits(PL.x,PL.z,PL.y)) return true;
  return solidAt(x,z,0);
}
while(bodyHits(PL.x,PL.z,PL.y)&&PL.y<12) PL.y+=1;
$('jump').addEventListener('pointerdown',function(e){ jumpQ=true; e.preventDefault(); });

var ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
function tap(cx,cy){
  if(dlgOpen) return;
  var r=canvas.getBoundingClientRect(); ndc.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height*2-1));
  ray.setFromCamera(ndc,camera);
  var hits=ray.intersectObjects(interactables.concat(blockMeshes,[ground]),false);
  if(!hits.length) return;
  var h=hits[0], o=h.object;
  if(o.userData.tap){ if(h.distance>60){ toast('走近一点再点'); return; } o.userData.tap(); return; }
  if(mode!=='build'){ if(o.userData.cell) toast('切到“搭建”才能改方块'); return; }
  if(h.distance>16){ toast('太远了,走近一点再放'); return; }
  var x,y,z;
  if(o.userData.cell){ var c=o.userData.cell;
    if(erasing){ userBuilt=true; removeBlock(c[0],c[1],c[2]); return; }
    var n=h.face.normal; x=c[0]+Math.round(n.x); y=c[1]+Math.round(n.y); z=c[2]+Math.round(n.z);
  } else { if(erasing) return; x=Math.floor(h.point.x); y=0; z=Math.floor(h.point.z); }
  if(y>=Math.floor(PL.y)&&y<=Math.floor(PL.y+1.7)&&Math.abs(x+.5-PL.x)<.8&&Math.abs(z+.5-PL.z)<.8){ toast('离自己太近了,退一步再放'); return; }
  if(y<4&&solidAt(x+.5,z+.5,.5)){ toast('这里有东西,换个位置'); return; }
  userBuilt=true;
  if(!addBlock(x,y,z,curColor)) toast(y>11?'已经到最高了':'这里放不了');
}

function setMode(m){ mode=m; document.body.classList.toggle('build',m==='build');
  $('mExplore').setAttribute('aria-pressed',m==='explore'); $('mBuild').setAttribute('aria-pressed',m==='build');
  if(m==='build') toast('点地面放方块,点方块的面继续垒。东边工地最宽敞'); }
$('mExplore').onclick=function(){ setMode('explore'); }; $('mBuild').onclick=function(){ setMode('build'); };
Array.prototype.forEach.call(document.querySelectorAll('.sw'),function(b){ var i=+b.dataset.c;
  b.style.background=hexCss(BCOL[i]); b.setAttribute('aria-pressed',i===curColor);
  b.onclick=function(){ curColor=i; erasing=false; $('erase').setAttribute('aria-pressed','false');
    Array.prototype.forEach.call(document.querySelectorAll('.sw'),function(o){ o.setAttribute('aria-pressed',o===b); }); }; });
$('erase').onclick=function(){ erasing=!erasing; this.setAttribute('aria-pressed',erasing); };

$('talk').onclick=function(){ if(nearNpc) openDlg(nearNpc.id); };
$('introKeys').textContent=isTouch ? '左下摇杆移动 · 拖动画面转视角 · 「跳」能跳上方块 · 轻点牌子、发光物体和居民' : 'WASD 移动 · 空格跳 · 按住鼠标拖动转视角 · 点击互动 · E 对话 · B 搭建';
function showIntro(){ closeDlg(); $('intro').classList.add('on'); }
$('go').onclick=function(){ $('intro').classList.remove('on'); canvas.focus(); };
$('helpBtn').onclick=function(){ if($('intro').classList.contains('on')) $('intro').classList.remove('on'); else showIntro(); };
if(!saved.pos) showIntro();

if(hot&&hot.snapshot) hot.snapshot(function(){ return {v:2,blocks:serialBlocks(),tasks:tasks,seen:seen,pos:[PL.x,PL.z,PL.yaw,PL.pitch,PL.y]}; });
window.__nv={PL:PL,r:renderer,n:npcList};

/* ---------- minimap ---------- */
var mctx=$('map').getContext('2d'), MZ=[['NN',0,2],['CNN',-25,-2],['工地',24,2],['YOLO',0,-28],['R-CNN',-22,-25],['追踪',26,-24],['VLM',-26,21]];
function drawMap(){
  var W=192, span=100, k=W/span;
  mctx.drawImage(gcan,w2p(-span/2),w2p(-span/2),span*mpp,span*mpp,0,0,W,W);
  mctx.fillStyle='rgba(20,22,58,.28)'; mctx.fillRect(0,0,W,W);
  mctx.font='600 15px '+FONT; mctx.textAlign='center'; mctx.textBaseline='middle'; mctx.lineWidth=3;
  MZ.forEach(function(z){ var x=(z[1]+span/2)*k, y=(z[2]+span/2)*k; mctx.strokeStyle='rgba(20,22,58,.9)'; mctx.strokeText(z[0],x,y); mctx.fillStyle='#fde725'; mctx.fillText(z[0],x,y); });
  npcList.forEach(function(n){ mctx.fillStyle=n.walker?'#ffffff':'#ff9bb0'; mctx.beginPath(); mctx.arc((n.ch.g.position.x+span/2)*k,(n.ch.g.position.z+span/2)*k,n.walker?2.5:3.5,0,7); mctx.fill(); });
  var px=(PL.x+span/2)*k, pz=(PL.z+span/2)*k;
  mctx.save(); mctx.translate(px,pz); mctx.rotate(-PL.yaw); mctx.fillStyle='#ffffff'; mctx.strokeStyle='#14163a'; mctx.lineWidth=2;
  mctx.beginPath(); mctx.moveTo(0,-11); mctx.lineTo(7,8); mctx.lineTo(0,4); mctx.lineTo(-7,8); mctx.closePath(); mctx.fill(); mctx.stroke(); mctx.restore();
}

/* ---------- loop ---------- */
var clock=new THREE.Clock(), time=0, frame=0, perfAcc=0;
function tick(){
  requestAnimationFrame(tick);
  var dt=Math.min(.05,clock.getDelta()); time+=dt; frame++;
  var mx=joy.x+((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0);
  var my=joy.y+((keys.KeyW||keys.ArrowUp)?1:0)-((keys.KeyS||keys.ArrowDown)?1:0);
  var ml=Math.hypot(mx,my); if(ml>1){ mx/=ml; my/=ml; }
  if(ml>.05&&!dlgOpen){
    var sp=5.6*dt, syw=Math.sin(PL.yaw), cyw=Math.cos(PL.yaw);
    var dx=(cyw*mx-syw*my)*sp, dz=(-syw*mx-cyw*my)*sp;
    if(!blocked(PL.x+dx,PL.z)) PL.x+=dx;
    if(!blocked(PL.x,PL.z+dz)) PL.z+=dz;
  }
  if(jumpQ&&PL.ground&&!dlgOpen){ PL.vy=6.7; PL.ground=false; } jumpQ=false;
  PL.vy-=19*dt; var ny=PL.y+PL.vy*dt;
  if(PL.vy>0&&bodyHits(PL.x,PL.z,ny)&&!bodyHits(PL.x,PL.z,PL.y)){ PL.vy=0; ny=PL.y; }
  var sup=support(PL.x,PL.z,PL.y);
  if(ny<=sup){ ny=sup; PL.vy=0; PL.ground=true; } else PL.ground=false;
  if(ny>.95&&indoors(PL.x,PL.z)){ ny=.95; if(PL.vy>0) PL.vy=0; }
  PL.y=ny;
  var bob=(ml>.05&&PL.ground&&!reduceMotion&&!dlgOpen)?Math.sin(time*9)*.035:0;
  camera.position.set(PL.x,PL.y+1.7+bob,PL.z); camera.rotation.set(PL.pitch,PL.yaw,0);
  for(var i=0;i<ticks.length;i++) ticks[i](time,dt);
  var best=null, bd=4.6;
  for(i=0;i<npcList.length;i++){ var n=npcList[i]; if(n.walker) tickWalker(n,dt); var d=tickNPC(n,time,dt); if(d<bd){ bd=d; best=n; } }
  if(best!==nearNpc){ nearNpc=best; var tb=$('talk'); if(best){ tb.textContent='和'+best.name.split(' ')[0]+'对话'; tb.style.display='block'; } else tb.style.display='none'; }
  if(frame%8===1) drawMap();
  if(frame<=120){ perfAcc+=dt; if(frame===120&&perfAcc/120>1/27){ renderer.setPixelRatio(1); resize(); } }
  renderer.render(scene,camera);
}
tick();
}

if(hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
</script>
</body>
</html>
