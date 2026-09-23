// Árbol de los Buendía: las siete generaciones de Cien años de soledad, quién desciende de
// quién y cómo termina cada uno. Textos originales (sin citas literales); los capítulos son
// referencia de lectura. Los ids son estables en kebab-case y enlazan padres, hijos y pareja.
export const GENERACIONES = [
  // -------- Primera generación: los fundadores --------
  { id:'jose-arcadio-buendia', nombre:'José Arcadio Buendía', generacion:1,
    pareja:'ursula-iguaran', padres:[], hijos:['jose-arcadio','aureliano-coronel','amaranta'],
    final:'Enloquecido con la idea de que el tiempo se había detenido, pasa sus últimos años atado al castaño del patio y muere allí.',
    nota:'El primer Buendía: funda Macondo y abre la estirpe; por él entran al pueblo los inventos de los gitanos.' },

  { id:'ursula-iguaran', nombre:'Úrsula Iguarán', generacion:1,
    pareja:'jose-arcadio-buendia', padres:[], hijos:['jose-arcadio','aureliano-coronel','amaranta'],
    final:'Muere de muy vieja, ya ciega, casi un siglo después de haber fundado Macondo.',
    nota:'La matriarca: sostiene la casa y sigue nombrando a los suyos cuando ya no los ve.' },

  // -------- Segunda generación --------
  { id:'jose-arcadio', nombre:'José Arcadio', generacion:2,
    pareja:null, padres:['jose-arcadio-buendia','ursula-iguaran'], hijos:['arcadio'],
    final:'Muere de un pistoletazo sin herida, y un hilo de sangre cruza el pueblo hasta la cocina de su madre.',
    nota:'El hijo mayor: se va con los gitanos, vuelve enorme y tatuado, y se casa con Rebeca.' },

  { id:'aureliano-coronel', nombre:'Aureliano Buendía, el coronel', generacion:2,
    pareja:null, padres:['jose-arcadio-buendia','ursula-iguaran'], hijos:['aureliano-jose','aurelianos-diecisiete'],
    final:'Muere de viejo bajo el castaño, después de haber sobrevivido a su propio disparo.',
    nota:'Nace con los ojos abiertos y con dones de adivino; la guerra lo vuelve el hombre más solo del pueblo.' },

  { id:'amaranta', nombre:'Amaranta', generacion:2,
    pareja:null, padres:['jose-arcadio-buendia','ursula-iguaran'], hijos:[],
    final:'Muere al terminar de tejer su propia mortaja, sin confesarse, tras repartir cartas para los muertos.',
    nota:'Rechaza a todos sus pretendientes y vive la espera como una forma de castigo.' },

  // Madre de dos ramas del pueblo; por su tiempo pertenece a la segunda generación.
  { id:'pilar-ternera', nombre:'Pilar Ternera', generacion:2,
    pareja:null, padres:[], hijos:['arcadio','aureliano-jose'],
    final:'Muere de muy vieja y la entierran sentada en su mecedor, sin ataúd.',
    nota:'Lee el porvenir y el pasado en las cartas; es madre del hijo que José Arcadio no crió y del que Aureliano engendró antes de la guerra.' },

  // -------- Tercera generación --------
  { id:'arcadio', nombre:'Arcadio', generacion:3,
    pareja:'santa-sofia-de-la-piedad', padres:['jose-arcadio','pilar-ternera'],
    hijos:['remedios-la-bella','jose-arcadio-segundo','aureliano-segundo'],
    final:'Lo fusilan contra el muro del cementerio cuando apenas había empezado a gobernar Macondo con bandos absurdos.',
    nota:'Se crio creyendo que era un hermano más; muere siendo a la vez un gobernante cruel y un muchacho asustado.' },

  { id:'aureliano-jose', nombre:'Aureliano José', generacion:3,
    pareja:null, padres:['aureliano-coronel','pilar-ternera'], hijos:[],
    final:'Muere de un balazo en una riña, después de volver a buscar a Amaranta, que le había cerrado la puerta.',
    nota:'Hijo del coronel y de Pilar Ternera; encarna la pasión imposible dentro de la propia casa.' },

  { id:'aurelianos-diecisiete', nombre:'Los diecisiete Aurelianos', generacion:3,
    pareja:null, padres:['aureliano-coronel'], hijos:[],
    final:'Los cazan uno por uno, guiándose por la cruz de ceniza que llevan en la frente; solo uno logra escapar.',
    nota:'Los hijos de la guerra: todos se llaman Aureliano y viven lejos del padre. La repetición del nombre alcanza aquí su mayor número.' },

  // Entra al árbol como madre y compañera de Arcadio, no como Buendía de sangre.
  { id:'santa-sofia-de-la-piedad', nombre:'Santa Sofía de la Piedad', generacion:3,
    pareja:'arcadio', padres:[], hijos:['remedios-la-bella','jose-arcadio-segundo','aureliano-segundo'],
    final:'Se marcha de la casa para siempre, vieja y pobre, sin que vuelvan a saber de ella.',
    nota:'Crió a los hijos que no eran suyos y sostuvo la casa desde la cocina.' },

  // -------- Cuarta generación --------
  { id:'remedios-la-bella', nombre:'Remedios, la bella', generacion:4,
    pareja:null, padres:['arcadio','santa-sofia-de-la-piedad'], hijos:[],
    final:'Sube al cielo una tarde de marzo, entre las sábanas que estaba doblando.',
    nota:'Su belleza mata a quien la mira sin quererlo; nunca sospecha el poder que tiene.' },

  { id:'jose-arcadio-segundo', nombre:'José Arcadio Segundo', generacion:4,
    pareja:null, padres:['arcadio','santa-sofia-de-la-piedad'], hijos:[],
    final:'Cae muerto sobre los pergaminos de Melquíades, al mismo tiempo que su gemelo, y acaban enterrándolo en la tumba del otro.',
    nota:'Gemelo de Aureliano Segundo: los dos se intercambian ropa y nombres, y ni la muerte los distingue.' },

  { id:'aureliano-segundo', nombre:'Aureliano Segundo', generacion:4,
    pareja:'fernanda-del-carpio', padres:['arcadio','santa-sofia-de-la-piedad'],
    hijos:['jose-arcadio-ii','renata-remedios','amaranta-ursula'],
    final:'Muere el mismo día que su gemelo, y en el entierro confunden los dos ataúdes.',
    nota:'Gemelo de José Arcadio Segundo: derrocha una fortuna que se multiplica sola y termina pobre y enamorado de Petra Cotes.' },

  // Entra al árbol como esposa de Aureliano Segundo y madre de sus tres hijos.
  { id:'fernanda-del-carpio', nombre:'Fernanda del Carpio', generacion:4,
    pareja:'aureliano-segundo', padres:[], hijos:['jose-arcadio-ii','renata-remedios','amaranta-ursula'],
    final:'Muere en su cama, muy vieja, creyéndose todavía reina y sin soltar sus ritos.',
    nota:'Trae a la casa los horarios, el rosario y los manteles de lino; quiere ordenar una familia que no se deja.' },

  // -------- Quinta generación --------
  { id:'jose-arcadio-ii', nombre:'José Arcadio', generacion:5,
    pareja:null, padres:['aureliano-segundo','fernanda-del-carpio'], hijos:[],
    final:'Lo ahogan en su propia alberca los cuatro niños que había recogido, y estos se llevan el tesoro.',
    nota:'Vuelve de Roma hablando de santos, encuentra el oro enterrado y se pierde en el despilfarro.' },

  { id:'renata-remedios', nombre:'Renata Remedios (Meme)', generacion:5,
    pareja:'mauricio-babilonia', padres:['aureliano-segundo','fernanda-del-carpio'], hijos:['aureliano-babilonia'],
    final:'Tras enmudecer y ser llevada a un convento, vive y muere lejos de Macondo.',
    nota:'Su amor con Mauricio Babilonia, anunciado por las mariposas, la condena al silencio.' },

  { id:'amaranta-ursula', nombre:'Amaranta Úrsula', generacion:5,
    pareja:'aureliano-babilonia', padres:['aureliano-segundo','fernanda-del-carpio'], hijos:['aureliano-cola-de-cerdo'],
    final:'Muere desangrada después de dar a luz al último de la estirpe.',
    nota:'Vuelve de Europa decidida a restaurar la casa y, sin saberlo, cierra el círculo de la familia.' },

  // Entra al árbol como padre de Aureliano Babilonia, el hijo de Meme.
  { id:'mauricio-babilonia', nombre:'Mauricio Babilonia', generacion:5,
    pareja:'renata-remedios', padres:[], hijos:['aureliano-babilonia'],
    final:'Un disparo en la columna lo deja paralítico, y vive solo, marcado por la vigilancia de la casa.',
    nota:'Aprendiz de mecánico; siempre llega precedido por las mariposas amarillas.' },

  // -------- Sexta generación --------
  { id:'aureliano-babilonia', nombre:'Aureliano Babilonia', generacion:6,
    pareja:'amaranta-ursula', padres:['mauricio-babilonia','renata-remedios'], hijos:['aureliano-cola-de-cerdo'],
    final:'Descifra los pergaminos de Melquíades y, al terminar de leerlos, el huracán borra a Macondo.',
    nota:'El último Buendía que crece en la casa: nieto del coronel, sobrino y amante de Amaranta Úrsula.' },

  // -------- Séptima generación --------
  { id:'aureliano-cola-de-cerdo', nombre:'Aureliano', generacion:7,
    pareja:null, padres:['aureliano-babilonia','amaranta-ursula'], hijos:[],
    final:'Nace con cola de cerdo y las hormigas se lo llevan mientras su padre vuelve a casa.',
    nota:'El último de la estirpe: cumple la amenaza que persiguió a la familia desde la fundación.' },
];

