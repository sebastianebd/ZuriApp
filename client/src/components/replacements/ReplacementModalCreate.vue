<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      v-if="visible"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content shadow-2xl border-0 rounded-4">
          <!-- HEADER -->
          <div class="modal-header border-0 bg-white p-4 pb-3">
            <div>
              <h5 class="modal-title fw-bold text-dark">
                <i class="bi bi-plus-circle-fill text-primary me-2"></i>Nuevo Reemplazo
              </h5>
              <p class="text-secondary small mb-0 mt-1">
                Configure los detalles de la transacción y el período.
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="$emit('cerrar')"
              aria-label="Close"
            ></button>
          </div>

          <!-- BODY -->
          <div class="modal-body p-4 bg-light bg-opacity-50">
            <!-- ALERTAS DE VALIDACIÓN -->
            <div
              v-if="validationError"
              class="alert alert-danger border-0 shadow-sm rounded-3 d-flex align-items-center mb-4 animate-shake"
            >
              <i class="bi bi-exclamation-triangle-fill fs-5 me-3"></i>
              <div>
                <div class="fw-bold">Conflicto de Usuarios</div>
                <div class="small">{{ validationError }}</div>
              </div>
            </div>

            <!-- SELECTOR DE MODO: DIRECTO VS BOLSA DE REEMPLAZOS -->
            <div class="d-flex align-items-center justify-content-between p-3 mb-4 bg-white rounded-4 border shadow-sm">
              <div>
                <span class="fw-bold text-dark d-block">Modalidad de Reemplazo</span>
                <span class="small text-muted">Asignación directa o convocatoria pública en bolsa de reemplazos.</span>
              </div>
              <div class="btn-group">
                <button
                  type="button"
                  class="btn btn-sm px-3"
                  :class="!isBolsaMode ? 'btn-dark text-white shadow-sm fw-semibold' : 'btn-outline-secondary'"
                  @click="isBolsaMode = false"
                >
                  Modo Directo
                </button>
                <button
                  type="button"
                  class="btn btn-sm px-3"
                  :class="isBolsaMode ? 'btn-dark text-white shadow-sm fw-semibold' : 'btn-outline-secondary'"
                  @click="isBolsaMode = true"
                >
                  📢 Publicar en Bolsa de Reemplazos
                </button>
              </div>
            </div>

            <!-- SECCIÓN TRANSACCIÓN (Saliente -> Entrante) -->
            <div class="transaction-container bg-white rounded-4 shadow-sm p-4 mb-4 border">
              <div class="row align-items-center g-0">
                <!-- SALIENTE CARD -->
                <div class="col-md-5">
                  <div
                    class="IStaff-card outgoing p-3 rounded-3 border border-danger border-opacity-25 bg-danger bg-opacity-10 position-relative"
                  >
                    <div
                      class="badge bg-danger text-white position-absolute top-0 start-0 m-2 x-small shadow-sm"
                    >
                      SALIENTE
                    </div>

                    <!-- 🏢 ENTERPRISE: v-select with server-side search -->
                    <div class="mt-4">
                      <label class="form-label small fw-semibold text-danger mb-2">
                        <i class="bi bi-search me-1"></i>Buscar Funcionario
                      </label>
                      <v-select
                        v-model="selectedSaliente"
                        :options="salienteOptions"
                        :filterable="false"
                        :loading="isSearchingSaliente"
                        @search="searchSaliente"
                        label="displayName"
                        placeholder="Escribe RUT o nombre..."
                        class="IStaff-select-danger"
                      >
                        <template #option="option">
                          <div class="IStaff-option">
                            <div class="d-flex justify-content-between align-items-center">
                              <div>
                                <span class="fw-bold text-dark">{{ option.rut }}</span>
                                <span class="text-secondary ms-2"
                                  >{{ option.firstName }} {{ option.lastName }}</span
                                >
                              </div>
                              <span class="badge bg-primary">{{ option.positionId?.name || 'Sin Cargo' }}</span>
                            </div>
                          </div>
                        </template>
                        <template #selected-option="option">
                          <div class="d-flex align-items-center">
                            <div
                              class="avatar-filled bg-gradient-danger text-white shadow-sm me-2"
                              style="width: 32px; height: 32px; font-size: 0.75rem"
                            >
                              {{ getInitials(option.firstName + ' ' + option.lastName) }}
                            </div>
                            <div>
                              <div class="fw-bold text-dark" style="font-size: 0.875rem">
                                {{ option.firstName }} {{ option.lastName }}
                              </div>
                              <div class="text-secondary" style="font-size: 0.7rem">
                                {{ option.rut }}
                              </div>
                            </div>
                          </div>
                        </template>
                        <template #no-options="{ search }">
                          <div class="text-center text-muted py-2">
                            <i class="bi bi-search me-1"></i>
                            <span v-if="!search">Escribe para buscar...</span>
                            <span v-else>No se encontraron resultados</span>
                          </div>
                        </template>
                      </v-select>
                    </div>

                    <!-- Causal de Ausencia (Saliente) -->
                    <div class="mt-3 pt-2 border-top border-danger border-opacity-25">
                      <label class="form-label small fw-semibold text-danger mb-1" for="causal-saliente-select">
                        <i class="bi bi-file-earmark-medical me-1"></i>Causal de Ausencia <span class="text-danger">*</span>
                      </label>
                      <select
                        id="causal-saliente-select"
                        v-model="registroLocal.motivo"
                        class="form-select form-select-sm border-danger border-opacity-50"
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

                      <!-- Observaciones -->
                      <div class="mt-2">
                        <label
                          class="form-label small fw-semibold mb-1"
                          :class="registroLocal.motivo === 'OTRO' ? 'text-danger' : 'text-secondary'"
                          for="observaciones-saliente"
                        >
                          Observaciones
                          <span v-if="registroLocal.motivo === 'OTRO'" class="text-danger">* (Obligatorio)</span>
                          <span v-else class="text-muted fw-normal">(Opcional)</span>
                        </label>
                        <textarea
                          id="observaciones-saliente"
                          v-model="registroLocal.observaciones"
                          class="form-control form-control-sm"
                          :class="{ 'border-danger border-opacity-50': registroLocal.motivo === 'OTRO' && (!registroLocal.observaciones || !registroLocal.observaciones.trim()) }"
                          rows="2"
                          maxlength="500"
                          placeholder="Detalles sobre la ausencia..."
                          data-testid="observaciones-textarea"
                        ></textarea>
                        <div class="text-end text-muted x-small mt-1">
                          {{ (registroLocal.observaciones || '').length }} / 500
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ARROW CONNECTOR -->
                <div class="col-md-2 text-center py-3 py-md-0">
                  <div
                    class="connector-icon bg-white text-secondary shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center border"
                  >
                    <i class="bi bi-arrow-right fs-4 d-none d-md-block"></i>
                    <i class="bi bi-arrow-down fs-4 d-md-none"></i>
                  </div>
                </div>

                <!-- ENTRANTE CARD / BOLSA PRESETS -->
                <div class="col-md-5">
                  <div
                    v-if="!isBolsaMode"
                    class="IStaff-card incoming p-3 rounded-3 border border-success border-opacity-25 bg-success bg-opacity-10 position-relative"
                  >
                    <div
                      class="badge bg-success text-white position-absolute top-0 start-0 m-2 x-small shadow-sm"
                    >
                      ENTRANTE
                    </div>

                    <!-- 🏢 ENTERPRISE: v-select with server-side search -->
                    <div class="mt-4">
                      <label class="form-label small fw-semibold text-success mb-2">
                        <i class="bi bi-search me-1"></i>Buscar Funcionario
                      </label>
                      <v-select
                        v-model="selectedEntrante"
                        :options="entranteOptions"
                        :filterable="false"
                        :loading="isSearchingEntrante"
                        @search="searchEntrante"
                        label="displayName"
                        placeholder="Escribe RUT o nombre..."
                        class="IStaff-select-success"
                      >
                        <template #option="option">
                          <div class="IStaff-option">
                            <div class="d-flex justify-content-between align-items-center">
                              <div>
                                <span class="fw-bold text-dark">{{ option.rut }}</span>
                                <span class="text-secondary ms-2"
                                  >{{ option.firstName }} {{ option.lastName }}</span
                                >
                              </div>
                              <span class="badge bg-primary">{{ option.positionId?.name || 'Sin Cargo' }}</span>
                            </div>
                          </div>
                        </template>
                        <template #selected-option="option">
                          <div class="d-flex align-items-center">
                            <div
                              class="avatar-filled bg-gradient-success text-white shadow-sm me-2"
                              style="width: 32px; height: 32px; font-size: 0.75rem"
                            >
                              {{ getInitials(option.firstName + ' ' + option.lastName) }}
                            </div>
                            <div>
                              <div class="fw-bold text-dark" style="font-size: 0.875rem">
                                {{ option.firstName }} {{ option.lastName }}
                              </div>
                              <div class="text-secondary" style="font-size: 0.7rem">
                                {{ option.rut }}
                              </div>
                            </div>
                          </div>
                        </template>
                        <template #no-options="{ search }">
                          <div class="text-center text-muted py-2">
                            <i class="bi bi-search me-1"></i>
                            <span v-if="!search">Escribe para buscar...</span>
                            <span v-else>No se encontraron resultados</span>
                          </div>
                        </template>
                      </v-select>
                    </div>
                  </div>

                  <!-- MODO BOLSA: PRESETS DE VENCIMIENTO -->
                  <div
                    v-else
                    class="IStaff-card bolsa p-3 rounded-3 border border-primary border-opacity-25 bg-primary bg-opacity-10 position-relative"
                    data-testid="bolsa-presets-container"
                  >
                    <div
                      class="badge bg-primary text-white position-absolute top-0 start-0 m-2 x-small shadow-sm"
                    >
                      BOLSA DE REEMPLAZOS
                    </div>
                    <div class="mt-4">
                      <label class="form-label small fw-semibold text-primary mb-2">
                        <i class="bi bi-clock-history me-1"></i>Vencimiento de Postulación
                      </label>
                      <div class="d-flex flex-wrap gap-2 mb-2">
                        <button
                          type="button"
                          class="btn btn-sm"
                          :class="expirationPreset === '2h' ? 'btn-dark text-white fw-bold' : 'btn-outline-dark'"
                          @click="expirationPreset = '2h'"
                        >
                          En 2 horas
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm"
                          :class="expirationPreset === '4h' ? 'btn-dark text-white fw-bold' : 'btn-outline-dark'"
                          @click="expirationPreset = '4h'"
                        >
                          En 4 horas
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm"
                          :class="expirationPreset === 'eod' ? 'btn-dark text-white fw-bold' : 'btn-outline-dark'"
                          @click="expirationPreset = 'eod'"
                        >
                          Fin del día (18:00)
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm"
                          :class="expirationPreset === 'custom' ? 'btn-dark text-white fw-bold' : 'btn-outline-dark'"
                          @click="expirationPreset = 'custom'"
                        >
                          Personalizado
                        </button>
                      </div>

                      <div v-if="expirationPreset === 'custom'" class="mt-2">
                        <input
                          type="datetime-local"
                          v-model="customExpiresAt"
                          class="form-control form-control-sm"
                        />
                      </div>

                      <div class="small text-muted mt-2">
                        <span>Límite calculado: </span>
                        <strong class="text-dark">{{ formatExpirationDisplay() }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN CONTEXTO -->
            <div class="context-container bg-white rounded-4 shadow-sm p-4 border">
              <h6 class="text-uppercase text-secondary fw-bold x-small mb-3 tracking-wider">
                Detalles del Período
              </h6>

              <div class="row g-3">
                <!-- SERVICIO -->
                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary"
                    >Servicio Clínico</label
                  >
                  <v-select
                    v-model="registroLocal.servicio"
                    :options="computedListaDeServicios"
                    label="nombre"
                    :reduce="(s: any) => s._id"
                    placeholder="Seleccione servicio"
                    class="custom-v-select"
                  />
                </div>

                <!-- TIPO TURNO -->
                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Tipo de Turno</label>
                  <v-select
                    id="tipo_turno"
                    v-model="registroLocal.tipo_turno"
                    :options="computedListaDeTurnos"
                    :clearable="false"
                    :filterable="true"
                    placeholder="Tipo de turno..."
                    class="custom-v-select"
                  />
                </div>

                <!-- FECHAS -->
                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Inicio</label>
                  <DatePicker
                    ref="dpInicio"
                    v-model="fechaInicioComputed"
                    :disabled-dates="combinedDisabledDates"
                    :min-date="today"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :popover="popoverConfig"
                    :attributes="combinedDateAttributes"
                    is-required
                    color="blue"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group">
                        <span class="input-group-text bg-white border-end-0 text-muted"
                          ><i class="bi bi-calendar3"></i
                        ></span>
                        <input
                          class="form-control bg-white border-start-0 ps-0"
                          :value="inputValue"
                          v-on="inputEvents"
                          @click="handleInicioClick"
                          placeholder="Seleccione fecha inicio"
                          readonly
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Término</label>
                  <DatePicker
                    ref="dpTermino"
                    v-model="fechaTerminoComputed"
                    :disabled-dates="combinedDisabledDates"
                    :min-date="fechaInicioComputed || today"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :popover="popoverConfig"
                    :attributes="combinedDateAttributes"
                    is-required
                    color="blue"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group">
                        <span class="input-group-text bg-white border-end-0 text-muted"
                          ><i class="bi bi-calendar3"></i
                        ></span>
                        <input
                          class="form-control bg-white border-start-0 ps-0"
                          :value="inputValue"
                          v-on="inputEvents"
                          @click="handleTerminoClick"
                          placeholder="Seleccione fecha término"
                          readonly
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer border-top bg-light p-3">
            <button
              type="button"
              class="btn btn-light border fw-bold text-secondary px-4 me-2"
              @click="$emit('cerrar')"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="abrirConfirmacion"
              class="btn btn-primary fw-bold px-4 shadow-sm"
              :disabled="!!validationError || !isFormComplete"
            >
              <i class="bi bi-check-lg me-2"></i>Crear Reemplazo
            </button>
          </div>

          <!-- Modal de confirmación -->
          <ConfirmationModal
            :visible="showConfirmacion"
            mensaje="¿Confirmas la creación de este reemplazo?"
            @confirmar="confirmarGuardar"
            @cancelar="cancelarConfirmacion"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed, onMounted } from 'vue'
