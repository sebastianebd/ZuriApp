import { inject } from 'vue'
import { useUserStore } from '@/stores/user.store'
import { type User } from '@/types/user.types'

interface ActionsDependencies {
  loadUsers: (page?: number) => Promise<void>
  currentPage: { value: number }
  closeUpdateModal: () => void
  closeCreateModal: () => void
}

export function useEmployeesActions(deps: ActionsDependencies) {
  const userStore = useUserStore()
  const showAlert =
    inject<(title: string, message: string, type?: 'success' | 'error' | 'info') => void>(
      'showAlert'
    )

  async function handleUpdate(usuario: User) {
    await userStore.actualizarUsuario(usuario._id, usuario)
    await deps.loadUsers(deps.currentPage.value) // Reload current page
    deps.closeUpdateModal()
    showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
  }

  async function handleDelete(id: string) {
    await userStore.eliminarUsuario(id)
    await deps.loadUsers(deps.currentPage.value) // Reload current page
    showAlert?.('Eliminado', 'El usuario se ha eliminado correctamente.')
  }

  async function handleCreate(nuevoUsuario: User) {
    try {
      await userStore.crearUsuario(nuevoUsuario)
      await deps.loadUsers(1) // Go to page 1 to see new user
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
