export interface User {
  _id: string
  rut: string
  nombre: string
  apellido: string
  fecha_nac: Date
  direccion: string
  telefono: string
  email: string
  ciudad: string
  habilitado: string
  roleId: any
  positionId: any
  tipo_cargo?: string
  servicio?: string
  tipo_contrato?: string
  nivel?: number
  permisos?: string[]
}

export interface UserRegistration {
  rut: string
  nombre: string
  apellido: string
  fecha_nac: Date
  direccion: string
  telefono: string
  email: string
  ciudad: string
  roleId: any
  positionId: any
  tipo_cargo?: string
  tipo_contrato?: string
  habilitado?: string
  servicio?: string
}
