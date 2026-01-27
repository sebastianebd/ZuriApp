<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      v-if="visible"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content shadow-2xl border-0 rounded-4">
          <!-- HEADER -->
          <div class="modal-header border-bottom p-4">
            <div>
              <h5 class="modal-title fw-bold text-dark">
                <i class="bi bi-calendar-plus text-primary me-2"></i>Asignar Turno Planta
              </h5>
              <p class="text-secondary small mb-0 mt-1">
                Define el patrón de turnos para un funcionario de planta.
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="emit('cerrar')"
              aria-label="Close"
            ></button>
          </div>

          <!-- BODY -->
          <div class="modal-body p-4 bg-light bg-opacity-50">
            <form @submit.prevent="guardar">
              <div class="bg-white p-4 rounded-4 shadow-sm border">
                <!-- 🏢 ENTERPRISE: User Selection with v-select -->
                <div class="mb-4 position-relative">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase"
                    >Funcionario (PLANTA)</label
                  >
                  <v-select
                    v-model="selectedUser"
                    :options="userOptions"
                    :filterable="false"
                    :loading="isSearchingUser"
                    @search="searchUser"
                    label="displayName"
                    placeholder="Buscar funcionario PLANTA..."
                    class="user-select-planta"
                    :class="{ 'is-invalid': errors.user_id }"
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
                        <div
                          class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                          style="width: 32px; height: 32px; font-size: 0.75rem"
                        >
                          <span class="fw-bold"
                            >{{ option.nombre.charAt(0) }}{{ option.apellido.charAt(0) }}</span
                          >
                        </div>
                        <div>
                          <div class="fw-bold text-dark" style="font-size: 0.875rem">
                            {{ option.nombre }} {{ option.apellido }}
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
                        <span v-else>No se encontraron funcionarios PLANTA</span>
                      </div>
                    </template>
                  </v-select>
                  <div v-if="errors.user_id" class="text-danger x-small fw-bold floating-error">
                    {{ errors.user_id }}
                  </div>
                </div>

                <!-- Service Selection -->
                <div class="mb-4 position-relative">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase"
                    >Servicio</label
                  >
                  <v-select
                    v-model="form.service"
                    :options="serviceOptions"
                    placeholder="Seleccione servicio"
                    class="custom-v-select"
                    :class="{ 'is-invalid': errors.service }"
                    :clearable="false"
                  />
                  <div v-if="errors.service" class="invalid-feedback fw-bold floating-error">
                    {{ errors.service }}
                  </div>
                </div>

                <!-- Turn Type -->
                <div class="mb-4 position-relative">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase"
                    >Tipo de Turno</label
                  >
                  <v-select
                    v-model="form.turn_type"
                    :options="turnTypeOptions"
                    placeholder="Seleccione tipo de turno"
                    class="custom-v-select"
                    :class="{ 'is-invalid': errors.turn_type }"
                  />
                  <div v-if="errors.turn_type" class="invalid-feedback fw-bold floating-error">
                    {{ errors.turn_type }}
                  </div>
                </div>

                <!-- Start Date -->
                <div class="mb-4 position-relative">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase"
                    >Fecha Inicio</label
                  >
                  <DatePicker
                    ref="startDatePicker"
                    v-model="form.start_date"
                    :popover="{ visibility: 'click', placement: 'bottom' }"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :disabled-dates="vCalendarDisabledDates"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group">
                        <span class="input-group-text bg-white border-end-0 text-muted">
                          <i class="bi bi-calendar-event"></i>
                        </span>
                        <input
                          class="form-control border-start-0 ps-0"
                          :class="{ 'is-invalid': errors.start_date }"
                          :value="inputValue"
                          v-on="inputEvents"
                          @click="closeOtherPicker('end')"
                          placeholder="Seleccione fecha"
                          readonly
                        />
                      </div>
                    </template>
                  </DatePicker>
                  <div v-if="errors.start_date" class="text-danger x-small fw-bold floating-error">
                    {{ errors.start_date }}
                  </div>
                  <small class="form-text text-muted x-small mt-1 d-block">
                    Esta fecha determina el inicio del ciclo del turno seleccionado.
                  </small>
                </div>

                <!-- End Date (Required) -->
                <div class="mb-2 position-relative">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase"
                    >Fecha Término</label
                  >
                  <DatePicker
                    ref="endDatePicker"
                    v-model="form.end_date"
                    :popover="{ visibility: 'click', placement: 'bottom' }"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :min-date="form.start_date"
                    :disabled-dates="vCalendarDisabledDates"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group">
                        <span class="input-group-text bg-white border-end-0 text-muted">
                          <i class="bi bi-calendar-x"></i>
                        </span>
                        <input
                          class="form-control border-start-0 ps-0"
                          :class="{ 'is-invalid': errors.end_date }"
                          :value="inputValue"
                          v-on="inputEvents"
                          @click="closeOtherPicker('start')"
                          placeholder="Seleccione fecha"
                          readonly
                        />
                      </div>
                    </template>
                  </DatePicker>
                  <div
                    v-if="errors.end_date"
                    class="valid-feedback text-danger d-block x-small fw-bold floating-error"
                  >
                    {{ errors.end_date }}
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer border-top bg-light p-3">
            <button
              type="button"
              class="btn btn-light border fw-bold text-secondary px-4 me-2"
              @click="emit('cerrar')"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary fw-bold px-4 shadow-sm"
              @click="guardar"
              :disabled="loading"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              <span v-else><i class="bi bi-save me-2"></i>Asignar Turno</span>
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
import 'v-calendar/dist/style.css'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { useUserStore } from '@/stores/user.store'
import { useTurnAssignmentStore } from '@/stores/turn-assignment.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { useOptionStore } from '@/stores/option.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import type { User } from '@/types/models'

