import { ref } from 'vue'

export function useShiftsTooltip(getShiftTooltip: (item: any, date: Date) => string | null) {
  const tooltipState = ref({
    show: false,
    content: '',
    style: {}
  })

  let tooltipTimer: number | null = null

  function showTooltip(event: MouseEvent, item: any, date: Date) {
    if (tooltipTimer) clearTimeout(tooltipTimer)

    const content = getShiftTooltip(item, date)
    if (!content) {
      tooltipState.value.show = false
      return
    }

    tooltipState.value.content = content

    tooltipTimer = window.setTimeout(() => {
      const x = event.clientX
      const y = event.clientY - 10

      tooltipState.value.style = {
        left: `${x}px`,
        top: `${y}px`
      }
      tooltipState.value.show = true
    }, 300)
  }

  function hideTooltip() {
    if (tooltipTimer) clearTimeout(tooltipTimer)
    tooltipState.value.show = false
  }

  return {
    tooltipState,
    showTooltip,
    hideTooltip
  }
}
