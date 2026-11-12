(function(){
'use strict';
var hot = window.claude && window.claude.hot;

function start(saved){
saved = (saved && saved.v===2) ? saved : {};
var $ = function(id){ return document.getElementById(id); };
if(!window.THREE){ $('err').style.display='flex'; return; }

var FONT='"PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei",sans-serif';
var isTouch = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window);
if(isTouch) document.body.classList.add('touch');
var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var PI=Math.PI;

/* ---------- persistence ---------- */
var store = null;
try{ store = JSON.parse(localStorage.getItem('nv-world-v2') || 'null'); }catch(e){}
if(saved.blocks) store = saved;

/* ---------- renderer ---------- */
var canvas = $('view'), renderer;
try{ renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true}); }
catch(e){ $('err').style.display='flex'; return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x8f6fa6);
scene.fog = new THREE.Fog(0x8f6fa6, 48, 175);
var camera = new THREE.PerspectiveCamera(70, 1, 0.1, 800);
camera.rotation.order = 'YXZ';
function resize(){
  var w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w/h; camera.fov = w < h ? 80 : 66; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

/* ---------- colour scale (viridis) ---------- */
var VIR=[[68,1,84],[59,82,139],[33,145,140],[94,201,98],[253,231,37]];
function vir(t){ t=Math.max(0,Math.min(1,t)); var f=t*4,i=Math.min(3,Math.floor(f)),u=f-i,a=VIR[i],b=VIR[i+1];
  return [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u, a[2]+(b[2]-a[2])*u]; }
function virCss(t){ var c=vir(t); return 'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')'; }
function virSet(col,t,k){ var c=vir(t); k=(k===undefined?1:k)/255; return col.setRGB(c[0]*k,c[1]*k,c[2]*k); }
function hexCss(h){ return '#'+('000000'+h.toString(16)).slice(-6); }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function mkRng(s){ return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
var rand=mkRng(20261112);

/* ---------- canvas / label helpers ---------- */
function canvasTex(c){ var t=new THREE.CanvasTexture(c); t.generateMipmaps=false; t.minFilter=THREE.LinearFilter; return t; }
function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function makeLabel(text,opt){
  opt=opt||{};
  var c=document.createElement('canvas'), ctx=c.getContext('2d'), tex=canvasTex(c);
  var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,fog:false}));
  var h=opt.h||0.5, last=null;
  sp.setText=function(t){
    if(t===last) return; last=t;
    var fs=44,pad=16,font='600 '+fs+'px '+FONT;
    ctx.font=font;
    var w=Math.ceil(ctx.measureText(t).width)+pad*2;
    c.width=w; c.height=fs+pad*2;
    ctx.font=font; ctx.textBaseline='middle';
    rr(ctx,2,2,w-4,c.height-4,16);
    ctx.fillStyle=opt.bg||'rgba(20,22,58,.80)'; ctx.fill();
    ctx.lineWidth=3; ctx.strokeStyle=opt.border||'rgba(200,190,255,.4)'; ctx.stroke();
    ctx.fillStyle=opt.color||'#f1efff'; ctx.fillText(t,pad,c.height/2+2);
    tex.needsUpdate=true;
    sp.scale.set(h*w/c.height,h,1);
  };
  sp.setText(text);
  return sp;
}
function label(text,x,y,z,opt){ var s=makeLabel(text,opt); s.position.set(x,y,z); scene.add(s); return s; }
var HOT={color:'#fde725',border:'rgba(253,231,37,.55)'};
var glowTex=(function(){ var c=document.createElement('canvas'); c.width=c.height=64; var x=c.getContext('2d');
  var g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.35,'rgba(255,255,255,.45)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.fillRect(0,0,64,64); return canvasTex(c); })();
function glow(color,size,opacity){ var s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:color,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:opacity===undefined?.6:opacity}));
  s.scale.set(size,size,1); return s; }

/* ---------- geometry + material kit ---------- */
var G={ sph:new THREE.SphereGeometry(1,18,12), lo:new THREE.SphereGeometry(1,10,7), box:new THREE.BoxGeometry(1,1,1),
  cyl:new THREE.CylinderGeometry(1,1,1,12), cone:new THREE.ConeGeometry(1,1,12), taper:new THREE.CylinderGeometry(.65,1,1,14),
  pyr:new THREE.ConeGeometry(1,1,4), torus:new THREE.TorusGeometry(1,.2,6,18), disc:new THREE.CircleGeometry(1,22) };
G.disc.rotateX(-PI/2); G.pyr.rotateY(PI/4);
var unitBox=G.box, mc={};
function T(hex,em){ var k='t'+hex+'_'+(em||0); return mc[k]||(mc[k]=new THREE.MeshToonMaterial(em?{color:hex,emissive:hex,emissiveIntensity:em}:{color:hex})); }
function B(hex,op){ var k='b'+hex+'_'+(op||0); return mc[k]||(mc[k]=new THREE.MeshBasicMaterial(op?{color:hex,transparent:true,opacity:op,depthWrite:false}:{color:hex})); }
var shadowM=new THREE.MeshBasicMaterial({color:0x1a1035,transparent:true,opacity:.26,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
var WOOD=0x8a6044, WOOD2=0xcdb38a, STONE=0xa59fb5, CREAM=0xf6e7cf, DARK=0x2a2440;
function add(p,geo,m,sx,sy,sz,x,y,z){ var o=new THREE.Mesh(geo,m); o.scale.set(sx,sy,sz); o.position.set(x||0,y||0,z||0); if(p) p.add(o); return o; }
function ball(p,m,rx,ry,rz,x,y,z){ return add(p,G.sph,m,rx,ry,rz,x,y,z); }
function lo(p,m,rx,ry,rz,x,y,z){ return add(p,G.lo,m,rx,ry,rz,x,y,z); }
function bx(p,m,sx,sy,sz,x,y,z){ return add(p,G.box,m,sx,sy,sz,x,y,z); }
function cy(p,m,r,h,x,y,z){ return add(p,G.cyl,m,r,h,r,x,y,z); }
function cn(p,m,r,h,x,y,z){ return add(p,G.cone,m,r,h,r,x,y,z); }
function disc(p,m,r,x,y,z){ return add(p,G.disc,m,r,1,r,x,y,z); }
function shadow(p,r,x,z){ return disc(p,shadowM,r,x||0,.04,z||0); }
function grp(p,x,y,z,ry){ var g=new THREE.Group(); g.position.set(x||0,y||0,z||0); if(ry) g.rotation.y=ry; if(p) p.add(g); return g; }
function gable(w,h,d){ var s=new THREE.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(0,h); s.lineTo(-w/2,0);
  var g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}); g.translate(0,0,-d/2); return g; }
