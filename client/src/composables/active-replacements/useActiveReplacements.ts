import { onMounted, onUnmounted, inject } from 'vue'
import { useActiveReplacementsState } from './useActiveReplacementsState'
import { useReplacementModals } from './useReplacementModals'
import { useActiveReplacementsActions } from './useActiveReplacementsActions'
import { useReplacementStore } from '@/stores/replacement.store'
import socket from '@/plugins/socket'

export function useReplacements() {
  const replacementStore = useReplacementStore()
  const showAlert = inject<(title: string, message: string) => void>('showAlert')

  const modals = useReplacementModals()
  const state = useActiveReplacementsState({
    createModalVisible: modals.createModalVisible,
    updateModalVisible: modals.updateModalVisible,
    registroNuevo: modals.registroNuevo,
    registroActual: modals.registroActual
  })

  const actions = useActiveReplacementsActions({ modals })

  // --- WebSocket Listener (Ping Ciego) ---
  const handleSocketUpdate = async (payload: { serviceId?: string; action?: string; replacementId?: string }) => {
    // Lost Update Prevention
    if (modals.updateModalVisible.value && payload.replacementId && String(modals.registroActual.value._id) === String(payload.replacementId)) {
      modals.closeUpdateModal()
      showAlert?.('Atención', 'Este registro acaba de ser modificado por otro administrador. Se recargará la tabla para evitar inconsistencias.')
    }

    // Ping Ciego Reload
    const currentServiceFilter = replacementStore.filtroServicio
    if (!currentServiceFilter || currentServiceFilter === payload.serviceId || !payload.serviceId) {
      await replacementStore.fetchActiveReplacementsPaginated({
        page: replacementStore.currentPage,
        servicio: currentServiceFilter
      })
    }
  }

  onMounted(() => {
    if (!socket.connected) socket.connect()
    socket.on('replacements:update', handleSocketUpdate)
  })

  onUnmounted(() => {
    socket.off('replacements:update', handleSocketUpdate)
    replacementStore.clearState()
  })

  return {
    replacementStore,
    ...state,
    ...modals,
    ...actions
  }
}
