// Escenas originales de esta instalación; no son episodios de una novela.
export const SECOND_STORIES = [
 {
  id:'dos-tardes', encounterId:'arbol-tiempo', locationId:'jardin', kind:'observation',
  title:'Dos tardes bajo el árbol', invite:'El mismo banco espera en dos tardes distintas.',
  intro:'En el jardín hay un banco con una muesca en el respaldo. Mira las dos tardes: cambia la luz, caen flores, vuelve a crecer la hierba. Luego conserva algo que siga allí.',
  views:[
   {id:'clara', label:'Primera tarde', text:'La luz es dorada. El árbol tiene flores claras y la hierba es corta. En el respaldo del banco queda una muesca en forma de media luna.', effectId:'jardin.clara'},
   {id:'lluvia', label:'Segunda tarde', text:'La luz es azul después de la lluvia. Hay pétalos en el suelo y la hierba ha crecido. La misma muesca de media luna sigue en el respaldo del banco.', effectId:'jardin.lluvia'},
  ],
  actions:[{id:'muesca',label:'Conservar la muesca del banco',outcomeId:'muesca'}, {id:'camino',label:'Conservar el camino de regreso',outcomeId:'camino'}],
  outcomes:[
   {id:'muesca',text:'Entre las dos tardes conservas la media luna del respaldo.',trace:'Cambió la tarde; la muesca del banco permaneció.',effectId:'jardin.lluvia'},
   {id:'camino',text:'Entre las dos tardes conservas el camino que permite volver al banco.',trace:'El jardín cambió de luz, pero dejó abierto el regreso.',effectId:'jardin.clara'},
  ],
  reflection:'Una marca pequeña permite reconocer un lugar cuando todo alrededor cambia. También podemos recordar el camino que nos lleva de vuelta.'
 },
 {
  id:'nombres-cosas', encounterId:'etiquetas', locationId:'plaza', kind:'labels',
  title:'Los nombres de las cosas', invite:'Tres etiquetas esperan junto a una repisa.',
  intro:'Después de pintar la repisa de la calle, quedaron tres etiquetas sueltas. Una vecina pide ayuda para ponerlas otra vez. Observa la forma y el uso de cada objeto; elige su nombre sin arrastrar nada.',
  objects:[{id:'llave',description:'Pieza de metal con dientes que abre la puerta.'},{id:'jarra',description:'Recipiente con asa y pico para servir agua.'},{id:'carrete',description:'Cilindro pequeño alrededor del cual se enrolla hilo.'}],
  actions:[{id:'colocar',label:'Colocar las etiquetas',outcomeId:'nombradas'}],
  outcomes:[{id:'nombradas',text:'La repisa vuelve a decir: llave, jarra, carrete. La vecina deja secar la pintura con la puerta abierta.',trace:'Devolví tres nombres a la repisa recién pintada.',effectId:'etiquetas.nombradas'}],
  reflection:'Los nombres ayudan a compartir los usos de las cosas. La marca de los dedos y el desgaste también cuentan quién las ha cuidado.'
 },
 {
  id:'voz-vecina', encounterId:'vecina', locationId:'plaza', kind:'versions',
  title:'La voz de la vecina', invite:'La vecina recuerda una cometa de dos maneras.',
  intro:'Desde su umbral, una vecina cuenta cómo apareció una cometa en la plaza. A veces recuerda una cuerda; otras, una sombra. Lee las dos versiones o escúchalas y decide qué detalle llevarte.',
  views:[
   {id:'cuerda',label:'La versión de la cuerda',text:'Aquella tarde encontré una cuerda atada al picaporte. La seguí hasta la plaza: al otro extremo, una cometa descansaba en una silla. La llevé a mi puerta para que su dueño pudiera verla.'},
   {id:'sombra',label:'La versión de la sombra',text:'Aquella tarde una sombra de papel cruzó mi ventana. Salí a buscarla y encontré una cometa en la plaza, apoyada en una silla. Puse la silla junto a mi puerta y esperé a que alguien preguntara por ella.'},
  ],
  actions:[{id:'cuerda',label:'Conservar la cuerda',outcomeId:'cuerda'},{id:'sombra',label:'Conservar la sombra',outcomeId:'sombra'}],
  outcomes:[{id:'cuerda',text:'La vecina vuelve a señalar el picaporte: conservas la cuerda que unía la puerta y la plaza.',trace:'Una cuerda llevó a la vecina hasta una cometa.',effectId:null},{id:'sombra',text:'La vecina mira la ventana: conservas la sombra que la hizo salir.',trace:'Una sombra de papel hizo salir a la vecina.',effectId:null}],
  reflection:'Las dos versiones son recuerdos de una escena imaginada. Elegir un detalle no decide cuál es verdadera: muestra qué llamó tu atención.'
 },
].map(story=>({...story, sources:['https://www.nobelprize.org/prizes/literature/1982/marquez/lecture/'], editorial:'original'}));
