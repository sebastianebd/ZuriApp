import { ref, computed } from 'vue'

interface DataPickerProps {
  fechasBloqueadas: string[] | null | undefined
}

export function useDatePicker(props: DataPickerProps) {

  // 2. Fechas Deshabilitadas Procesadas
const isDisabled = computed(() => {
  if (!props.fechasBloqueadas) return []

  return props.fechasBloqueadas.map((f) => {
    const fecha = `${f}T12:00:00`
    console.log(fecha)
    return fecha
  })
})

  const popoverConfig = ref({
    visibility: 'focus' as const,
    placement: 'right' as const,
    hideDelay: 50
  })

  const dateAttributes = computed(() => {
    return [
      {
        key: 'disabled-dates',
        highlight: {
          color: 'red',
          fillMode: 'light'
        },
        dates: isDisabled.value,
        exclude: {
          weekdays: []
        }
      }
    ]
  })

  return {
    popoverConfig,
    dateAttributes,
    isDisabled
  }
}
