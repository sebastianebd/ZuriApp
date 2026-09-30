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
                <i class="bi bi-calendar-plus text-primary fs-5"></i>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h5 class="modal-title fw-bold text-dark mb-0 modal-title-custom">Asignar Turno Planta</h5>
                  <span class="badge-role-tag">Dotación Planta</span>
                </div>
                <p class="text-secondary small mb-0 mt-1">
                  Define y programa el ciclo operativo de turnos para el funcionario de dotación.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="btn-close-modal"
              @click="emit('cerrar')"
              aria-label="Cerrar modal"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- BODY CON DOBLE BISEL -->
          <div class="modal-body p-4 bg-surface">
            <form @submit.prevent="guardar">
              <!-- SECCIÓN 1: FUNCIONARIO Y SERVICIO -->
              <div class="vanguard-section-card mb-3 p-3 p-md-4">
                <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div class="d-flex align-items-center gap-2">
                    <span class="section-indicator bg-primary"></span>
                    <h6 class="fw-bold text-dark mb-0 section-heading">Identificación y Asignación</h6>
                  </div>
                  <span class="badge bg-light text-primary border x-small">
                    Personal de Planta
                  </span>
                </div>

                <div class="row g-3">
                  <!-- Selector Funcionario PLANTA -->
                  <div class="col-12 col-md-6">
                    <label class="form-label staff-field-label mb-1">
                      Funcionario (PLANTA) <span class="text-danger">*</span>
                    </label>
                    <v-select
                      v-model="selectedUser"
                      :options="userOptions"
                      :filterable="false"
                      :loading="isSearchingUser"
                      @search="searchUser"
                      label="displayName"
                      placeholder="Buscar por RUT o nombre..."
                      class="custom-v-select staff-v-select"
                      :class="{ 'is-invalid': errors.staffId }"
                    >
                      <template #option="option">
                        <div class="IStaff-option py-1">
                          <div class="d-flex justify-content-between align-items-center">
                            <div>
                              <span class="fw-bold text-dark font-monospace x-small">{{ option.rut }}</span>
                              <span class="text-secondary ms-2 small">{{ option.firstName }} {{ option.lastName }}</span>
                            </div>
                            <span class="badge bg-light text-primary border x-small">
                              {{ option.positionId?.name || option.roleId?.name || 'PLANTA' }}
                            </span>
                          </div>
                        </div>
                      </template>
                      <template #selected-option="option">
                        <div class="d-flex align-items-center py-1">
                          <div class="avatar-squircle avatar-planta-xs shadow-xs me-2">
                            {{ option.firstName?.charAt(0) }}{{ option.lastName?.charAt(0) }}
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
                          <span v-else>No se encontraron funcionarios PLANTA</span>
                        </div>
                      </template>
                    </v-select>
                    <div v-if="errors.staffId" class="text-danger x-small fw-semibold mt-1">
                      {{ errors.staffId }}
                    </div>
                  </div>

                  <!-- Selector Servicio -->
                  <div class="col-12 col-md-6">
                    <label class="form-label staff-field-label mb-1">
                      Servicio Clínico <span class="text-danger">*</span>
                    </label>
                    <v-select
                      v-model="form.service"
                      :options="serviceOptions"
                      label="nombre"
                      :reduce="(s: any) => s._id"
                      placeholder="Seleccione servicio..."
                      class="custom-v-select small-select"
                      :class="{ 'is-invalid': errors.service }"
                      :clearable="false"
                    />
                    <div v-if="errors.service" class="text-danger x-small fw-semibold mt-1">
                      {{ errors.service }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- SECCIÓN 2: PATRÓN DE TURNO Y RANGO DE FECHAS -->
              <div class="vanguard-section-card p-3 p-md-4">
                <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div class="d-flex align-items-center gap-2">
                    <span class="section-indicator bg-indigo"></span>
                    <h6 class="fw-bold text-dark mb-0 section-heading">Ciclo y Rango de Fechas</h6>
                  </div>
                  <span class="badge bg-light text-secondary border x-small">
                    Programación Operativa
                  </span>
                </div>

                <div class="row g-3">
                  <!-- Tipo de Turno -->
                  <div class="col-12">
                    <label class="form-label staff-field-label mb-1">
                      Tipo de Turno <span class="text-danger">*</span>
                    </label>
                    <v-select
                      v-model="form.turn_type"
                      :options="turnTypeOptions"
                      placeholder="Seleccione tipo de turno..."
                      class="custom-v-select small-select"
                      :class="{ 'is-invalid': errors.turn_type }"
                    />
                    <div v-if="errors.turn_type" class="text-danger x-small fw-semibold mt-1">
                      {{ errors.turn_type }}
                    </div>
                  </div>

                  <!-- Fecha Inicio -->
                  <div class="col-12 col-md-6">
                    <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                      <i class="bi bi-calendar-event text-secondary"></i>
                      <span>Fecha Inicio</span>
                      <span class="text-danger">*</span>
                    </label>
                    <DatePicker
                      ref="startDatePicker"
                      v-model="form.start_date"
                      :popover="{ visibility: 'click', placement: 'bottom' }"
                      :masks="{ input: 'DD/MM/YYYY' }"
                      :disabled-dates="vCalendarDisabledDates"
                    >
                      <template #default="{ inputValue, inputEvents }">
                        <div class="input-group modern-input-group">
                          <span class="input-group-text">
                            <i class="bi bi-calendar3"></i>
                          </span>
                          <input
                            class="form-control modern-date-input"
                            :class="{ 'is-invalid': errors.start_date }"
                            :value="inputValue"
                            v-on="inputEvents"
                            @click="closeOtherPicker('end')"
                            placeholder="dd/mm/aaaa"
                            readonly
                          />
                        </div>
                      </template>
                    </DatePicker>
                    <div v-if="errors.start_date" class="text-danger x-small fw-semibold mt-1">
                      {{ errors.start_date }}
                    </div>
                    <small class="form-text text-muted x-small mt-1 d-block">
                      Determina el día inicial del ciclo de turno seleccionado.
                    </small>
                  </div>

                  <!-- Fecha Término -->
                  <div class="col-12 col-md-6">
                    <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                      <i class="bi bi-calendar-check text-secondary"></i>
                      <span>Fecha Término</span>
                      <span class="text-danger">*</span>
                    </label>
                    <DatePicker
                      ref="endDatePicker"
                      v-model="form.end_date"
                      :popover="{ visibility: 'click', placement: 'bottom' }"
                      :masks="{ input: 'DD/MM/YYYY' }"
                      :min-date="form.start_date || undefined"
                      :disabled-dates="vCalendarDisabledDates"
                    >
                      <template #default="{ inputValue, inputEvents }">
                        <div class="input-group modern-input-group">
                          <span class="input-group-text">
                            <i class="bi bi-calendar-x"></i>
                          </span>
                          <input
                            class="form-control modern-date-input"
                            :class="{ 'is-invalid': errors.end_date }"
                            :value="inputValue"
                            v-on="inputEvents"
                            @click="closeOtherPicker('start')"
                            placeholder="dd/mm/aaaa"
                            readonly
                          />
                        </div>
                      </template>
                    </DatePicker>
                    <div v-if="errors.end_date" class="text-danger x-small fw-semibold mt-1">
                      {{ errors.end_date }}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- FOOTER VANGUARDISTA -->
          <div class="modal-footer vanguard-modal-footer p-3 px-4 border-top d-flex justify-content-between align-items-center bg-white">
            <button
              type="button"
              class="btn btn-secondary-pill"
              @click="emit('cerrar')"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary btn-primary-pill d-flex align-items-center gap-2"
              @click="guardar"
              :disabled="loading"
            >
              <span class="btn-icon-wrap primary">
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <i v-else class="bi bi-check-lg"></i>
              </span>
              <span>{{ loading ? 'Asignando...' : 'Asignar Turno' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { useStaffStore } from '@/stores/staff.store'
import { useTurnAssignmentStore } from '@/stores/turn-assignment.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { useServiceStore } from '@/stores/service.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import { type IStaff } from '@/types/staff.types'
import { findNextAvailableDate } from '@/utils/date-utils'

const props = defineProps<{
  visible: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', payload: any): void
}>()

const usersStore = useStaffStore()
const turnAssignmentStore = useTurnAssignmentStore()
const serviceStore = useServiceStore()
const turnTypeStore = useTurnTypeStore()
const replacementStore = useReplacementStore()

const INDEFINITE_END_DATE = new Date('2099-12-31T23:59:59Z')

const selectedUser = ref<IStaff | null>(null)
const userOptions = ref<IStaff[]>([])
const isSearchingUser = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const searchUser = (query: string, loading: (isLoading: boolean) => void) => {
  if (!query || query.length < 2) {
    userOptions.value = []
    return
  }

  loading(true)
  isSearchingUser.value = true

  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(async () => {
    try {
      await usersStore.searchStaff({
        search: query.trim(),
        page: 1,
        limit: 20
      })

      const plantaUsers = usersStore.searchResults.filter((u) => u.contractType === 'PLANTA')

      userOptions.value = plantaUsers.map((u) => ({
        ...u,
        displayName: `${u.rut} - ${u.firstName} ${u.lastName}`
      }))
    } catch (error) {
      console.error('[TurnAssignmentModal] Search staff error:', error)
      userOptions.value = []
    } finally {
      loading(false)
      isSearchingUser.value = false
    }
  }, 300)
}

const turnTypeOptions = computed(() => {
  return turnTypeStore.turnTypes.map((t) => t.nombre)
})

const serviceOptions = computed(() => {
  return serviceStore.services || []
})

const form = ref({
  staffId: '',
  service: '',
  turn_type: '',
  start_date: null as Date | null,
  end_date: null as Date | null
})

const errors = ref<Record<string, string>>({})

watch(
  () => props.visible,
  async (newVal) => {
    if (newVal) {
      resetForm()
      try {
        await Promise.all([serviceStore.fetchServices(), turnTypeStore.fetchTurnTypes(true)])
      } catch (e) {
        console.error('Error fetching data', e)
      }
    }
  }
)

function resetForm() {
  form.value = {
    staffId: '',
    service: '',
    turn_type: '',
    start_date: new Date(),
    end_date: new Date()
  }
  selectedUser.value = null
  userOptions.value = []
  errors.value = {}
}

const startDatePicker = ref()
const endDatePicker = ref()

function closeOtherPicker(current: 'start' | 'end') {
  if (current === 'start' && endDatePicker.value) {
    endDatePicker.value.hidePopover()
  } else if (current === 'end' && startDatePicker.value) {
    startDatePicker.value.hidePopover()
  }
}

const blockedDates = ref<any[]>([])

function getBlockedDates(assignments: any[]) {
  return assignments.map((a) => {
    const s = new Date(a.start_date)
    const start = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), 12, 0, 0))
    
    let end = null
    if (a.end_date) {
      const e = new Date(a.end_date)
      end = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate(), 12, 0, 0))
    }
    
    return { start, end }
  })
}

