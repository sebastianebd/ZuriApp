<template>
  <div
    v-if="modelValue"
    class="bottom-sheet-backdrop"
    @click.self="close"
  >
    <div
      class="bottom-sheet-content show"
      data-test="shift-confirm-sheet"
    >
      <div class="bottom-sheet-handle"></div>

      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 text-danger fw-bold">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          Aviso de Indisponibilidad
        </h5>
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="close"
        ></button>
      </div>

      <p class="text-muted small mb-3">
        Si no puedes asistir a tu turno programado en
        <strong>{{ shift?.serviceName || 'Servicio Hospitalario' }}</strong>
        para el <strong>{{ shift?.date }}</strong>, indica el motivo detallado.
        Esta acción emitirá una alerta crítica a la jefatura de servicio en tiempo real.
      </p>

      <div class="mb-3">
        <label for="reason-input" class="form-label fw-semibold">
          Motivo de Indisponibilidad / Fuerza Mayor
          <span class="text-danger">* (Mínimo 5 caracteres)</span>
        </label>
        <textarea
          id="reason-input"
          v-model="reason"
          class="form-control"
          rows="4"
          placeholder="Ej: Licencia médica de urgencia por fractura..."
          data-test="reason-textarea"
        ></textarea>
        <div class="form-text text-end">
          {{ reason.length }}/500 caracteres
        </div>
      </div>

      <div class="d-grid gap-2">
        <button
          type="button"
          class="btn btn-danger py-2 fw-semibold"
          :disabled="isSubmitDisabled || isSubmitting"
          data-test="submit-unavailable-btn"
          @click="submitUnavailable"
        >
          <span
            v-if="isSubmitting"
            class="spinner-border spinner-border-sm me-2"
          ></span>
          <i v-else class="bi bi-send-fill me-2"></i>
          Enviar Aviso de Indisponibilidad
        </button>

        <button
          type="button"
          class="btn btn-outline-secondary py-2"
          @click="close"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePortalStore } from '@/stores/portal.store'

const props = defineProps<{
  modelValue: boolean
  shift: {
    id: string
    assignmentModel: 'TurnAssignment' | 'Replacement'
    date: string
    serviceName: string
  } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const portalStore = usePortalStore()
const reason = ref('')
const isSubmitting = ref(false)

const isSubmitDisabled = computed(() => {
  return reason.value.trim().length < 5
})

function close() {
  reason.value = ''
  emit('update:modelValue', false)
}

async function submitUnavailable() {
  if (isSubmitDisabled.value || !props.shift) return

  isSubmitting.value = true
  try {
    await portalStore.reportUnavailableNextShift(
      props.shift.id,
      props.shift.assignmentModel,
      props.shift.date,
      reason.value.trim()
    )
    close()
  } catch (error) {
    console.error('Error enviando aviso de indisponibilidad:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped lang="scss">
.bottom-sheet-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1050;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.bottom-sheet-content {
  background: #ffffff;
  width: 100%;
  max-width: 540px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.25s ease-out;

  .bottom-sheet-handle {
    width: 40px;
    height: 4px;
    background: #dee2e6;
    border-radius: 2px;
    margin: -0.5rem auto 1rem auto;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
