// Capa literaria: lo que Cien años de soledad (Gabriel García Márquez) cuenta de verdad en
// torno al tema de cada estación. Son glosas propias, sin citas literales del libro; la única
// transcripción de la novela en este proyecto sigue siendo el campo `cita` de `content.js`.

export const FICHAS_NOVELA = {
  // Estación de la casa: la novela ha vuelto la memoria un lugar físico.
  memoria: {
    capitulo: '3, 4 y 7',
    titulo: 'La casa que recuerda por todos',
    texto:
      'Macondo no guarda sus recuerdos en libros, sino en la casa. Cuando la familia crece, ' +
      'Úrsula manda ampliarla: una sala, un comedor de doce puestos, nueve dormitorios y un ' +
      'corredor de rosas y begonias (cap. 3). En uno de esos cuartos nuevos aloja a Melquíades ' +
      'cuando envejece, lejos del trajín (cap. 4). El patio guarda su propia memoria: allí, bajo ' +
      'el castaño, termina atado José Arcadio Buendía cuando deja de entender el tiempo (cap. 4). ' +
      'La novela imagina una peste que borra los nombres de las cosas; para defenderse, los ' +
      'habitantes pegan carteles con el nombre de cada objeto —la mesa, la silla, el reloj— y ' +
      'cuelgan en el cuello de la vaca un letrero que explica para qué sirve (cap. 3). Donde ya ' +
      'no alcanzan las etiquetas, construyen la máquina de la memoria. Años después, cuando muere ' +
      'el fundador, cae sobre el pueblo una lluvia de flores amarillas que hay que apartar a ' +
      'paladas para que pase el entierro (cap. 7). Usted entra aquí a una casa que recuerda por todos.',
    datos: [
      'La casa se amplió con una sala, un comedor de doce puestos y nueve dormitorios (cap. 3).',
      'El insomnio hacía olvidar los nombres; los vecinos marcaron las cosas con carteles y colgaron en la vaca un letrero (cap. 3).',
      'Cuando murió José Arcadio Buendía cayó una lluvia de flores amarillas que hubo que apartar a paladas (cap. 7)',
    ],
    fuente: 'Gabriel García Márquez, Cien años de soledad, capítulos 3, 4 y 7',
  },

  // Estación del jardín: el tiempo circular de Macondo.
  tiempo: {
    capitulo: '4 y 17',
    titulo: 'El tiempo que da vueltas en redondo',
    texto:
      'Desde la primera página, la novela juega con un tiempo que no avanza en línea recta. La ' +
      'historia empieza anunciando un fusilamiento futuro y luego retrocede a contar los orígenes, ' +
      'como si quien narra ya conociera el final. El episodio más claro es el de José Arcadio ' +
      'Buendía: una mañana cree que sigue siendo lunes, y al día siguiente, y al otro, vuelve a ' +
      'comprobar que todo está igual; convencido de que el tiempo se ha detenido, destruye sus ' +
      'talleres y termina amarrado al castaño del patio (cap. 4). Mucho después, Úrsula conversa ' +
      'con su bisnieto y comprende, con un estremecimiento, que el tiempo no pasa, sino que da ' +
      'vueltas en redondo (cap. 17). A esa sensación contribuyen los nombres que se repiten de ' +
      'generación en generación: los Aureliano, los José Arcadio, las Remedios y las Amaranta ' +
      'vuelven como ecos. Usted puede leer el jardín como ese reloj circular: lo que parece nuevo ' +
      'ya ocurrió, y lo que ocurrió volverá a ocurrir.',
    datos: [
      'José Arcadio Buendía creyó que todos los días eran lunes y acabó amarrado al castaño del patio (cap. 4).',
      'Úrsula comprendió que el tiempo no pasa, sino que da vueltas en redondo (cap. 17).',
      'Los nombres se repiten de generación en generación: Aureliano, José Arcadio, Remedios, Amaranta (caps. 1, 6 y 10).',
    ],
    fuente: 'Gabriel García Márquez, Cien años de soledad, capítulos 4 y 17',
  },

  // Estación del puerto: la espera y la dignidad.
  espera: {
    capitulo: '4, 9, 10 y 16',
    titulo: 'La pensión que nunca llega',
    texto:
      'La espera es uno de los motores de esta novela, y casi siempre es una espera sin ' +
      'recompensa. Cuando el gobierno se niega a pagar las pensiones de los antiguos combatientes ' +
      'mientras revisa cada expediente, el coronel Aureliano Buendía advierte que los veteranos se ' +
      'morirán de viejos esperando el correo (cap. 9). Él mismo había rechazado su propia pensión ' +
      'para no pasar la vida aguardándola hasta la muerte (cap. 10). Antes, de joven, esperó a ' +
      'Remedios el tiempo que fuera necesario, hasta que estuviera en edad de casarse (cap. 4). ' +
      'Durante el diluvio, Fernanda aguarda a que escampe y se restablezca el correo para reanudar ' +
      'su correspondencia secreta (cap. 16). Es la misma dignidad frente a la espera que da título ' +
      'a otra novela del autor, El coronel no tiene quien le escriba. Usted mire el atril y el ' +
      'muelle: aquí la espera no se resuelve, se sostiene.',
    datos: [
      'El gobierno negó las pensiones de guerra mientras revisaba cada expediente (cap. 9).',
      'El coronel Aureliano Buendía rechazó su propia pensión para no estar esperándola hasta la muerte (cap. 10).',
      'Fernanda esperaba el fin de la lluvia y el regreso del correo para retomar su correspondencia secreta (cap. 16).',
    ],
    fuente: 'Gabriel García Márquez, Cien años de soledad, capítulos 4, 9, 10 y 16',
  },

  // Estación del mirador: la voz que cuenta y los pergaminos.
  voz: {
    capitulo: '18 y 20',
    titulo: 'La voz que ya sabía el final',
    texto:
      'La novela está contada por una voz que parece conocer el final antes de narrarlo, y esa voz ' +
      'tiene su símbolo dentro del libro: los pergaminos de Melquíades. El gitano dejó escritos, en ' +
      'sánscrito, cien años de la historia de la familia, con los versos pares cifrados con una ' +
      'clave privada y los impares con claves militares (cap. 18). Aureliano, encerrado en el ' +
      'cuarto, clasifica el alfabeto y aprende la lengua para descifrarlos; al final, mientras el ' +
      'huracán arranca puertas y ventanas, lee los manuscritos y se descubre profetizado a sí ' +
      'mismo, leyéndose en el acto de leer (cap. 20). Melquíades no ordenó los hechos en el tiempo ' +
      'común de los hombres, sino que concentró un siglo entero en un instante. En 1982, al recibir ' +
      'el Nobel, García Márquez habló de esa misma materia: de la soledad de América Latina y de la ' +
      'relación entre su historia y su imaginación. Usted está en un mirador: desde aquí se ve ' +
      'quién cuenta y cómo cuenta.',
    datos: [
      'Melquíades escribió la historia de la familia en sánscrito, con cien años de anticipación (caps. 18 y 20).',
      'Aureliano descifró los pergaminos mientras el huracán arrasaba Macondo (cap. 20).',
      'García Márquez recibió el Premio Nobel de Literatura en 1982 y tituló su discurso La soledad de América Latina.',
    ],
    fuente: 'Gabriel García Márquez, Cien años de soledad, capítulos 18 y 20; discurso del Nobel, 1982',
  },

  // Estación de la plaza: la fundación contada por dentro.
  llegada: {
    capitulo: '1 y 2',
    titulo: 'La fundación contada por dentro',
    texto:
      'El libro sí dice quién fundó el pueblo. José Arcadio Buendía y Úrsula eran primos y se ' +
      'habían criado juntos; el temor a engendrar un hijo con cola de cerdo los acompañaba desde ' +
      'antes del matrimonio. Una noche, tras un duelo de gallos, José Arcadio Buendía mató de una ' +
      'lanzada en la garganta a Prudencio Aguilar, y el muerto empezó a aparecerse en la casa ' +
      '(cap. 2). Para dejar atrás aquel peso, emprendió con varios amigos una travesía por la ' +
      'sierra en busca del mar. Anduvieron más de dos años —veintiséis meses, precisa el libro— y ' +
      'al no encontrar salida acamparon junto a un río pedregoso, no lejos de la ciénaga. Aquella ' +
      'noche él soñó una ciudad con paredes de espejo y le preguntó su nombre: Macondo. Al día ' +
      'siguiente mandó derribar los árboles y fundó la aldea (cap. 2). Antes, en una feria de ' +
      'gitanos, había visto el primer prodigio de su vida: un bloque de hielo dentro de un cofre, ' +
      'custodiado por un gigante, que él tomó por el diamante más grande del mundo (cap. 1).',
    datos: [
      'José Arcadio Buendía mató de una lanzada en la garganta a Prudencio Aguilar (cap. 2).',
      'La travesía de la sierra en busca del mar duró veintiséis meses (cap. 1); el capítulo 2 la narra paso a paso.',
      'El fundador soñó una ciudad con paredes de espejo y su nombre, Macondo; la aldea se levantó junto al río (cap. 2).',
    ],
    fuente: 'Gabriel García Márquez, Cien años de soledad, capítulos 1 y 2',
  },

  // Estación del jardín: las mariposas como señal.
  mariposas: {
    capitulo: '14',
    titulo: 'Las mariposas que anuncian a Mauricio',
    texto:
      'En esta novela las mariposas amarillas no adornan los jardines: anuncian a una persona. ' +
      'Antes de que Meme lo vea, ya sabe que Mauricio Babilonia está cerca, porque un aleteo ' +
      'amarillo lo precede. Las reconoce en el taller de mecánica, en la penumbra del cine, sobre ' +
      'su cabeza en el calor; cuando él empieza a perseguirla, entiende que las mariposas tienen ' +
      'que ver con él (cap. 14). Mauricio es un aprendiz de mecánico, de manos percudidas y ropa ' +
      'remendada, y su presencia levanta en la casa una pared: Fernanda lo rechaza desde la puerta, ' +
      'sin dejarlo hablar, mientras la casa se llena de mariposas. El prodigio no explica nada; ' +
      'solo señala. Una mañana la propia Fernanda confunde ese aleteo con el milagro de Remedios, ' +
      'la bella, y cree por un instante que va a repetirse en su hija. Así trabaja el presagio en ' +
      'el libro: siembra la señal temprano y deja que el lector la reconozca. Usted observe la ' +
      'espiral sobre el banco: la mariposa que sube es también un aviso que sube.',
    datos: [
      'Las mariposas amarillas precedían las apariciones de Mauricio Babilonia (cap. 14).',
      'Mauricio era aprendiz de mecánico y Fernanda lo expulsó de la casa sin dejarlo hablar (cap. 14).',
      'Mauricio murió viejo, en la soledad, atormentado por las mariposas amarillas (cap. 14).',
    ],
    fuente: 'Gabriel García Márquez, Cien años de soledad, capítulo 14',
  },

  // Estación del puerto: el tren y la modernidad.
  tren: {
    capitulo: '11 y 12',
    titulo: 'El tren amarillo y la fábrica de hielo',
    texto:
      'El tren no llegó cualquier madrugada: llegó tarde y lleno de flores. Un silbato estremeció ' +
      'al pueblo, la gente salió a la calle y vio a Aureliano Triste saludando desde la locomotora, ' +
      'en el tren amarillo adornado de flores que llegaba por primera vez con ocho meses de retraso ' +
      '(cap. 11). Ese mismo Aureliano Triste había instalado en las afueras la fábrica de hielo ' +
      'con que soñó José Arcadio Buendía, y de allí salió su idea de traer el ferrocarril. Detrás ' +
      'vinieron los inventos: el cine, que al principio el pueblo creyó otro embuste de gitanos; ' +
      'los gramófonos de cilindros; el teléfono de la estación nueva (cap. 12). Después llegó ' +
      'Mr. Herbert, que almorzó en la casa y examinó un racimo de banano con instrumentos de ' +
      'precisión, y detrás de él la compañía bananera (cap. 12). Los muebles y utensilios ' +
      'domésticos, en cambio, habían entrado al pueblo mucho antes en carretas de bueyes (cap. 2). ' +
      'Usted compare: una cosa es el mundo que llega en tren y otra la vida que ya estaba aquí.',
    datos: [
      'El tren llegó adornado de flores y con ocho meses de retraso (cap. 11).',
      'Aureliano Triste instaló la fábrica de hielo que José Arcadio Buendía había soñado, y propuso traer el ferrocarril (cap. 11).',
      'Los muebles y utensilios domésticos habían llegado antes en carretas de bueyes (cap. 2).',
    ],
    fuente: 'Gabriel García Márquez, Cien años de soledad, capítulos 11 y 12',
  },

  // Estación del jardín: complementa la cita literal con el contexto del capítulo 12.
  remedios: {
    capitulo: '12',
    titulo: 'Lo que queda de Remedios en la casa',
    texto:
      'La ascensión no se entiende sin la casa donde ocurre. En el capítulo 12 Macondo ya está ' +
      'invadido por la compañía bananera y por forasteros que bajan del tren; la casa de los ' +
      'Buendía se ha vuelto un albergue donde hay que poner turnos para almorzar, y es Fernanda ' +
      'quien impone sus leyes: horarios, rosario, manteles de lino. En medio de ese trajín vive ' +
      'Remedios, la bella, a quien la familia había dejado a su suerte por considerarla simple. ' +
      'Amaranta y Fernanda se cansan de ella; solo el coronel Aureliano Buendía sostiene que es la ' +
      'criatura más lúcida que ha conocido. Cuando sube, el pueblo se divide: unos rezan ' +
      'novenarios y encienden velas, otros sospechan que la familia oculta la verdad con una ' +
      'patraña. Fernanda, mordida por la envidia, termina aceptando el prodigio y rogando que le ' +
      'devuelvan las sábanas. Poco después, el exterminio de los diecisiete Aurelianos cambia el ' +
      'asombro por el espanto. Usted imagínese esa casa: puertas abiertas al mundo, visitantes a ' +
      'todas horas y una familia que apenas entiende a la mujer que tiene adentro.',
    datos: [
      'En el capítulo 12 la casa se había vuelto un albergue con turnos para almorzar, y Fernanda imponía sus leyes.',
      'Amaranta y Fernanda tenían por boba a Remedios, la bella; el coronel Aureliano Buendía la tenía por la más lúcida (cap. 12).',
      'Muchos forasteros creyeron que la familia ocultaba la verdad con una patraña; Fernanda pidió que le devolvieran las sábanas (cap. 12).',
    ],
    fuente: 'Gabriel García Márquez, Cien años de soledad, capítulo 12',
  },

  // Estación de la plaza: el prodigio que se paga por tocar y su eco industrial.
  hielo: {
    capitulo: '1 y 11',
    titulo: 'El hielo: del asombro al negocio',
    texto:
      'En el primer capítulo los gitanos traen al pueblo un cofre de pirata con un bloque de hielo ' +
      'y un gigante que cobra por tocarlo. El fundador pone la mano y no encuentra qué decir; su ' +
      'hijo mayor se niega; el menor la retira asustado y asegura que quema. El narrador cuenta ' +
      'la escena sin subrayar el milagro: el prodigio se mide en reales y se comenta como una ' +
      'compra. Esa serenidad es justamente lo que vuelve creíble la maravilla. Diez capítulos ' +
      'después el hielo regresa por otro camino: uno de los nietos instala en las afueras la ' +
      'fábrica de hielo con que soñaba el fundador y vende helados de fruta (cap. 11). Lo que ' +
      'empezó como asombro termina como empresa, y el pueblo ya no paga por verlo: lo compra ' +
      'hecho postre. Usted tiene delante las dos mitades del invento.',
    datos: [
      'Los gitanos exhibieron el hielo dentro de un cofre de pirata y cobraban por tocarlo (cap. 1).',
      'El fundador lo tuvo por el gran invento de su tiempo; su hijo menor retiró la mano y dijo que quemaba (cap. 1).',
      'Aureliano Triste instaló en las afueras la fábrica de hielo que el fundador había soñado (cap. 11).',
    ],
    fuente: 'Gabriel García Márquez, Cien años de soledad, capítulos 1 y 11',
  },

  // Estación del patio: el oficio circular del coronel.
  pescaditos: {
    capitulo: '6, 9 y 13',
    titulo: 'El oficio que empieza otra vez',
    texto:
      'El coronel Aureliano Buendía vuelve de la guerra y se encierra a trabajar el oro. Fabrica ' +
      'pescaditos en su taller, los cambia por monedas, funde las monedas y vuelve a empezar; ' +
      'cuando reúne veinticinco los funde todos y arranca de nuevo, dos al día (cap. 13). El ' +
      'círculo no es un pasatiempo: es su manera de habitar una vida que ya no espera nada ' +
      'grande. La novela cuenta además que rechazó la pensión y que los veteranos envejecían ' +
      'esperando un correo que el gobierno no despachaba (cap. 9). Hay un detalle que lo dice ' +
      'todo: cuando descubre que la gente compra sus pescaditos no como joyas sino como reliquias, ' +
      'deja de venderlos y sigue fabricándolos para nadie. Usted mire la bandeja: el trabajo ' +
      'hecho, contado y listo para deshacerse.',
    datos: [
      'El coronel fabricaba dos pescaditos al día y, al completar veinticinco, los fundía para volver a empezar (cap. 13).',
      'Cambiaba los pescaditos por monedas de oro y fundía las monedas para hacer más pescaditos (cap. 6).',
      'Dejó de venderlos cuando supo que no los compraban como joyas sino como reliquias históricas (cap. 13).',
    ],
    fuente: 'Gabriel García Márquez, Cien años de soledad, capítulos 6, 9 y 13',
  },
};

