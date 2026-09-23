import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import * as THREE from 'three';
import { createVillage } from '../src/world/createVillage.js';
import { ancla, superficieDe, idsDeAnclas } from '../src/world/anclas.js';
import { createStoryEffects } from '../src/world/storyEffects.js';
import { BANCA_DEL_CORREO } from '../src/world/places/puerto.js';
import { ENCOUNTERS } from '../src/data/encounters.js';
import { LOCATIONS, NODES, EDGES, TOUR_ORDER, routePointsFrom } from '../src/data/locations.js';
import { stations } from '../src/data/content.js';
import { restoreProgress, serializeProgress } from '../src/state/progress.js';
import { InteractionSystem } from '../src/interaction/InteractionSystem.js';
import { STORIES, HISTORIAS_KEY, MAX_WRITING, tracesFrom } from '../src/data/stories.js';
import { restoreHistorias, serializeHistorias } from '../src/state/historias.js';
import { NarrativeDirector } from '../src/narrative/NarrativeDirector.js';
import { Locomocion } from '../src/navigation/Locomocion.js';
import { NARRACION } from '../src/data/narracion.js';
import { TourNarrator } from '../src/audio/TourNarrator.js';
import { AmbientBed, AMBIENTE_KEY } from '../src/audio/AmbientBed.js';
import { CONTORNOS, PERFIL_CUERPO, geometriaAla } from '../src/world/butterflyAvatar.js';
test('encuentros y rutas referencian registros existentes',()=>{
 assert.equal(new Set(ENCOUNTERS.map(e=>e.id)).size,ENCOUNTERS.length);
 for(const e of ENCOUNTERS){assert.ok(LOCATIONS[e.locationId]);assert.ok(stations.some(s=>s.id===e.contentId) || STORIES.some(s=>s.encounterId===e.id));assert.ok(e.radius>0)}
 for(const edge of EDGES) for(const id of edge) assert.ok(NODES[id]);
 for(const id of TOUR_ORDER) assert.ok(routePointsFrom(0,30,id)?.length>1);
});
test('migra visitas antiguas y tolera progreso corrupto',()=>{
 const ids=stations.map(s=>s.id);
 const state=restoreProgress({visited:['Casa de la memoria','puerto','desconocido'],answers:['voz','x']},LOCATIONS,ids);
 assert.deepEqual([...state.discovered],['casa','puerto']);
 assert.deepEqual([...state.answered],['voz']);
 assert.deepEqual(serializeProgress(state).visited,['casa','puerto']);
 for(const raw of [null,17,{visited:{},answers:'voz'}]) assert.equal(restoreProgress(raw,LOCATIONS,ids).discovered.size,0);
});
test('interacciones respetan altura y oclusión',()=>{
 const world={lineOfSight:()=>true}; const system=new InteractionSystem({},world);
 system.setItems([{id:'alto',x:0,z:0,y:3,eyeY:1.6,radius:2}]);
 assert.equal(system.update(0,0,1.65),null);
 assert.equal(system.update(0,0,4.65).id,'alto');
 world.lineOfSight=()=>false;assert.equal(system.update(0,0,4.65),null);
});
// El pueblo se construye sin navegador (createVillage no toca el DOM) y se revisa a sí
// mismo: los invariantes viven en src/world/invariantes.js y aquí sólo se cruza su
// interfaz. Estas pruebas son la red que hace seguro añadir piezas nuevas.
const pueblo = createVillage({ scene:new THREE.Scene(), camera:new THREE.PerspectiveCamera() });
const problemasDe = check => pueblo.invariantes.problemas.filter(p => p.check === check).map(p => p.detalle);

