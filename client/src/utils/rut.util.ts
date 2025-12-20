/**
 * Formatea un RUT chileno en tiempo real añadiendo puntos y guión.
 * Comportamiento:
 * - Elimina caracteres no válidos.
 * - Añade puntos cada 3 dígitos.
 * - Añade guión antes del dígito verificador.
 *
 * @param value RUT sin formato o parcialmente formateado
 * @returns RUT formateado (ej: 12.345.678-9)
 */
export function formatRut(value: string): string {
  // Limpiar: solo números y K/k. Limitado a 9 caracteres (8 cuerpo + 1 DV)
  let val = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (val.length > 9) val = val.slice(0, 9)

  if (val.length < 2) {
    return val
  }

  // El último es el DV, el resto es el cuerpo
  const cuerpo = val.slice(0, -1)
  const dv = val.slice(-1)

  // Formatear cuerpo: puntos cada 3 dígitos de derecha a izquierda
  const cuerpoFormateado = cuerpo
    .split('')
    .reverse()
    .join('')
    .replace(/(\d{3})(?!$)/g, '$1.')
    .split('')
    .reverse()
    .join('')

  return `${cuerpoFormateado}-${dv}`
}

/**
 * Limpia el RUT para dejarlo en formato 12345678-9 (sin puntos, con guión)
 * Ideal para guardar en BD.
 */
export function cleanRutForStorage(value: string): string {
  let val = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (val.length < 2) return val

  const cuerpo = val.slice(0, -1)
  const dv = val.slice(-1)
  return `${cuerpo}-${dv}`
}
