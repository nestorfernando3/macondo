// Contenido literario. Los textos pedagógicos son originales. La única transcripción literal
// de la novela es la ascensión de Remedios, la bella (estación «remedios»): viaja en el campo
// `cita`, separada de la glosa, atribuida a su capítulo y sin entrar en la narración hablada
// —una grabación del pasaje sería una reproducción mucho más pesada que una cita impresa, y
// los clips de audio se generan y se distribuyen como MP3—. Fuentes: nobelprize.org (Nobel 1982).
export const stations = [
 { id:'memoria', location:'casa', title:'La casa de la memoria', tag:'01 / MEMORIA', icon:'⌂', color:'#ffc766',
   body:'En el realismo mágico, lo extraordinario puede contarse con la misma naturalidad que una tarea doméstica. El asombro nace de esa convivencia: lo imposible forma parte de la vida cotidiana.',
   work:'Cien años de soledad · Una puerta de entrada a Macondo, la familia Buendía y las vueltas de la memoria.',
   question:'¿Qué voz se acerca más al realismo mágico? (Ejemplos originales)',
   answers:['El fantasma volvió a desayunar y le servimos café.','Desperté: todo había sido un sueño.'],
   correct:0, feedback:'La primera frase acepta lo extraordinario como cotidiano; la segunda lo explica como un sueño.' },
 { id:'tiempo', location:'jardin', title:'El jardín del tiempo', tag:'02 / TIEMPO', icon:'✳', color:'#f18fab',
   body:'Una historia puede avanzar y, al mismo tiempo, regresar. En Cien años de soledad, los nombres y las experiencias repetidas invitan a leer el tiempo como una pregunta sobre la memoria y el destino.',
   work:'Cien años de soledad · Observa qué cambia cuando una situación parece repetirse.',
   question:'Si dos generaciones repiten una decisión, ¿qué conviene explorar?',
   answers:['Solo el orden de las fechas.','Las semejanzas y diferencias entre sus decisiones.'],
   correct:1, feedback:'Comparar las decisiones permite interpretar la repetición, sin reducir la novela a una cronología.' },
 { id:'espera', location:'puerto', title:'El puerto de la espera', tag:'03 / ESPERA', icon:'≈', color:'#73d9c9',
   body:'La obra de García Márquez también permite explorar la espera, la dignidad y las tensiones de la vida diaria. No todo lo que escribió necesita un suceso sobrenatural para conmover.',
   work:'El coronel no tiene quien le escriba · Una lectura de la espera y la dignidad.',
   question:'¿Toda obra de García Márquez debe tener magia?',
   answers:['Sí: el autor determina siempre el género.','No: hay que observar cómo está construido cada texto.'],
   correct:1, feedback:'La interpretación parte de cada obra. Una etiqueta literaria no sustituye su lectura.' },
 { id:'voz', location:'mirador', title:'El mirador de las historias', tag:'04 / VOZ', icon:'✦', color:'#c5a4f0',
   body:'La literatura de García Márquez entrelaza imaginación, narración oral e historia latinoamericana. Su discurso del Nobel abre una conversación sobre quién cuenta nuestra realidad y cómo se vuelve creíble para otros.',
   work:'La soledad de América Latina · Discurso del Nobel, 1982.',
   question:'¿Qué pregunta abre una lectura crítica del discurso?',
   answers:['¿Qué relación propone entre historia e imaginación?','¿Cuántos elementos mágicos aparecen?'],
   correct:0, feedback:'Relacionar historia e imaginación ayuda a leer el argumento, además de sus imágenes.' },
 // Pasajes sin quiz (question:null): se leen y se escuchan, sin preguntas.
 { id:'llegada', location:'plaza', title:'El pueblo que se inventa', tag:'05 / PLAZA', icon:'◉', color:'#e8a087',
   body:'Antes del primer tren, Macondo era un puñado de casas de barro y cañabrava junto al río, ordenadas como si alguien las hubiera pensado la noche anterior. Los recién llegados preguntaban quién fundó el pueblo, y nadie respondía con certeza: parecía haberse inventado solo, una mañana de calor. Ese es el primer gesto del realismo mágico: contar lo extraordinario con la serenidad de un inventario. No hay explicación para una aldea que florece en mitad de la ciénaga; hay descripción, y la descripción alcanza. Mire la plaza: la fuente, el reloj y las bancas sostienen la escena igual que una frase bien puesta sostiene un párrafo.',
   work:'Cien años de soledad · La fundación, contada sin asombro.',
   question:null,
   conversa:'¿Qué lugar de su infancia se reinventa cada vez que usted lo recuerda?' },
 { id:'mariposas', location:'jardin', title:'Las mariposas que anuncian', tag:'06 / SEÑAL', icon:'❋', color:'#f5c542',
   body:'En Macondo, las mariposas amarillas no decoran: anuncian. Aparecen donde algo está a punto de cambiar, y quien las ve entiende que el aire trae noticias. A esa señal anticipada la literatura la llama presagio, pero aquí funciona como en los pueblos: nadie la explica, todos la respetan. Observe la espiral sobre el banco: cada mariposa sube en hélice, se demora en el aire y vuelve a subir. La repetición no es un error del cielo; es un sistema de avisos. Así se construye la expectativa en una novela: siembre la señal temprano y deje que el lector la reconozca mucho antes de la noticia.',
   work:'Cien años de soledad · Las mariposas como sistema de señales.',
   question:null,
   conversa:'¿Qué señal pequeña le ha anticipado a usted un cambio grande?' },
 { id:'tren', location:'puerto', title:'El tren de los buhoneros', tag:'07 / TREN', icon:'⌁', color:'#8fb7e8',
   body:'El tren llegó un sábado de madrugada con un silbato largo, y de los vagones bajaron buhoneros con cacerolas, mecedoras, sombreros de ala ancha y utensilios cuyo nombre hubo que aprender de prisa. Detrás del tren vino todo lo demás: los discos, el cine, los catálogos con fotos. La novela entiende esa llegada como una puerta que ya no vuelve a cerrarse: lo remoto se vuelve cotidiano, y el pueblo deja de contarse a sí mismo para mirar el horizonte. En este muelle hay otra espera: la carta del atril lleva años pidiendo respuesta. Compare las dos esperas, la del progreso que llega sin pedir permiso y la de la palabra que no llega: entre las dos se arma media novela.',
   work:'Cien años de soledad · La llegada del tren y la apertura del mundo.',
   question:null,
   conversa:'¿Qué objeto traído de lejos cambió para siempre la vida de su familia?' },
 // La única transcripción literal de la novela, y por eso lleva campos propios: `cita` es el
 // pasaje tal como está en el libro —dictado letra a letra desde la edición ilustrada, sin
 // cortes ni retoques—, `citaFuente` es su atribución y `source:null` retira el enlace de
 // fuente, porque la fuente de una cita es el libro y no la página del Nobel que citan las
 // demás. La glosa (`body`) es original y va después, para no confundir lo que dijo García
 // Márquez con lo que decimos nosotros. Y el pasaje NO entra en `narracion.js`: el clip de
 // audio se genera y se distribuye como MP3, así que grabar el fragmento sería una
 // reproducción mucho más pesada que esta cita impresa.
 { id:'remedios', location:'jardin', title:'La ascensión de Remedios, la bella', tag:'08 / ASCENSO', icon:'✧', color:'#f0e3c8',
   cita:'Remedios, la bella, se quedó vagando por el desierto de la soledad, sin cruces a cuestas, madurándose en sus sueños sin pesadillas, en sus baños interminables, en sus comidas sin horarios, en sus hondos y prolongados silencios sin recuerdos, hasta una tarde de marzo en que Fernanda quiso doblar en el jardín sus sábanas de bramante, y pidió ayuda a las mujeres de la casa. Apenas habían empezado, cuando Amaranta advirtió que Remedios, la bella, estaba transparentada por una palidez intensa. —¿Te sientes mal? —le preguntó. Remedios, la bella, que tenía agarrada la sábana por el otro extremo, hizo una sonrisa de lástima. —Al contrario —dijo—, nunca me he sentido mejor. Acabó de decirlo, cuando Fernanda sintió que un delicado viento de luz le arrancó las sábanas de las manos y las desplegó en toda su amplitud. Amaranta sintió un temblor misterioso en los encajes de sus pollerines y trató de agarrarse de la sábana para no caer, en el instante en que Remedios, la bella, empezaba a elevarse. Úrsula, ya casi ciega, fue la única que tuvo serenidad para identificar la naturaleza de aquel viento irreparable, y dejó las sábanas a merced de la luz, viendo a Remedios, la bella, que le decía adiós con la mano, entre el deslumbrante aleteo de las sábanas que subían con ella, que abandonaban con ella el aire de los escarabajos y las dalias, y pasaban con ella a través del aire donde terminaban las cuatro de la tarde, y se perdieron con ella para siempre en los altos aires donde no podían alcanzarla ni los más altos pájaros de la memoria.',
   citaFuente:'Gabriel García Márquez, Cien años de soledad, capítulo 12',
   body:'El prodigio no llega con estruendo: llega mientras se dobla la ropa. Fíjese en el orden de la escena —una casa que ya no sabe qué hacer con Remedios, una tarea doméstica cualquiera y, solo entonces, el viento de luz— y sobre todo en el tono: el narrador no explica el milagro ni se detiene a admirarlo, lo cuenta con la misma voz con la que contaría que se rompió un plato. En eso consiste el pacto del realismo mágico. Tres detalles lo sostienen: las sábanas que suben con ella, el aire «donde terminaban las cuatro de la tarde» —una hora que se acaba como se acaba un lugar— y la ceguera de Úrsula, la única que entiende lo que está viendo. Nadie grita. La casa sigue doblada.',
   work:'Cien años de soledad · Remedios, la bella sube al cielo una tarde de marzo.',
   question:null,
   source:null,
   conversa:'El narrador cuenta el milagro sin asombrarse. ¿Qué gana la escena con esa calma y qué perdería si alguien gritara?' },
 // Estaciones de la capa literaria: el prodigio del hielo (caps. 1 y 11) y el oficio del
 // platero (caps. 6, 9 y 13). Pasajes sin quiz, como los otros tres. La glosa es nuestra y la
 // fuente es el libro, así que `source:null` retira el enlace externo, igual que en «remedios».
 { id:'hielo', location:'plaza', title:'El cofre que ardía', tag:'09 / HIELO', icon:'❄', color:'#bfe3ef',
   body:'En la plaza hay una carpa de feria con un cofre abierto y, dentro, un bloque de hielo. La escena viene del primer asombro del pueblo: traer un témpano a una aldea de barro y cañabrava era tan increíble que se pagaba por tocarlo. Fíjese en los gestos, porque ahí está la lección: el padre pone la mano y no encuentra palabras; el hijo mayor se niega; el menor la retira y asegura que quema. Nadie explica nada. El prodigio se cuenta como se cuenta un recibo, y esa serenidad es lo que lo vuelve creíble. Mire el charco que crece bajo el cofre: el asombro también se derrite, y eso forma parte del asunto. El hielo no era magia: era frío, y bastó para que un pueblo entero cambiara de idea sobre lo posible.',
   work:'Cien años de soledad · El primer prodigio: un bloque de hielo que se paga por tocar.',
   question:null,
   source:null,
   conversa:'¿Cuándo le pareció asombroso algo que, para los demás, era lo más corriente del mundo?' },
 { id:'pescaditos', location:'casa', title:'Veinticinco pescaditos', tag:'10 / OFICIO', icon:'◍', color:'#e8c976',
   body:'En la mesa del patio hay una bandeja con veinticinco pescaditos de oro y, al lado, las herramientas del platero. El taller viene de un oficio que en la novela ocupa a un hombre durante años: fabricaba dos pescaditos al día, los cambiaba por monedas, fundía las monedas y volvía a empezar; al completar veinticinco los fundía todos y arrancaba otra vez. La repetición no es una rutina vacía: es su manera de sostener una vida que ya no espera nada grande. Compare la bandeja con la silla de esta misma mesa: las dos guardan una ausencia. Mire el crisol encendido: lo que se funde puede volver a empezar. Pregúntese qué haría usted con veinticinco pescaditos y una tarde entera por delante.',
   work:'Cien años de soledad · El oficio del coronel: hacer y fundir, dos pescaditos al día.',
   question:null,
   source:null,
   conversa:'¿Qué tarea repetida le ordena hoy la vida, y qué haría distinto si nadie la viera?' }
].map(s=>({...s,source:s.source!==undefined?s.source:'https://www.nobelprize.org/prizes/literature/1982/'+(s.id==='voz'?'marquez/lecture/':'press-release/')}));

export const stationBy = key => stations.find(s=>s.id===key||s.location===key);

// Escritura final (opcional, mirador). Nunca obligatoria ni calificada.
export const writing = {
  title:'Tres frases propias',
  prompt:'Después del paseo: escribe tres frases sobre algo cotidiano que te parezca extraordinario.',
  storageKey:'macondo.escritura.v1'
};

// Clave versionada para visitas y respuestas de esta experiencia.
export const PROGRESS_KEY = 'macondo.progreso.v1';
