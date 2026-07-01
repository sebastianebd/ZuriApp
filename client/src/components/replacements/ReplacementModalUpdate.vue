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
          <div class="modal-header border-bottom p-3">
            <div>
              <h5 class="modal-title fw-bold text-dark">
                <i class="bi bi-pencil-square text-primary me-2"></i>Modificar Registro
              </h5>
              <p class="text-secondary small mb-0 mt-1">
                Actualiza los detalles del reemplazo o turno.
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
          <div class="modal-body p-3 bg-light bg-opacity-50">
            <!-- TRANSACTIONS CONTAINER (Saliente -> Entrante) -->
            <div class="bg-white rounded-4 shadow-sm p-3 mb-3 border">
              <div class="row align-items-start g-0">
                <!-- COLUMNA SALIENTE -->
                <div class="col-md-5">
                  <div
                    class="user-card outgoing p-2 rounded-3 border border-danger border-opacity-25 bg-danger bg-opacity-10 position-relative h-100"
                  >
                    <div
                      class="badge bg-danger text-white position-absolute top-0 start-0 m-2 x-small shadow-sm"
                    >
                      SALIENTE
                    </div>

                    <div class="d-flex align-items-center mt-4 pt-1">
                      <div class="avatar-filled bg-gradient-danger text-white shadow-sm me-3">
                        {{
                          getInitials(
                            (registro.nombre_saliente || '') +
                              ' ' +
                              (registro.apellido_saliente || '')
                          )
                        }}
                      </div>
                      <div class="flex-grow-1 overflow-hidden">
                        <div class="fw-bold text-dark text-truncate small">
                          {{ registro.nombre_saliente }} {{ registro.apellido_saliente }}
                        </div>
                        <div class="text-secondary x-small font-monospace">
                          {{ registro.rut_saliente }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- CONNECTOR ARROW -->
                <div class="col-md-2 text-center py-2 py-md-0 align-self-center">
                  <div
                    class="connector-icon bg-white text-secondary shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center border"
                  >
                    <i class="bi bi-arrow-right fs-5 d-none d-md-block"></i>
                    <i class="bi bi-arrow-down fs-5 d-md-none"></i>
                  </div>
                </div>

                <!-- COLUMNA ENTRANTE -->
                <div class="col-md-5 position-relative">
                  <!-- Substitution Button (Outside Card) -->
                  <div
                    class="position-absolute top-0 end-0 m-2"
                    style="z-index: 5; margin-top: -15px !important; margin-right: -10px !important"
                  >
                    <button
                      v-if="turnoEnCurso && !registro.corte_anticipado"
                      @click.prevent="$emit('sustituir-usuario')"
                      class="btn btn-icon btn-white text-danger shadow-sm border"
                      title="Sustituir Funcionario"
                    >
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                  </div>

                  <div
                    class="user-card incoming p-2 rounded-3 border border-success border-opacity-25 bg-success bg-opacity-10 position-relative h-100"
                  >
                    <div
                      class="badge bg-success text-white position-absolute top-0 start-0 m-2 x-small shadow-sm"
                    >
                      ENTRANTE
                    </div>

                    <!-- STATIC VIEW (Locked) -->
                    <div v-if="turnoEnCurso" class="d-flex align-items-center mt-4 pt-1">
                      <div class="avatar-filled bg-gradient-success text-white shadow-sm me-3">
                        {{
                          getInitials(
                            (registro.nombre_entrante || '') +
                              ' ' +
                              (registro.apellido_entrante || '')
                          )
                        }}
                      </div>
                      <div class="flex-grow-1 overflow-hidden">
                        <div class="fw-bold text-dark text-truncate small">
                          {{ registro.nombre_entrante }} {{ registro.apellido_entrante }}
                        </div>
                        <div class="text-secondary x-small font-monospace">
                          {{ registro.rut_entrante }}
                        </div>
                      </div>
                    </div>

                    <!-- EDITABLE VIEW (Pending) -->
                    <div v-else class="mt-4 pt-1">
                      <!-- v-select for Entrante -->
                      <v-select
                        v-model="selectedEntrante"
                        :options="entranteOptions"
                        :filterable="false"
                        :loading="isSearchingEntrante"
                        @search="searchEntrante"
                        label="displayName"
                        placeholder="Buscar funcionario..."
                        class="user-select-success"
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
                              class="avatar-filled bg-gradient-success text-white shadow-sm me-2"
                              style="width: 32px; height: 32px; font-size: 0.75rem"
                            >
                              {{ getInitials(option.nombre + ' ' + option.apellido) }}
                            </div>
                            <div style="overflow: hidden">
                              <div
                                class="fw-bold text-dark text-truncate"
                                style="font-size: 0.8rem"
                              >
                                {{ option.nombre }} {{ option.apellido }}
                              </div>
                              <div class="text-secondary x-small font-monospace text-truncate">
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
                </div>
              </div>

              <!-- Helper Text Row (Outside Grid) -->
              <div class="row g-0" v-if="turnoEnCurso && !registro.corte_anticipado">
                <div class="col-md-5 offset-md-7 text-center mt-1">
                  <small class="text-muted fst-italic" style="font-size: 0.65rem"
                    >Para cambiar funcionario en curso, use el botón de sustitución
                    <i class="bi bi-arrow-repeat"></i>.</small
                  >
                </div>
              </div>
            </div>

            <!-- CONFIGURACION DEL TURNO (Compact) -->
            <div class="bg-white rounded-4 shadow-sm p-3 border">
              <h6
                class="text-uppercase text-secondary fw-bold x-small mb-3 tracking-wider border-bottom pb-2"
              >
                Configuración
              </h6>

              <div class="row g-3">
                <!-- Fila 1: Turno y Servicio -->
                <div class="col-md-6">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase mb-1"
                    >Tipo Turno</label
                  >
                  <v-select
                    :options="listaDeTurnos"
                    :model-value="registro.tipo_turno"
                    @update:model-value="(newValue: string) => { 
                          $emit('update:registro', {
                              ...registro,
                              tipo_turno: newValue
                          })
                        }"
                    :disabled="turnoEnCurso"
                    placeholder="Seleccione..."
                    :clearable="false"
                    :searchable="false"
                    class="custom-v-select small-select"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase mb-1"
                    >Servicio</label
                  >
                  <v-select
                    :options="listaDeServicios"
                    :model-value="registro.servicio"
                    @update:model-value="
                          (newValue: string) => {
                              $emit('update:registro', {
                                  ...registro,
                                  servicio: newValue
                              })
                          }
                        "
                    :disabled="turnoEnCurso"
                    placeholder="Seleccione..."
                    :clearable="false"
                    :searchable="true"
                    class="custom-v-select small-select"
                  />
                </div>

                <!-- Fila 2: Fechas -->
                <div class="col-md-6">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase mb-1"
                    >Inicio</label
                  >
                  <DatePicker
                    ref="dpInicio"
                    :model-value="
                      registro.fecha_inicio ? registro.fecha_inicio + 'T00:00:00' : null
                    "
                    @update:model-value="
                      (newDate) => {
                        $emit('update:registro', {
                          ...registro,
                          fecha_inicio: newDate
                        })
                      }
                    "
                    :disabled-dates="isDisabled"
                    :min-date="new Date()"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :model-config="{
                      type: 'string',
                      mask: 'YYYY-MM-DD',
                      timeAdjust: '00:00:00'
                    }"
                    :popover="popoverConfig"
                    :attributes="dateAttributes"
                    :is-required="true"
                    :disabled="turnoEnCurso"
                    trim-weeks
                    color="blue"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group input-group-sm">
                        <span class="input-group-text bg-white border-end-0 text-muted">
                          <i class="bi bi-calendar-event"></i>
                        </span>
                        <input
                          class="form-control border-start-0 ps-0"
                          :value="inputValue"
                          v-on="inputEvents"
                          @click="handleInicioClick"
                          placeholder="Fecha Inicio"
                          readonly
                          :disabled="turnoEnCurso"
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>
                <div class="col-md-6">
                  <label class="form-label x-small fw-bold text-secondary text-uppercase mb-1"
                    >Término</label
                  >
                  <DatePicker
                    ref="dpTermino"
                    :model-value="
                      registro.fecha_termino ? registro.fecha_termino + 'T00:00:00' : null
                    "
                    @update:model-value="
                      (newDate) => {
                        $emit('update:registro', {
                          ...registro,
                          fecha_termino: newDate
                        })
                      }
                    "
                    :disabled-dates="isDisabled"
                    :min-date="new Date()"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :model-config="{
                      type: 'string',
                      mask: 'YYYY-MM-DD',
                      timeAdjust: '00:00:00'
                    }"
                    :popover="popoverConfig"
                    :attributes="dateAttributes"
                    :is-required="true"
                    :disabled="turnoEnCurso"
                    trim-weeks
                    color="blue"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group input-group-sm">
                        <span class="input-group-text bg-white border-end-0 text-muted">
                          <i class="bi bi-calendar-event"></i>
                        </span>
                        <input
                          class="form-control border-start-0 ps-0"
                          :value="inputValue"
                          v-on="inputEvents"
                          @click="handleTerminoClick"
                          placeholder="Fecha Término"
                          readonly
                          :disabled="turnoEnCurso"
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer border-top bg-light p-2">
            <button
              type="button"
              class="btn btn-light border fw-bold text-secondary px-3 btn-sm"
              @click="$emit('cerrar')"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary fw-bold px-3 shadow-sm btn-sm"
              @click="abrirConfirmacion"
            >
              <i class="bi bi-check-lg me-1"></i>Guardar
            </button>
          </div>

          <!-- Modal de confirmación -->
          <Teleport to="body">
            <ConfirmationModal
              :visible="showConfirmacion"
              mensaje="¿Deseas guardar los cambios realizados?"
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
import { getInitials } from '@/utils/text-formatters'
import { type ReplacementRegistration } from '@/types/replacement.types'
import { type User } from '@/types/user.types'
import { ref, computed, watch } from 'vue'
import ConfirmationModal from '../common/ConfirmationModal.vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import { useDatePicker } from '@/composables/useDatePicker'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { useUserStore } from '@/stores/user.store'

