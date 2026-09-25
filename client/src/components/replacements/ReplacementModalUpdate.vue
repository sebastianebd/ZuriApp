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
                <i class="bi bi-pencil-square text-primary fs-5"></i>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h5 class="modal-title fw-bold text-dark mb-0 modal-title-custom">Modificar Registro</h5>
                  <span class="badge-record-id font-monospace" v-if="registro.id_negocio">
                    #{{ registro.id_negocio }}
                  </span>
                </div>
                <p class="text-secondary small mb-0 mt-1">
                  Actualiza los datos del reemplazo, causal de ausencia y programación de turnos.
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

          <!-- BODY CON DOBLE BISEL (Vanguard Double-Bezel) -->
          <div class="modal-body p-4 bg-surface">
            <!-- SECCIÓN 1: TRASPASO DE TURNO (Saliente -> Entrante) -->
            <div class="vanguard-section-card mb-3 p-3 p-md-4">
              <!-- Encabezado de Sección -->
              <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div class="d-flex align-items-center gap-2">
                  <span class="section-indicator bg-primary"></span>
                  <h6 class="fw-bold text-dark mb-0 section-heading">Traspaso de Turno</h6>
                </div>
                <div v-if="turnoEnCurso" class="badge-status-in-course">
                  <span class="pulse-dot-amber"></span>
                  <span>Turno en Curso</span>
                </div>
                <div v-else class="badge-status-pending">
                  <span class="pulse-dot-blue"></span>
                  <span>Programado</span>
                </div>
              </div>

              <!-- Grilla de Transferencia Balanceada -->
              <div class="row g-3 align-items-stretch position-relative">
                <!-- COLUMNA FUNCIONARIO SALIENTE -->
                <div class="col-12 col-md-6">
                  <div class="staff-role-card staff-outgoing h-100 p-3 rounded-3 d-flex flex-column justify-content-between">
                    <div>
                      <!-- Badge Rol -->
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="role-pill pill-outgoing">
                          <i class="bi bi-person-dash me-1"></i> Titular Saliente
                        </span>
                      </div>

                      <!-- Ficha Funcionario -->
                      <div class="d-flex align-items-center gap-3 my-2">
                        <div class="avatar-squircle avatar-outgoing shadow-xs">
                          {{
                            getInitials(
                              (registro.nombre_saliente || '') +
                                ' ' +
                                (registro.apellido_saliente || '')
                            )
                          }}
                        </div>
                        <div class="staff-info overflow-hidden">
                          <div
                            class="fw-bold text-dark text-truncate staff-name"
                            :title="`${registro.nombre_saliente} ${registro.apellido_saliente}`"
                          >
                            {{ registro.nombre_saliente }} {{ registro.apellido_saliente }}
                          </div>
                          <div class="staff-rut font-monospace">
                            {{ registro.rut_saliente }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Causal de Ausencia -->
                    <div class="mt-3 pt-2 border-top-dashed">
                      <label
                        class="form-label staff-field-label d-flex align-items-center gap-1 mb-1"
                        for="update-motivo-select"
                      >
                        <span>Causal de Ausencia</span>
                        <span class="text-danger">*</span>
                      </label>
                      <div class="select-wrapper">
                        <select
                          id="update-motivo-select"
                          :value="registro.motivo || 'OTRO'"
                          @change="(e: any) => $emit('update:registro', { ...registro, motivo: e.target.value })"
                          class="form-select form-select-custom"
                          data-testid="update-motivo-select"
                        >
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
                      <!-- Badge Rol -->
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="role-pill pill-incoming">
                          <i class="bi bi-person-check me-1"></i> Reemplazante Entrante
                        </span>
                      </div>

                      <!-- VISTA BLOQUEADA (Turno en Curso) -->
                      <div v-if="turnoEnCurso">
                        <div class="d-flex align-items-center gap-3 my-2">
                          <div class="avatar-squircle avatar-incoming shadow-xs">
                            {{
                              getInitials(
                                (registro.nombre_entrante || '') +
                                  ' ' +
                                  (registro.apellido_entrante || '')
                              )
                            }}
                          </div>
                          <div class="staff-info overflow-hidden">
                            <div
                              class="fw-bold text-dark text-truncate staff-name"
                              :title="`${registro.nombre_entrante} ${registro.apellido_entrante}`"
                            >
                              {{ registro.nombre_entrante }} {{ registro.apellido_entrante }}
                            </div>
                            <div class="staff-rut font-monospace">
                              {{ registro.rut_entrante }}
                            </div>
                          </div>
                        </div>

                        <!-- Acción de Sustitución o Estado -->
                        <div class="mt-3 pt-2 border-top-dashed">
                          <div
                            v-if="!registro.corte_anticipado"
                            class="d-flex align-items-center justify-content-between gap-2 p-2 bg-white rounded-3 border"
                          >
                            <div class="d-flex align-items-center gap-1 text-muted x-small">
                              <i class="bi bi-shield-lock text-warning"></i>
                              <span>Turno en ejecución</span>
                            </div>
                            <button
                              type="button"
                              @click.prevent="$emit('sustituir-usuario')"
                              class="btn btn-sm btn-substitute-pill d-flex align-items-center gap-1 shadow-xs"
                              title="Sustituir Funcionario"
                            >
                              <i class="bi bi-arrow-repeat"></i>
                              <span>Sustituir</span>
                            </button>
                          </div>
                          <div
                            v-else
                            class="p-2 bg-white rounded-3 border text-muted x-small d-flex align-items-center gap-2"
                          >
                            <i class="bi bi-slash-circle text-secondary"></i>
                            <span>Corte anticipado aplicado</span>
                          </div>
                        </div>
                      </div>

                      <!-- VISTA EDITABLE (Programado / Pendiente) -->
                      <div v-else>
                        <div class="my-2">
                          <label class="form-label staff-field-label mb-1">Buscar y Asignar Funcionario</label>
                          <v-select
                            v-model="selectedEntrante"
                            :options="entranteOptions"
                            :filterable="false"
                            :loading="isSearchingEntrante"
                            @search="searchEntrante"
                            label="displayName"
                            placeholder="Escribe RUT o apellido..."
                            class="custom-v-select staff-v-select"
                          >
                            <template #option="option">
                              <div class="IStaff-option py-1">
                                <div class="d-flex justify-content-between align-items-center">
                                  <div>
                                    <span class="fw-bold text-dark font-monospace x-small">{{ option.rut }}</span>
                                    <span class="text-secondary ms-2 small">
                                      {{ option.firstName }} {{ option.lastName }}
                                    </span>
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
                                  <div
                                    class="fw-bold text-dark text-truncate"
                                    style="font-size: 0.8rem"
                                  >
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
                                <span v-else>No se encontraron funcionarios</span>
                              </div>
                            </template>
                          </v-select>
                        </div>

                        <div class="mt-3 pt-2 border-top-dashed d-flex align-items-center gap-1 text-muted x-small">
                          <i class="bi bi-check-circle-fill text-success opacity-75"></i>
                          <span>Dotación activa habilitada para asignación</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Fila Transversal de Observaciones (Balance y Cohesión) -->
              <div class="mt-3 pt-3 border-top">
                <label
                  class="form-label staff-field-label d-flex justify-content-between align-items-center mb-1"
                  for="update-observaciones-input"
                >
                  <span class="d-flex align-items-center gap-1">
                    <i class="bi bi-card-text text-secondary"></i>
                    <span>Observaciones de la Cobertura</span>
                  </span>
                  <span class="text-secondary fw-normal x-small">Opcional • Máx. 500 car.</span>
                </label>
                <textarea
                  id="update-observaciones-input"
                  :value="registro.observaciones || ''"
                  @input="(e: any) => $emit('update:registro', { ...registro, observaciones: e.target.value })"
                  class="form-control form-textarea-custom"
                  rows="2"
                  maxlength="500"
                  placeholder="Observaciones clínicas, justificación de turno o notas adicionales..."
                  data-testid="update-observaciones-textarea"
                ></textarea>
              </div>
            </div>

            <!-- SECCIÓN 2: PARÁMETROS DEL TURNO (Configuración y Fechas) -->
            <div class="vanguard-section-card p-3 p-md-4">
              <!-- Encabezado de Sección -->
              <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div class="d-flex align-items-center gap-2">
                  <span class="section-indicator bg-indigo"></span>
                  <h6 class="fw-bold text-dark mb-0 section-heading">Parámetros del Turno</h6>
                </div>
                <div v-if="turnoEnCurso" class="badge-locked-params">
                  <i class="bi bi-lock-fill me-1"></i>
                  <span>Parámetros bloqueados en ejecución</span>
                </div>
              </div>

              <div class="row g-3">
                <!-- Fila 1: Tipo Turno y Servicio Clínico -->
                <div class="col-12 col-md-6">
                  <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                    <i class="bi bi-clock-history text-secondary"></i>
                    <span>Tipo de Turno</span>
                  </label>
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
                  </label>
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
                    label="nombre"
                    :reduce="(s: any) => s._id"
                    placeholder="Seleccione servicio..."
                    :clearable="false"
                    :searchable="true"
                    class="custom-v-select small-select"
                  />
                </div>

                <!-- Fila 2: Fechas Inicio y Término con DatePicker -->
                <div class="col-12 col-md-6">
                  <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                    <i class="bi bi-calendar-event text-secondary"></i>
                    <span>Fecha de Inicio</span>
                  </label>
                  <DatePicker
                    ref="dpInicio"
                    :model-value="
                      registro.fecha_inicio ? String(registro.fecha_inicio).split('T')[0] + 'T12:00:00' : null
                    "
                    @update:model-value="
                      (newDate) => {
                        let dateStr = newDate;
                        if (newDate instanceof Date && !isNaN(newDate.getTime())) {
                          const offset = newDate.getTimezoneOffset() * 60000;
                          dateStr = (new Date(newDate.getTime() - offset)).toISOString().split('T')[0];
                        }
                        $emit('update:registro', {
                          ...registro,
                          fecha_inicio: dateStr
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
                      <div class="input-group modern-input-group" :class="{ 'is-disabled': turnoEnCurso }">
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
                          :disabled="turnoEnCurso"
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                    <i class="bi bi-calendar-check text-secondary"></i>
                    <span>Fecha de Término</span>
                  </label>
                  <DatePicker
                    ref="dpTermino"
                    :model-value="
                      registro.fecha_termino ? String(registro.fecha_termino).split('T')[0] + 'T12:00:00' : null
                    "
                    @update:model-value="
                      (newDate) => {
                        let dateStr = newDate;
                        if (newDate instanceof Date && !isNaN(newDate.getTime())) {
                          const offset = newDate.getTimezoneOffset() * 60000;
                          dateStr = (new Date(newDate.getTime() - offset)).toISOString().split('T')[0];
                        }
                        $emit('update:registro', {
                          ...registro,
                          fecha_termino: dateStr
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
                      <div class="input-group modern-input-group" :class="{ 'is-disabled': turnoEnCurso }">
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
                          :disabled="turnoEnCurso"
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
              class="btn btn-primary-pill d-flex align-items-center gap-2"
              @click="abrirConfirmacion"
            >
              <span class="btn-icon-wrap primary"><i class="bi bi-check-lg"></i></span>
              <span>Guardar Cambios</span>
            </button>
          </div>

          <!-- Modal de confirmación -->
          <Teleport to="body">
            <ConfirmationModal
              :visible="showConfirmacion"
              mensaje="¿Deseas guardar los cambios realizados en este reemplazo?"
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
import { type ReplacementRegistration, MOTIVOS_AUSENCIA_LABELS } from '@/types/replacement.types'
import { type IStaff } from '@/types/staff.types'
import { ref, computed, watch } from 'vue'
import ConfirmationModal from '../common/ConfirmationModal.vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import { useDatePicker } from '@/composables/useDatePicker'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { useStaffStore } from '@/stores/staff.store'

interface ReemplazoModalData extends Partial<ReplacementRegistration> {
  fecha_inicio?: string
  fecha_termino?: string
}

const props = defineProps<{
  visible: boolean
  registro: ReemplazoModalData
  listaDeTurnos: string[]
  listaDeServicios: any[]
  fechasBloqueadas: string[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar'): void
  (e: 'sustituir-usuario'): void
  (e: 'update:registro', nuevoRegistro: ReemplazoModalData): void
}>()

const staffStore = useStaffStore()
const showConfirmacion = ref(false)

// v-select state
const selectedEntrante = ref<any>(null)
const entranteOptions = ref<IStaff[]>([])
const isSearchingEntrante = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Initialize v-select logic
watch(
  () => props.registro,
  (newVal) => {
    if (newVal && newVal.rut_entrante) {
      selectedEntrante.value = {
        _id: newVal.id_entrante,
        rut: newVal.rut_entrante,
        firstName: newVal.nombre_entrante || '',
        lastName: newVal.apellido_entrante || '',
        displayName: `${newVal.rut_entrante} - ${newVal.nombre_entrante} ${newVal.apellido_entrante}`
      }
    } else {
      selectedEntrante.value = null
    }
  },
  { deep: true, immediate: true }
)

// Watch IStaff selection to update registro
watch(selectedEntrante, (IStaff) => {
  if (IStaff) {
    if (IStaff._id !== props.registro.id_entrante) {
      emit('update:registro', {
        ...props.registro,
        id_entrante: IStaff._id,
        rut_entrante: IStaff.rut,
        nombre_entrante: IStaff.nombre,
        apellido_entrante: IStaff.apellido
      })
    }
  } else if (!IStaff && props.registro.id_entrante) {
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
      await staffStore.searchStaff({
        search: query.trim(),
        page: 1,
        limit: 20
      })

      entranteOptions.value = staffStore.searchResults.map((u) => ({
        ...u,
        displayName: `${u.rut} - ${u.firstName} ${u.lastName}`
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
  return props.registro.status === 'EN CURSO'
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

.badge-record-id {
  font-size: 0.72rem;
  font-weight: 700;
  color: #3b82f6;
  background-color: #eff6ff;
  border: 1px solid rgba(191, 219, 254, 0.8);
  padding: 2px 7px;
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

/* Status Badges */
.badge-status-in-course {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #b45309;
  background-color: #fffbeb;
  border: 1px solid #fde68a;
  padding: 3px 9px;
  border-radius: 9999px;
}

.badge-status-pending {
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

.badge-locked-params {
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 3px 8px;
  border-radius: 6px;
}

.pulse-dot-amber {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
}

.pulse-dot-blue {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
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
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.avatar-outgoing {
  background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%);
  color: #991b1b;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.avatar-incoming {
  background: linear-gradient(135deg, #d1fae5 0%, #86efac 100%);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.avatar-incoming-xs {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #d1fae5 0%, #86efac 100%);
  color: #065f46;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.staff-name {
  font-size: 0.88rem;
  color: #0f172a;
  line-height: 1.25;
}

.staff-rut {
  font-size: 0.72rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
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

/* Botón Sustituir */
.btn-substitute-pill {
  background: white;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-substitute-pill:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #991b1b;
  transform: translateY(-1px);
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

.modern-input-group.is-disabled {
  opacity: 0.65;
}

.modern-input-group.is-disabled .input-group-text,
.modern-input-group.is-disabled .modern-date-input {
  background-color: #f1f5f9;
  cursor: not-allowed;
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

.custom-v-select:deep(.vs--disabled .vs__dropdown-toggle) {
  background-color: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.7;
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

.btn-primary-pill:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  color: white;
}

.btn-primary-pill:active,
.btn-secondary-pill:active {
  transform: scale(0.98);
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

/* Helpers */
.x-small {
  font-size: 0.7rem;
}

.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
