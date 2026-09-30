<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      v-if="visible"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      style="background-color: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px)"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered modal-custom-width" role="document">
        <div class="modal-content vanguard-modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
          <!-- HEADER VANGUARDISTA -->
          <div class="modal-header vanguard-modal-header p-4 border-bottom d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <div class="modal-icon-box shadow-sm">
                <i class="bi bi-arrow-left-right text-primary fs-5"></i>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h5 class="modal-title fw-bold text-dark mb-0 modal-title-custom">
                    Nuevo Reemplazo Directo
                  </h5>
                  <span class="badge-direct-mode">
                    <span class="pulse-dot-blue"></span> Asignación Bilateral
                  </span>
                </div>
                <p class="text-secondary small mb-0 mt-1">
                  Asigna una cobertura directa de turno entre el titular ausente y su reemplazante.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="btn-close-modal"
              @click="$emit('cerrar')"
              aria-label="Cerrar modal"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- BODY CON DOBLE BISEL -->
          <div class="modal-body p-4 bg-surface">
            <!-- ALERTA DE VALIDACIÓN -->
            <div
              v-if="validationError"
              class="alert alert-danger border-0 shadow-sm rounded-3 d-flex align-items-center mb-3 animate-shake"
            >
              <i class="bi bi-exclamation-triangle-fill fs-5 me-2 flex-shrink-0 text-danger"></i>
              <div class="small fw-medium">{{ validationError }}</div>
            </div>

            <!-- SECCIÓN 1: TRASPASO DE TURNO (Saliente -> Entrante) -->
            <div class="vanguard-section-card mb-3 p-3 p-md-4">
              <!-- Encabezado de Sección -->
              <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div class="d-flex align-items-center gap-2">
                  <span class="section-indicator bg-primary"></span>
                  <h6 class="fw-bold text-dark mb-0 section-heading">Traspaso de Turno</h6>
                </div>
                <span class="badge bg-light text-primary border x-small">
                  Transacción Directa
                </span>
              </div>

              <!-- Grilla de Asignación Balanceada -->
              <div class="row g-3 align-items-stretch position-relative">
                <!-- COLUMNA FUNCIONARIO SALIENTE -->
                <div class="col-12 col-md-6">
                  <div class="staff-role-card staff-outgoing h-100 p-3 rounded-3 d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="role-pill pill-outgoing">
                          <i class="bi bi-person-dash me-1"></i> Titular Saliente
                        </span>
                      </div>

                      <!-- Buscador Saliente -->
                      <div class="my-2">
                        <label class="form-label staff-field-label mb-1">
                          Buscar Funcionario Titular <span class="text-danger">*</span>
                        </label>
                        <v-select
                          v-model="selectedSaliente"
                          :options="salienteOptions"
                          :filterable="false"
                          :loading="isSearchingSaliente"
                          @search="searchSaliente"
                          label="displayName"
                          placeholder="Escribe RUT o nombre..."
                          class="custom-v-select staff-v-select"
                        >
                          <template #option="option">
                            <div class="IStaff-option py-1">
                              <div class="d-flex justify-content-between align-items-center">
                                <div>
                                  <span class="fw-bold text-dark font-monospace x-small">{{ option.rut }}</span>
                                  <span class="text-secondary ms-2 small">{{ option.firstName }} {{ option.lastName }}</span>
                                </div>
                                <span class="badge bg-light text-primary border x-small">
                                  {{ option.positionId?.name || 'Sin Cargo' }}
                                </span>
                              </div>
                            </div>
                          </template>
                          <template #selected-option="option">
                            <div class="d-flex align-items-center py-1">
                              <div class="avatar-squircle avatar-outgoing-xs shadow-xs me-2">
                                {{ getInitials(option.firstName + ' ' + option.lastName) }}
                              </div>
                              <div style="overflow: hidden">
                                <div class="fw-bold text-dark text-truncate" style="font-size: 0.8rem">
                                  {{ option.firstName }} {{ option.lastName }}
                                </div>
                                <div class="text-secondary x-small font-monospace text-truncate">
                                  {{ option.rut }}
                                </div>
                              </div>
                            </div>
                          </template>
                          <template #no-options="{ search }">
                            <div class="text-center text-muted py-2 small">
                              <i class="bi bi-search me-1"></i>
                              <span v-if="!search">Escribe al menos 2 caracteres...</span>
                              <span v-else>No se encontraron resultados</span>
                            </div>
                          </template>
                        </v-select>
                      </div>
                    </div>

                    <!-- Causal de Ausencia -->
                    <div class="mt-3 pt-2 border-top-dashed">
                      <label
                        class="form-label staff-field-label d-flex align-items-center gap-1 mb-1"
                        for="causal-saliente-select"
                      >
                        <i class="bi bi-file-earmark-medical text-secondary"></i>
                        <span>Causal de Ausencia</span>
                        <span class="text-danger">*</span>
                      </label>
                      <div class="select-wrapper">
                        <select
                          id="causal-saliente-select"
                          v-model="registroLocal.motivo"
                          class="form-select form-select-custom"
                          data-testid="motivo-select"
                          required
                        >
                          <option value="" disabled>Seleccione causal de ausencia...</option>
                          <option
                            v-for="(label, key) in MOTIVOS_AUSENCIA_LABELS"
                            :key="key"
                            :value="key"
                          >
                            {{ label }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- COLUMNA FUNCIONARIO ENTRANTE -->
                <div class="col-12 col-md-6">
                  <div class="staff-role-card staff-incoming h-100 p-3 rounded-3 d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="role-pill pill-incoming">
                          <i class="bi bi-person-check me-1"></i> Reemplazante Entrante
                        </span>
                      </div>

                      <!-- Buscador Entrante -->
                      <div class="my-2">
                        <label class="form-label staff-field-label mb-1">
                          Buscar Reemplazante <span class="text-danger">*</span>
                        </label>
                        <v-select
                          v-model="selectedEntrante"
                          :options="entranteOptions"
                          :filterable="false"
                          :loading="isSearchingEntrante"
                          @search="searchEntrante"
                          label="displayName"
                          placeholder="Escribe RUT o nombre..."
                          class="custom-v-select staff-v-select"
                        >
                          <template #option="option">
                            <div class="IStaff-option py-1">
                              <div class="d-flex justify-content-between align-items-center">
                                <div>
                                  <span class="fw-bold text-dark font-monospace x-small">{{ option.rut }}</span>
                                  <span class="text-secondary ms-2 small">{{ option.firstName }} {{ option.lastName }}</span>
                                </div>
                                <span class="badge bg-light text-primary border x-small">
                                  {{ option.positionId?.name || 'Sin Cargo' }}
                                </span>
                              </div>
                            </div>
                          </template>
                          <template #selected-option="option">
                            <div class="d-flex align-items-center py-1">
                              <div class="avatar-squircle avatar-incoming-xs shadow-xs me-2">
                                {{ getInitials(option.firstName + ' ' + option.lastName) }}
                              </div>
                              <div style="overflow: hidden">
                                <div class="fw-bold text-dark text-truncate" style="font-size: 0.8rem">
                                  {{ option.firstName }} {{ option.lastName }}
                                </div>
                                <div class="text-secondary x-small font-monospace text-truncate">
                                  {{ option.rut }}
                                </div>
                              </div>
                            </div>
                          </template>
                          <template #no-options="{ search }">
                            <div class="text-center text-muted py-2 small">
                              <i class="bi bi-search me-1"></i>
                              <span v-if="!search">Escribe al menos 2 caracteres...</span>
                              <span v-else>No se encontraron resultados</span>
                            </div>
                          </template>
                        </v-select>
                      </div>
                    </div>

                    <div class="mt-3 pt-2 border-top-dashed d-flex align-items-center gap-1 text-muted x-small">
                      <i class="bi bi-check-circle-fill text-success opacity-75"></i>
                      <span>Personal habilitado para cobertura de turno</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Observaciones Transversal (Simetría Perfecta) -->
              <div class="mt-3 pt-3 border-top">
                <label
                  class="form-label staff-field-label d-flex justify-content-between align-items-center mb-1"
                  for="observaciones-saliente"
                >
                  <span class="d-flex align-items-center gap-1">
                    <i class="bi bi-card-text text-secondary"></i>
                    <span>Observaciones de la Ausencia o Turno</span>
                    <span v-if="registroLocal.motivo === 'OTRO'" class="text-danger">* (Obligatorio)</span>
                  </span>
                  <span class="text-secondary fw-normal x-small">
                    {{ (registroLocal.observaciones || '').length }} / 500 car.
                  </span>
                </label>
                <textarea
                  id="observaciones-saliente"
                  v-model="registroLocal.observaciones"
                  class="form-control form-textarea-custom"
                  :class="{ 'border-danger border-opacity-50': registroLocal.motivo === 'OTRO' && (!registroLocal.observaciones || !registroLocal.observaciones.trim()) }"
                  rows="2"
                  maxlength="500"
                  placeholder="Detalles sobre la ausencia, justificación o acuerdos del turno..."
                  data-testid="observaciones-textarea"
                ></textarea>
              </div>
            </div>

            <!-- SECCIÓN 2: PARÁMETROS DEL TURNO Y SERVICIO -->
            <div class="vanguard-section-card p-3 p-md-4">
              <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div class="d-flex align-items-center gap-2">
                  <span class="section-indicator bg-indigo"></span>
                  <h6 class="fw-bold text-dark mb-0 section-heading">Parámetros del Turno</h6>
                </div>
                <span class="badge bg-light text-secondary border x-small">
                  Período y Servicio
                </span>
              </div>

              <div class="row g-3">
                <!-- Tipo Turno y Servicio Clínico -->
                <div class="col-12 col-md-6">
                  <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                    <i class="bi bi-clock-history text-secondary"></i>
                    <span>Tipo de Turno</span>
                    <span class="text-danger">*</span>
                  </label>
                  <v-select
                    :options="computedListaDeTurnos"
                    v-model="registroLocal.tipo_turno"
                    placeholder="Seleccione turno..."
                    :clearable="false"
                    :searchable="false"
                    class="custom-v-select small-select"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                    <i class="bi bi-hospital text-secondary"></i>
                    <span>Servicio Clínico</span>
                    <span class="text-danger">*</span>
                  </label>
                  <v-select
                    :options="computedListaDeServicios"
                    v-model="registroLocal.servicio"
                    label="nombre"
                    :reduce="(s: any) => s._id"
                    placeholder="Seleccione servicio..."
                    :clearable="false"
                    :searchable="true"
                    class="custom-v-select small-select"
                  />
                </div>

                <!-- Fechas Inicio y Término con DatePicker -->
                <div class="col-12 col-md-6">
                  <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                    <i class="bi bi-calendar-event text-secondary"></i>
                    <span>Fecha de Inicio</span>
                    <span class="text-danger">*</span>
                  </label>
                  <DatePicker
                    ref="dpInicio"
                    v-model="fechaInicioComputed"
                    :disabled-dates="combinedDisabledDates"
                    :min-date="today"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :popover="popoverConfig"
                    :is-required="true"
                    trim-weeks
                    color="blue"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group modern-input-group">
                        <span class="input-group-text">
                          <i class="bi bi-calendar3"></i>
                        </span>
                        <input
                          class="form-control modern-date-input"
                          :value="inputValue"
                          v-on="inputEvents"
                          @click="handleInicioClick"
                          placeholder="dd/mm/aaaa"
                          readonly
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                    <i class="bi bi-calendar-check text-secondary"></i>
                    <span>Fecha de Término</span>
                    <span class="text-danger">*</span>
                  </label>
                  <DatePicker
                    ref="dpTermino"
                    v-model="fechaTerminoComputed"
                    :disabled-dates="combinedDisabledDates"
                    :min-date="fechaInicioComputed || today"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :popover="popoverConfig"
                    :is-required="true"
                    trim-weeks
                    color="blue"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group modern-input-group">
                        <span class="input-group-text">
                          <i class="bi bi-calendar3"></i>
                        </span>
                        <input
                          class="form-control modern-date-input"
                          :value="inputValue"
                          v-on="inputEvents"
                          @click="handleTerminoClick"
                          placeholder="dd/mm/aaaa"
                          readonly
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER VANGUARDISTA -->
          <div class="modal-footer vanguard-modal-footer p-3 px-4 border-top d-flex justify-content-between align-items-center bg-white">
            <button
              type="button"
              class="btn btn-secondary-pill"
              @click="$emit('cerrar')"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary btn-primary-pill d-flex align-items-center gap-2"
              :disabled="!isFormComplete || Boolean(validationError)"
              @click="abrirConfirmacion"
            >
              <span class="btn-icon-wrap primary">
                <i class="bi bi-check-lg"></i>
              </span>
              <span>Crear Reemplazo</span>
            </button>
          </div>

          <!-- Modal de confirmación -->
          <Teleport to="body">
            <ConfirmationModal
              :visible="showConfirmacion"
              mensaje="¿Deseas crear y confirmar este reemplazo directo?"
              @confirmar="confirmarGuardar"
              @cancelar="cancelarConfirmacion"
            />
          </Teleport>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { getInitials } from '@/utils/text-formatters'
import {
  type ReplacementRegistration,
  MOTIVOS_AUSENCIA_LABELS,
  type AusenciaSalienteMotivo
} from '@/types/replacement.types'
import { type IStaff } from '@/types/staff.types'
import { useStaffStore } from '@/stores/staff.store'
import { useServiceStore } from '@/stores/service.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import { useTurnAssignmentStore } from '@/stores/turn-assignment.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import { useDatePicker } from '@/composables/useDatePicker'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import ConfirmationModal from '../common/ConfirmationModal.vue'

interface ReemplazoModalData extends Partial<ReplacementRegistration> {
  fecha_inicio?: string
  fecha_termino?: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    listaDeTurnos?: string[]
    listaDeServicios?: any[]
    registro?: ReemplazoModalData
    fechasBloqueadas?: string[]
  }>(),
  {
    visible: false,
    listaDeTurnos: () => [],
    listaDeServicios: () => [],
    registro: () => ({}),
    fechasBloqueadas: () => []
  }
)

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', registro: ReplacementRegistration): void
}>()

