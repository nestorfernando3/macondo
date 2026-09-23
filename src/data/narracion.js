// Narración del recorrido guiado en español colombiano (voz de Deepgram Aura 2).
// Todo el texto de aquí es original; no se reproducen fragmentos de las obras.
// Los clips «lectura-<id>» se derivan de las estaciones de content.js:
// el guion de generación los sintetiza con el mismo texto que se ve en pantalla.
// Por eso la ascensión de Remedios, la bella —la única cita literal de la novela, en el campo
// `cita` de esa estación— se queda fuera de la narración a propósito: el clip se graba y se
// distribuye como MP3, y una grabación del fragmento sería una reproducción mucho más pesada
// que la cita impresa que el panel muestra. Lo que se escucha es la glosa, que es nuestra.
import { stations } from './content.js';

const textos = {
 'bienvenida':
  'Bienvenido a Macondo. Aquí los domingos duraban más, y el asombro llegaba sin avisar. ' +
  'Usted acaba de aterrizar en un pueblo inventado para explorar el realismo mágico de Gabriel García Márquez. ' +
  'Camine con calma, y acérquese a los objetos hasta que el pueblo le hable. Si quiere, yo lo guío: solo diga «guiarme». ' +
  'Y si prefiere el silencio, apague mi voz cuando quiera.',

 'guia-inicio':
  'Vamos, sin prisa. Caminaremos despacio, como se camina en los pueblos donde el calor manda: ' +
  'usted pone el paso, yo pongo la palabra. En cada llegada le cuento lo esencial del lugar; ' +
  'usted decide si se queda a leer o seguimos de largo.',

 'camino-casa':
  'Vamos hacia la casa de la memoria. Fíjese en las sábanas tendidas: en Macondo hasta la ropa participa en los milagros. ' +
  'Cuando García Márquez era niño, en Aracataca, su abuela le contaba los milagros como si fueran recados del mercado. ' +
  'Esa voz es la semilla del realismo mágico: lo extraordinario contado con naturalidad.',

 'camino-jardin':
  'Ahora, al jardín del tiempo. Mire las mariposas amarillas: no son decoración, son un sistema de señales. ' +
  'En el realismo mágico el tiempo no camina en línea recta; da vueltas, como los pétalos que usted va a ver subir y caer. Allá vamos.',

 'camino-puerto':
  'Bajamos al puerto de la espera. El río suena a lo lejos, igual que suena la espera de un coronel que nunca recibe carta. ' +
  'En la obra de García Márquez también hay silencio y dignidad, sin una sola brujería. Camine despacio: el muelle cruje a propósito.',

 'camino-mirador':
  'Última subida: el mirador de las historias. La rampa sube tres metros, y el pueblo queda a sus pies como un cuento abierto. ' +
  'Arriba hay páginas suspendidas y un cuaderno esperando tres frases suyas. Respire: desde arriba, Macondo se entiende mejor.',

 'llegada-casa':
  'Hemos llegado a la casa de la memoria. En el patio hay una mesa puesta y una silla vacía: si se acerca, el pueblo le cuenta por qué. ' +
  'Este es el corazón del realismo mágico: lo imposible convive con la ropa tendida y las tazas de café. ' +
  'Piense en eso mientras lee: aquí el fantasma que desayuna no asusta a nadie; asombra. ' +
  'Cuando quiera seguir, tóqueme «continuar», o quédese un rato con la mesa.',

 'llegada-jardin':
  'Bienvenido al jardín del tiempo. Vea los pétalos: suben, se detienen en el aire y caen, y luego vuelven a subir. ' +
  'Así funciona el tiempo en Cien años de soledad: nombres que se repiten, amores que se repiten, errores que se repiten. ' +
  'La pregunta del jardín no es cuándo, sino para qué vuelve lo mismo. ' +
  'Acérquese al banco, mire la espiral de mariposas y hágase la pregunta antes de seguir.',

 'llegada-puerto':
  'Este es el puerto de la espera. La carta del atril lleva años esperando respuesta, como la del coronel. ' +
  'García Márquez no solo escribió de milagros: escribió de dignidad, de colas, de pensiones que no llegan. ' +
  'El realismo mágico también sabe estar callado. Mire el agua: parece quieta y no lo es. ' +
  'Déle un rato a la carta, y luego le cuento por qué la espera también es una forma de cariño.',

 'llegada-mirador':
  'Llegamos al mirador de las historias, la última parada. Desde aquí Macondo se ve entero: la plaza, el tendal, el jardín, el río. ' +
  'En 1982, al recibir el Nobel, García Márquez habló de la soledad de América Latina y de quién tiene derecho a contar nuestra realidad. ' +
  'Estas páginas suspendidas recogen esa conversación. Cuando termine, el cuaderno queda listo para tres frases suyas. ' +
  'No hay prisa: el pueblo no cierra nunca.',

 'fin-recorrido':
  'Aquí termina el paseo guiado, pero Macondo no se acaba: siga caminando, vuelva a la plaza, ' +
  'y si quiere llevarse el pueblo en el bolsillo, descargue un recuerdo con el botón «recuerdo». ' +
  'Y recuerde la regla del realismo mágico: cuente lo increíble con voz natural, y lo natural con asombro. ' +
  'Hasta siempre, y gracias por caminar conmigo.',
};

// Lecturas narradas: mismo texto del panel (título + cuerpo), para «Escuchar».
export const NARRACION = {
  ...textos,
  ...Object.fromEntries(stations.map(s => ['lectura-' + s.id, s.title + '. ' + s.body])),
};

// URL pública de un clip (public/audio se copia tal cual a dist/).
export const audioUrl = id => `./audio/${id}.mp3`;

export const VOZ_ESCO = 'gloria'; // alternativa: 'celeste' (también es-CO)
