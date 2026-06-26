<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      v-if="visible"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-md modal-dialog-centered" role="document">
        <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div class="modal-header border-0 bg-danger bg-gradient text-white p-4">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-exclamation-octagon-fill me-2"></i>SUSTITUCIÓN DE REEMPLAZANTE
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="$emit('cerrar')"
              aria-label="Close"
            ></button>
          </div>

          <div class="modal-body p-4 bg-white">
            <h5 class="text-danger fw-bold mb-3 smaller text-uppercase tracking-wider">
              <i class="bi bi-exclamation-triangle-fill me-2"></i> Confirmación de Corte
            </h5>

            <div class="alert alert-warning border-0 p-3 mb-4 rounded-3 shadow-sm" role="alert">
              <i class="bi bi-info-circle-fill me-2"></i>Esta acción **cierra** el segmento actual y
              **crea uno nuevo**. Ambos registros conservarán el Código del evento original.
            </div>

            <div class="p-3 bg-light rounded-3 border border-1 shadow-xs mb-4">
              <h6 class="text-secondary fw-bold smaller text-uppercase mb-3">
                Segmento Actual a Finalizar
              </h6>
              <p class="mb-2 d-flex align-items-center">
                <i class="bi bi-person-circle me-2 text-primary"></i>
                <span class="text-secondary me-2">Funcionario:</span>
                <span class="fw-bold text-dark"
                  >{{ registroActual.nombre_entrante }} {{ registroActual.apellido_entrante }}</span
                >
              </p>
              <p class="mb-3 d-flex align-items-center">
                <i class="bi bi-calendar-event me-2 text-primary"></i>
                <span class="text-secondary me-2">Inicio Original:</span>
                <span class="fw-bold text-dark">{{ formattedInicioOriginal }}</span>
              </p>

              <hr class="my-3 opacity-10" />

              <div class="mb-2">
                <label class="text-danger fw-semibold smaller mb-1"
                  >Último Día Trabajado (Funcionario A) *</label
                >
                <DatePicker
                  :model-value="fechaCorteA"
                  @update:model-value="onDateUpdate"
                  :min-date="minDate"
                  :max-date="maxDate"
                  timezone="UTC"
                  :popover="{ visibility: 'click' }"
                  :model-config="{ type: 'string', mask: 'YYYY-MM-DD' }"
                  class="w-100"
                >
                  <template #default="{ inputValue, inputEvents }">
                    <input
                      class="form-control bg-white border-danger border-opacity-25 shadow-sm rounded-3"
                      :value="inputValue"
                      v-on="inputEvents"
                      placeholder="Seleccione la fecha de corte"
                      readonly
                    />
                  </template>
                </DatePicker>
              </div>
              <div class="form-text text-danger smaller ps-1">
                <i class="bi bi-info-circle me-1"></i>Esta será la nueva fecha de término del
                registro actual.
              </div>
            </div>

            <div class="p-3 bg-light rounded-3 border border-1 shadow-xs">
              <h6 class="text-secondary fw-bold smaller text-uppercase mb-3">
                Nuevo Funcionario Entrante
              </h6>

              <div
                class="alert alert-success border-0 bg-success bg-opacity-10 p-2 mb-3 rounded-3 shadow-none d-flex align-items-center smaller"
              >
                <i class="bi bi-calendar-check-fill me-2 text-success"></i>
                <span class="text-success-dark">
                  El nuevo reemplazo iniciará el
                  <strong>{{ fechaInicioB || 'Día siguiente a la Fecha de Corte' }}</strong>
                </span>
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary mb-1">
                  Buscar Nuevo Funcionario
                </label>
                <v-select
                  v-model="selectedUser"
                  :options="userOptions"
                  :filterable="false"
                  :loading="isSearchingUser"
                  @search="searchUsers"
                  label="displayName"
                  placeholder="Buscar por RUT o nombre..."
                  class="premium-select"
                >
                  <template #option="option">
                    <div class="user-option">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <span class="fw-bold text-dark">{{ option.rut }}</span>
                          <span class="text-secondary ms-2"
                            >{{ option.nombre }} {{ option.apellido }}</span
                          >
                        </div>
                        <span class="badge bg-primary">{{ option.tipo_cargo }}</span>
                      </div>
                    </div>
                  </template>
                  <template #selected-option="option">
                    <div class="d-flex align-items-center">
                      <div class="fw-bold text-dark text-truncate">
                        {{ option.nombre }} {{ option.apellido }}
                        <small class="text-muted ms-1">({{ option.rut }})</small>
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

              <div
                v-if="isSameUser"
                class="alert alert-danger border-0 p-2 mb-3 rounded-3 shadow-none d-flex align-items-center smaller"
              >
                <i class="bi bi-x-circle-fill me-2"></i>
                <span>El funcionario entrante no puede ser el mismo que el actual.</span>
              </div>
            </div>
          </div>

          <div class="modal-footer border-0 p-4 pt-0 d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-light fw-bold px-4 border text-secondary"
              @click="$emit('cerrar')"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-danger fw-bold px-4 shadow-sm"
              @click="abrirConfirmacion"
              :disabled="!isFormValid"
            >
              <i class="bi bi-check-lg me-2"></i>Confirmar Sustitución
            </button>
          </div>

          <ConfirmationModal
            :visible="showConfirmacion"
            mensaje="¿Deseas guardar los cambios realizados?"
            @confirmar="confirmarGuardar"
            @cancelar="cancelarConfirmacion"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { type ReplacementRegistration } from '@/types/replacement.types'
