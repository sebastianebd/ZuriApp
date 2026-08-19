export function getActionClass(action: string) {
  switch (action) {
    case 'CREAR':
      return 'bg-success'
    case 'MODIFICAR':
      return 'bg-warning'
    case 'ELIMINAR':
    case 'ANULAR':
      return 'bg-danger'
    case 'FINALIZAR':
      return 'bg-info'
    default:
      return 'bg-primary'
  }
}

/** Retorna la clase de color CSS o código HEX según el estado de un reemplazo.
 *  Usado en: ReplacementCalendarView (eventos del calendario). */
export function getColorByStatus(status: string) {
  switch (status) {
    case 'EN CURSO':
      return '#10b981'
    case 'PENDIENTE':
      return '#f59e0b'
    case 'FINALIZADO':
      return '#64748b'
    case 'ANULADO':
      return '#ef4444'
    default:
      return '#3b82f6'
  }
}

/** Retorna el nombre completo del creador de un reemplazo */
export const getCreatorName = (reemplazo: any): string => {
  const creator = reemplazo.creado_por
  if (typeof creator !== 'string' && creator) {
    if ('firstName' in creator && 'lastName' in creator) {
      return `${creator.firstName} ${creator.lastName}`
    }
  }
  return String(creator) || 'Usuario no asignado'
}
