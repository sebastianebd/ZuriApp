import { ref, computed } from 'vue'
import type { RegisterDataReemplazo, SustitucionPayload } from '@/types/models'

type ReplacementRecord = Partial<RegisterDataReemplazo>

// --- ESTADOS REACTIVOS ---
const updateModalVisible = ref(false)
const createModalVisible = ref(false)
const substituteModalVisible = ref(false)

const registroActual = ref<ReplacementRecord>({})

const getTodayLocal = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const registroNuevo = ref<ReplacementRecord>({
  tipo_cargo: '',
  fecha_inicio: getTodayLocal(),
  fecha_termino: getTodayLocal()
})

const fechaCorteSustitucion = ref('')
const nuevoEntranteSustitucion = ref<ReplacementRecord>({})

const cargoDeFiltrado = computed(() => {
  return undefined
})

const openUpdateModal = (reemplazo: RegisterDataReemplazo) => {
  updateModalVisible.value = true

  const { fecha_inicio, fecha_termino, ...resto } = reemplazo

  registroActual.value = {
    ...resto,
    fecha_inicio: String(fecha_inicio).slice(0, 10),
    fecha_termino: String(fecha_termino).slice(0, 10)
  }
}
const closeUpdateModal = () => {
  updateModalVisible.value = false
  registroActual.value = {}
}

const openCreateModal = (userLogedId: string) => {
  registroNuevo.value = {
    ...registroNuevo.value,
    creado_por: userLogedId
  }
  createModalVisible.value = true
}

const closeCreateModal = () => {
  createModalVisible.value = false
  registroNuevo.value = {
    rut_entrante: '',
    rut_saliente: '',
    nombre_entrante: '',
    nombre_saliente: '',
    apellido_entrante: '',
    apellido_saliente: '',
    tipo_cargo: '',
    servicio: '',
    tipo_turno: ''
  }
}

const handleSustitucion = () => {
  fechaCorteSustitucion.value = registroActual.value.fecha_termino || ''
  nuevoEntranteSustitucion.value = {}
  substituteModalVisible.value = true
}
const closeSubstituteModal = () => {
  substituteModalVisible.value = false
  closeUpdateModal()
  fechaCorteSustitucion.value = ''
  nuevoEntranteSustitucion.value = {}
}

const createSustitucionPayload = (): SustitucionPayload => {
  if (!registroActual.value._id || !fechaCorteSustitucion.value) {
    throw new Error('Datos de sustitución incompletos.')
  }

  return {
    id_registro_a: registroActual.value._id!,
    fecha_corte_a: fechaCorteSustitucion.value,
    nuevo_entrante: nuevoEntranteSustitucion.value,
    datos_base_evento: {
      id_evento_principal: registroActual.value.id_negocio!,
      tipo_turno: registroActual.value.tipo_turno!,
      servicio: registroActual.value.servicio!,
      id_saliente: registroActual.value.id_saliente!,
      rut_saliente: registroActual.value.rut_saliente!,
      nombre_saliente: registroActual.value.nombre_saliente!,
      apellido_saliente: registroActual.value.apellido_saliente!,
      tipo_cargo: registroActual.value.tipo_cargo!,
      fecha_termino_original: registroActual.value.fecha_termino!
    }
  }
}

export function useReplacementModals() {
  return {
    updateModalVisible,
    createModalVisible,
    substituteModalVisible,
    registroActual,
    registroNuevo,
    fechaCorteSustitucion,
    nuevoEntranteSustitucion,
    cargoDeFiltrado,
    openUpdateModal,
    closeUpdateModal,
    openCreateModal,
    closeCreateModal,
    handleSustitucion,
    closeSubstituteModal,
    createSustitucionPayload
  }
}
