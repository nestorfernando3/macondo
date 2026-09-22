import { ancla } from '../anclas.js';

// Props estáticos fuera del eje de las rutas. No alteran colisiones.
export function buildSecondPackage({kit}) {
  const e = ancla('etiquetas'), v = ancla('vecina');
  kit.caja('madera', 1.8,.12,.6,e.x,1,e.z);
  for (const dx of [-.7,.7]) kit.caja('madera',.1,1,.1,e.x+dx,.5,e.z);
  // Llave, jarra con asa y carrete de hilo.
  kit.caja('piedraHonda',.35,.04,.06,e.x-.55,1.09,e.z);
  kit.cil('piedraHonda',.07,.04,e.x-.7,1.09,e.z);
  kit.cil('coral',.13,.3,e.x,1.2,e.z);
  kit.caja('coral',.08,.16,.08,e.x+.16,1.21,e.z);
  kit.cil('madera',.11,.2,e.x+.55,1.16,e.z);
  kit.cil('blanco',.08,.14,e.x+.55,1.16,e.z);
  // Vecina en el umbral: silueta sencilla, sin animación obligatoria.
  kit.cil('coral',.22,.9,v.x,.75,v.z);
  kit.cil('madera',.14,.27,v.x,1.37,v.z);
  for (const dx of [-.12,.12]) kit.caja('madera',.1,.3,.14,v.x+dx,.18,v.z);
}
