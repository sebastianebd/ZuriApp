<template>
  <div
    v-if="showModal && alert"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    aria-labelledby="alertDetailTitle"
    aria-modal="true"
    style="background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
        <!-- Header -->
        <div
          class="modal-header border-bottom px-4 py-3"
          :class="{
            'bg-danger-subtle text-danger-emphasis': alert.severity === 'critical',
            'bg-warning-subtle text-warning-emphasis': alert.severity === 'high',
            'bg-info-subtle text-info-emphasis': alert.severity === 'medium',
          }"
        >
          <div class="d-flex align-items-center gap-2">
            <span
              class="badge rounded-pill text-uppercase px-3 py-2 fw-bold"
              :class="{
                'bg-danger text-white': alert.severity === 'critical',
                'bg-warning text-dark': alert.severity === 'high',
                'bg-info text-dark': alert.severity === 'medium',
              }"
            >
              {{ alert.ruleId }}
            </span>
            <h5 class="modal-title fw-bold mb-0" id="alertDetailTitle">
              Detalle de Infracción {{ alert.category === 'normative' ? 'Normativa' : 'Operativa' }}
            </h5>
          </div>
          <button
            type="button"
            class="btn-close shadow-none"
            aria-label="Cerrar"
            data-test="btn-close"
            @click="onClose"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <!-- Alerta Mensaje -->
          <div class="alert alert-light border shadow-sm rounded-3 mb-4">
            <div class="d-flex align-items-start gap-3">
              <i class="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
              <div>
                <h6 class="fw-bold text-dark mb-1">Descripción de la Infracción</h6>
                <p class="text-muted mb-0">{{ alert.message }}</p>
              </div>
            </div>
          </div>

          <!-- Datos del Funcionario y Turno -->
          <div class="row g-3 mb-4">
            <div class="col-md-6" v-if="alert.staffName || alert.rut">
              <div class="p-3 bg-light rounded-3 border">
                <small class="text-muted text-uppercase fw-bold smaller d-block mb-1">Funcionario Afectado</small>
                <p class="fw-semibold text-dark mb-0">{{ alert.staffName || 'N/A' }}</p>
                <small class="text-secondary" v-if="alert.rut">RUT: {{ alert.rut }}</small>
                <span class="d-block text-muted smaller" v-if="alert.positionName">{{ alert.positionName }}</span>
              </div>
            </div>

            <div class="col-md-6">
              <div class="p-3 bg-light rounded-3 border">
                <small class="text-muted text-uppercase fw-bold smaller d-block mb-1">Detalles Operacionales</small>
                <p class="fw-semibold text-dark mb-0" v-if="alert.date">
                  Fecha: {{ formatDate(alert.date) }}
                </p>
                <p class="text-muted mb-0 small" v-if="alert.shiftSlot">
                  Franja: <span class="badge bg-secondary">{{ alert.shiftSlot }}</span>
                </p>
                <p class="text-muted mb-0 small" v-if="alert.context?.restHours !== undefined">
                  Horas de descanso efectivas: <span class="fw-bold text-danger">{{ alert.context.restHours }}h</span>
                </p>
                <p class="text-muted mb-0 small" v-if="alert.context?.deficit !== undefined">
                  Déficit detectado: <span class="fw-bold text-danger">{{ alert.context.deficit }} vacante(s)</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Formulario de Resolución Manual -->
          <div class="resolution-box p-3 border rounded-3 bg-white">
            <label for="resolutionNote" class="form-label fw-bold text-dark mb-1">
              Justificación de Resolución
              <span class="text-danger">*</span>
            </label>
            <p class="text-muted smaller mb-2">
              Para resolver esta alerta es mandatario fundamentar el motivo u orden de excepción (mínimo 5 caracteres).
            </p>
            <textarea
              id="resolutionNote"
              v-model="resolutionNote"
              class="form-control rounded-3"
              rows="3"
              placeholder="Ej: Autorizado por jefatura debido a emergencia sanitaria o cobertura urgente..."
              data-test="input-resolution-note"
            ></textarea>
            <small v-if="resolutionNote.trim().length > 0 && resolutionNote.trim().length < 5" class="text-danger smaller">
              La justificación debe contener al menos 5 caracteres.
            </small>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-top bg-light px-4 py-3 d-flex justify-content-between">
          <button
            type="button"
            class="btn btn-outline-secondary rounded-pill px-4"
            data-test="btn-cancel"
            @click="onClose"
          >
            Cerrar
          </button>
          <button
            type="button"
            class="btn btn-success rounded-pill px-4 fw-medium d-flex align-items-center gap-2"
            data-test="btn-resolve"
            :disabled="isResolving || resolutionNote.trim().length < 5"
            @click="onResolve"
          >
            <span v-if="isResolving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <i v-else class="bi bi-check-circle-fill"></i>
            Marcar como Resuelta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAlertStore } from '../../stores/alert.store'

const alertStore = useAlertStore()

const showModal = computed(() => alertStore.showDetailModal)
const alert = computed(() => alertStore.selectedAlert)

const resolutionNote = ref('')
const isResolving = ref(false)

watch(showModal, (val) => {
  if (val) {
    resolutionNote.value = ''
  }
})

const onClose = () => {
  alertStore.closeDetail()
}

const onResolve = async () => {
  if (!alert.value || resolutionNote.value.trim().length < 5) return

  isResolving.value = true
  try {
    await alertStore.resolveAlert(alert.value.id, resolutionNote.value.trim())
    resolutionNote.value = ''
    alertStore.closeDetail()
  } catch (err) {
    // Manejado por store
  } finally {
    isResolving.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<style scoped>
.smaller {
  font-size: 0.8rem;
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
</style>
