export interface PublicUser {
  _id: string
  nombre: string
  apellido: string
}

export interface PublicShiftItem {
  sigla: string
  hours: number
  color: string
  startTime: string | null
  endTime: string | null
}

export interface PublicDayEntry {
  date: string
  items: PublicShiftItem[]
}

export interface PublicShiftsResponse {
  IStaff: PublicUser
  timeline: PublicDayEntry[]
}