export const CIERRE_ARBOL = 'El último de la estirpe es Aureliano, el hijo que Amaranta Úrsula trae al mundo con una cola de cerdo: el mismo temor que había perseguido a la familia desde que los fundadores se casaron siendo primos. Su madre muere desangrada del parto y su padre, Aureliano Babilonia, sale a buscar consuelo; cuando vuelve, el recién nacido ha sido arrastrado por las hormigas. En ese instante, y no antes, Aureliano entiende los pergaminos de Melquíades: descubre que toda la historia de los Buendía estaba escrita con cien años de anticipación, que él está leyendo su propio final y que Amaranta Úrsula era su tía y no su hermana. La línea se acaba porque estaba condenada desde el principio: cada generación repitió los mismos nombres y los mismos errores hasta que el círculo se cerró en un solo niño, y porque una familia encerrada en cien años de soledad no vuelve a empezar. Mientras Aureliano termina de leer, el huracán arrasa Macondo y lo borra de la memoria de los hombres.';

export const NOTAS_ARBOL = [
  'Los nombres son un destino: casi todos los Aureliano son solitarios, previsores y guerreros, y casi todos los José Arcadio son corpulentos, impulsivos y trágicos. Antes de conocer a un personaje, el nombre ya anuncia cómo será.',
  'La familia repite los mismos nombres generación tras generación —José Arcadio, Aureliano, Amaranta, Remedios—, de modo que el lector, igual que los personajes, tiene que esforzarse por distinguir quién es quién. Esa confusión no es un descuido: es parte del libro.',
  'Los gemelos José Arcadio Segundo y Aureliano Segundo se intercambian la ropa, los nombres y hasta las mujeres desde niños, y al morir el mismo día terminan sepultados en la tumba equivocada: la novela lleva la confusión hasta el final.',
  'Los nombres vuelven y el tiempo también: el fundador termina atado a un árbol y el último de la estirpe muere comido por las hormigas, como si el final repitiera el principio. Leer el árbol es leer un tiempo que da vueltas en redondo.',
];
