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

              <div class="d-flex align-items-center mb-3">
                <div class="flex-grow-1">
                  <p class="mb-0 small fw-medium text-secondary">
                    <i class="bi bi-calendar-plus me-1 text-success"></i>
                    Inicio del Nuevo Reemplazo:
                    <span class="text-dark fw-bold">{{
                      fechaInicioB || 'Día siguiente a la Fecha de Corte'
                    }}</span>
                  </p>
                </div>
                <button
                  @click.prevent="$emit('sustituir-usuario')"
                  class="btn btn-success btn-sm fw-bold shadow-sm px-3 border-0"
                >
                  <i class="bi bi-person-plus-fill me-1"></i> Asignar
                </button>
              </div>

              <div
                v-if="isSameUser"
                class="alert alert-danger border-0 p-2 mb-3 rounded-3 shadow-none d-flex align-items-center smaller"
              >
                <i class="bi bi-x-circle-fill me-2"></i>
                <span>El funcionario entrante no puede ser el mismo que el actual.</span>
              </div>

              <div class="form-floating mb-3">
                <input
                  type="text"
                  id="rutEntranteB"
                  :value="nuevoFuncionarioB.rut_entrante || 'N/A'"
                  class="form-control bg-white border-0 shadow-sm rounded-3"
                  :class="{ 'is-invalid': isSameUser }"
                  disabled
                  placeholder="RUT"
                />
                <label for="rutEntranteB" class="text-secondary fw-semibold"
                  >RUT Nuevo Funcionario</label
                >
              </div>

              <div class="form-floating mb-2">
                <input
                  type="text"
                  id="nombreEntranteB"
                  :value="
                    `${nuevoFuncionarioB.nombre_entrante || ''} ${
                      nuevoFuncionarioB.apellido_entrante || ''
                    }` || 'Pendiente de selección'
                  "
                  class="form-control bg-white border-0 shadow-sm rounded-3"
                  disabled
                  placeholder="Nombre"
                />
                <label for="nombreEntranteB" class="text-secondary fw-semibold"
                  >Nombre Completo</label
                >
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
import type { RegisterDataReemplazo } from '@/types/models'
import { computed, ref, watch } from 'vue'
import ConfirmationModal from '../common/ConfirmationModal.vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'

interface ReemplazoModalData extends Partial<RegisterDataReemplazo> {
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
// El reemplazante debe trabajar al menos 1 día, por lo tanto el corte A no puede ser el mismo día del término.
// Máximo puede ser el penúltimo día.
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
    // Si ya es string, lo emitimos tal cual (esperando YYYY-MM-DD)
    // A veces v-calendar emite el string ISO completo si no se ajusta la máscara
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

// Validar que no sea el mismo usuario
const isSameUser = computed(() => {
  if (!props.registroActual.rut_entrante || !props.nuevoFuncionarioB.rut_entrante) return false
  return props.registroActual.rut_entrante === props.nuevoFuncionarioB.rut_entrante
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
</style>
