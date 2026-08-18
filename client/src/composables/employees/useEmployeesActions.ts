import { inject } from 'vue'
import { useStaffStore } from '@/stores/staff.store'
import { type IStaff, type StaffRegistration } from '@/types/staff.types'

interface ActionsDependencies {
  loadUsers: (page?: number) => Promise<void>
  currentPage: { value: number }
  closeUpdateModal: () => void
  closeCreateModal: () => void
}

export function useEmployeesActions(deps: ActionsDependencies) {
  const staffStore = useStaffStore()
  const showAlert =
    inject<(title: string, message: string, type?: 'success' | 'error' | 'info') => void>(
      'showAlert'
    )

  async function handleUpdate(usuario: IStaff) {
    await staffStore.updateStaff(usuario._id, usuario as unknown as StaffRegistration)
    await deps.loadUsers(deps.currentPage.value) // Reload current page
    deps.closeUpdateModal()
    showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
  }

  async function handleDelete(id: string) {
    await staffStore.deleteStaff(id)
    await deps.loadUsers(deps.currentPage.value) // Reload current page
    showAlert?.('Eliminado', 'El usuario se ha eliminado correctamente.')
  }

  async function handleCreate(nuevoUsuario: StaffRegistration) {
    try {
      await staffStore.createStaff(nuevoUsuario)
      await deps.loadUsers(1) // Go to page 1 to see new IStaff
      deps.currentPage.value = 1
      deps.closeCreateModal()
      showAlert?.('Guardado', 'El usuario se ha creado correctamente.')
    } catch (error: any) {
      const message = error.mensaje || error.response?.data?.mensaje || 'Error al crear usuario.'
      showAlert?.('Error', message, 'error')
    }
  }

  return {
    handleUpdate,
    handleDelete,
    handleCreate
  }
}