test('el pueblo se construye y se revisa a sí mismo',()=>{
 assert.ok(pueblo.invariantes.revisados.aristas >= 18, 'no recorrió el grafo');
 assert.equal(pueblo.invariantes.revisados.encuentros, ENCOUNTERS.length);
 assert.deepEqual(problemasDe('ruta'), [], 'el recorrido dejó de ser transitable');
});
test('el suelo del recorrido no da saltos',()=>{
 assert.deepEqual(problemasDe('suelo'), [], 'hay un escalón de suelo en el camino');
});
test('las alturas del recorrido son las prometidas',()=>{
 assert.deepEqual(problemasDe('alturas'), [], 'alguna altura pactada cambió');
});
test('el agua no se cruza y el muelle sí',()=>{
 assert.deepEqual(problemasDe('agua'), [], 'las barreras del río cambiaron');
});
test('cada encuentro conserva un punto de aproximación libre',()=>{
 assert.deepEqual(problemasDe('encuentros'), [], 'un encuentro quedó cercado');
});
test('ningún lugar queda cercado para el vuelo',()=>{
 // La meseta del mirador estuvo cercada por dos anillos de colisión que bloqueaban a
 // cualquier altura: el vuelo se detenía a nueve metros del destino y el único camino era la
 // rampa. Esta prueba vuela —sobre el papel— desde el arranque y exige llegar a los seis.
 assert.deepEqual(problemasDe('vuelo'), [], 'algún lugar dejó de alcanzarse volando');
 assert.equal(pueblo.invariantes.revisados.lugaresVolables, Object.keys(LOCATIONS).length);
});
test('los muros tapan la vista y la puerta no',()=>{
 // Antes esto se probaba con un doble del registry (nunca se ejercía `lineOfSight` de
 // verdad) y `sightBlocks` estaba siempre vacío: la oclusión no existía. Ahora se cruza
 // el seam real, sobre el pueblo construido.
 assert.deepEqual(problemasDe('vista'), [], 'la oclusión cambió de criterio');
 assert.ok(pueblo.world.sightBlocks.length >= 10, 'ningún muro se registró como tapavistas');
 assert.equal(pueblo.world.lineOfSight(2, -8, 1.8, -16.2), false, 'el muro dejó pasar la vista');
 assert.equal(pueblo.world.lineOfSight(0, -10.5, 1.8, -16.2), true, 'el hueco de la puerta quedó ciego');
});
test('las anclas mandan: el prop y el efecto leen la misma coordenada',()=>{
 // Antes esto era tres literales en tres archivos y la deriva ya se notaba: la taza del
 // efecto quedaba 4 cm hundida en la mesa y la carta flotaba 8,8 cm sobre la banca.
 const escena=new THREE.Scene();
 const efectos=createStoryEffects(escena);
 efectos.set('silla-quien-falta','silla.taza-extra');
 efectos.set('correo-pendiente','correo.carta-plegada');
 const taza=escena.children.find(o=>o.geometry?.type==='CylinderGeometry');
 const carta=escena.children.find(o=>o.geometry?.type==='BoxGeometry');
 assert.ok(taza&&carta,'los dos efectos construyeron su objeto');
 const mesa=ancla('objeto-mesa');
 assert.ok(Math.hypot(taza.position.x-mesa.x,taza.position.z-mesa.z)<1.05,'la taza cayó fuera del tablero');
 assert.equal(taza.position.y,+(superficieDe('objeto-mesa',0)+.07).toFixed(4),'la taza no se posa en el tablero');
 const banca=BANCA_DEL_CORREO;
 assert.equal(carta.position.x,banca.x,'la carta no está sobre la banca del correo');
 assert.equal(carta.position.z,banca.z);
 assert.ok(Math.abs(carta.position.y-banca.superficie)<.02,'la carta flota sobre la banca');
 efectos.dispose(); assert.equal(escena.children.length,0,'los efectos no se retiraron');
});
test('toda ancla declarada tiene pieza o se puede construir sin ella',()=>{
 for(const id of idsDeAnclas()) assert.ok(ancla(id).x!==undefined&&ancla(id).z!==undefined);
 assert.throws(()=>ancla('no-existe'),/No existe el ancla/);
});
test('la locomoción sólo obedece en el paseo, y nunca con el recorrido guiando',()=>{
 const l=new Locomocion();
 assert.equal(l.estado.modo,'portada');
 assert.equal(l.estado.puedeVolar,false,'en la portada no se vuela');
 l.ir('transicion'); assert.equal(l.estado.puedeVolar,false,'en la transición no se vuela');
 l.ir('paseo'); assert.equal(l.estado.puedeVolar,true,'en el paseo sí');
 l.recorrido('iniciar'); assert.equal(l.estado.puedeVolar,false,'con el recorrido activo no');
 l.recorrido('pausar'); assert.equal(l.estado.puedeVolar,true,'en pausa la mariposa vuelve a responder');
 l.bloquear(); assert.equal(l.estado.modo,'lectura'); assert.equal(l.estado.puedeVolar,false);
 l.ir('paseo'); assert.equal(l.estado.puedeVolar,true);
 assert.throws(()=>l.ir('volar'),/Modo desconocido/);
});
test('abrir un panel detiene recorrido, voz y vuelo, y es idempotente',()=>{
 const voz=[]; const narrador={paused:false,enabled:true,has:()=>true,pause(){voz.push('pausar');this.paused=true},interrupt(){voz.push('cortar');this.paused=false}};
 const l=new Locomocion({narrador});
 l.ir('paseo'); l.recorrido('iniciar');
 const primero=l.bloquear();
 assert.equal(primero.recorrido,'pausar'); assert.equal(primero.vuelo,'soltar'); assert.equal(primero.voz,'pausar'); assert.equal(primero.teclas,true);
 const segundo=l.bloquear();          // ya estaba en pausa: no se vuelve a pausar
 assert.equal(segundo.recorrido,undefined);
});
test('cerrar un panel con otro panel abierto no libera la locomoción',()=>{
 const l=new Locomocion(); l.ir('paseo'); l.bloquear();
 assert.deepEqual(l.liberar({otroPanelAbierto:true}),{});
 assert.equal(l.estado.modo,'lectura','el modo no debe cambiar con otro panel arriba');
 const libre=l.liberar();
 assert.equal(libre.modo,'paseo'); assert.equal(l.estado.modo,'paseo');
});
test('el relato de la llegada retiene «Continuar» y un panel lo cancela',()=>{
 const narrador={paused:false,enabled:true,has:id=>id.startsWith('llegada-'),pause(){},interrupt(){this.interrupted=true}};
 const l=new Locomocion({narrador}); l.ir('paseo');
 const llego=l.recorrido('llegar',{destino:'casa',esUltimo:false});
 assert.equal(llego.voz,'tocar'); assert.equal(llego.clip,'llegada-casa');
 assert.equal(llego.continuar,false,'Continuar espera al relato');
 assert.equal(l.estado.relato,true);
 const cerro=l.relato('termino',{esUltimo:false});
 assert.equal(cerro.continuar,true); assert.equal(l.estado.relato,false);
 // Ahora el caso del panel que interrumpe el relato
 l.recorrido('llegar',{destino:'jardin',esUltimo:false});
 l.bloquear();
 const liberado=l.liberar();
 assert.equal(liberado.voz,'cortar','el panel corta el relato interrumpido');
 assert.equal(liberado.continuar,true);
});
test('el mirador no ofrece «Continuar» y sin voz la llegada no retiene nada',()=>{
 const conVoz={paused:false,enabled:true,has:()=>true,pause(){},interrupt(){}};
 const a=new Locomocion({narrador:conVoz}); a.ir('paseo');
 assert.equal(a.recorrido('llegar',{destino:'mirador',esUltimo:true}).continuar,false);
 assert.equal(a.relato('termino',{esUltimo:true}).continuar,false,'el mirador cierra el recorrido');
 const sinVoz={paused:false,enabled:false,has:()=>true,pause(){},interrupt(){}};
 const b=new Locomocion({narrador:sinVoz}); b.ir('paseo');
 const llego=b.recorrido('llegar',{destino:'casa',esUltimo:false});
 assert.equal(llego.voz,undefined,'sin voz no se reproduce nada');
 assert.equal(llego.continuar,true,'sin relato, Continuar aparece de una vez');
});
test('salir del paseo cancela el recorrido y suelta el vuelo',()=>{
 const l=new Locomocion(); l.ir('paseo'); l.recorrido('iniciar');
 const aPortada=l.ir('portada');
 assert.equal(aPortada.modo,'portada'); assert.equal(aPortada.recorrido,'detener');
 assert.equal(aPortada.vuelo,'soltar'); assert.equal(aPortada.banner,false);
 assert.equal(l.estado.recorrido,false);
 const fallback=l.ir('portada');       // el fallback sin 3D también fija su modo
 assert.equal(fallback.modo,'portada'); assert.equal(fallback.recorrido,undefined);
});
test('recorrido y relato rechazan acciones inventadas',()=>{
 const l=new Locomocion();
 assert.throws(()=>l.recorrido('saltar'),/Acción de recorrido desconocida/);
 assert.throws(()=>l.relato('quizá'),/Estado de relato desconocido/);
});
test('historias referencian encuentros y lugares, con efectos cerrados',()=>{
 assert.equal(HISTORIAS_KEY,'macondo.historias.v1');
 assert.equal(new Set(STORIES.map(s=>s.id)).size,STORIES.length);
 for(const s of STORIES){
  const e=ENCOUNTERS.find(x=>x.id===s.encounterId);
  assert.ok(e); assert.equal(e.locationId,s.locationId); assert.ok(LOCATIONS[s.locationId]);
  assert.ok(['choice','writing','observation','labels','versions'].includes(s.kind));
  for(const a of s.actions) assert.ok(s.outcomes.some(o=>o.id===a.outcomeId));
 }
});
test('director invita sin abrir, resuelve idempotente y reemplaza elección',()=>{
 const events=[]; const d=new NarrativeDirector(STORIES,{onOpen:s=>events.push(`open:${s.id}`),onResolve:(s,r)=>events.push(`resolve:${r.outcomeId}`)});
 assert.equal(d.invite('silla-quien-falta'),true); assert.equal(d.state,'invited'); assert.equal(events.length,0);
 d.open('silla-quien-falta'); assert.equal(d.state,'active');
 const first=d.choose('servir-taza'); assert.equal(first.outcomeId,'taza-servida');
 assert.equal(d.choose('servir-taza').outcomeId,'taza-servida'); assert.equal(events.filter(x=>x.startsWith('resolve')).length,1);
 d.open('silla-quien-falta'); const second=d.choose('dejar-sitio'); assert.equal(second.outcomeId,'sitio-intacto');
 assert.equal(d.resultOf('silla-quien-falta').outcomeId,'sitio-intacto'); d.close(); assert.equal(d.state,'idle');
});
test('historias restaura y limita escritura, y compone huellas',()=>{
 const long='x'.repeat(MAX_WRITING+30);
 const raw={results:{'correo-pendiente':{outcomeId:'escrita',text:long},bad:{outcomeId:'no'}}};
 const restored=restoreHistorias(raw,STORIES);
 assert.equal(restored.results['correo-pendiente'].text.length,MAX_WRITING);
 assert.equal(restored.results.bad,undefined);
 assert.equal(serializeHistorias(restored).version,1);
 assert.equal(tracesFrom(restored.results).length,1);
});
test('narración cubre los clips de guía y todas las lecturas, con textos ≤1200',()=>{
 const base=['bienvenida','guia-inicio','fin-recorrido','camino-casa','camino-jardin','camino-puerto','camino-mirador','llegada-casa','llegada-jardin','llegada-puerto','llegada-mirador'];
 const ids=Object.keys(NARRACION);
 assert.equal(ids.length,base.length+stations.length); // 11 de guía + lectura-<cada estación>
 for(const id of base) assert.ok(ids.includes(id),'falta '+id);
 assert.equal(new Set(ids).size,ids.length);
 for(const s of stations){
  assert.ok(ids.includes('lectura-'+s.id),'falta lectura-'+s.id);
  assert.ok(NARRACION['lectura-'+s.id].startsWith(s.title));
  if(!s.question) assert.ok(s.conversa&&s.conversa.length>0,'pasaje sin quiz necesita línea para conversar');
 }
 for(const texto of Object.values(NARRACION)) assert.ok(texto.length<=1200,'texto muy largo');
});
test('narrador: reemplazo sin aviso, interrupt silencioso, skip con aviso y apagado',()=>{
 const captions=[],ended=[];
 const mk=()=>({played:0,play(){this.played++;return Promise.resolve()},pause(){}});
 const audios=[]; const factory=()=>{const a=mk();audios.push(a);return a};
 const n=new TourNarrator({onCaption:t=>captions.push(t),onEnded:id=>ended.push(id),audioFactory:factory});
 assert.equal(n.enabled,true);
 const clip=n.play('camino-casa');
 assert.equal(clip.id,'camino-casa');
 assert.equal(captions.at(-1),NARRACION['camino-casa']);
 n.play('camino-jardin'); // reemplaza al actual: sin onEnded
 assert.deepEqual(ended,[]);
 n.skip(); assert.deepEqual(ended,['camino-jardin']); // el salto avisa
 n.play('bienvenida'); n.interrupt(); // la cancelación no avisa
 assert.deepEqual(ended,['camino-jardin']);
 assert.equal(n.current,null); assert.equal(captions.at(-1),null);
 assert.equal(n.play('no-existe'),null); // clip desconocido
 n.setEnabled(false);
 assert.equal(n.play('bienvenida'),null); // apagada: sin audio
 assert.ok(n.play('bienvenida',{force:true})); // fuerza (gesto «Escuchar»)
 assert.equal(n.has('lectura-memoria'),true); assert.equal(n.has('otro'),false);
});
test('narrador: MP3 ausente libera el flujo y pausa/reanuda el clip',()=>{
 const ended=[];
 const factory=()=>({play(){if(this.onerror)this.onerror();return Promise.resolve()},pause(){}});
 const n=new TourNarrator({onEnded:id=>ended.push(id),audioFactory:factory});
 n.play('llegada-casa'); // el factory simula onerror inmediato
 assert.deepEqual(ended,['llegada-casa']); assert.equal(n.current,null);
 const pausable=[]; const factory2=()=>{const a={play(){return Promise.resolve()},pause(){pausable.push(1)}};return a};
 const n2=new TourNarrator({onEnded:()=>{},audioFactory:factory2});
 n2.play('bienvenida'); n2.pause(); n2.pause(); // pausa doble consecutiva: sin efecto
 assert.equal(pausable.length,1);
 n2.resume(); n2.pause(); // tras reanudar, pausar de nuevo sí actúa
 assert.equal(pausable.length,2);
});
test('el lecho ambiente calla hasta el gesto, sigue al río y cede ante la voz',()=>{
 const hechos=[]; const factory=id=>{const a={id,volume:0,loop:false,played:0,parado:0,readyState:4,paused:true,play(){this.played++;this.paused=false;return Promise.resolve()},pause(){this.parado++;this.paused=true}};hechos.push(a);return a};
 const cama=new AmbientBed({audioFactory:factory,enabled:false});
 assert.equal(cama.enabled,false); assert.deepEqual(hechos,[]);
 cama.setEnabled(true);
 assert.equal(hechos.length,3); assert.ok(hechos.every(a=>a.loop&&a.played===1));
 const rio=()=>cama.volumenDe('rio'), viento=()=>cama.volumenDe('viento');
 assert.equal(cama.estado.viento.listo,true);
 cama.update(-29); assert.ok(rio()>.5,'a la orilla el río se oye');
 cama.update(0); assert.ok(rio()<.02,'tierra adentro no');
 cama.update(-29); cama.setNarrando(true);
 assert.ok(rio()<.25&&viento()<.2,'la voz manda sobre el ambiente');
 cama.setNarrando(false); cama.setEnabled(false);
 assert.ok(hechos.every(a=>a.parado>=1));
 assert.equal(AMBIENTE_KEY,'macondo.ambiente.v1');
 cama.dispose(); assert.deepEqual(cama.estado,{});
});
test('los lechos de ambiente están medidos y cierran en bucle',()=>{
 const ruta=new URL('../internal/audio/manifest-ambiente.json',import.meta.url);
 if(!existsSync(ruta)) return;                      // sin generar: la prueba no aplica
 const m=JSON.parse(readFileSync(ruta,'utf8'));
 for(const id of ['rio','viento','aves']){
  assert.ok(m[id],'falta el lecho '+id);
  assert.ok(m[id].duracion>=20,id+' debe durar al menos 20 s');
  assert.ok(m[id].rms_dBFS<-18&&m[id].rms_dBFS>-30,id+' fuera de rango de RMS');
  assert.ok(m[id].pico_dBFS<-2,id+' sin margen de pico');
  assert.ok(m[id].salto_de_bucle<.2,id+' cierra mal el bucle');
 }
});
test('la mariposa conserva su envergadura y sus alas apuntan a lados distintos',()=>{
 const anterior=geometriaAla('anterior'); anterior.computeBoundingBox();
 const posterior=geometriaAla('posterior'); posterior.computeBoundingBox();
 const a=anterior.boundingBox, p=posterior.boundingBox;
 assert.ok(a.max.x>.40&&a.max.x<.45,'media envergadura del ala anterior');
 assert.ok(a.min.z<-.09&&a.max.z<.08,'el ala anterior va hacia adelante');
 assert.ok(p.max.z>.35,'el ala posterior llega más atrás que el abdomen');
 assert.ok(p.min.z>0,'el ala posterior no invade el frente');
 assert.equal(geometriaAla('anterior'),anterior,'geometría compartida, no por instancia');
});
test('el cuerpo es un perfil cerrado y los contornos son finitos',()=>{
 assert.equal(PERFIL_CUERPO[0][1],0);
 assert.equal(PERFIL_CUERPO.at(-1)[1],0);
 assert.equal(PERFIL_CUERPO.at(-1)[0],.300);
 for(let i=1;i<PERFIL_CUERPO.length;i++) assert.ok(PERFIL_CUERPO[i][0]>PERFIL_CUERPO[i-1][0],'el perfil avanza sin retroceder');
 for(const [clave,cmds] of Object.entries(CONTORNOS)){
  assert.ok(cmds.length>=6,clave);
  assert.ok(cmds.every(c=>c.slice(1).every(Number.isFinite)),clave);
  assert.ok(cmds[0][0]==='M'&&cmds.at(-1).length===5,'el contorno se cierra con una curva: '+clave);
 }
});
