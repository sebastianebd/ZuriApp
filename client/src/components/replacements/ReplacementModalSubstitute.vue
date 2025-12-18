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
                <span class="fw-bold text-dark">{{ registroActual.fecha_inicio }}</span>
              </p>

              <hr class="my-3 opacity-10" />

              <div class="form-floating mb-2">
                <input
                  type="date"
                  id="fechaCorteA"
                  :value="fechaCorteA"
                  @input="$emit('update:fechaCorteA', ($event.target as HTMLInputElement).value)"
                  class="form-control bg-white border-danger border-opacity-25 shadow-sm rounded-3"
                />
                <label for="fechaCorteA" class="text-danger fw-semibold"
                  >Último Día Trabajado (Funcionario A) *</label
                >
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

              <div class="form-floating mb-3">
                <input
                  type="text"
                  id="rutEntranteB"
                  :value="nuevoFuncionarioB.rut_entrante || 'N/A'"
                  class="form-control bg-white border-0 shadow-sm rounded-3"
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
import { computed, ref } from 'vue'
import ConfirmationModal from '../common/ConfirmationModal.vue'

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

const fechaInicioB = computed(() => {
  if (!props.fechaCorteA) return ''

  const corte = new Date(props.fechaCorteA)
  corte.setDate(corte.getDate() + 1)

  return corte.toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  const hasFechaCorte = !!props.fechaCorteA
  const hasFuncionarioB = !!props.nuevoFuncionarioB.rut_entrante

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
