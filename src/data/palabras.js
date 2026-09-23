// Cuaderno de palabras del Caribe: léxico que el visitante ve en el pueblo o lee en la novela.
// Para cada palabra, una definición breve, dónde aparece (capítulo verificado o «uso general
// del Caribe colombiano») y qué aporta al leer. Textos originales, sin citas literales.
export const PALABRAS = [
  { palabra:'cañabrava', categoria:'construcción',
    significado:'Caña hueca y liviana con la que se levantan las paredes y los techos de las casas más humildes.',
    enLaNovela:'cap. 1',
    nota:'Macondo nace como una aldea de barro y cañabrava: la palabra nombra la casa antes de que lleguen el ladrillo y el cemento.' },

  { palabra:'guadua', categoria:'construcción',
    significado:'Bambú grueso y resistente del trópico, usado para postes, vigas y andamios.',
    enLaNovela:'uso general del Caribe colombiano',
    nota:'Es el material de la construcción criolla: sirve para imaginar con qué se arma una casa del pueblo.' },

  { palabra:'bahareque', categoria:'construcción',
    significado:'Pared hecha de caña o madera trenzada y recubierta de barro, típica de la vivienda campesina.',
    enLaNovela:'uso general del Caribe colombiano',
    nota:'Explica cómo se hacen las paredes de barro que sostienen los primeros años de Macondo.' },

  { palabra:'ciénaga', categoria:'río',
    significado:'Terreno bajo y pantanoso que se inunda, con agua quieta entre la tierra y el río.',
    enLaNovela:'caps. 1 y 2',
    nota:'Macondo está rodeado por la ciénaga: esa frontera de agua lo aísla del mundo y, más tarde, se vuelve el camino por donde el mundo entra.' },

  { palabra:'totuma', categoria:'casa',
    significado:'Recipiente que se saca del fruto del totumo, partido por la mitad, para servir agua o comida.',
    enLaNovela:'caps. 4 y 12',
    nota:'Aparece desde el baño de Remedios la bella hasta las tareas de la casa: es el objeto humilde que la novela repite sin llamar la atención.' },

  { palabra:'guineo', categoria:'planta',
    significado:'Plátano pequeño y dulce, más corto que el plátano de cocinar; fruta común del Caribe.',
    enLaNovela:'caps. 3 y 12',
    nota:'Se cuenta entre los frutos que da la tierra, junto a la yuca y la malanga, y nombra la comida diaria del pueblo.' },

  { palabra:'malanga', categoria:'planta',
    significado:'Raíz comestible parecida a la yuca, de sabor suave, que se cocina como tubérculo.',
    enLaNovela:'caps. 1 y 3',
    nota:'Aparece en la lista de cultivos y crías del pueblo: es una de las palabras que dibujan la mesa campesina.' },

  { palabra:'yuca', categoria:'planta',
    significado:'Raíz larga y harinosa, alimento básico del campo caribeño; se come cocida o en casabe.',
    enLaNovela:'caps. 1, 3 y 13',
    nota:'Sostiene la comida del pueblo y, en el torneo de comilones, se sirve con plátano y ñame: la misma palabra nombra el sustento y el exceso.' },

  { palabra:'plátano', categoria:'planta',
    significado:'Fruto alargado y verde que se cocina; es la planta que alimenta la cocina del pueblo.',
    enLaNovela:'cap. 1 (y reaparece a lo largo de la novela)',
    nota:'Acompaña la vida entera de Macondo; su pariente industrial, el banano, traerá después la bonanza y la matanza.' },

  { palabra:'hamaca', categoria:'casa',
    significado:'Tela larga que se cuelga de dos puntos y sirve para dormir y descansar, meciéndose.',
    enLaNovela:'caps. 1 y 16',
    nota:'Es el mueble de dormir del trópico: la casa se lee por sus hamacas y petates, hechos con lo que da la tierra.' },

  { palabra:'nasa', categoria:'río',
    significado:'Trampa de pesca tejida en mimbre, con forma de embudo, que se deja en el río para atrapar peces.',
    enLaNovela:'uso general del Caribe colombiano',
    nota:'En el muelle del pueblo se apilan nasas: la palabra nombra el oficio de pescar en el río, uno de los trabajos que nunca dejó de existir.' },

  { palabra:'atarraya', categoria:'río',
    significado:'Red redonda de pesca que se lanza abierta sobre el agua y se recoge con un cordel.',
    enLaNovela:'uso general del Caribe colombiano',
    nota:'Como la nasa, pertenece al léxico de la pesca ribereña: recuerda que el río de Macondo también se trabaja.' },

  { palabra:'bohío', categoria:'casa',
    significado:'Vivienda rústica de una sola pieza, hecha de caña, madera y palma, típica del campo caribeño.',
    enLaNovela:'uso general del Caribe colombiano',
    nota:'Explica qué clase de casa se levanta en los primeros tiempos, antes de la casa grande de los Buendía.' },

  { palabra:'alcaraván', categoria:'animal',
    significado:'Ave zancuda de patas largas y plumaje pardo que anda de noche por los campos abiertos y el barro.',
    enLaNovela:'caps. 6, 19 y 20',
    nota:'Ave del llano y de la noche: aparece en las faenas del campo y, al final, acompaña el barrio en ruinas que cierra la historia.' },

  { palabra:'gallinazo', categoria:'animal',
    significado:'Ave rapaz negra y carroñera, parecida al buitre, que se alimenta de animales muertos.',
    enLaNovela:'caps. 4 y 13',
    nota:'El gallinazo posado en el cuerpo de Melquíades y los que rondan a los muertos son la cara fría de la muerte, contada sin dramatismo.' },

  { palabra:'guacharaca', categoria:'animal',
    significado:'Ave silvestre del monte, de canto ronco y repetido, parecida a una pava.',
    enLaNovela:'uso general del Caribe colombiano',
    nota:'La guacharaca es a la vez pájaro y tambor: su nombre recuerda que en el Caribe la fauna y la música comparten el mismo vocabulario.' },

  { palabra:'mecedor', categoria:'casa',
    significado:'Silla con las patas curvas que se balancea hacia adelante y hacia atrás.',
    enLaNovela:'caps. 3, 4 y 20',
    nota:'El mecedorcito de Rebeca y el mecedor donde entierran a Pilar Ternera cierran el círculo: el mismo mueble para la niña que llega y la vieja que se va.' },

  { palabra:'petate', categoria:'casa',
    significado:'Estera de palma o junco que se tiende en el suelo para dormir.',
    enLaNovela:'caps. 6 y 12',
    nota:'El petate es la cama pobre: se amontonan en el cuartel y en las casas de paso, frente a los muebles importados que trae la modernidad.' },

  { palabra:'cuja', categoria:'casa',
    significado:'Armazón de la cama, el mueble donde se pone el colchón.',
    enLaNovela:'uso general del Caribe colombiano',
    nota:'Es la palabra antigua y caribeña para la cama: nombra el descanso de la casa y permite hablar de la intimidad sin rodeos.' },

  { palabra:'aljibe', categoria:'casa',
    significado:'Depósito o pozo, casi siempre enterrado, donde se recoge y se guarda el agua de lluvia.',
    enLaNovela:'uso general del Caribe colombiano',
    nota:'Antes del acueducto, la casa dependía del aljibe y del agua guardada; en Macondo el agua también se espera y se recuerda.' },

  { palabra:'estera', categoria:'casa',
    significado:'Tejido plano de fibra vegetal que se usa como alfombra o para dormir en el suelo.',
    enLaNovela:'cap. 2 (la estera voladora)',
    nota:'El objeto doméstico más humilde se vuelve prodigio: la estera que vuela en la feria de los gitanos muestra cómo lo extraordinario entra en la casa.' },

  { palabra:'buhonero', categoria:'oficio',
    significado:'Vendedor ambulante que recorre los pueblos con mercancía menuda, colgada o en un cajón.',
    enLaNovela:'uso general del Caribe colombiano',
    nota:'El tren de la novela llena la calle de vendedores: el buhonero trae lo remoto hasta la puerta de la casa y mide cuánto ha cambiado el pueblo.' },

  { palabra:'galeón', categoria:'objeto',
    significado:'Barco grande de vela, de los que cruzaban los mares en la época de la Colonia.',
    enLaNovela:'cap. 1',
    nota:'Encontrarlo encallado en la selva es la primera prueba de que Macondo está rodeado de agua y de tiempo: un barco donde debería haber tierra.' },
];

export const INTRO_PALABRAS = 'En Cien años de soledad, las cosas empiezan sin nombre: al principio hay que señalarlas con el dedo, y una peste llega a borrar los nombres de todo lo que hay en el pueblo. Por eso el léxico importa: nombrar la cañabrava, la totuma o la ciénaga es una forma de sostener el mundo y de no olvidarlo. Estas palabras del Caribe colombiano le permiten a usted ver Macondo con los ojos de quien lo habita, y no solo de quien lo visita.';
