import { ref, computed } from 'vue'

interface DataPickerProps {
  fechasBloqueadas: string[] | null | undefined
}

export function useDatePicker(props: DataPickerProps) {
  // Convertir strings a objetos Date para disabled-dates
  const isDisabled = computed(() => {
    if (!props.fechasBloqueadas || props.fechasBloqueadas.length === 0) {
      return [] // ← CAMBIO CLAVE: undefined en lugar de []
    }

    return props.fechasBloqueadas
      .map((f) => {
        const [year, month, day] = f.split('-').map(Number)
        const date = new Date(year, month - 1, day) // Fecha local sin 'T00:00:00'
        return date
      })
      .filter((d) => !isNaN(d.getTime()))
  })

  const popoverConfig = ref({
    visibility: 'click' as const,
    placement: 'right' as const,
    hideDelay: 50
  })

  const dateAttributes = computed(() => {
    const dates = isDisabled.value
    if (!dates.length) return []
    return [
      {
        highlight: {
          color: 'red',
          fillMode: 'light'
        },
        dates: [...isDisabled.value]
      }
    ]
  })

  return {
    popoverConfig,
    isDisabled,
    dateAttributes
  }
}
