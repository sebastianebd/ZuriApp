import { ref, onMounted, watch, computed } from 'vue'
import { useShiftsState } from './useShiftsState'
import { useShiftsGrid } from './useShiftsGrid'
import { useShiftsExceptions } from './useShiftsExceptions'
import { useShiftsTooltip } from './useShiftsTooltip'

import { useAuthStore } from '@/stores/auth.store'
import { useServiceStore } from '@/stores/service.store'
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { useTurnAssignmentStore } from '@/stores/turn-assignment.store'
import { useShiftExceptionStore } from '@/stores/shift-exception.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'
import { useUserStore } from '@/stores/user.store'
import type { User } from '@/types/user.types'

export function useCurrentShifts(props: {
  readonly?: boolean
  historyMode?: boolean
  externalFilters?: any
}) {
  const serviceStore = useServiceStore()
  const optionStore = useOptionStore()
  const replacementStore = useReplacementStore()
  const turnAssignmentStore = useTurnAssignmentStore()
  const exceptionStore = useShiftExceptionStore()
  const turnTypeStore = useTurnTypeStore()
  const turnSiglaStore = useTurnSiglaStore()
  const userStore = useUserStore()
  const authStore = useAuthStore()

  const allUsers = ref<User[]>([])

  const hasUpdatePermission = computed(() => authStore.hasPermission('shifts.update'))
  const hasCreatePermission = computed(() => authStore.hasPermission('shifts.create'))
  const loadingExceptions = computed(() => exceptionStore.loading)
  const loadingAssignments = computed(() => turnAssignmentStore.loading)

  const state = useShiftsState()
  const grid = useShiftsGrid(state, props, allUsers)
  const exceptions = useShiftsExceptions(state, grid, props)
  const tooltip = useShiftsTooltip(grid.getShiftTooltip)

  async function loadData() {
    state.loading.value = true
    try {
      const startOfMonth = new Date(state.currentYear.value, state.currentMonth.value, 1)
      const endOfMonth = new Date(state.currentYear.value, state.currentMonth.value + 1, 0)

      await Promise.all([optionStore.mostrarOpciones(), serviceStore.fetchServices()])

      const activeServiceFilter = props.historyMode
        ? props.externalFilters?.service
        : state.selectedService.value

      const dictPromises = [
        turnTypeStore.fetchTurnTypes(true),
        turnSiglaStore.fetchSiglas(),
        userStore
          .mostrarTodos(1000)
          .then((data: User[]) => {
            allUsers.value = data
          })
          .catch((err) => console.error('[ShiftsView] Failed to load users:', err))
      ]

      if (!activeServiceFilter) {
        await Promise.all(dictPromises)
        return
      }

      await Promise.all([
        replacementStore.fetchActiveReplacementsPaginated({
          servicio: activeServiceFilter,
          limit: 1000
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

  async function handleSaveAssignment(payload: any) {
    try {
      await turnAssignmentStore.addAssignment(payload)
      state.closeModal()
      state.alertComponent.value.show('Éxito', 'Turno asignado correctamente', 'success')
      loadData()
    } catch (error) {
      console.error(error)
      state.alertComponent.value.show('Error', 'No se pudo guardar la asignación', 'error')
    }
  }

  async function handleDeleteAssignment() {
    if (!exceptions.selectedShiftData.value) return

    try {
      const idToDelete = exceptions.selectedShiftData.value.assignmentId
      await turnAssignmentStore.removeAssignment(idToDelete)

      exceptions.showModifyModal.value = false
      state.alertComponent.value.show('Éxito', 'Asignación eliminada correctamente', 'success')
      loadData()
    } catch (error) {
      console.error(error)
      state.alertComponent.value.show('Error', 'No se pudo eliminar la asignación', 'error')
    }
  }

  const activeServiceComputed = computed(() => {
    return props.historyMode ? props.externalFilters?.service : state.selectedService.value
  })

  watch(activeServiceComputed, (newService, oldService) => {
    if (newService !== oldService) {
      loadData()
    }
  })

  // We should also reload exceptions when the month changes
  watch(state.currentDate, () => {
    loadData()
  })

  onMounted(() => {
    loadData()
  })

  const selectedServiceName = computed(() => {
    // In history mode, rely on external filters passed via props, otherwise local state
    const currentId = props.historyMode && props.externalFilters?.service !== undefined
      ? props.externalFilters.service
      : state.selectedService.value
    return serviceStore.getServiceName(currentId)
  })

  return {
    ...state,
    ...grid,
    ...exceptions,
    loadData,
    handleSaveAssignment,
    handleDeleteAssignment,
    hasUpdatePermission,
    hasCreatePermission,
    loadingExceptions,
    loadingAssignments,
    allUsers,
    selectedServiceName,
    ...tooltip
  }
}