const props = defineProps<{
  visible: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', payload: any): void
}>()

const usersStore = useUserStore()
const turnAssignmentStore = useTurnAssignmentStore()
const optionStore = useOptionStore()
const turnTypeStore = useTurnTypeStore()
const replacementStore = useReplacementStore()

// 🏢 ENTERPRISE: User search with server-side filtering (PLANTA only)
const selectedUser = ref<User | null>(null)
const userOptions = ref<User[]>([])
const isSearchingUser = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Debounced search for PLANTA users (300ms)
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
      await usersStore.searchUsers({
        search: query.trim(),
        page: 1,
        limit: 20
      })

      // 🏭 CRITICAL: Filter PLANTA only
      const plantaUsers = usersStore.searchResults.filter((u) => u.tipo_contrato === 'PLANTA')

      // Transform results for v-select
      userOptions.value = plantaUsers.map((u) => ({
        ...u,
        displayName: `${u.rut} - ${u.nombre} ${u.apellido}`
      }))
    } catch (error) {
      console.error('[TurnAssignmentModal] Search user error:', error)
      userOptions.value = []
    } finally {
      loading(false)
      isSearchingUser.value = false
    }
  }, 300)
}

// Watch selectedUser and update form
watch(selectedUser, async (newUser) => {
  if (newUser) {
    form.value.user_id = newUser._id
    if (errors.value.user_id) delete errors.value.user_id

    // Fetch assignments for date blocking
    const assignments = await turnAssignmentStore.fetchAssignmentsByUser(newUser._id)
    blockedDates.value = getBlockedDates(assignments)
  } else {
    form.value.user_id = ''
    blockedDates.value = []
  }
})

// Options
const turnTypeOptions = computed(() => {
  return turnTypeStore.turnTypes.map((t) => t.nombre)
})

const serviceOptions = computed(() => {
  return optionStore.opciones?.servicios || []
})

// Form State
const form = ref({
  user_id: '',
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
      // Fetch options only (users loaded via search)
      try {
        await Promise.all([optionStore.mostrarOpciones(), turnTypeStore.fetchTurnTypes(true)])
      } catch (e) {
        console.error('Error fetching data', e)
      }
    }
  }
)

function resetForm() {
  form.value = {
    user_id: '',
    service: '',
    turn_type: '',
    start_date: new Date(),
    end_date: new Date()
  }
  selectedUser.value = null
  userOptions.value = []
  errors.value = {}
}

// DatePicker refs for manual control
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
    return {
      start: new Date(a.start_date),
      end: a.end_date ? new Date(a.end_date) : null // Null end means indefinite. v-calendar handles null end? limit to 100 years maybe.
    }
  })
}

const vCalendarDisabledDates = computed(() => {
  return blockedDates.value.map((range) => ({
    start: range.start,
    end: range.end || new Date(2100, 0, 1)
  }))
})

