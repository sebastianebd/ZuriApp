<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      v-if="visible"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content shadow-lg border-0 rounded-4">
          <!-- HEADER -->
          <div class="modal-header border-0 bg-primary bg-gradient text-white p-4 rounded-top-4">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-pencil-square me-2"></i>MODIFICA REGISTRO
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="$emit('cerrar')"
              aria-label="Close"
            ></button>
          </div>

          <!-- BODY -->
          <div class="modal-body p-4 bg-white">
            <div class="row g-4">
              <!-- Grupo 1: Usuario Saliente -->
              <div class="col-md-6">
                <div class="p-3 bg-light rounded-3 border border-1 shadow-xs h-100">
                  <div class="d-flex align-items-center mb-3">
                    <h6 class="text-primary fw-bold mb-0 smaller text-uppercase tracking-wider">
                      Funcionario Saliente
                    </h6>
                  </div>

                  <div class="form-floating mb-3">
                    <input
                      type="text"
                      id="rutSaliente"
                      :value="registro.rut_saliente"
                      class="form-control bg-white border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="RUT"
                    />
                    <label for="rutSaliente" class="text-secondary fw-semibold">RUT</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input
                      type="text"
                      id="nombreSaliente"
                      :value="registro.nombre_saliente"
                      class="form-control bg-white border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="Nombre"
                    />
                    <label for="nombreSaliente" class="text-secondary fw-semibold">Nombre</label>
                  </div>

                  <div class="form-floating">
                    <input
                      type="text"
                      id="apellidoSaliente"
                      :value="registro.apellido_saliente"
                      class="form-control bg-white border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="Apellido"
                    />
                    <label for="apellidoSaliente" class="text-secondary fw-semibold"
                      >Apellido</label
                    >
                  </div>
                </div>
              </div>

              <!-- Grupo 2: Usuario Entrante -->
              <div class="col-md-6">
                <div class="p-3 bg-light rounded-3 border border-1 shadow-xs h-100">
                  <div class="d-flex align-items-center mb-3">
                    <h6
                      class="text-primary flex-grow-1 fw-bold mb-0 smaller text-uppercase tracking-wider"
                    >
                      Funcionario Entrante
                    </h6>

                    <!-- ✅ Botón dinámico -->
                    <button
                      v-if="turnoEnCurso"
                      @click.prevent="$emit('sustituir-usuario')"
                      class="btn btn-danger btn-sm fw-bold shadow-sm border-0 px-3"
                    >
                      <i class="bi bi-arrow-repeat me-1"></i> Sustituir
                    </button>
                    <button
                      v-else
                      @click.prevent="$emit('buscar-entrante')"
                      class="btn btn-warning btn-sm fw-bold shadow-sm border-0 px-3"
                    >
                      <i class="bi bi-search me-1"></i> Buscar
                    </button>
                  </div>

                  <div class="form-floating mb-3">
                    <input
                      type="text"
                      id="rutEntrante"
                      :value="registro.rut_entrante"
                      class="form-control bg-white border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="RUT"
                    />
                    <label for="rutEntrante" class="text-secondary fw-semibold">RUT</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input
                      type="text"
                      id="nombreEntrante"
                      :value="registro.nombre_entrante"
                      class="form-control bg-white border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="Nombre"
                    />
                    <label for="nombreEntrante" class="text-secondary fw-semibold">Nombre</label>
                  </div>

                  <div class="form-floating">
                    <input
                      type="text"
                      id="apellidoEntrante"
                      :value="registro.apellido_entrante"
                      class="form-control bg-white border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="Apellido"
                    />
                    <label for="apellidoEntrante" class="text-secondary fw-semibold"
                      >Apellido</label
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Grupo 3: Configuración de Turno -->
            <div class="p-4 bg-light rounded-3 border border-1 shadow-xs mt-4">
              <h6 class="text-primary fw-bold mb-4 smaller text-uppercase tracking-wider">
                Configuración del Turno
              </h6>

              <div class="row g-3">
                <div class="col-md-12 mb-2">
                  <label class="form-label text-secondary fw-semibold small">Tipo de Turno</label>
                  <v-select
                    id="tipoTurno"
                    :key="listaDeTurnos.length > 0 ? 'turnos-loaded' : 'turnos-loading'"
                    :options="listaDeTurnos"
                    :model-value="registro.tipo_turno"
                    @update:model-value="(newValue: string) => { 
                      $emit('update:registro', {
                          ...registro,
                          tipo_turno: newValue
                      })
                    }"
                    :disabled="turnoEnCurso"
                    placeholder="Seleccione un turno"
                    :clearable="false"
                    :searchable="false"
                    class="custom-v-select"
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary fw-semibold small">Fecha de Inicio</label>
                  <DatePicker
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
                      <div class="input-group">
                        <span class="input-group-text bg-white border-0 shadow-sm"
                          ><i class="bi bi-calendar-event text-primary"></i
                        ></span>
                        <input
                          class="form-control bg-white border-0 shadow-sm"
                          :value="inputValue"
                          v-on="inputEvents"
                          placeholder="Seleccione fecha de inicio"
                          readonly
                          :disabled="turnoEnCurso"
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>

                <div class="col-md-6">
                  <label class="form-label text-secondary fw-semibold small"
                    >Fecha de Término</label
                  >
                  <DatePicker
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
                      <div class="input-group">
                        <span class="input-group-text bg-white border-0 shadow-sm"
                          ><i class="bi bi-calendar-event text-danger"></i
                        ></span>
                        <input
                          class="form-control bg-white border-0 shadow-sm"
                          :value="inputValue"
                          v-on="inputEvents"
                          placeholder="Seleccione fecha de Termino"
                          readonly
                          :disabled="turnoEnCurso"
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>

                <div class="col-md-12 mt-3">
                  <label class="form-label text-secondary fw-semibold small">Servicio</label>
                  <v-select
                    id="servicio"
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
                    placeholder="Seleccione un servicio"
                    :clearable="false"
                    :searchable="true"
                    class="custom-v-select"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
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
              class="btn btn-primary fw-bold px-4 shadow-sm"
              @click="abrirConfirmacion"
            >
              <i class="bi bi-check-lg me-2"></i>Guardar Cambios
            </button>
          </div>

          <!-- Modal de confirmación -->
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
import type { RegisterDataReemplazo } from '@/types/models'
import { ref, computed } from 'vue'
import ConfirmationModal from '../common/ConfirmationModal.vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import { useDatePicker } from '@/composables/useDatePicker'

interface ReemplazoModalData extends Partial<RegisterDataReemplazo> {
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
  (e: 'buscar-entrante'): void
  (e: 'sustituir-usuario'): void
  (e: 'update:registro', nuevoRegistro: ReemplazoModalData): void
}>()

const showConfirmacion = ref(false)

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
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom v-select */
.custom-v-select :deep(.vs__dropdown-toggle) {
  background: white;
  border: none;
  border-radius: 0.5rem;
  padding: 4px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.075);
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 500;
  line-height: 27px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
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
  overflow: hidden;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.375rem;
  padding: 8px 12px;
  margin-bottom: 2px;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
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

:deep(.modal-content) {
  overflow: visible;
}
</style>