import { computed, ref, watch } from 'vue'
import ConfirmationModal from '../common/ConfirmationModal.vue'
import { DatePicker } from 'v-calendar'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import 'v-calendar/style.css'
import { debounce } from 'lodash-es'
import { useUserStore } from '@/stores/user.store'

interface ReemplazoModalData extends Partial<ReplacementRegistration> {
  fecha_inicio?: string
  fecha_termino?: string
}

const props = defineProps<{
  visible: boolean
  registroActual: ReemplazoModalData
  fechaCorteA: string
  nuevoFuncionarioB: Partial<ReemplazoModalData>
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'sustituir-usuario'): void
  (e: 'update:fechaCorteA', nuevaFecha: string): void
  (e: 'confirmar-sustitucion'): void
  (e: 'update:nuevoFuncionarioB', val: any): void
}>()

// Formatear Fecha Inicio Original (DD-MM-YYYY)
const formattedInicioOriginal = computed(() => {
  if (!props.registroActual.fecha_inicio) return 'N/A'
  const [year, month, day] = props.registroActual.fecha_inicio.split('-')
  return `${day}-${month}-${year}`
})

// Fecha mínima (Hoy)
// Usamos UTC para alinearnos con el comportamiento del DatePicker en modo UTC
const now = new Date()
const minDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

// Fecha máxima (Término Original - 1 día)
const maxDate = computed(() => {
  if (!props.registroActual.fecha_termino) return undefined

  // Parseamos la fecha de término (YYYY-MM-DD) y la tratamos como UTC
  const [y, m, d] = props.registroActual.fecha_termino.split('-').map(Number)
  const termino = new Date(Date.UTC(y, m - 1, d))

  // Restamos 1 día en UTC
  termino.setUTCDate(termino.getUTCDate() - 1)

  return termino
})

// Configurar fecha por defecto cuando se abre el modal
watch(
  () => props.visible,
  (newVal: boolean) => {
    if (newVal) {
      // Generar string YYYY-MM-DD local
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const today = `${year}-${month}-${day}`

      emit('update:fechaCorteA', today)
    }
  },
  { immediate: true }
)

function onDateUpdate(val: any) {
  if (!val) {
    emit('update:fechaCorteA', '')
    return
  }

  // Si recibimos un objeto Date, lo convertimos a string YYYY-MM-DD
  // Asumiendo que v-calendar con timezone="UTC" nos da una fecha UTC correcta para el día seleccionado
  if (val instanceof Date) {
    const year = val.getUTCFullYear()
    const month = String(val.getUTCMonth() + 1).padStart(2, '0')
    const day = String(val.getUTCDate()).padStart(2, '0')
    emit('update:fechaCorteA', `${year}-${month}-${day}`)
  } else if (typeof val === 'string') {
    // Si ya es string, lo emitimos tal cual
    if (val.includes('T')) {
      emit('update:fechaCorteA', val.split('T')[0])
    } else {
      emit('update:fechaCorteA', val)
    }
  }
}

// Fecha de inicio B (Día siguiente al corte)
const fechaInicioB = computed(() => {
  if (!props.fechaCorteA || typeof props.fechaCorteA !== 'string') return ''

  try {
    const [y, m, d] = props.fechaCorteA.split('-').map(Number)
    if (!y || !m || !d) return ''

    // Validar si la fecha excede el máximo permitido
    // Esto es visual en el calendario (max-date) pero validamos lógica aquí también

    const corte = new Date(y, m - 1, d)
    corte.setDate(corte.getDate() + 1)

    const day = String(corte.getDate()).padStart(2, '0')
    const month = String(corte.getMonth() + 1).padStart(2, '0')
    const year = corte.getFullYear()

    return `${day}-${month}-${year}`
  } catch (e) {
    console.error('Error calculando fechaInicioB:', e)
    return ''
  }
})

