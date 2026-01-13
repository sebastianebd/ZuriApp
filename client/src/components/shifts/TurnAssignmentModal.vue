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
                <!-- User Selection -->
                <div class="mb-4 position-relative">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase"
                    >Funcionario</label
                  >

                  <div
                    v-if="!selectedUser"
                    class="p-4 border rounded-3 bg-light text-center cursor-pointer hover-bg-light"
                    @click="showUserModal = true"
                    :class="{ 'border-danger': errors.user_id }"
                  >
                    <div class="text-primary mb-2">
                      <i class="bi bi-person-plus-fill fs-3"></i>
                    </div>
                    <div class="fw-bold text-secondary small">
                      Click para seleccionar funcionario
                    </div>
                    <div v-if="errors.user_id" class="text-danger x-small fw-bold mt-2">
                      {{ errors.user_id }}
                    </div>
                  </div>

                  <div
                    v-else
                    class="p-3 border rounded-3 bg-white d-flex align-items-center justify-content-between shadow-sm"
                  >
                    <div class="d-flex align-items-center gap-3">
                      <div
                        class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center"
                        style="width: 40px; height: 40px"
                      >
                        <span class="fw-bold"
                          >{{ selectedUser.nombre.charAt(0)
                          }}{{ selectedUser.apellido.charAt(0) }}</span
                        >
                      </div>
                      <div>
                        <div class="fw-bold text-dark small">
                          {{ selectedUser.nombre }} {{ selectedUser.apellido }}
                        </div>
                        <div class="text-secondary x-small">{{ selectedUser.rut }}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="btn btn-link text-secondary p-0"
                      @click="clearUser"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
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
                    placeholder="Seleccione patrón"
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
                    >Fecha Inicio (Semilla)</label
                  >
                  <DatePicker
                    v-model="form.start_date"
                    :popover="{ visibility: 'click', placement: 'bottom' }"
                    :masks="{ input: 'DD/MM/YYYY' }"
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
                    Esta fecha determina el inicio del ciclo del patrón.
                  </small>
                </div>

                <!-- End Date (Optional) -->
                <div class="mb-2 position-relative">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase"
                    >Fecha Término (Opcional)</label
                  >
                  <DatePicker
                    v-model="form.end_date"
                    :popover="{ visibility: 'click', placement: 'bottom' }"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :min-date="form.start_date"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group">
                        <span class="input-group-text bg-white border-end-0 text-muted">
                          <i class="bi bi-calendar-x"></i>
                        </span>
                        <input
                          class="form-control border-start-0 ps-0"
                          :value="inputValue"
                          v-on="inputEvents"
                          placeholder="Indefinido"
                          readonly
                        />
                      </div>
                    </template>
                  </DatePicker>
                  <small class="form-text text-muted x-small mt-1 d-block">
                    Dejar vacío para asignación indefinida.
                  </small>
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

  <!-- User Selection Modal -->
  <TurnAssignmentUserModal
    :visible="showUserModal"
    :usuarios="localUsers"
    :listaDeCargos="cargoOptions"
    @cerrar="showUserModal = false"
    @usuario-seleccionado="handleUserSelected"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'
import { useUserStore } from '@/stores/user.store'
import { useOptionStore } from '@/stores/option.store'
import { PATTERNS } from '@/services/turn-pattern.service'
import type { User } from '@/types/models'
import TurnAssignmentUserModal from './TurnAssignmentUserModal.vue'

const props = defineProps<{
  visible: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', payload: any): void
}>()

const usersStore = useUserStore()
const optionStore = useOptionStore()
const localUsers = ref<any[]>([])

// Logic State
const showUserModal = ref(false)
const selectedUser = ref<User | null>(null)

// Options
const turnTypeOptions = Object.keys(PATTERNS)

const serviceOptions = computed(() => {
  return optionStore.opciones?.servicios || []
})

const cargoOptions = computed(() => {
  return optionStore.opciones?.tipoCargo || []
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
      // Fetch users and options
      try {
        const [users] = await Promise.all([
          usersStore.mostrarTodos(),
          optionStore.mostrarOpciones()
        ])
        localUsers.value = users
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
    start_date: null,
    end_date: null
  }
  selectedUser.value = null
  errors.value = {}
}

function handleUserSelected(user: User) {
  selectedUser.value = user
  form.value.user_id = user._id
  showUserModal.value = false
  if (errors.value.user_id) delete errors.value.user_id
}

function clearUser() {
  selectedUser.value = null
  form.value.user_id = ''
}

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

  // End date logic
  if (form.value.start_date && form.value.end_date) {
    if (form.value.end_date < form.value.start_date) {
      errors.value.end_date = 'La fecha de término no puede ser anterior a la de inicio'
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
.is-invalid {
  border-color: #ef4444 !important;
}
.invalid-feedback,
.text-danger {
  font-size: 0.7rem;
  color: #ef4444;
}
</style>