import { type ReplacementRegistration, MOTIVOS_AUSENCIA_LABELS, type AusenciaSalienteMotivo } from '@/types/replacement.types'
import { type IStaff } from '@/types/staff.types'
import { useStaffStore } from '@/stores/staff.store'
import { useServiceStore } from '@/stores/service.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import ConfirmationModal from '../common/ConfirmationModal.vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import { useDatePicker } from '@/composables/useDatePicker'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { useTurnAssignmentStore } from '@/stores/turn-assignment.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { useReplacementOfferStore } from '@/stores/replacement-offer.store'
import { findNextAvailableDate } from '@/utils/date-utils'

const props = withDefaults(
  defineProps<{
    visible: boolean
    listaDeTurnos?: string[]
    listaDeServicios?: any[]
    registro?: Partial<ReplacementRegistration>
    fechasBloqueadas?: string[]
    initialBolsaMode?: boolean
  }>(),
  {
    listaDeTurnos: () => [],
    listaDeServicios: () => [],
    registro: () => ({}),
    fechasBloqueadas: () => [],
    initialBolsaMode: false,
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

const isBolsaMode = ref<boolean>(props.initialBolsaMode ?? false)

onMounted(async () => {
  if (props.initialBolsaMode) {
    isBolsaMode.value = true
  }
  if (props.visible) {
    if (serviceStore.services.length === 0) {
      await serviceStore.fetchServices()
    }
    if (turnTypeStore.turnTypes.length === 0) {
      await turnTypeStore.fetchTurnTypes(true)
    }
  }
})

const expirationPreset = ref<'2h' | '4h' | 'eod' | 'custom'>('2h')
const customExpiresAt = ref<string>('')

const computeExpirationDate = (): Date => {
  const now = new Date()
  if (expirationPreset.value === '2h') {
    return new Date(now.getTime() + 2 * 3600000)
  }
  if (expirationPreset.value === '4h') {
    return new Date(now.getTime() + 4 * 3600000)
  }
  if (expirationPreset.value === 'eod') {
    const eod = new Date(now)
    eod.setHours(18, 0, 0, 0)
    if (eod.getTime() <= now.getTime()) {
      eod.setDate(eod.getDate() + 1)
    }
    return eod
  }
  if (customExpiresAt.value) {
    const d = new Date(customExpiresAt.value)
    if (!isNaN(d.getTime())) return d
  }
  return new Date(now.getTime() + 2 * 3600000)
}

const computedExpiresAt = computed(() => {
  return computeExpirationDate().toISOString()
})

const formatExpirationDisplay = () => {
  const d = computeExpirationDate()
  return d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

const registroLocal = reactive({
  ...props.registro,
  motivo: (props.registro.motivo || '') as AusenciaSalienteMotivo,
  observaciones: props.registro.observaciones || ''
})
const showConfirmacion = ref(false)

// 🏢 ENTERPRISE: IStaff selection with server-side search
const selectedSaliente = ref<IStaff | null>(null)
const selectedEntrante = ref<IStaff | null>(null)
const salienteOptions = ref<IStaff[]>([])
const entranteOptions = ref<IStaff[]>([])
const isSearchingSaliente = ref(false)
const isSearchingEntrante = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Debounced search for Saliente (300ms)
const searchSaliente = (query: string, loading: (isLoading: boolean) => void) => {
  if (!query || query.length < 2) {
    salienteOptions.value = []
    return
  }

  loading(true)
  isSearchingSaliente.value = true

  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(async () => {
    try {
      await staffStore.searchStaff({
        search: query.trim(),
        page: 1,
        limit: 20
      })

      // Transform results for v-select
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

// Debounced search for Entrante (300ms)
const searchEntrante = (query: string, loading: (isLoading: boolean) => void) => {
  if (!query || query.length < 2) {
    entranteOptions.value = []
    return
  }

  loading(true)
  isSearchingEntrante.value = true

  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(async () => {
    try {
      await staffStore.searchStaff({
        search: query.trim(),
        page: 1,
        limit: 20
      })

      // Transform results for v-select
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

// --- Blocking Logic AuthState ---
const salienteBlockedDates = ref<Date[]>([])
const entranteBlockedRanges = ref<any[]>([])

// Helper to parse "YYYY-MM-DD" to Date
const parseDateStr = (str: string) => {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Helper para actualizar fecha_inicio al primer día disponible si hay fechas bloqueadas
const updateDateToNextAvailable = () => {
  if (combinedDisabledDates.value.length === 0) return
  const nextAvailable = findNextAvailableDate(new Date(), combinedDisabledDates.value)
  const yyyy = nextAvailable.getFullYear()
  const mm = String(nextAvailable.getMonth() + 1).padStart(2, '0')
  const dd = String(nextAvailable.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`
  registroLocal.fecha_inicio = dateStr
  registroLocal.fecha_termino = dateStr
}

// Shared helper to fetch blocked dates for a Staff (Absence + Working + Shifts)
const fetchBlockedDates = async (IStaff: IStaff) => {
  try {
    const [replacements, assignments = []] = await Promise.all([
      replacementStore.checkConflicts({ search: IStaff.rut, limit: 100 }),
      turnAssignmentStore.fetchAssignmentsByUser(IStaff._id)
    ])

    // 1. Absences (IStaff is Saliente en otro reemplazo activo)
    const absenceStrs = replacementStore.getFechasAusencia(IStaff._id, replacements)
    const absenceDates = absenceStrs.map(parseDateStr)

    // 2. Occupied as Replacement (IStaff is Entrante en otro reemplazo activo)
    const occupiedStrs = replacementStore.getFechasOcupadas(IStaff._id, replacements)
    const occupiedDates = occupiedStrs.map(parseDateStr)

    // 3. Occupied by Shift Assignment (bloquea fechas con turnos asignados)
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

// Watch Saliente -> Update Form & Fetch ALL Blocked Dates
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

// Watch Entrante -> Update Form & Fetch ALL Blocked Dates
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

// Combine everything
const combinedDisabledDates = computed(() => {
  const fromProps = (props.fechasBloqueadas || []).map(parseDateStr)
  return [...fromProps, ...salienteBlockedDates.value, ...entranteBlockedRanges.value]
})

const combinedDateAttributes = computed(() => {
  if (combinedDisabledDates.value.length === 0) return []
  return [
    {
      highlight: {
        color: 'red',
        fillMode: 'light'
      },
      dates: combinedDisabledDates.value
    }
  ]
})

// --- Validation Logic ---
const validationError = computed(() => {
  // 1. Validar conflicto de usuarios
  if (registroLocal.rut_saliente && registroLocal.rut_entrante) {
    if (registroLocal.rut_saliente === registroLocal.rut_entrante) {
      return 'El funcionario saliente y entrante no pueden ser la misma persona.'
    }
  }

  // 2. Validar Fechas
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
    } else {
      // If no end date set yet, we only validate start against blocks if strictly needed,
      // but usually we validate range. If single day replacment assumption?
      // IStaff says "input start and end".
      // If end is missing, we assume end = start for blocking check?
      // No, let's wait for end date usually. But if IStaff only wants 1 day...
      // Let's assume end = start if not provided for safety check?
      // Or just check conflict for start date.
      const startEnd = new Date(start)
      startEnd.setHours(23, 59, 59, 999)
      end = startEnd
    }

    // Default to Check Overlap (supports Date or range { start, end })
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

  // 3. Validar Causal de Ausencia y Observaciones
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
  if (isBolsaMode.value) {
    const bolsaComplete = Boolean(
      registroLocal.rut_saliente &&
      registroLocal.tipo_turno &&
      registroLocal.servicio &&
      registroLocal.fecha_inicio &&
      registroLocal.fecha_termino &&
      registroLocal.motivo
    )
    if (!bolsaComplete) return false
    if (registroLocal.motivo === 'OTRO') {
      return Boolean(registroLocal.observaciones && registroLocal.observaciones.trim().length > 0)
    }
    return true
  }

  const baseComplete = Boolean(
    registroLocal.rut_saliente &&
    registroLocal.rut_entrante &&
    registroLocal.tipo_turno &&
    registroLocal.servicio &&
    registroLocal.fecha_inicio &&
    registroLocal.fecha_termino &&
    registroLocal.motivo
  )

  if (!baseComplete) return false

  if (registroLocal.motivo === 'OTRO') {
    return Boolean(registroLocal.observaciones && registroLocal.observaciones.trim().length > 0)
  }

  return true
})

// --- Watchers ---
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
      if (props.initialBolsaMode) {
        isBolsaMode.value = true
      }
      if (serviceStore.services.length === 0) {
        await serviceStore.fetchServices()
      }
      if (turnTypeStore.turnTypes.length === 0) {
        await turnTypeStore.fetchTurnTypes(true)
      }
      // Reset logic if needed
      if (!registroLocal.fecha_inicio) registroLocal.fecha_inicio = todayString()
      if (!registroLocal.fecha_termino) registroLocal.fecha_termino = todayString()
    }
  }
)

// Sync Termino with Inicio
watch(
  () => registroLocal.fecha_inicio,
  (newVal) => {
    if (newVal) {
      registroLocal.fecha_termino = newVal
    }
  }
)

// --- Date Logic ---
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

// --- Helpers ---
function getInitials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function abrirConfirmacion() {
  if (validationError.value) return
  showConfirmacion.value = true
}

function confirmarGuardar() {
  showConfirmacion.value = false
  
  // Clean payload for strict backend
  const payload = { ...registroLocal } as any
  
  // Force strict UTC Dates
  if (payload.fecha_inicio) {
    const [y, m, d] = String(payload.fecha_inicio).split('T')[0].split('-').map(Number)
    payload.fecha_inicio = new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString()
  }
  
  if (payload.fecha_termino) {
    const [y, m, d] = String(payload.fecha_termino).split('T')[0].split('-').map(Number)
    payload.fecha_termino = new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString()
  }

  // Ensure ObjectIds are strings, not objects (Vue-Select sometimes binds objects)
  if (typeof payload.id_saliente === 'object' && payload.id_saliente?._id) payload.id_saliente = payload.id_saliente._id
  if (typeof payload.id_entrante === 'object' && payload.id_entrante?._id) payload.id_entrante = payload.id_entrante._id
  if (typeof payload.servicio === 'object' && payload.servicio?._id) payload.servicio = payload.servicio._id

  payload.motivo = registroLocal.motivo
  payload.observaciones = registroLocal.observaciones && registroLocal.observaciones.trim() ? registroLocal.observaciones.trim() : undefined

  if (isBolsaMode.value) {
    const offerPayload = {
      serviceId: payload.servicio,
      positionId: (selectedSaliente.value?.positionId as any)?._id || selectedSaliente.value?.positionId,
      id_saliente: payload.id_saliente,
      motivo: payload.motivo,
      observaciones: payload.observaciones,
      tipo_turno: payload.tipo_turno,
      fecha_inicio: payload.fecha_inicio,
      fecha_termino: payload.fecha_termino,
      expiresAt: computedExpiresAt.value,
    }

    try {
      const offerStore = useReplacementOfferStore()
      offerStore.createOffer(offerPayload)
    } catch {
      // Graceful fallback
    }

    emit('cerrar')
    return
  }

  emit('guardar', payload as ReplacementRegistration)
}

function cancelarConfirmacion() {
  showConfirmacion.value = false
}
</script>

<style scoped>
.modal-content {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

/* IStaff Cards */
.IStaff-card {
  transition: all 0.2s ease;
  height: 100%;
}
.IStaff-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.avatar-empty {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.avatar-filled {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.bg-gradient-danger {
  background: linear-gradient(135deg, #fecaca 0%, #ef4444 100%);
}
.bg-gradient-success {
  background: linear-gradient(135deg, #bbf7d0 0%, #22c55e 100%);
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.connector-icon {
  width: 40px;
  height: 40px;
}

.form-control:focus {
  box-shadow: none;
  background-color: #f8fafc;
}

.custom-v-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 4px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 500;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.8);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: none;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 8px;
  font-size: 0.875rem;
  border: 1px solid #e2e8f0;
  max-height: 210px; /* Limit to approx 5 items */
  overflow-y: auto;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.375rem;
  padding: 8px 12px;
  margin-bottom: 2px;
  color: #475569;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

/* Typography */
.x-small {
  font-size: 0.7rem;
}
.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.tracking-wider {
  letter-spacing: 0.05em;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 🏢 ENTERPRISE: Custom v-select styles for IStaff selection */
.IStaff-select-danger :deep(.vs__dropdown-toggle),
.IStaff-select-success :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 6px;
  background: white;
  min-height: 60px; /* Fixed height to prevent expansion */
  max-height: 60px;
  overflow: hidden;
}

.IStaff-select-danger :deep(.vs__selected-options),
.IStaff-select-success :deep(.vs__selected-options) {
  min-height: 48px;
  max-height: 48px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.IStaff-select-danger :deep(.vs__selected),
.IStaff-select-success :deep(.vs__selected) {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
}

.IStaff-select-danger :deep(.vs__dropdown-toggle) {
  border-color: rgba(239, 68, 68, 0.3);
}

.IStaff-select-success :deep(.vs__dropdown-toggle) {
  border-color: rgba(34, 197, 94, 0.3);
}

.IStaff-select-danger :deep(.vs__dropdown-toggle):hover,
.IStaff-select-success :deep(.vs__dropdown-toggle):hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.IStaff-select-danger :deep(.vs__search::placeholder),
.IStaff-select-success :deep(.vs__search::placeholder) {
  color: #94a3b8;
  font-size: 0.875rem;
}

.IStaff-select-danger :deep(.vs__dropdown-menu),
.IStaff-select-success :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 4px;
  max-height: 240px;
  overflow-y: auto;
  min-width: 320px; /* Balanced width for info display */
  z-index: 9999; /* Above everything */
}

.IStaff-select-danger :deep(.vs__dropdown-option),
.IStaff-select-success :deep(.vs__dropdown-option) {
  border-radius: 0.375rem;
  padding: 10px 12px;
  margin-bottom: 2px;
  font-size: 0.875rem;
}

.IStaff-select-danger :deep(.vs__dropdown-option--highlight) {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.IStaff-select-success :deep(.vs__dropdown-option--highlight) {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.IStaff-select-danger :deep(.vs__spinner),
.IStaff-select-success :deep(.vs__spinner) {
  border-left-color: #3b82f6;
}

.IStaff-option {
  width: 100%;
}
</style>
