import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useShiftExceptionStore } from '@/stores/shift-exception.store'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'
import { formatTitleCase } from '@/utils/text-formatters'
import type { GridRow, ShiftResult } from './useShiftsGrid'

export function useShiftsExceptions(state: any, grid: any, props: { readonly?: boolean }) {
  const authStore = useAuthStore()
  const exceptionStore = useShiftExceptionStore()
  const turnSiglaStore = useTurnSiglaStore()

  const showModifyModal = ref(false)
  const selectedShiftData = ref<{
    assignmentId: string
    assignmentName: string
    date: Date
    currentShift: ShiftResult | null
    hasException: boolean
  } | null>(null)

  const recentlyModifiedCell = ref<{
    assignmentId: string
    date: string
  } | null>(null)

  function handleCellClick(item: GridRow, date: Date) {
    if (props.readonly) return
    if (!authStore.hasPermission('shifts.update')) return
    if (!grid.isEditableDate(date)) return

    const shift = item.getShift(date)
    if (!shift) return

    const exception = exceptionStore.findException(shift.assignmentId || item._id, date)

    selectedShiftData.value = {
      assignmentId: shift.assignmentId || item._id,
      assignmentName: shift.assignmentName
        ? formatTitleCase(shift.assignmentName)
        : formatTitleCase(`${item.nombre} ${item.apellido}`),
      date: date,
      currentShift: shift,
      hasException: !!exception
    }

    showModifyModal.value = true
  }

  async function handleSaveException(data: { override_type: string }) {
    if (!selectedShiftData.value) return

    if (!authStore.user || !authStore.user._id) {
      state.alertComponent.value.show('Error', 'Debe iniciar sesión para realizar cambios', 'error')
      return
    }

    try {
      await exceptionStore.createException({
        assignment_id: selectedShiftData.value.assignmentId,
        date: selectedShiftData.value.date.toISOString(),
        original_type: turnSiglaStore.mapSiglaToNombre(
          selectedShiftData.value.currentShift?.sigla || 'X'
        ),
        override_type: data.override_type,
        created_by: authStore.user._id
      })

      recentlyModifiedCell.value = {
        assignmentId: selectedShiftData.value.assignmentId,
        date: selectedShiftData.value.date.toISOString().split('T')[0]
      }

      setTimeout(() => {
        recentlyModifiedCell.value = null
      }, 2000)

      showModifyModal.value = false
      state.alertComponent.value.show('Éxito', 'Turno modificado correctamente', 'success')
      // loadData is generally handled by the grid if needed, or by reactive store
    } catch (error) {
      console.error(error)
      state.alertComponent.value.show('Error', 'No se pudo modificar el turno', 'error')
    }
  }

  async function handleRestorePattern() {
    if (!selectedShiftData.value) return

    try {
      const exception = exceptionStore.findException(
        selectedShiftData.value.assignmentId,
        selectedShiftData.value.date
      )

      if (exception) {
        await exceptionStore.deleteException(exception._id)
        showModifyModal.value = false
        state.alertComponent.value.show('Éxito', 'Patrón restaurado correctamente', 'success')
      }
    } catch (error) {
      console.error(error)
      state.alertComponent.value.show('Error', 'No se pudo restaurar el patrón', 'error')
    }
  }

  function isRecentlyModified(assignmentId: string, date: Date): boolean {
    if (!recentlyModifiedCell.value) return false
    const dateStr = date.toISOString().split('T')[0]
    return (
      recentlyModifiedCell.value.assignmentId === assignmentId &&
      recentlyModifiedCell.value.date === dateStr
    )
  }

  function hasException(assignmentId: string, date: Date): boolean {
    return !!exceptionStore.findException(assignmentId, date)
  }

  return {
    showModifyModal,
    selectedShiftData,
    recentlyModifiedCell,
    handleCellClick,
    handleSaveException,
    handleRestorePattern,
    isRecentlyModified,
    hasException
  }
}
