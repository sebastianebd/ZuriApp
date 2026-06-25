export interface JobRole {
  _id?: string
  nombre: string
  codigo?: string
  nivel?: number
  permisos?: string[]
  descripcion?: string
  activo: boolean
  createdAt?: string
  updatedAt?: string
}
