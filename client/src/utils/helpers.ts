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
