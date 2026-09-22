import * as THREE from 'three';

// Renderer, ciclo de animación, resize y dispose. Sin geometría ni física.
export class Experience {
  constructor(canvasHost) {
    this.host = canvasHost;
    this.quality = 'detail';
    try { if (localStorage.getItem('macondo-quality') === 'light') this.quality = 'light'; } catch {}
    this.renderer = new THREE.WebGLRenderer({ antialias:true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = this.quality !== 'light';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(this._dpr());
    this.renderer.setSize(innerWidth, innerHeight);
    this.host.append(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9ed4e4);
    this.scene.fog = new THREE.Fog(0x9ed4e4, 45, 130);
    this.camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, .1, 400);
    this.camera.position.set(0, 26, 44);

    this.clock = new THREE.Clock();
    this.tickFns = new Set();
    this._loop = (ms) => this._frame(ms);
    this._boundResize = () => this._resize();
    addEventListener('resize', this._boundResize);
  }

  _dpr() { return Math.min(devicePixelRatio, this.quality === 'light' ? 1 : (innerWidth < 700 ? 1.5 : 2)); }

  setQuality(quality) {
    this.quality = quality === 'light' ? 'light' : 'detail';
    this.renderer.shadowMap.enabled = this.quality !== 'light';
    this.scene.traverse(o => { if (o.material) for (const m of [o.material].flat()) m.needsUpdate = true; });
    this._resize();
    try { localStorage.setItem('macondo-quality', this.quality); } catch {}
  }

  _resize() {
    this.camera.aspect = innerWidth/innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this._dpr());
    this.renderer.setSize(innerWidth, innerHeight);
  }

  onTick(fn) { this.tickFns.add(fn); }

  start() {
    this.renderer.setAnimationLoop(this._loop);
  }

  _frame(ms) {
    const dt = Math.min(this.clock.getDelta(), .1); // límite de delta tras cambiar de pestaña
    for (const fn of this.tickFns) fn(dt, performance.now()/1000);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    removeEventListener('resize', this._boundResize);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