interface ReemplazoModalData extends Partial<ReplacementRegistration> {
  fecha_inicio?: string
  fecha_termino?: string
}

const props = defineProps<{
  visible: boolean
  registro: ReemplazoModalData
  listaDeTurnos: string[]
  listaDeServicios: string[]
  fechasBloqueadas: string[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar'): void
  // NO 'buscar-entrante' anymore
  (e: 'sustituir-usuario'): void
  (e: 'update:registro', nuevoRegistro: ReemplazoModalData): void
}>()

const userStore = useUserStore()
const showConfirmacion = ref(false)

// v-select state
const selectedEntrante = ref<any>(null) // Use 'any' to construct incomplete user obj
const entranteOptions = ref<User[]>([])
const isSearchingEntrante = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Initialize v-select logic
// When modal becomes visible or registro changes, set selectedEntrante
watch(
  () => props.registro,
  (newVal) => {
    if (newVal && newVal.rut_entrante) {
      selectedEntrante.value = {
        _id: newVal.id_entrante,
        rut: newVal.rut_entrante,
        nombre: newVal.nombre_entrante || '',
        apellido: newVal.apellido_entrante || '',
        displayName: `${newVal.rut_entrante} - ${newVal.nombre_entrante} ${newVal.apellido_entrante}` // Helper for label if needed
      }
    } else {
      selectedEntrante.value = null
    }
  },
  { deep: true, immediate: true }
)

// Watch user selection to update registro
watch(selectedEntrante, (user) => {
  // If user selected
  if (user) {
    // Break loop: Only emit if ID is different
    if (user._id !== props.registro.id_entrante) {
      emit('update:registro', {
        ...props.registro,
        id_entrante: user._id,
        rut_entrante: user.rut,
        nombre_entrante: user.nombre,
        apellido_entrante: user.apellido
      })
    }
  }
  // If user cleared
  else if (!user && props.registro.id_entrante) {
    emit('update:registro', {
      ...props.registro,
      id_entrante: undefined,
      rut_entrante: undefined,
      nombre_entrante: undefined,
      apellido_entrante: undefined
    })
  }
})

// Search Logic
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
      await userStore.searchUsers({
        search: query.trim(),
        page: 1,
        limit: 20
      })

      entranteOptions.value = userStore.searchResults.map((u) => ({
        ...u,
        displayName: `${u.rut} - ${u.nombre} ${u.apellido}`
      }))
    } catch (error) {
      console.error('Search error:', error)
      entranteOptions.value = []
    } finally {
      loading(false)
      isSearchingEntrante.value = false
    }
  }, 300)
}

