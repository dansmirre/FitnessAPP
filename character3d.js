import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
let active;
// All geometry below is generated locally; no remote avatar service is used.
function makeCharacter(sex,stage){
 const root=new THREE.Group(),female=sex==='female',muscle=stage/4;
 const skin=new THREE.MeshStandardMaterial({color:0xe4ae8c,roughness:.67}),hair=new THREE.MeshStandardMaterial({color:0x30231e,roughness:.9}),cloth=new THREE.MeshStandardMaterial({color:0x17191e,roughness:.95}),white=new THREE.MeshStandardMaterial({color:0xfaf6ec,roughness:.5}),pupil=new THREE.MeshStandardMaterial({color:0x31291f,roughness:.5}),sole=new THREE.MeshStandardMaterial({color:0x55565a,roughness:1});
 function ellipsoid(x,y,z,sx,sy,sz,material=skin){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);root.add(mesh);return mesh;}
 function limb(a,b,r1,r2,material=skin){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,delta.length(),20),material);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());root.add(mesh);return mesh;}
 const shoulders=female?.38+muscle*.08:.42+muscle*.16,waist=female?.24+muscle*.025:.26+muscle*.06,hips=female?.34+muscle*.025:.29+muscle*.055;
 const contour=[[hips,1.75],[hips,1.91],[waist,2.13],[waist+.035,2.34],[shoulders-.04,2.61],[shoulders,2.75],[shoulders-.06,2.82],[.13,2.9]];
 const torso=new THREE.Mesh(new THREE.LatheGeometry(contour.map(([x,y])=>new THREE.Vector2(x,y)),32),skin);torso.scale.z=.63;root.add(torso);
 ellipsoid(0,1.83,0,hips,.23,.22,cloth);
 limb([0,2.84,0],[0,3.06,0],.12,.11);
 ellipsoid(0,3.31,.005,.255,.315,.235); // head
 for(const sign of [-1,1]){
  ellipsoid(sign*.251,3.31,0,.048,.075,.04);
  ellipsoid(sign*.095,3.35,.208,.068,.045,.025,white);
  ellipsoid(sign*.095,3.35,.231,.025,.031,.011,pupil);
  const brow=ellipsoid(sign*.095,3.425,.218,.072,.013,.014,hair);brow.rotation.z=-sign*.08;
 }
 ellipsoid(0,3.29,.238,.035,.06,.04);
 const smile=new THREE.Mesh(new THREE.TorusGeometry(.068,.006,6,24,Math.PI*.72),new THREE.MeshStandardMaterial({color:0x9f6653,roughness:1}));smile.position.set(0,3.233,.223);smile.rotation.z=Math.PI*1.14;root.add(smile);
 ellipsoid(0,3.51,-.025,.26,.15,.225,hair);
 ellipsoid(0,3.34,-.15,.25,.22,.1,hair);
 // Deterministic tufts rather than random geometry on every render.
 for(let i=0;i<9;i++)ellipsoid(Math.sin(i*2.4)*.20,3.54+Math.cos(i*1.4)*.06,Math.cos(i*2.4)*.14,.09,.09,.085,hair);
 if(female){ellipsoid(0,3.31,-.31,.105,.2,.1,hair);ellipsoid(0,3.12,-.32,.09,.19,.08,hair);}
 for(const sign of [-1,1]){
  const arm=.074+muscle*.045,shoulder=[sign*shoulders,2.73,0],elbow=[sign*(shoulders+.12),2.23,.025],wrist=[sign*(shoulders+.17),1.82,.045];
  ellipsoid(...shoulder,arm*1.5,.17,arm*1.35);
  limb(shoulder,elbow,arm,arm*.83);ellipsoid(...elbow,arm*.85,.09,arm*.8);
  limb(elbow,wrist,arm*.85,.052);ellipsoid(sign*(shoulders+.17),1.72,.05,.065,.115,.045);ellipsoid(sign*(shoulders+.115),1.75,.08,.028,.065,.025);
  const legX=sign*hips*.55,thigh=.115+muscle*.05;
  limb([legX,1.82,0],[legX*1.07,1.03,.015],thigh,.078);ellipsoid(legX*1.07,1.03,.025,.083,.10,.083);
  limb([legX*1.07,1.01,.01],[legX*1.04,.26,0],.085+muscle*.02,.05);ellipsoid(legX*1.07,.76,-.035,.085+muscle*.02,.22,.075);
  ellipsoid(legX*1.04,.16,.09,.09,.09,.185,cloth);ellipsoid(legX*1.04,.105,.10,.095,.025,.19,sole);
  // Separate short legs leave a real gap between them.
  limb([legX,2.0,0],[legX,1.63,0],thigh*1.2,thigh*1.16,cloth);
 }
 ellipsoid(0,1.99,0,hips*1.02,.09,.235,cloth);
 if(female){
  const top=new THREE.Mesh(new THREE.LatheGeometry([[waist+.03,2.43],[shoulders-.03,2.58],[shoulders-.035,2.67]].map(([x,y])=>new THREE.Vector2(x,y)),32),cloth);top.scale.z=.68;root.add(top);
  for(const sign of [-1,1])limb([sign*.18,2.63,.15],[sign*.23,2.83,.05],.024,.024,cloth);
 }else if(stage>=2){
  for(const sign of [-1,1])ellipsoid(sign*(shoulders*.43),2.61,.17,.15+muscle*.03,.10,.055+muscle*.025);
  for(let i=0;i<3;i++)for(const sign of [-1,1])ellipsoid(sign*.07,2.36-i*.115,.174,.065,.052,.022);
 }
 return root;
}
function disposeObject(object){const geometries=new Set(),materials=new Set(),textures=new Set();object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}
export function mountCharacter({sex='male',stage=0}={}){
 active?.();active=null;
 const host=document.querySelector('#turnAvatar');if(!host)return;
 let renderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);
 const canvas=renderer.domElement;canvas.setAttribute('aria-label',`${sex==='female'?'Женский':'Мужской'} 3D-персонаж, этап ${stage+1}`);canvas.setAttribute('role','img');canvas.style.cssText='width:100%;height:100%;display:block;touch-action:pan-y';
 const scene=new THREE.Scene(),pivot=new THREE.Group();scene.add(pivot);let model=makeCharacter(sex,stage);pivot.add(model);
 scene.add(new THREE.HemisphereLight(0xfff0e3,0x454153,2.7));const light=new THREE.DirectionalLight(0xffe3ca,3);light.position.set(2,5,4);scene.add(light);const rim=new THREE.DirectionalLight(0xdddbff,1.8);rim.position.set(-3,3,-3);scene.add(rim);
 const camera=new THREE.PerspectiveCamera(30,1,.1,50);camera.position.set(0,2.0,7.8);camera.lookAt(0,1.95,0);
 let disposed=false,frame=0,mixer,last=performance.now(),dirty=true;
 const draw=()=>{if(disposed)return;renderer.render(scene,camera);dirty=false;};
 const resize=()=>{const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();draw();};
 const observer=new ResizeObserver(resize);observer.observe(host);
 // Keep SVG visible until a successful first render; WebGL failures retain it.
 try{const fallback=host.querySelector('svg');host.append(canvas);resize();if(fallback)fallback.style.display='none';host.dataset.renderer='3d';}catch{observer.disconnect();disposeObject(scene);renderer.dispose();canvas.remove();return;}
 let downX=0,downY=0,lastX=0,moved=false;
 host.onpointerdown=e=>{downX=lastX=e.clientX;downY=e.clientY;moved=false;};
 host.onpointermove=e=>{if(!e.buttons&&e.pointerType==='mouse')return;if(Math.abs(e.clientX-downX)<6&&!moved)return;if(Math.abs(e.clientY-downY)>Math.abs(e.clientX-downX)&&!moved)return;if(e.pressure===0&&e.pointerType!=='mouse')return;moved=true;host.setPointerCapture?.(e.pointerId);pivot.rotation.y+=(e.clientX-lastX)*.016;lastX=e.clientX;draw();};
 host.onpointerup=()=>{};host.onclick=()=>{if(!moved){pivot.rotation.y+=Math.PI/2;draw();}moved=false;};
 const hint=document.querySelector('#rotateHint');if(hint)hint.onclick=()=>{pivot.rotation.y+=Math.PI/2;draw();};
 const animate=time=>{if(disposed)return;const dt=Math.min(.05,(time-last)/1000);last=time;if(mixer&&!document.hidden){mixer.update(dt);draw();}else if(dirty)draw();if(mixer&&!document.hidden)frame=requestAnimationFrame(animate);};const visibility=()=>{cancelAnimationFrame(frame);if(mixer&&!document.hidden){last=performance.now();frame=requestAnimationFrame(animate);}};document.addEventListener('visibilitychange',visibility);
 // Optional artist-authored GLB replaces the generated starter model.
 const path=`./assets/avatars/${sex==='female'?'female':'male'}.glb`;
 fetch(path).then(async response=>{
  if(!response.ok||disposed)return;
  const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),new URL('.',document.baseURI).href);
  if(disposed){disposeObject(gltf.scene);return;}
  const custom=gltf.scene;const names=['BodyThin','BodySlim','BodyFit','BodyAthletic','BodyPowerful'];
  custom.traverse(o=>{if(o.morphTargetDictionary&&o.morphTargetInfluences){for(const name of names){const i=o.morphTargetDictionary[name];if(i!==undefined)o.morphTargetInfluences[i]=name===names[stage]?1:0;}}});
  const bounds=new THREE.Box3().setFromObject(custom),size=bounds.getSize(new THREE.Vector3());if(!Number.isFinite(size.y)||size.y<=0){disposeObject(custom);return;}
  const center=bounds.getCenter(new THREE.Vector3()),scale=3.6/size.y;custom.scale.multiplyScalar(scale);custom.position.set(-center.x*scale,.08-bounds.min.y*scale,-center.z*scale);
  pivot.remove(model);disposeObject(model);model=custom;pivot.add(custom);
  const idle=gltf.animations.find(a=>a.name.toLowerCase()==='idle');if(idle&&!matchMedia('(prefers-reduced-motion: reduce)').matches){mixer=new THREE.AnimationMixer(custom);mixer.clipAction(idle).play();visibility();}draw();host.dataset.renderer='glb';
 }).catch(()=>{/* Generated local model stays available if a GLB is absent or invalid. */});
 active=()=>{disposed=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);observer.disconnect();mixer?.stopAllAction();disposeObject(scene);renderer.dispose();renderer.forceContextLoss();canvas.remove();};
}