const staffStore = useStaffStore()
const serviceStore = useServiceStore()
const turnTypeStore = useTurnTypeStore()
const turnAssignmentStore = useTurnAssignmentStore()
const replacementStore = useReplacementStore()

const computedListaDeServicios = computed(() => {
  if (props.listaDeServicios && props.listaDeServicios.length > 0) {
    return props.listaDeServicios
  }
  return serviceStore.services
})

const computedListaDeTurnos = computed(() => {
  if (props.listaDeTurnos && props.listaDeTurnos.length > 0) {
    return props.listaDeTurnos
  }
  return turnTypeStore.turnTypes.map((t: any) => t.nombre || t.name)
})

onMounted(async () => {
  if (props.visible) {
    if (serviceStore.services.length === 0) await serviceStore.fetchServices()
    if (turnTypeStore.turnTypes.length === 0) await turnTypeStore.fetchTurnTypes(true)
  }
})

// Local Form State
const registroLocal = reactive({
  ...props.registro,
  motivo: (props.registro.motivo || '') as AusenciaSalienteMotivo | '',
  observaciones: props.registro.observaciones || ''
})

const showConfirmacion = ref(false)
const selectedSaliente = ref<IStaff | null>(null)
const selectedEntrante = ref<IStaff | null>(null)
const salienteOptions = ref<IStaff[]>([])
const entranteOptions = ref<IStaff[]>([])
const isSearchingSaliente = ref(false)
const isSearchingEntrante = ref(false)

