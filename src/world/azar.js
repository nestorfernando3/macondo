// Generador pseudoaleatorio con semilla, compartido por el vocabulario de piezas (kit),
// el vocabulario floral (flora) y la capa de vida: el pueblo debe verse igual en cada
// carga. Vive aparte para que flora.js pueda pedirlo sin cerrar un ciclo con kit.js.
export function secuencia(semilla = 1) {
  let s = Math.max(1, Math.floor(semilla * 7919)) % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
