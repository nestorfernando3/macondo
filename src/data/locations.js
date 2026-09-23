// Registro único de lugares, caminos y puntos de interés.
// Escena, mapa y guía leen de aquí; no duplicar coordenadas en DOM ni en el motor.

// Metros. yaw 0 mira hacia -z. Cámara a 1,65 m; jugador r 0,3 m.
export const SPAWN = { x:0, z:30, yaw:0 };

export const LOCATIONS = {
 plaza:   { name:'Plaza de llegada',          x:0,    z:0 },
 casa:    { name:'Casa de la memoria',        x:0,    z:-11 },
 patio:   { name:'Patio de la casa',          x:0,    z:-15.5 },
 jardin:  { name:'Jardín del tiempo',         x:22.5, z:-11.5 },
 puerto:  { name:'Puerto de la espera',       x:-29.5,z:8 },
 mirador: { name:'Mirador de las historias',  x:17,   z:22 }
};

// Orden del recorrido guiado según el spec: plaza → casa → jardín → puerto → mirador.
export const TOUR_ORDER = ['casa','jardin','puerto','mirador'];

// Grafo de caminos transitables (puntos de giro; nunca línea recta entre edificios).
// La plaza evita la fuente (0,0) con los nodos laterales pE/pW.
export const NODES = {
 spawn:[0,30], s1:[0,24], s2:[0,12], plaza:[0,5.5], pE:[4.5,-.5], pW:[-4.5,-.5],
 e1:[7,0], e2:[14,0], jardinDoor:[20.5,-11], jardin:[22.5,-11.5],
 w1:[-10,2], w2:[-20,6], muelle:[-29.5,8],
 n1:[0,-5.5], puerta:[0,-11], patio:[0,-15.5],
 se1:[2.6,9], se2:[7.5,12.2], rampaPie:[17,13.2], rampaCima:[17,18.5], cima:[17,22]
};

export const EDGES = [
 ['spawn','s1'],['s1','s2'],['s2','plaza'],
 ['plaza','pE'],['pE','e1'],['e1','e2'],['e2','jardinDoor'],['jardinDoor','jardin'],
 ['plaza','pW'],['pW','w1'],['w1','w2'],['w2','muelle'],
 ['pE','n1'],['pW','n1'],['n1','puerta'],['puerta','patio'],
 ['plaza','se1'],['se1','se2'],['se2','rampaPie'],['rampaPie','rampaCima'],['rampaCima','cima']
];

const ADJ = {}; EDGES.forEach(([a,b])=>{(ADJ[a]??=[]).push(b);(ADJ[b]??=[]).push(a)});

// Vecinos de un nodo en el grafo de caminos. Lo lee el planificador de rutas, que necesita
// recorrer el grafo con costes (no sólo la primera ruta que encuentre).
export function vecinos(id){ return ADJ[id] ?? [] }

// Nodo de llegada del recorrido guiado para cada lugar.
// Casa → patio: la guía cruza la puerta; probar la puerta es parte del paseo.
export const LOCATION_NODE = { plaza:'plaza', casa:'patio', jardin:'jardin', puerto:'muelle', mirador:'cima', patio:'patio' };

// Aquí no se trazan rutas: este módulo es el registro de los lugares y del grafo, y no conoce
// el mundo. Quien decide por dónde se puede volar —con las colisiones delante— es
// `navigation/RoutePlanner.js`. Antes vivía aquí un camino por BFS que enlazaba al jugador con
// el nodo más cercano en línea recta, sin mirar qué había en medio.
