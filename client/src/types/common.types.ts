export interface OptionsState {
  servicios: string[]
  tiposTurno: string[]
  tipoCargo: string[]
  habilitado: string[]
}

export interface SelectOption {
  label: string
  value: string | number | boolean
}
