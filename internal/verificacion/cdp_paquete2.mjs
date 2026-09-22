import { abrir } from './arnes.mjs';
const s=await abrir({url:'http://127.0.0.1:5176/',out:'/tmp/macondo-paquete2'});
await s.entrar();
const js=s.js;
const click = async selector => {
 await js(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center'})`);
 return s.clic(selector);
};
async function close() {
 await click('#story .close');
 await s.esperar(`!document.querySelector('#story').open`);
 s.afirmar(await js(`!['active','resolved'].includes(window.__macondo.director.state)`),'closing releases director');
}
async function open(id) { await js(`window.__macondo.director.open('${id}')`); }
console.log('garden'); await open('dos-tardes');
await click('#story-actions button');
s.afirmar(await js(`!window.__macondo.historias.results['dos-tardes']`),'garden must be observed first');
await click('#story-interaction button:nth-of-type(1)');
await s.captura('jardin-primera');
await click('#story-interaction button:nth-of-type(2)');
await s.captura('jardin-segunda');
await close();
s.afirmar(await js(`!window.__macondo.effects.has('dos-tardes')`),'cancelled preview is removed');
console.log('garden'); await open('dos-tardes');
await click('#story-interaction button:nth-of-type(1)'); await click('#story-interaction button:nth-of-type(2)');
await click('#story-actions button'); await close();
// New props can be reached through ordinary E interaction.
await js(`window.__macondo.player.place(6,1,0)`);
await s.esperar(`window.__macondo.interactions.current?.id==='etiquetas'`);
await s.tecla('KeyE');
s.afirmar(await js(`document.querySelector('#story-title').textContent==='Los nombres de las cosas'`),'labels reachable with E');
await click('#story-actions button');
s.afirmar(await js(`!window.__macondo.historias.results['nombres-cosas']`),'empty labels do not resolve');
await js(`document.querySelectorAll('#story-interaction select').forEach((el,i)=>{el.value=['llave','jarra','carrete'][i];el.dispatchEvent(new Event('change'))})`);
await click('#story-actions button'); await close();
console.log('neighbor'); await open('voz-vecina');
await click('#story-interaction button:nth-of-type(1)');
await click('#story-interaction button:nth-of-type(3)');
s.afirmar(await js(`document.querySelector('#story-interaction [role=status]').textContent.includes('picaporte')`),'full captions remain with optional voice');
await click('#story-interaction button:nth-of-type(2)');
await click('#story-actions button:nth-of-type(2)');
await close();
s.afirmar(await js(`!speechSynthesis.speaking && !speechSynthesis.pending`),'voice stopped on close');
console.log('reload'); await js(`window.__paqueteReload=true`); await s.recargar();
await s.esperar(`!window.__paqueteReload && document.readyState==='complete'`);
await click('#enter');
if(await s.puedeClic('#skip-flight')) await click('#skip-flight');
await s.esperar(`!!window.__macondo`);
s.afirmar(await js(`Object.keys(window.__macondo.historias.results).length===3`),'three results reload');
s.afirmar(await js(`window.__macondo.effects.has('dos-tardes') && window.__macondo.effects.has('nombres-cosas')`),'world effects reload');
await open('cuaderno-mirador');
s.afirmar(await js(`document.querySelectorAll('#writing-trace-list li').length===3`),'notebook has three traces');
await click('#writing .close');
// Exercise the real guided controller at small timesteps, without waiting for GPU frames.
// Opening an encounter pauses the route; closing exposes an explicit continuation.
await click('#toggle-tour');
await open('voz-vecina');
s.afirmar(await js(`window.__macondo.tour.paused`),'story pauses guided route');
await close();
s.afirmar(await js(`!document.querySelector('#tour-continue').hidden`),'closing offers guided continuation');
await click('#tour-continue');
s.afirmar(await js(`window.__macondo.tour.active && !window.__macondo.tour.paused`),'guided route continues after scene');
await js(`document.querySelector('#tour-stop').click()`);
// Device voice adapter: deterministic cancellation including late callbacks.
s.afirmar(await js(`(async()=>{
 const {StoryInteraction}=await import('/src/ui/StoryInteraction.js');
 const {SECOND_STORIES}=await import('/src/data/secondStories.js');
 let stopped=0;const clips=[];const root=document.createElement('div');
 const panel=new StoryInteraction(root,{speech:{speak:c=>clips.push(c),cancel:()=>stopped++},utterance:text=>({text})});
 panel.render(SECOND_STORIES.find(s=>s.kind==='versions'));
 const buttons=root.querySelectorAll('button');buttons[0].click();buttons[2].click();
 const first=clips[0];buttons[1].click();buttons[2].click();first.onend();panel.clear();
 return clips.length===2 && stopped===2 && root.children.length===0 && !panel.speaking;
})()`),'voice replacement and close cancel clips, ignoring stale endings');
console.log('route'); for(const name of ['Casa','Jard','Puer','Mira']) {
 await click('#open-map');
 await js(`[...document.querySelectorAll('#map-destinations button')].find(b=>b.textContent.includes('${name}')).click()`);
 await s.esperar(`!document.querySelector('#map').open`);
 const result=await js(`(()=>{const m=window.__macondo;for(let i=0;i<20000&&m.tour.active;i++)m.tour.update(.016);return !m.tour.active})()`);
 s.afirmar(result,`guided route reaches ${name}`);
 await js(`document.querySelector('#tour-stop').click()`);
}
s.afirmar(await js(`window.__macondo.village.invariantes.problemas.length===0`),'world invariants');
// Force only WebGL creation to fail; keep 2D canvas for labels.
console.log('fallback'); await js(`window.__paqueteReload=true`); await s.navegar();
await s.esperar(`!window.__paqueteReload && document.readyState==='complete'`);
await js(`{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:original.call(this,type,...args)}}`);
s.permitir(/WebGL|Error creating|Error al crear/);
await click('#enter');
await s.esperar(`!document.querySelector('#fallback').hidden`);
s.afirmar(await js(`document.querySelectorAll('#fallback-historias button').length===6`),'all six scenes without WebGL');
await s.movil();
await js(`[...document.querySelectorAll('#fallback-historias button')].find(b=>b.textContent.includes('vecina')).click()`);
s.afirmar(await js(`document.querySelector('#story-outcome').textContent.includes('sombra')`),'fallback restores choice');
await s.captura('vecina-movil-sin-webgl');
await click('#story-actions button');
await click('#story-interaction button:nth-of-type(1)');
await click('#story-interaction button:nth-of-type(2)');
await click('#story-actions button:nth-of-type(1)');
s.afirmar(await js(`document.querySelector('#story-outcome').textContent.includes('cuerda')`),'fallback changes neighbor choice');
await click('#story .close');
s.afirmar(await js(`!document.querySelector('dialog[open]')`),'fallback closes');
for (const title of ['Dos tardes','Los nombres']) {
 await js(`[...document.querySelectorAll('#fallback-historias button')].find(b=>b.textContent.includes('${title}')).click()`);
 await click('#story-actions button');
 if (title==='Dos tardes') {
   await click('#story-interaction button:nth-of-type(1)'); await click('#story-interaction button:nth-of-type(2)');
 } else {
   await js(`document.querySelectorAll('#story-interaction select').forEach((el,i)=>{el.value=['llave','jarra','carrete'][i];el.dispatchEvent(new Event('change'))})`);
 }
 await click('#story-actions button');
 s.afirmar(await js(`!document.querySelector('#story-outcome').hidden`), 'fallback completes '+title);
 s.afirmar(await js(`document.querySelector('#story').scrollWidth<=document.querySelector('#story').clientWidth+1`),'mobile has no horizontal overflow');
 await click('#story .close');
}
await s.cerrar();
