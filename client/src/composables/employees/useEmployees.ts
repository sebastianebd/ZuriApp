import { useEmployeesState } from './useEmployeesState'
import { useEmployeesModals } from './useEmployeesModals'
import { useEmployeesActions } from './useEmployeesActions'

export function useUsers() {
  const state = useEmployeesState()
  const modals = useEmployeesModals()
  const actions = useEmployeesActions({
    loadUsers: state.loadUsers,
    currentPage: state.currentPage,
    closeUpdateModal: modals.closeUpdateModal,
    closeCreateModal: modals.closeCreateModal
  })

  return {
    ...state,
    ...modals,
    ...actions
  }
}
