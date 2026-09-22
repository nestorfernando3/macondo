import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export function createWorld(container, onSelect) {
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;container.append(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,innerWidth/innerHeight,.1,100);camera.position.set(11,9,14);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=12;controls.maxDistance=25;controls.maxPolarAngle=Math.PI*.47;controls.target.set(-3,0,0);
 scene.add(new T.HemisphereLight(0xffd9bb,0x354979,3));const sun=new T.DirectionalLight(0xffdab0,4);sun.position.set(-3,8,5);scene.add(sun);
 const world=new T.Group();scene.add(world);const mats=new Map();function material(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return mats.get(c)}
 function mesh(geo,c,x=0,y=0,z=0,parent=world){const m=new T.Mesh(geo,material(c));m.position.set(x,y,z);parent.add(m);return m}
 const rock=mesh(new T.ConeGeometry(4.7,4,7),0x455569,0,-2,0);rock.rotation.z=Math.PI;
 mesh(new T.CylinderGeometry(4.65,4.3,.55,9),0x658c80,0,.05,0);
 mesh(new T.CylinderGeometry(4.4,4.6,.08,9),0x92aa82,0,.35,0);
 const river=new T.CatmullRomCurve3([new T.Vector3(-3,.44,-2.4),new T.Vector3(-1,.46,-1),new T.Vector3(0,.46,1),new T.Vector3(2,.44,2),new T.Vector3(3,.4,3)]);
 mesh(new T.TubeGeometry(river,40,.28,8,false),0x85e7db);
 const fall=mesh(new T.CylinderGeometry(.25,.1,5,12),0x8ee9e0,3,-2.05,3);fall.material=new T.MeshStandardMaterial({color:0x8ee9e0,transparent:true,opacity:.65,emissive:0x38777e});
 function house(x,z,c,scale=1){const g=new T.Group();g.position.set(x,.4,z);g.scale.setScalar(scale);world.add(g);mesh(new T.BoxGeometry(1.15,1.25,1),c,0,.62,0,g);const roof=mesh(new T.ConeGeometry(1.05,.7,4),0xad646c,0,1.57,0,g);roof.rotation.y=Math.PI/4;mesh(new T.BoxGeometry(.28,.66,.03),0x304e5b,0,.34,.515,g);for(const xx of [-.37,.37])mesh(new T.BoxGeometry(.19,.3,.04),0xffdc86,xx,.87,.515,g);return g}
 house(-2,0,0xf0ce92,1.2);house(-2.7,-1.7,0xe79388,.8);house(.8,-2,0x83bfc2);house(2,-.8,0xf2b676,.8);house(-.3,2.6,0xcfa7cd,.7);
 let seed=42;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
 for(let i=0;i<23;i++){const a=rand()*Math.PI*2,r=2.6+rand()*1.35,x=Math.cos(a)*r,z=Math.sin(a)*r;mesh(new T.CylinderGeometry(.07,.12,1.4,5),0x77655d,x,1,z);for(let j=0;j<3;j++)mesh(new T.IcosahedronGeometry(.45+rand()*.3,1),[0xe5a0b8,0xc37a9c,0x6ba99d][i%3],x+(rand()-.5)*.6,1.7+j*.2,z+(rand()-.5)*.6)}
 const clouds=[];for(let i=0;i<12;i++){const g=new T.Group();g.position.set((rand()-.5)*20,rand()*3-2,(rand()-.5)*13-3);for(let j=0;j<4;j++){const puff=mesh(new T.IcosahedronGeometry(.6+rand()*.6,2),0xe9b9b3,j*.65,rand()*.3,0,g);puff.scale.y=.45}scene.add(g);clouds.push(g)}
 const butterflies=[];const wingGeo=new T.SphereGeometry(1,6,4);for(let i=0;i<65;i++){const g=new T.Group();const wings=[-1,1].map(sign=>{const w=mesh(wingGeo,0xffd15c,sign*.11,0,0,g);w.scale.set(.14,.025,.2);return w});g.userData={phase:rand()*6.28,r:2+rand()*4,y:1+rand()*4,wings};world.add(g);butterflies.push(g)}
 const markers=[[-2,2.6,0],[1.8,2.6,-1.8],[2.6,1.3,1.8],[-.5,4,-2]].map((p,i)=>{const m=mesh(new T.OctahedronGeometry(.17),[0xffd074,0xf18fab,0x73d9c9,0xc5a4f0][i],...p);m.userData.index=i;return m});
 const stars=new Float32Array(180*3);for(let i=0;i<stars.length;i++)stars[i]=(rand()-.5)*35;const starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.BufferAttribute(stars,3));scene.add(new T.Points(starGeo,new T.PointsMaterial({color:0xffdcaa,size:.035,transparent:true,opacity:.7})));
 const ray=new T.Raycaster(),pointer=new T.Vector2();let down;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(markers)[0];if(hit)onSelect(hit.object.userData.index)});
 let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,t=0,last=0;
 let exploring=false;
 function explore(){exploring=true;controls.target.set(0,0,0);camera.position.set(10,9,14);camera.fov=innerWidth<700?55:42;camera.updateProjectionMatrix();controls.update()}
 let userMoved=false;controls.addEventListener('start',()=>userMoved=true);
 function resize(){const mobile=innerWidth<700;camera.aspect=innerWidth/innerHeight;camera.fov=exploring?(mobile?55:42):(mobile?48:38);camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(!exploring)controls.target.set(mobile?0:-3,mobile?3.4:0,0);if(!exploring&&mobile&&!userMoved)camera.position.set(10,11,20)}resize();addEventListener('resize',resize);
 renderer.setAnimationLoop(ms=>{const dt=Math.min((ms-last)/1000,.05);last=ms;if(!paused){t+=dt;world.position.y=Math.sin(t*.6)*.12;butterflies.forEach(b=>{const d=b.userData,a=t*.18+d.phase;b.position.set(Math.cos(a)*d.r,d.y+Math.sin(t+d.phase)*.3,Math.sin(a)*d.r);b.rotation.y=-a;d.wings.forEach((w,i)=>w.rotation.z=Math.sin(t*9+d.phase)*.8*(i?1:-1))});markers.forEach(m=>m.rotation.y=t);clouds.forEach((c,i)=>c.position.y+=Math.sin(t*.4+i)*dt*.025)}controls.update();renderer.render(scene,camera)});
 return {explore,home(){exploring=false;userMoved=false;camera.position.set(11,9,14);resize()},setPaused(value){paused=value},get paused(){return paused}};
}
