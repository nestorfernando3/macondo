import * as THREE from 'three';

// Misma altura para la superficie y los objetos que flotan sobre ella.
export function riverHeight(x, z, t) {
  return .085 + Math.sin(x * .65 + z * .3 - t * 1.15) * .028
    + Math.sin(z * 1.2 - x * .22 - t * 1.7) * .012;
}

export function createRiver(scene, kit) {
  const uniforms = { time:{ value:0 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float time;
      varying vec3 point;
      varying vec3 normalWater;
      void main() {
        vec4 p = modelMatrix * vec4(position, 1.0);
        float a = p.x * .65 + p.z * .3 - time * 1.15;
        float b = p.z * 1.2 - p.x * .22 - time * 1.7;
        p.y = .085 + sin(a) * .028 + sin(b) * .012;
        normalWater = normalize(vec3(-cos(a)*.0182 + cos(b)*.00264, 1.0,
          -cos(a)*.0084 - cos(b)*.0144));
        point = p.xyz;
        gl_Position = projectionMatrix * viewMatrix * p;
      }`,
    fragmentShader: `
      uniform float time;
      varying vec3 point;
      varying vec3 normalWater;
      void main() {
        vec3 viewDir = normalize(cameraPosition - point);
        float fresnel = pow(1.0 - max(dot(viewDir, normalWater), 0.0), 3.0);
        float current = sin(point.z*3.0 - point.x*.8 - time*1.8)
          * sin(point.x*1.5 + point.z*.7 - time*.6);
        float shore = smoothstep(-29.0, -24.0, point.x);
        vec3 color = mix(vec3(.035,.23,.29), vec3(.13,.47,.47), shore);
        color += current * .025;
        color = mix(color, vec3(.54,.75,.77), fresnel*.65);
        vec3 halfway = normalize(viewDir + normalize(vec3(-.4,1.0,.3)));
        float sparkle = pow(max(dot(normalWater, halfway),0.0),100.0);
        color += vec3(1.0,.85,.55) * sparkle * .55;
        float foam = smoothstep(.72,1.0,sin(point.z*2.8-time*1.3));
        color = mix(color,vec3(.73,.84,.72),shore*shore*foam*.18);
        float fog = smoothstep(45.0,130.0,length(cameraPosition-point));
        gl_FragColor = vec4(mix(color,vec3(.34,.66,.78),fog),1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(42,120,28,72),material);
  mesh.name = 'rio-corriente';
  mesh.rotation.x = -Math.PI/2; mesh.position.set(-44.9,0,-5);
  scene.add(mesh);
  kit.animar(t => { uniforms.time.value = t; });
  return mesh;
}

export function fountainDrop(i, t) {
  const stream = i % 8, phase = ((t * .8 + Math.floor(i/8)/12) % 1 + 1) % 1;
  const a = stream * Math.PI/4;
  const r = .11 + phase*.72;
  return { x:Math.cos(a)*r, z:Math.sin(a)*r,
    y:1.76 + 1.1*phase - 2.2*phase*phase, scale:.035 + phase*.018 };
}

export function createFountain(kit) {
  const mat = new THREE.MeshStandardMaterial({ color:0x9ce7e7, roughness:.18, metalness:.15, emissive:0x497d87, emissiveIntensity:.25 });
  kit.movil(new THREE.IcosahedronGeometry(1,0),mat,96,(o,i,t) => {
    const p = fountainDrop(i,t);
    o.position.set(p.x,p.y,p.z); o.scale.set(p.scale,p.scale*1.8,p.scale);
  }, { sombra:false });
  // Impactos en ocho puntos de la taza, separados del pilar central.
  kit.movil(new THREE.TorusGeometry(.1,.012,3,16),mat,16,(o,i,t) => {
    const a = (i%8)*Math.PI/4, phase = (t*.8 + Math.floor(i/8)*.5)%1;
    o.position.set(Math.cos(a)*.82,.655,Math.sin(a)*.82);
    o.rotation.x = Math.PI/2; o.scale.setScalar(.3 + phase*.8);
  }, { sombra:false });
}