watch(selectedUser, async (newUser) => {
  if (newUser) {
    // 1. Fetch Assignments (shifts)
    const assignments = await turnAssignmentStore.fetchAssignmentsByUser(newUser._id)
    const shiftBlocks = getBlockedDates(assignments)

    // 2. Fetch Active Replacements (Absences)
    // Use non-mutating checkConflicts to avoid filtering the background table
    const replacements = await replacementStore.checkConflicts({
      search: newUser.rut,
      limit: 100
    })

    // 3. Get Absence Dates (User is SALIENTE)
    const absenceDateStrings = replacementStore.getFechasAusencia(newUser._id, replacements)
    // Convert string "YYYY-MM-DD" to range { start, end }
    const absenceBlocks = absenceDateStrings.map((dateStr: string) => {
      // Parse UTC to avoid timezone shifts.
      // Assuming dateStr is YYYY-MM-DD.
      const [y, m, d] = dateStr.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      return { start: dateObj, end: dateObj } // Single day block
    })

    // Merge blocks
    blockedDates.value = [...shiftBlocks, ...absenceBlocks]
  } else {
    blockedDates.value = []
  }
})

function validateForm() {
  errors.value = {}
  let isValid = true

  if (!form.value.user_id) {
    errors.value.user_id = 'Debe seleccionar un funcionario'
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

  // End date logic
  if (form.value.start_date && form.value.end_date) {
    if (form.value.end_date < form.value.start_date) {
      errors.value.end_date = 'La fecha de término no puede ser anterior a la de inicio'
      isValid = false
    }
  }

  // Overlap Check (Frontend)
  if (form.value.start_date) {
    const newStart = new Date(form.value.start_date)
    // IMPORTANT: Clear time part to compare only dates
    newStart.setHours(0, 0, 0, 0)

    const newEnd = form.value.end_date ? new Date(form.value.end_date) : new Date(2100, 0, 1)
    newEnd.setHours(23, 59, 59, 999) // End at end of day

    const hasOverlap = blockedDates.value.some((range) => {
      // Create fresh date objects from range to ensure clean comparison
      const blockedStart = new Date(range.start)
      blockedStart.setHours(0, 0, 0, 0)

      const blockedEnd = range.end ? new Date(range.end) : new Date(2100, 0, 1)
      blockedEnd.setHours(23, 59, 59, 999)

      // Overlap logic: StartA <= EndB AND EndA >= StartB
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
    ...form.value,
    start_date: form.value.start_date?.toISOString(),
    end_date: form.value.end_date?.toISOString()
  })
}
</script>

<style scoped>
/* Reuse styles from UserModalCreate */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
  z-index: 1050;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.x-small {
  font-size: 0.7rem;
}
.form-control {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  color: #1e293b;
  background-color: #fff;
  transition: all 0.2s ease;
}
.form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
.input-group-text {
  border-color: #e2e8f0;
  color: #64748b;
}
.floating-error {
  position: absolute;
  bottom: -18px;
  left: 0;
  font-size: 0.7rem;
  white-space: nowrap;
}
/* Custom v-select */
.custom-v-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 3px;
  background: white;
  box-shadow: none;
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.8);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 5px;
  font-size: 0.875rem;
  max-height: 200px;
  overflow-y: auto;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.25rem;
  padding: 6px 10px;
  margin-bottom: 2px;
  color: #475569;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}
.is-invalid {
  border-color: #ef4444 !important;
}
.invalid-feedback,
.text-danger {
  font-size: 0.7rem;
  color: #ef4444;
}

/* \ud83c\udfe2 ENTERPRISE: Custom v-select for PLANTA user selection */
.user-select-planta :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 6px;
  background: white;
  min-height: 60px;
  max-height: 60px;
  overflow: hidden;
}

.user-select-planta :deep(.vs__selected-options) {
  min-height: 48px;
  max-height: 48px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.user-select-planta :deep(.vs__selected) {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
}

.user-select-planta :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 4px;
  max-height: 240px;
  overflow-y: auto;
  min-width: 320px;
  z-index: 9999;
}

.user-select-planta :deep(.vs__dropdown-option) {
  border-radius: 0.375rem;
  padding: 10px 12px;
  margin-bottom: 2px;
  font-size: 0.875rem;
}

.user-select-planta :deep(.vs__dropdown-option--highlight) {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.user-option {
  width: 100%;
}
</style>
