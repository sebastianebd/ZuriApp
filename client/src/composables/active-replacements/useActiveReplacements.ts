import { useActiveReplacementsState } from './useActiveReplacementsState'
import { useReplacementModals } from './useReplacementModals'
import { useActiveReplacementsActions } from './useActiveReplacementsActions'
import { useReplacementStore } from '@/stores/replacement.store'

export function useReplacements() {
  const replacementStore = useReplacementStore()

  const modals = useReplacementModals()
  const state = useActiveReplacementsState({
    createModalVisible: modals.createModalVisible,
    updateModalVisible: modals.updateModalVisible,
    registroNuevo: modals.registroNuevo,
    registroActual: modals.registroActual
  })

  const actions = useActiveReplacementsActions({ modals })

  return {
    replacementStore,
    ...state,
    ...modals,
    ...actions
  }
}
