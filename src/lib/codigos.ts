/**
 * Códigos de producto.
 *
 * El código existe para buscar y para cruzar con la lista del proveedor, pero
 * inventarlo a mano frenaba el alta: era el primer campo del formulario y
 * obligaba a decidir una convención antes de poder escribir el nombre. Acá se
 * propone uno a partir del nombre y se deja editar.
 */

/** "Aceite de girasol" → "ACEITEDEGIRASOL" (sin acentos ni símbolos). */
function soloLetras(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Propone un código libre a partir del nombre: las tres primeras letras de la
 * primera palabra con sustancia, y un número que se corre hasta no chocar.
 *
 * "Aceite de girasol" → ACE-001, y si ACE-001 ya existe, ACE-002.
 */
export function sugerirCodigo(nombre: string, existentes: string[]): string {
  // "de", "la", "x" no identifican nada: se saltean para el prefijo.
  const palabras = nombre.trim().split(/\s+/).filter((p) => soloLetras(p).length >= 3);
  const base = soloLetras(palabras[0] ?? nombre).slice(0, 3);
  if (!base) return '';

  const usados = new Set(existentes.map((c) => c.trim().toUpperCase()));
  for (let n = 1; n <= 999; n++) {
    const candidato = `${base}-${String(n).padStart(3, '0')}`;
    if (!usados.has(candidato)) return candidato;
  }
  // 999 productos con el mismo prefijo es improbable, pero no puede devolver
  // un código repetido: cae a algo único aunque sea feo.
  return `${base}-${Date.now().toString().slice(-6)}`;
}