function edgeBox(w,h,d,color,t,p){
  t=t||0.06; var g=new THREE.Group(), m=B(color);
  [-1,1].forEach(function(a){ [-1,1].forEach(function(b){
    bx(g,m,w+t,t,t,0,a*h/2,b*d/2); bx(g,m,t,h+t,t,a*w/2,0,b*d/2); bx(g,m,t,t,d+t,a*w/2,b*h/2,0);
  });});
  if(p) p.add(g); return g;
}
/* merge every mesh under a group into one mesh per material (static things only) */
function bake(group){
  group.updateMatrixWorld(true);
  var inv=new THREE.Matrix4().copy(group.matrixWorld).invert(), by=new Map(), rel=new THREE.Matrix4();
  group.traverse(function(o){ if(!o.isMesh) return;
    var g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
    rel.multiplyMatrices(inv,o.matrixWorld); g.applyMatrix4(rel);
    var a=by.get(o.material); if(!a){ a=[]; by.set(o.material,a); } a.push(g); });
  while(group.children.length) group.remove(group.children[0]);
  by.forEach(function(list,material){ var n=0; list.forEach(function(g){ n+=g.attributes.position.count; });
    var pos=new Float32Array(n*3), nor=new Float32Array(n*3), off=0;
    list.forEach(function(g){ pos.set(g.attributes.position.array,off*3); nor.set(g.attributes.normal.array,off*3); off+=g.attributes.position.count; g.dispose(); });
    var bg=new THREE.BufferGeometry(); bg.setAttribute('position',new THREE.BufferAttribute(pos,3)); bg.setAttribute('normal',new THREE.BufferAttribute(nor,3));
    var m=new THREE.Mesh(bg,material); m.frustumCulled=group.userData.cull!==false; group.add(m); });
  return group;
}
var dummy=new THREE.Object3D(), tmpCol=new THREE.Color();
function Inst(geo,material,max){ this.m=new THREE.InstancedMesh(geo,material,max); this.m.frustumCulled=false; this.n=0; this.max=max; scene.add(this.m); }
Inst.prototype.add=function(x,y,z,sx,sy,sz,ry,color){ if(this.n>=this.max) return;
  dummy.position.set(x,y,z); dummy.scale.set(sx,sy,sz); dummy.rotation.set(0,ry||0,0); dummy.updateMatrix();
  this.m.setMatrixAt(this.n,dummy.matrix); if(color!==undefined) this.m.setColorAt(this.n,tmpCol.setHex(color)); this.n++; };
Inst.prototype.done=function(){ this.m.count=this.n; this.m.instanceMatrix.needsUpdate=true; if(this.m.instanceColor) this.m.instanceColor.needsUpdate=true; };

var ST=new THREE.Group(); ST.userData.cull=false;      /* all static scenery, baked at the end */
var invisible=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
var interactables=[], obstacles=[], rects=[], ticks=[];
function onTick(fn){ ticks.push(fn); }
function hitSphere(p,r,x,y,z,fn){ var h=new THREE.Mesh(G.lo,invisible); h.scale.set(r,r,r); h.position.set(x,y,z); h.userData.tap=fn; p.add(h); interactables.push(h); return h; }
var toastT=0;
function toast(msg){ var el=$('toast'); el.textContent=msg; el.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(function(){ el.classList.remove('on'); },2600); }

/* ---------- tasks + knowledge counter ---------- */
var TASK_KEYS=['input','kernel','stride','rcnn','thr','track','vlm','tower'];
var tasks=(store&&store.tasks)||{}, seen=(store&&store.seen)||{}, totalNodes=0;
function renderTasks(){
  var d=0; Array.prototype.forEach.call(document.querySelectorAll('#tasks li'),function(li){ var ok=!!tasks[li.dataset.t]; if(ok) d++; li.classList.toggle('done',ok); });
  $('prog').textContent='任务 '+d+'/'+TASK_KEYS.length+' · 知识点 '+Object.keys(seen).length+'/'+totalNodes;
}
function doneTask(k){ if(tasks[k]) return; tasks[k]=true; renderTasks(); save();
  var all=TASK_KEYS.every(function(t){ return tasks[t]; });
  toast(all ? '八个任务全部完成,你已经是村里的老手了。' : '任务完成 ✓'); }
$('brand').onclick=function(){ this.classList.toggle('open'); };
var save=function(){};

/* ---------- player (declared early; exhibits read the position) ---------- */
var PL={x:0,z:41.5,yaw:0,pitch:0.03};
if(saved.pos){ PL.x=saved.pos[0]; PL.z=saved.pos[1]; PL.yaw=saved.pos[2]; PL.pitch=saved.pos[3]; }
function near(x,z,d){ return Math.abs(PL.x-x)<d && Math.abs(PL.z-z)<d; }
var LIMIT=46;
