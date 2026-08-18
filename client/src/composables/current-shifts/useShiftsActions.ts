export function useShiftsActions(
  turnAssignmentStore: any,
  state: any,
  exceptions: any,
  loadData: () => Promise<void>
) {
  async function handleSaveAssignment(payload: any) {
    try {
      await turnAssignmentStore.addAssignment(payload)
      state.closeModal()
      state.alertComponent.value.show('Éxito', 'Turno asignado correctamente', 'success')
      loadData()
    } catch (error: any) {
      console.error(error)
      const errorMessage = error.response?.data?.message || 'No se pudo guardar la asignación'
      state.alertComponent.value.show('Error', errorMessage, 'error')
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

  return {
    handleSaveAssignment,
    handleDeleteAssignment
  }
}