const vCalendarDisabledDates = computed(() => {
  return blockedDates.value.map((range) => ({
    start: range.start,
    end: range.end || INDEFINITE_END_DATE
  }))
})

watch(selectedUser, async (newUser) => {
  if (newUser) {
    form.value.staffId = newUser._id
    if (errors.value.staffId) delete errors.value.staffId

    try {
      const assignments = await turnAssignmentStore.fetchAssignmentsByUser(newUser._id)
      const shiftBlocks = getBlockedDates(assignments)

      const replacements = await replacementStore.checkConflicts({
        search: newUser.rut,
        limit: 100
      })

      const absenceDateStrings = replacementStore.getFechasAusencia(newUser._id, replacements)
      const absenceBlocks = absenceDateStrings.map((dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number)
        const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
        return { start: dateObj, end: dateObj }
      })

      blockedDates.value = [...shiftBlocks, ...absenceBlocks]

      const nextAvailable = findNextAvailableDate(new Date(), blockedDates.value)
      form.value.start_date = nextAvailable
      form.value.end_date = nextAvailable
    } catch (err) {
      console.error('Error fetching user blocked dates:', err)
      blockedDates.value = []
    }
  } else {
    form.value.staffId = ''
    blockedDates.value = []
  }
})

function validateForm() {
  errors.value = {}
  let isValid = true

  if (!form.value.staffId) {
    errors.value.staffId = 'Debe seleccionar un funcionario'
    isValid = false
  }

  if (!form.value.service) {
    errors.value.service = 'Debe seleccionar un servicio'
    isValid = false
  }

  if (!form.value.turn_type) {
    errors.value.turn_type = 'Debe seleccionar un tipo de turno'
    isValid = false
  }

  if (!form.value.start_date) {
    errors.value.start_date = 'La fecha de inicio es requerida'
    isValid = false
  }

  if (!form.value.end_date) {
    errors.value.end_date = 'La fecha de término es requerida'
    isValid = false
  }

  if (form.value.start_date && form.value.end_date) {
    if (form.value.end_date < form.value.start_date) {
      errors.value.end_date = 'La fecha de término no puede ser anterior a la de inicio'
      isValid = false
    }
  }

  if (form.value.start_date) {
    const newStart = new Date(form.value.start_date)
    newStart.setHours(0, 0, 0, 0)

    const newEnd = form.value.end_date ? new Date(form.value.end_date) : INDEFINITE_END_DATE
    newEnd.setHours(23, 59, 59, 999)

    const hasOverlap = blockedDates.value.some((range) => {
      const blockedStart = new Date(range.start)
      blockedStart.setHours(0, 0, 0, 0)

      const blockedEnd = range.end ? new Date(range.end) : INDEFINITE_END_DATE
      blockedEnd.setHours(23, 59, 59, 999)

      return newStart <= blockedEnd && newEnd >= blockedStart
    })

    if (hasOverlap) {
      errors.value.start_date =
        'La fecha seleccionada entra en conflicto con una ausencia o turno existente.'
      errors.value.end_date =
        'La fecha seleccionada entra en conflicto con una ausencia o turno existente.'
      isValid = false
    }
  }

  return isValid
}

function guardar() {
  if (!validateForm()) return

  emit('guardar', {
    staffId: form.value.staffId,
    service: form.value.service,
    turn_type: form.value.turn_type,
    start_date: form.value.start_date,
    end_date: form.value.end_date
  })
}
</script>

<style scoped>
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Modal Dialog */
.modal-custom-width {
  max-width: 780px;
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

.badge-role-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #2563eb;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 2px 8px;
  border-radius: 6px;
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

/* Avatars */
.avatar-squircle {
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.avatar-planta-xs {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 700;
}

/* Fields & Labels */
.staff-field-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.01em;
}

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
  padding: 0.45rem 0.75rem;
  color: #1e293b;
  font-variant-numeric: tabular-nums;
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

/* Invalid States */
.is-invalid {
  border-color: #ef4444 !important;
}

.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
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
