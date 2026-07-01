import type { User } from './user.types'

export interface TurnAssignment {
  _id: string
  user_id: string | User
  service: string
  turn_type: string
  start_date: string | Date
  end_date?: string | Date
  snapshot_secuencia?: Array<{
    dia: number
    turno_entrada?: string
    turno_salida?: string
    es_libre: boolean
    sigla: string
    color?: string
  }>
  createdAt?: string
  updatedAt?: string
}