// Índice de los veinte capítulos: un título corto propio, una línea de hechos y las
// estaciones relacionadas (vacío cuando el capítulo no toca ninguna estación).
export const INDICE_NOVELA = [
  {
    n: 1,
    titulo: 'La fundación y el hielo',
    hechos:
      'Macondo es una aldea de veinte casas de barro y cañabrava; los gitanos de Melquíades traen el imán, el catalejo y el hielo, primer prodigio.',
    estaciones: ['llegada', 'hielo'],
  },
  {
    n: 2,
    titulo: 'La travesía y los orígenes',
    hechos:
      'Tras matar a Prudencio Aguilar, José Arcadio Buendía cruza la sierra; un sueño de casas de espejo bautiza el pueblo que funda junto al río.',
    estaciones: ['llegada'],
  },
  {
    n: 3,
    titulo: 'La peste del insomnio',
    hechos:
      'La peste borra los nombres de las cosas; el pueblo pega carteles, inventa la máquina de la memoria y la casa se amplía.',
    estaciones: ['memoria'],
  },
  {
    n: 4,
    titulo: 'La casa nueva y la locura del tiempo',
    hechos:
      'La pianola y Pietro Crespi llegan a la casa blanca; José Arcadio Buendía cree que todo es lunes y termina atado al castaño.',
    estaciones: ['tiempo', 'memoria'],
  },
  {
    n: 5,
    titulo: 'La guerra',
    hechos:
      'Aureliano se casa con Remedios, que muere pronto; vuelve José Arcadio; estalla la guerra y Aureliano parte como coronel.',
    estaciones: [],
  },
  {
    n: 6,
    titulo: 'Arcadio y los bandos',
    hechos:
      'Arcadio gobierna con bandos crueles y es fusilado; Amaranta rechaza a Pietro Crespi, que se suicida, y ella se quema la mano.',
    estaciones: ['pescaditos'],
  },
  {
    n: 7,
    titulo: 'La muerte del fundador',
    hechos:
      'El coronel cae prisionero; los gemelos nacen; un hilo de sangre anuncia la muerte de José Arcadio; muere el fundador bajo la lluvia de flores amarillas.',
    estaciones: ['memoria'],
  },
  {
    n: 8,
    titulo: 'La paz y el general Moncada',
    hechos:
      'Llega la primavera de paz; Aureliano José muere por Amaranta; el coronel toma Macondo y condena a muerte al general Moncada.',
    estaciones: [],
  },
  {
    n: 9,
    titulo: 'El armisticio y el tiro',
    hechos:
      'La guerra acaba en Neerlandia; el coronel se dispara en el círculo de yodo y sobrevive, mientras en Macondo una olla de leche se llena de gusanos.',
    estaciones: [],
  },
  {
    n: 10,
    titulo: 'La compañía y el carnaval',
    hechos:
      'Los gemelos se confunden; Aureliano Segundo descubre el cuarto de Melquíades y su fortuna; un carnaval termina en masacre y aparece Fernanda.',
    estaciones: [],
  },
  {
    n: 11,
    titulo: 'El tren amarillo',
    hechos:
      'Aureliano Triste levanta la fábrica de hielo soñada por el fundador y propone el ferrocarril; el tren llega adornado de flores con ocho meses de retraso.',
    estaciones: ['tren', 'hielo'],
  },
  {
    n: 12,
    titulo: 'El banano y la ascensión',
    hechos:
      'Llegan el cine, el gramófono y el teléfono; Mr. Herbert trae la compañía bananera; Remedios, la bella, sube al cielo y cazan a los diecisiete Aurelianos.',
    estaciones: ['tren', 'remedios'],
  },
  {
    n: 13,
    titulo: 'La ceguera de Úrsula y Amaranta',
    hechos:
      'Úrsula envejece y calla su ceguera; Amaranta teje su mortaja durante años; el coronel Aureliano Buendía muere bajo el castaño.',
    estaciones: ['pescaditos'],
  },
  {
    n: 14,
    titulo: 'Las mariposas de Mauricio',
    hechos:
      'Mauricio Babilonia, precedido de mariposas amarillas, enamora a Meme; Fernanda descubre el romance y un disparo lo deja paralítico.',
    estaciones: ['mariposas'],
  },
  {
    n: 15,
    titulo: 'La huelga y la masacre',
    hechos:
      'La huelga bananera termina en la masacre de la estación; José Arcadio Segundo despierta en un tren cargado de muertos y luego empieza la lluvia.',
    estaciones: [],
  },
  {
    n: 16,
    titulo: 'El diluvio',
    hechos:
      'Llueve cuatro años, once meses y dos días; entierran a Gerineldo Márquez en el fango; Fernanda espera el correo y la casa se derrumba.',
    estaciones: ['espera'],
  },
  {
    n: 17,
    titulo: 'El viento árido y las muertes',
    hechos:
      'El viento árido seca Macondo; muere Úrsula y muere Rebeca; los gemelos expiran en el mismo instante y Santa Sofía de la Piedad se marcha.',
    estaciones: ['tiempo'],
  },
  {
    n: 18,
    titulo: 'Aureliano y el tesoro',
    hechos:
      'Aureliano descubre que los pergaminos están en sánscrito y estudia para leerlos; muere Fernanda y José Arcadio halla los doblones enterrados.',
    estaciones: ['voz'],
  },
  {
    n: 19,
    titulo: 'El regreso de Amaranta Úrsula',
    hechos:
      'Amaranta Úrsula vuelve de Bruselas y restaura la casa; Aureliano descubre el pueblo en ruinas; Pilar Ternera, centenaria, adivina su tormento.',
    estaciones: [],
  },
  {
    n: 20,
    titulo: 'El final',
    hechos:
      'Nace un hijo con cola de cerdo; Amaranta Úrsula se desangra; las hormigas se llevan al niño y Aureliano descifra los pergaminos mientras el huracán arrasa Macondo.',
    estaciones: ['voz'],
  },
];

export const NOTA_ATRIBUCION =
  'Lo que aquí se atribuye a la novela son hechos verificables de Cien años de soledad, ' +
  'citados con su capítulo. Todo lo demás —el mapa, las estaciones, los objetos del pueblo y ' +
  'las preguntas— es de esta instalación y no pretende ser del libro.';

export function fichaDe(id) {
  return FICHAS_NOVELA[id] ?? null;
}