let searchTimeoutSaliente: ReturnType<typeof setTimeout> | null = null
let searchTimeoutEntrante: ReturnType<typeof setTimeout> | null = null

const salienteBlockedDates = ref<any[]>([])
const entranteBlockedRanges = ref<any[]>([])

const searchSaliente = (query: string, loading: (isLoading: boolean) => void) => {
  if (!query || query.length < 2) {
    salienteOptions.value = []
    return
  }
  loading(true)
  isSearchingSaliente.value = true

  if (searchTimeoutSaliente) clearTimeout(searchTimeoutSaliente)
  searchTimeoutSaliente = setTimeout(async () => {
    try {
      await staffStore.searchStaff({ search: query.trim(), page: 1, limit: 20 })
      salienteOptions.value = staffStore.searchResults.map((u) => ({
        ...u,
        displayName: `${u.rut} - ${u.firstName} ${u.lastName}`
      }))
    } catch (error) {
      console.error('[ReplacementModalCreate] Search saliente error:', error)
      salienteOptions.value = []
    } finally {
      loading(false)
      isSearchingSaliente.value = false
    }
  }, 300)
}

const searchEntrante = (query: string, loading: (isLoading: boolean) => void) => {
  if (!query || query.length < 2) {
    entranteOptions.value = []
    return
  }
  loading(true)
  isSearchingEntrante.value = true

  if (searchTimeoutEntrante) clearTimeout(searchTimeoutEntrante)
  searchTimeoutEntrante = setTimeout(async () => {
    try {
      await staffStore.searchStaff({ search: query.trim(), page: 1, limit: 20 })
      entranteOptions.value = staffStore.searchResults.map((u) => ({
        ...u,
        displayName: `${u.rut} - ${u.firstName} ${u.lastName}`
      }))
    } catch (error) {
      console.error('[ReplacementModalCreate] Search entrante error:', error)
      entranteOptions.value = []
    } finally {
      loading(false)
      isSearchingEntrante.value = false
    }
  }, 300)
}