// User Search Logic
const userStore = useUserStore()
const selectedUser = ref<any>(null)
const userOptions = ref<any[]>([])
const isSearchingUser = ref(false)

// 🚀 Debounced Search with Lodash (300ms) - Consistent with ReportsView
const performSearch = debounce(async (search: string, loading: (l: boolean) => void) => {
  try {
    await userStore.searchUsers({ search, page: 1, limit: 10 })

    userOptions.value = userStore.searchResults.map((u: any) => ({
      ...u,
      displayName: `${u.rut} - ${u.nombre} ${u.apellido}`
    }))
  } catch (error) {
    console.error('Error searching users:', error)
  } finally {
    loading(false)
    isSearchingUser.value = false
  }
}, 300)

const searchUsers = (search: string, loading: (l: boolean) => void) => {
  if (search.length < 2) {
    userOptions.value = []
    return
  }

  // 1. Immediate UI Feedback
  loading(true)
  isSearchingUser.value = true

  // 2. Debounced API Call
  performSearch(search, loading)
}

// Watch selection and emit update
watch(selectedUser, (user) => {
  if (user) {
    emit('update:nuevoFuncionarioB', {
      rut_entrante: user.rut,
      nombre_entrante: user.nombre,
      apellido_entrante: user.apellido,
      id_entrante: user._id,
      tipo_cargo: user.tipo_cargo
    })
  } else {
    emit('update:nuevoFuncionarioB', {})
  }
})

// Initialize selectedUser if prop has data (re-opening modal)
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.nuevoFuncionarioB && props.nuevoFuncionarioB.rut_entrante) {
        selectedUser.value = {
          rut: props.nuevoFuncionarioB.rut_entrante,
          nombre: props.nuevoFuncionarioB.nombre_entrante,
          apellido: props.nuevoFuncionarioB.apellido_entrante,
          _id: props.nuevoFuncionarioB.id_entrante
        }
      } else {
        selectedUser.value = null
      }
    }
  },
  { immediate: true }
)

// Validar que no sea el mismo usuario
const isSameUser = computed(() => {
  if (!props.registroActual.rut_entrante || !selectedUser.value?.rut) return false
  return props.registroActual.rut_entrante === selectedUser.value.rut
})

const isFormValid = computed(() => {
  const hasFechaCorte = !!props.fechaCorteA
  const hasFuncionarioB = !!props.nuevoFuncionarioB.rut_entrante

  // Validar lógica de fechas: Corte debe ser menor que Término
  // Aunque max-date previene selección visual, es bueno asegurar
  if (hasFechaCorte && props.registroActual.fecha_termino) {
    if (props.fechaCorteA >= props.registroActual.fecha_termino) {
      return false
    }
  }

  // Validar usuario duplicado
  if (isSameUser.value) {
    return false
  }

  return hasFechaCorte && hasFuncionarioB
})

const showConfirmacion = ref(false)

function abrirConfirmacion() {
  showConfirmacion.value = true
}

function confirmarGuardar() {
  showConfirmacion.value = false
  emit('confirmar-sustitucion')
}

function cancelarConfirmacion() {
  showConfirmacion.value = false
}
</script>

<style scoped>
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.smaller {
  font-size: 0.75rem;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.alert-warning {
  background-color: #fffbeb;
  color: #92400e;
}

button {
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

button:active {
  transform: translateY(0);
}

/* Base Styles for Premium Selects (User Search + Dates) */
.premium-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 3px;
  background: white;
  box-shadow: none;
  transition: all 0.2s ease;
  min-height: 42px;
}

/* Search Input */
.premium-select :deep(.vs__search) {
  font-size: 0.875rem;
  color: #1e293b;
}

.premium-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
}

/* Selected Text */
.premium-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
}

/* Arrow/Actions */
.premium-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.8);
}

/* Dropdown Menu */
.premium-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 5px;
  font-size: 0.875rem;
  margin-top: 4px;
  z-index: 1000;
}

/* Options */
.premium-select :deep(.vs__dropdown-option) {
  border-radius: 0.25rem;
  padding: 6px 10px;
  margin-bottom: 2px;
  color: #475569;
}

.premium-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

/* Hover & Focus */
.premium-select:hover :deep(.vs__dropdown-toggle) {
  border-color: #cbd5e1;
}

.premium-select :deep(.vs--open .vs__dropdown-toggle),
.premium-select:focus-within :deep(.vs__dropdown-toggle) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
</style>
