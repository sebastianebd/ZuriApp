import { onMounted, watch, computed } from 'vue'
import { useShiftsState } from './useShiftsState'
import { useShiftsGrid } from './useShiftsGrid'
import { useShiftsExceptions } from './useShiftsExceptions'
import { useShiftsTooltip } from './useShiftsTooltip'
import { useShiftsActions } from './useShiftsActions'

import { useAuthStore } from '@/stores/auth.store'
import { useServiceStore } from '@/stores/service.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { useTurnAssignmentStore } from '@/stores/turn-assignment.store'
import { useShiftExceptionStore } from '@/stores/shift-exception.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'
import { useAlertStore } from '@/stores/alert.store'


export function useCurrentShifts(props: {
  readonly?: boolean
  historyMode?: boolean
  externalFilters?: any
}) {
  const alertStore = useAlertStore()
  const serviceStore = useServiceStore()
  const replacementStore = useReplacementStore()
  const turnAssignmentStore = useTurnAssignmentStore()
  const exceptionStore = useShiftExceptionStore()
  const turnTypeStore = useTurnTypeStore()
  const turnSiglaStore = useTurnSiglaStore()
  const authStore = useAuthStore()

  const hasUpdatePermission = computed(() => authStore.hasPermission('shifts.update'))
  const hasCreatePermission = computed(() => authStore.hasPermission('shifts.create'))
  const loadingExceptions = computed(() => exceptionStore.loading)
  const loadingAssignments = computed(() => turnAssignmentStore.loading)

  const state = useShiftsState(props)
  const grid = useShiftsGrid(state, props)
  const exceptions = useShiftsExceptions(state, grid, props)
  const tooltip = useShiftsTooltip(grid.getShiftTooltip)
  const actions = useShiftsActions(turnAssignmentStore, state, exceptions, loadData)

  async function loadData() {
    state.loading.value = true
    try {
      const startOfMonth = new Date(state.currentYear.value, state.currentMonth.value, 1)
      const endOfMonth = new Date(state.currentYear.value, state.currentMonth.value + 1, 0)

      await serviceStore.fetchServices()

      // Validate that the restored service still exists in fetched services
      if (state.selectedService.value && !props.historyMode && (serviceStore.services?.length || 0) > 0) {
        const serviceExists = serviceStore.services.some(
          (s: any) => s._id === state.selectedService.value
        )
        if (!serviceExists) {
          state.selectedService.value = null
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.removeItem('zuriapp_shifts_selected_service')
            } catch {}
          }
        }
      }

      const activeServiceFilter = props.historyMode
        ? props.externalFilters?.service
        : state.selectedService.value

      const dictPromises = [
        turnTypeStore.fetchTurnTypes(true),
        turnSiglaStore.fetchSiglas()
      ]

      if (!activeServiceFilter) {
        await Promise.all(dictPromises)
        return
      }

      await Promise.all([
        replacementStore.fetchGridReplacements({
          servicio: activeServiceFilter,
          fechaInicio: startOfMonth.toISOString().split('T')[0],
          fechaFin: endOfMonth.toISOString().split('T')[0]
        }),
        turnAssignmentStore.loadAssignments(),
        exceptionStore.loadExceptions(
          undefined,
          startOfMonth.toISOString(),
          endOfMonth.toISOString()
        ),
        ...dictPromises
      ])
    } finally {
      state.loading.value = false
    }
  }



  const activeServiceComputed = computed(() => {
    return props.historyMode ? props.externalFilters?.service : state.selectedService.value
  })

  watch(activeServiceComputed, (newService, oldService) => {
    if (newService !== oldService) {
      alertStore.fetchAlerts(newService || undefined)
      loadData()
    }
  })

  // We should also reload exceptions when the month changes
  watch(state.currentDate, () => {
    loadData()
  })

  onMounted(() => {
    alertStore.fetchAlerts(activeServiceComputed.value || undefined)
    loadData()
  })

  const selectedServiceName = computed(() => {
    // In history mode, rely on external filters passed via props, otherwise local state
    const currentId = props.historyMode && props.externalFilters?.service !== undefined
      ? props.externalFilters.service
      : state.selectedService.value
    return serviceStore.getServiceName(currentId)
  })

  const turnSiglas = computed(() => {
    return turnSiglaStore.siglas.filter((s) => s.activo !== false)
  })

  return {
    ...state,
    ...grid,
    ...exceptions,
    ...actions,
    loadData,
    hasUpdatePermission,
    hasCreatePermission,
    loadingExceptions,
    loadingAssignments,
    selectedServiceName,
    turnSiglas,
    exceptionStore,
    serviceStore,
    ...tooltip
  }
}
