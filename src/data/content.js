// Contenido literario. Textos pedagógicos y ejemplos originales; no se reproducen
// fragmentos de las novelas. Fuentes verificadas: nobelprize.org (Nobel 1982).
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
   conversa:'¿Qué objeto traído de lejos cambió para siempre la vida de su familia?' }
].map(s=>({...s,source:'https://www.nobelprize.org/prizes/literature/1982/'+(s.id==='voz'?'marquez/lecture/':'press-release/')}));

export const stationBy = key => stations.find(s=>s.id===key||s.location===key);

// Escritura final (opcional, mirador). Nunca obligatoria ni calificada.
export const writing = {
  title:'Tres frases propias',
  prompt:'Después del paseo: escribe tres frases sobre algo cotidiano que te parezca extraordinario.',
  storageKey:'macondo.escritura.v1'
};

// Clave versionada para visitas y respuestas de esta experiencia.
export const PROGRESS_KEY = 'macondo.progreso.v1';