const parseDateStr = (dStr: string): Date => {
  const [yyyy, mm, dd] = dStr.split('-').map(Number)
  return new Date(yyyy, mm - 1, dd)
}

const updateDateToNextAvailable = () => {
  const now = new Date()
  let nextAvailable = new Date(now)
  nextAvailable.setHours(0, 0, 0, 0)

  const isBlocked = (targetDate: Date) => {
    return combinedDisabledDates.value.some((b: any) => {
      let bStart: Date
      let bEnd: Date
      if (b && b.start) {
        bStart = new Date(b.start)
        bEnd = b.end ? new Date(b.end) : bStart
      } else {
        bStart = new Date(b)
        bEnd = new Date(b)
      }
      bStart.setHours(0, 0, 0, 0)
      bEnd.setHours(23, 59, 59, 999)
      return targetDate >= bStart && targetDate <= bEnd
    })
  }

  while (isBlocked(nextAvailable)) {
    nextAvailable.setDate(nextAvailable.getDate() + 1)
  }

  const yyyy = nextAvailable.getFullYear()
  const mm = String(nextAvailable.getMonth() + 1).padStart(2, '0')
  const dd = String(nextAvailable.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`
  registroLocal.fecha_inicio = dateStr
  registroLocal.fecha_termino = dateStr
}

const fetchBlockedDates = async (IStaff: IStaff) => {
  try {
    const [replacements, assignments = []] = await Promise.all([
      replacementStore.checkConflicts({ search: IStaff.rut, limit: 100 }),
      turnAssignmentStore.fetchAssignmentsByUser(IStaff._id)
    ])
    const absenceStrs = replacementStore.getFechasAusencia(IStaff._id, replacements)
    const absenceDates = absenceStrs.map(parseDateStr)
    const occupiedStrs = replacementStore.getFechasOcupadas(IStaff._id, replacements)
    const occupiedDates = occupiedStrs.map(parseDateStr)
    const shiftRanges = assignments.map((a: any) => ({
      start: new Date(a.start_date),
      end: a.end_date ? new Date(a.end_date) : new Date(2100, 0, 1)
    }))
    return [...absenceDates, ...occupiedDates, ...shiftRanges]
  } catch (error) {
    console.error(`Error fetching blocked dates for ${IStaff.rut}:`, error)
    return []
  }
}

watch(selectedSaliente, async (IStaff) => {
  if (IStaff) {
    Object.assign(registroLocal, {
      id_saliente: IStaff._id,
      rut_saliente: IStaff.rut,
      nombre_saliente: IStaff.firstName,
      apellido_saliente: IStaff.lastName
    })
    salienteBlockedDates.value = await fetchBlockedDates(IStaff)
    updateDateToNextAvailable()
  } else {
    registroLocal.id_saliente = undefined
    registroLocal.rut_saliente = undefined
    registroLocal.nombre_saliente = undefined
    registroLocal.apellido_saliente = undefined
    salienteBlockedDates.value = []
  }
})

watch(selectedEntrante, async (IStaff) => {
  if (IStaff) {
    Object.assign(registroLocal, {
      id_entrante: IStaff._id,
      rut_entrante: IStaff.rut,
      nombre_entrante: IStaff.firstName,
      apellido_entrante: IStaff.lastName
    })
    entranteBlockedRanges.value = await fetchBlockedDates(IStaff)
    updateDateToNextAvailable()
  } else {
    registroLocal.id_entrante = undefined
    registroLocal.rut_entrante = undefined
    registroLocal.nombre_entrante = undefined
    registroLocal.apellido_entrante = undefined
    entranteBlockedRanges.value = []
  }
})

const combinedDisabledDates = computed(() => {
  const staticBlocks = (props.fechasBloqueadas || []).map(parseDateStr)
  return [...staticBlocks, ...salienteBlockedDates.value, ...entranteBlockedRanges.value]
})

// Validations
const validationError = computed(() => {
  if (registroLocal.rut_saliente && registroLocal.rut_entrante) {
    if (registroLocal.rut_saliente === registroLocal.rut_entrante) {
      return 'El funcionario saliente y entrante no pueden ser la misma persona.'
    }
  }

  if (registroLocal.fecha_inicio) {
    const start = new Date(registroLocal.fecha_inicio + 'T00:00:00')
    start.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (start < now) {
      return 'La fecha de inicio no puede ser anterior a hoy.'
    }

    let end = start
    if (registroLocal.fecha_termino) {
      end = new Date(registroLocal.fecha_termino + 'T00:00:00')
      end.setHours(23, 59, 59, 999)
      if (end < start) {
        return 'La fecha de término no puede ser anterior a la fecha de inicio.'
      }
    }

    const hasConflict = combinedDisabledDates.value.some((blockedDate: any) => {
      let bStart: Date
      let bEnd: Date
      if (blockedDate && blockedDate.start) {
        bStart = new Date(blockedDate.start)
        bEnd = blockedDate.end ? new Date(blockedDate.end) : bStart
      } else {
        bStart = new Date(blockedDate)
        bEnd = new Date(blockedDate)
      }
      bStart.setHours(0, 0, 0, 0)
      bEnd.setHours(23, 59, 59, 999)
      return start <= bEnd && end >= bStart
    })

    if (hasConflict) {
      return 'El rango de fechas seleccionado entra en conflicto con un turno o ausencia existente.'
    }
  }

  if (registroLocal.motivo === 'OTRO') {
    if (!registroLocal.observaciones || !registroLocal.observaciones.trim()) {
      return "Las observaciones son obligatorias cuando el motivo es 'OTRO'"
    }
  }
  if (registroLocal.observaciones && registroLocal.observaciones.length > 500) {
    return 'Las observaciones no pueden superar los 500 caracteres.'
  }

  return ''
})

const isFormComplete = computed(() => {
  const complete = Boolean(
    registroLocal.rut_saliente &&
    registroLocal.rut_entrante &&
    registroLocal.tipo_turno &&
    registroLocal.servicio &&
    registroLocal.fecha_inicio &&
    registroLocal.fecha_termino &&
    registroLocal.motivo
  )
  if (!complete) return false
  if (registroLocal.motivo === 'OTRO') {
    return Boolean(registroLocal.observaciones && registroLocal.observaciones.trim().length > 0)
  }
  return true
})

// Watchers
watch(
  () => props.registro,
  (nuevo) => {
    Object.assign(registroLocal, {
      ...nuevo,
      motivo: nuevo.motivo || '',
      observaciones: nuevo.observaciones || ''
    })
  },
  { deep: true }
)

watch(
  () => props.visible,
  async (nuevoValor) => {
    if (nuevoValor) {
      if (serviceStore.services.length === 0) await serviceStore.fetchServices()
      if (turnTypeStore.turnTypes.length === 0) await turnTypeStore.fetchTurnTypes(true)
      if (!registroLocal.fecha_inicio) registroLocal.fecha_inicio = todayString()
      if (!registroLocal.fecha_termino) registroLocal.fecha_termino = todayString()
    }
  }
)

watch(
  () => registroLocal.fecha_inicio,
  (newVal) => {
    if (newVal) {
      registroLocal.fecha_termino = newVal
    }
  }
)

// DatePicker controls
const dpInicio = ref<any>(null)
const dpTermino = ref<any>(null)
const { popoverConfig } = useDatePicker(props)
const today = new Date()
today.setHours(0, 0, 0, 0)

function todayString() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function handleInicioClick() {
  if (dpTermino.value) dpTermino.value.hidePopover()
}

function handleTerminoClick() {
  if (dpInicio.value) dpInicio.value.hidePopover()
}

const fechaInicioComputed = computed({
  get: () => {
    if (!registroLocal.fecha_inicio) return null
    const [year, month, day] = registroLocal.fecha_inicio.split('-').map(Number)
    return new Date(year, month - 1, day)
  },
  set: (val: Date | string | null) => {
    if (!val) {
      registroLocal.fecha_inicio = undefined
      return
    }
    if (val instanceof Date && !isNaN(val.getTime())) {
      const year = val.getFullYear()
      const month = String(val.getMonth() + 1).padStart(2, '0')
      const day = String(val.getDate()).padStart(2, '0')
      registroLocal.fecha_inicio = `${year}-${month}-${day}`
    } else if (typeof val === 'string') {
      registroLocal.fecha_inicio = val.split('T')[0]
    }
  }
})

const fechaTerminoComputed = computed({
  get: () => {
    if (!registroLocal.fecha_termino) return null
    const [year, month, day] = registroLocal.fecha_termino.split('-').map(Number)
    return new Date(year, month - 1, day)
  },
  set: (val: Date | string | null) => {
    if (!val) {
      registroLocal.fecha_termino = undefined
      return
    }
    if (val instanceof Date && !isNaN(val.getTime())) {
      const year = val.getFullYear()
      const month = String(val.getMonth() + 1).padStart(2, '0')
      const day = String(val.getDate()).padStart(2, '0')
      registroLocal.fecha_termino = `${year}-${month}-${day}`
    } else if (typeof val === 'string') {
      registroLocal.fecha_termino = val.split('T')[0]
    }
  }
})

function abrirConfirmacion() {
  if (validationError.value || !isFormComplete.value) return
  showConfirmacion.value = true
}

function confirmarGuardar() {
  showConfirmacion.value = false

  const payload = { ...registroLocal } as any

  if (payload.fecha_inicio) {
    const [y, m, d] = String(payload.fecha_inicio).split('T')[0].split('-').map(Number)
    payload.fecha_inicio = new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString()
  }

  if (payload.fecha_termino) {
    const [y, m, d] = String(payload.fecha_termino).split('T')[0].split('-').map(Number)
    payload.fecha_termino = new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString()
  }

  if (typeof payload.id_saliente === 'object' && payload.id_saliente?._id) payload.id_saliente = payload.id_saliente._id
  if (typeof payload.id_entrante === 'object' && payload.id_entrante?._id) payload.id_entrante = payload.id_entrante._id
  if (typeof payload.servicio === 'object' && payload.servicio?._id) payload.servicio = payload.servicio._id

  payload.motivo = registroLocal.motivo
  payload.observaciones = registroLocal.observaciones?.trim() || undefined

  emit('guardar', payload as ReplacementRegistration)
}

function cancelarConfirmacion() {
  showConfirmacion.value = false
}
</script>

<style scoped>
/* Transición Modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Modal Dialog Width & Elevation */
.modal-custom-width {
  max-width: 820px;
}

.vanguard-modal-content {
  background: white;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25) !important;
}

.bg-surface {
  background-color: #f8fafc;
}

/* Header Styles */
.vanguard-modal-header {
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

.modal-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(191, 219, 254, 0.6);
  flex-shrink: 0;
}

.modal-title-custom {
  letter-spacing: -0.02em;
  font-size: 1.15rem;
}

.badge-direct-mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #1d4ed8;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 3px 9px;
  border-radius: 9999px;
}

.pulse-dot-blue {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

.btn-close-modal {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-close-modal:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: rotate(90deg);
}

/* Vanguard Section Card (Double-Bezel Inner Card) */
.vanguard-section-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
}

.section-indicator {
  width: 4px;
  height: 16px;
  border-radius: 9999px;
  display: inline-block;
}

.bg-indigo {
  background-color: #6366f1;
}

.section-heading {
  font-size: 0.88rem;
  letter-spacing: -0.01em;
}

/* Staff Role Cards */
.staff-role-card {
  border-radius: 14px;
  transition: all 0.2s ease;
}

.staff-outgoing {
  background: linear-gradient(180deg, #fffafa 0%, #ffffff 100%);
  border: 1px solid rgba(239, 68, 68, 0.18);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.03);
}

.staff-incoming {
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
  border: 1px solid rgba(16, 185, 129, 0.2);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.03);
}

.role-pill {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
}

.pill-outgoing {
  background-color: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.pill-incoming {
  background-color: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

/* Avatars */
.avatar-squircle {
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.avatar-outgoing-xs {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%);
  color: #991b1b;
  font-size: 0.72rem;
  font-weight: 700;
}

.avatar-incoming-xs {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #d1fae5 0%, #86efac 100%);
  color: #065f46;
  font-size: 0.72rem;
  font-weight: 700;
}

.border-top-dashed {
  border-top: 1px dashed rgba(148, 163, 184, 0.3);
}

/* Fields & Labels */
.staff-field-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.01em;
}

.form-select-custom {
  font-size: 0.82rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  padding: 0.45rem 0.75rem;
  color: #1e293b;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.form-select-custom:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  outline: none;
}

.form-textarea-custom {
  font-size: 0.82rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  padding: 0.5rem 0.75rem;
  color: #1e293b;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.form-textarea-custom:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  outline: none;
}

/* DatePicker Input Group */
.modern-input-group .input-group-text {
  background-color: #ffffff;
  border-color: #cbd5e1;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  color: #64748b;
  font-size: 0.85rem;
}

.modern-date-input {
  border-color: #cbd5e1;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  font-size: 0.82rem;
  background-color: #ffffff;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  color: #1e293b;
  padding: 0.45rem 0.75rem;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.modern-date-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

/* Custom vue-select styling */
.custom-v-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 3px 6px;
  background: white;
  box-shadow: none;
  min-height: 38px;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.custom-v-select.small-select :deep(.vs__dropdown-toggle) {
  min-height: 36px;
}

.custom-v-select :deep(.vs__dropdown-toggle:focus-within) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.82rem;
  color: #1e293b;
  margin: 2px 2px 0;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
  font-size: 0.82rem;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.75);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1);
  padding: 6px;
  font-size: 0.82rem;
  max-height: 220px;
  overflow-y: auto;
  z-index: 1050;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 2px;
  color: #334155;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

/* Footer & Buttons */
.vanguard-modal-footer {
  border-top: 1px solid #f1f5f9;
}

.btn-secondary-pill {
  background: white;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  padding: 0.45rem 1.25rem;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-secondary-pill:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
  transform: translateY(-1px);
}

.btn-primary-pill {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  padding: 0.45rem 1.25rem 0.45rem 0.65rem;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-primary-pill:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  color: white;
}

.btn-primary-pill:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-icon-wrap {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.btn-icon-wrap.primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.x-small {
  font-size: 0.7rem;
}

.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
