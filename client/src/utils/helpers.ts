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
      return '#10b981' // Esmerald 500
    case 'PENDIENTE':
      return '#f59e0b' // Amber 500
    case 'FINALIZADO':
      return '#64748b' // Slate 500
    case 'ANULADO':
      return '#ef4444' // Red 500
    default:
      return '#3b82f6' // Blue 500
  }
}
