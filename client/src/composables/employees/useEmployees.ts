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

  // Retornamos todos los estados y acciones como una fachada unificada
  // de esta manera la vista EmployeesView no necesita importar 3 archivos distintos.
  return {
    ...state,
    ...modals,
    ...actions
  }
}