// ... rest of script ...

// --- Elementos de calendario para control de popover
const dpInicio = ref<any>(null)
const dpTermino = ref<any>(null)

function handleInicioClick() {
  if (dpTermino.value) {
    try {
      dpTermino.value.hidePopover()
    } catch (e) {
      console.warn('Error closing Termino popover', e)
    }
  }
}

function handleTerminoClick() {
  if (dpInicio.value) {
    try {
      dpInicio.value.hidePopover()
    } catch (e) {
      console.warn('Error closing Inicio popover', e)
    }
  }
}

const turnoEnCurso = computed(() => {
  if (!props.registro?.status) return false
  const status = props.registro.status
  return status === 'EN CURSO'
})

function abrirConfirmacion() {
  showConfirmacion.value = true
}

function confirmarGuardar() {
  showConfirmacion.value = false
  emit('guardar')
}

function cancelarConfirmacion() {
  showConfirmacion.value = false
}

// --- Configuración de calendario
const { popoverConfig, dateAttributes, isDisabled } = useDatePicker(props)
</script>

<style scoped>
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
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

.tracking-wider {
  letter-spacing: 0.05em;
}

.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* User Cards & Avatar */
.avatar-filled {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.bg-gradient-danger {
  background: linear-gradient(135deg, #fecaca 0%, #ef4444 100%);
}
.bg-gradient-success {
  background: linear-gradient(135deg, #bbf7d0 0%, #22c55e 100%);
}

.connector-icon {
  width: 32px;
  height: 32px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.btn-white {
  background: white;
}
.btn-white:hover {
  background: #f8fafc;
}

/* Inputs & Forms */
.form-control {
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  border-radius: 0.375rem;
  color: #1e293b;
  background-color: #fff;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  background-color: #fff;
}

.input-group-text {
  border-color: #e2e8f0;
  color: #64748b;
  font-size: 0.8rem;
}

/* Custom v-select */
.custom-v-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 2px;
  background: white;
  box-shadow: none;
  min-height: 32px;
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.8rem;
  color: #1e293b;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
  font-size: 0.8rem;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.7);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 5px;
  font-size: 0.8rem;
  max-height: 200px;
  overflow-y: auto;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.25rem;
  padding: 4px 8px;
  margin-bottom: 2px;
  color: #475569;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}
</style>
