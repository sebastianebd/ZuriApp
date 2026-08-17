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
  const showAlert = inject<(title: string, message: string, type?: 'success' | 'error' | 'info', duration?: number) => void>('showAlert')
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
      showAlert?.('Error', 'No se pudo identificar al usuario creador.', 'error')
    }
  }

  // --- ERROR HANDLER ---
  const handleApiError = (error: any, defaultMsg: string) => {
    const status = error.status || error.response?.status
    const message = error.message || error.response?.data?.message || defaultMsg

    if (status === 409) {
      showAlert?.('Conflicto (409)', message, 'error')
    } else {
      showAlert?.('Error', message, 'error')
    }
  }

  // --- CRUD ACTIONS ---
  const handleSustitucion = () => {
    modals.handleSustitucion()
  }

  const confirmarSustitucion = async () => {
    if (!modals.nuevoEntranteSustitucion.value.rut_entrante) {
      showAlert?.('Error', 'Debe asignar un nuevo funcionario para la sustitución.', 'error')
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
    } catch (error: any) {
      handleApiError(error, 'Hubo un error al procesar la sustitución.')
    }
  }

  const guardarNuevoReemplazo = async (nuevoReemplazo: ReplacementRegistration) => {
    try {
      await replacementStore.crearReemplazo(nuevoReemplazo)
      modals.closeCreateModal()
      showAlert?.('Guardado', 'El registro se ha guardado correctamente.')
    } catch (error: any) {
      handleApiError(error, 'Hubo un error al guardar el reemplazo.')
    }
  }

  const handleFinalizar = async (id: string) => {
    try {
      const today = new Date()
      const fechaTerminoUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)).toISOString()

      await replacementStore.finalizarReemplazo(id, fechaTerminoUtc)
      showAlert?.('Finalizado', 'El registro se ha finalizado correctamente.')
    } catch (error: any) {
      handleApiError(error, 'Hubo un error al finalizar el reemplazo.')
    }
  }

  const handleUpdate = async () => {
    if (modals.registroActual.value._id) {
      try {
        const payload = { ...modals.registroActual.value } as any

        const toUTC = (dateStr: string) => {
          if (!dateStr) return dateStr
          const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number)
          return new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString()
        }

        if (payload.fecha_inicio) payload.fecha_inicio = toUTC(payload.fecha_inicio)
        if (payload.fecha_termino) payload.fecha_termino = toUTC(payload.fecha_termino)

        // Validate IDs
        if (typeof payload.id_saliente === 'object' && payload.id_saliente?._id) payload.id_saliente = payload.id_saliente._id
        if (typeof payload.id_entrante === 'object' && payload.id_entrante?._id) payload.id_entrante = payload.id_entrante._id
        if (typeof payload.servicio === 'object' && payload.servicio?._id) payload.servicio = payload.servicio._id

        await replacementStore.actualizarReemplazo(
          modals.registroActual.value._id,
          payload as ReplacementRegistration
        )
        modals.closeUpdateModal()
        showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
      } catch (error: any) {
        handleApiError(error, 'Hubo un error al actualizar el reemplazo.')
      }
    }
  }

  const handleAnular = async (id: string) => {
    try {
      await replacementStore.anularReemplazo(id)
      showAlert?.('Anulado', 'El registro se ha anulado correctamente.')
    } catch (error: any) {
      handleApiError(error, 'Hubo un error al anular el reemplazo.')
    }
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
