import { inject, computed } from 'vue'
import { useReplacementStore } from '@/stores/replacement.store'
import { useAuthStore } from '@/stores/auth.store'
import { type ReplacementRegistration } from '@/types/replacement.types'

interface ActionsDependencies {
  modals: any
}

export function useActiveReplacementsActions(deps: ActionsDependencies) {
  const replacementStore = useReplacementStore()
  const authStore = useAuthStore()
  const showAlert = inject<(title: string, message: string) => void>('showAlert')
  const userLoged = computed(() => authStore.userDetail)

  const { modals } = deps

  // --- MODAL WRAPPERS  ---
  const initUpdateReplacement = (reemplazo: ReplacementRegistration) => {
    const reemplazoConCargo = { ...reemplazo, tipo_cargo: reemplazo.tipo_cargo || '' }
    modals.openUpdateModal(reemplazoConCargo)
  }

  const initCreateReplacement = () => {
    if (userLoged.value && userLoged.value._id) {
      modals.openCreateModal(userLoged.value._id)
    } else {
      showAlert?.('Error', 'No se pudo identificar al usuario creador.')
    }
  }

  // --- CRUD ACTIONS ---
  const handleSustitucion = () => {
    modals.handleSustitucion()
  }

  const confirmarSustitucion = async () => {
    if (!modals.nuevoEntranteSustitucion.value.rut_entrante) {
      showAlert?.('Error', 'Debe asignar un nuevo funcionario para la sustitución.')
      return
    }
    try {
      const datosSustitucion = modals.createSustitucionPayload()
      await replacementStore.procesarSustitucion(datosSustitucion)
      modals.closeSubstituteModal()
      showAlert?.(
        'Sustitución Exitosa',
        'El reemplazo fue segmentado y el nuevo funcionario asignado.'
      )
    } catch (error) {
      showAlert?.('Error', 'Hubo un error al procesar la sustitución.')
    }
  }

  const guardarNuevoReemplazo = async (nuevoReemplazo: ReplacementRegistration) => {
    await replacementStore.crearReemplazo(nuevoReemplazo)
    modals.closeCreateModal()
    showAlert?.('Guardado', 'El registro se ha guardado correctamente.')
  }

  const handleFinalizar = async (id: string) => {
    await replacementStore.finalizarReemplazo(id)
    showAlert?.('Finalizado', 'El registro se ha finalizado correctamente.')
  }

  const handleUpdate = async () => {
    if (modals.registroActual.value._id) {
      await replacementStore.actualizarReemplazo(
        modals.registroActual.value._id,
        modals.registroActual.value as ReplacementRegistration
      )
    }
    modals.closeUpdateModal()
    showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
  }

  const handleAnular = async (id: string) => {
    await replacementStore.anularReemplazo(id)
    showAlert?.('Anulado', 'El registro se ha anulado correctamente.')
  }

  return {
    initUpdateReplacement,
    initCreateReplacement,
    handleSustitucion,
    confirmarSustitucion,
    guardarNuevoReemplazo,
    handleFinalizar,
    handleUpdate,
    handleAnular
  }
}
