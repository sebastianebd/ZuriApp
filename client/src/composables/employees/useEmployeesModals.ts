import { ref, inject } from 'vue'
import { type IStaff } from '@/types/staff.types'
import { useReplacementStore } from '@/stores/replacement.store'

export function useEmployeesModals() {
  const showAlert =
    inject<(title: string, message: string, type?: 'success' | 'error' | 'info') => void>(
      'showAlert'
    )
  const replacementStore = useReplacementStore()

  // Modal Visibility
  const updateModalVisible = ref(false)
  const createModalVisible = ref(false)
  const historialModalVisible = ref(false)
  const exportModalVisible = ref(false)

  // Selection
  const usuarioSeleccionado = ref<any>(null)
  const usuarioActual = ref<any>({})
  const historialUsuario = ref<any[]>([])

  // --- MODAL ACTIONS
  async function openHistorialModal(usuario: any) {
    usuarioSeleccionado.value = usuario
    historialModalVisible.value = true
    try {
      historialUsuario.value = await replacementStore.mostrarHistorialUsuario(usuario._id)
    } catch (error) {
      console.error('Error cargando historial:', error)
      showAlert?.('Error', 'No se pudo cargar el historial del usuario.')
    }
  }

  function closeHistorialModal() {
    historialModalVisible.value = false
    usuarioSeleccionado.value = null
    historialUsuario.value = []
  }

  function openUpdateModal(usuario: IStaff) {
    usuarioActual.value = { ...usuario }
    updateModalVisible.value = true
  }

  function closeUpdateModal() {
    updateModalVisible.value = false
    usuarioActual.value = {}
  }

  function openCreateModal() {
    createModalVisible.value = true
  }

  function closeCreateModal() {
    createModalVisible.value = false
  }

  function openExportModal() {
    exportModalVisible.value = true
  }

  function closeExportModal() {
    exportModalVisible.value = false
  }

  return {
    updateModalVisible,
    createModalVisible,
    historialModalVisible,
    exportModalVisible,
    usuarioActual,
    usuarioSeleccionado,
    historialUsuario,
    openHistorialModal,
    closeHistorialModal,
    openUpdateModal,
    closeUpdateModal,
    openCreateModal,
    closeCreateModal,
    openExportModal,
    closeExportModal
  }
}
