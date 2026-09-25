<template>
  <div
    v-if="modelValue"
    class="sheet-backdrop"
    @click.self="close"
  >
    <div
      class="sheet-panel"
      data-test="shift-confirm-sheet"
    >
      <div class="sheet-handle"></div>

      <div class="sheet-header">
        <div class="sheet-header-left">
          <span class="sheet-icon sheet-icon--danger">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </span>
          <h2 class="sheet-title">Aviso de indisponibilidad</h2>
        </div>
        <button type="button" class="sheet-close" aria-label="Close" @click="close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <p class="sheet-desc">
        Si no puedes asistir a tu turno programado en
        <strong>{{ shift?.serviceName || 'Servicio Hospitalario' }}</strong>
        para el <strong>{{ shift?.date }}</strong>, indica el motivo detallado.
        Esta acción emitirá una alerta crítica a la jefatura de servicio en tiempo real.
      </p>

      <div class="input-group-custom">
        <label for="reason-input" class="input-label">
          Motivo de indisponibilidad
          <span class="required-hint">Mínimo 5 caracteres</span>
        </label>
        <textarea
          id="reason-input"
          v-model="reason"
          class="input-textarea"
          rows="4"
          placeholder="Ej: Licencia médica de urgencia por fractura..."
          data-test="reason-textarea"
        ></textarea>
        <span class="char-count">{{ reason.length }}/500</span>
      </div>

      <div class="sheet-actions">
        <button
          type="button"
          class="btn-danger-custom"
          :disabled="isSubmitDisabled || isSubmitting"
          data-test="submit-unavailable-btn"
          @click="submitUnavailable"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-send-fill me-2"></i>
          Enviar aviso de indisponibilidad
        </button>

        <button type="button" class="btn-cancel" @click="close">
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
@use '@/assets/styles/portal-theme' as t;

.sheet-backdrop {
  position: fixed;
  inset: 0;
  background-color: t.$zuri-backdrop;
  z-index: 1050;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.sheet-panel {
  background: t.$zuri-surface-raised;
  width: 100%;
  max-width: t.$portal-max-width;
  border-radius: t.$radius-sheet t.$radius-sheet 0 0;
  padding: t.$space-5 t.$space-4 calc(#{t.$space-5} + #{t.$safe-area-bottom});
  box-shadow: t.$shadow-xl;
  animation: sheetUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: t.$zuri-border;
  border-radius: 2px;
  margin: -#{t.$space-2} auto t.$space-4 auto;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: t.$space-3;
}

.sheet-header-left {
  display: flex;
  align-items: center;
  gap: t.$space-2;
}

.sheet-icon {
  width: 32px;
  height: 32px;
  border-radius: t.$radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;

  &--danger {
    background: t.$zuri-danger-subtle;
    color: t.$zuri-danger;
  }
}

.sheet-title {
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  margin: 0;
}

.sheet-close {
  width: 32px;
  height: 32px;
  border: none;
  background: t.$zuri-surface;
  border-radius: t.$radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: t.$zuri-text-muted;
  cursor: pointer;
  transition: all t.$transition-base;

  &:hover {
    background: t.$zuri-danger-subtle;
    color: t.$zuri-danger;
  }
}

.sheet-desc {
  font-size: t.$font-size-sm;
  color: t.$zuri-text-muted;
  line-height: 1.5;
  margin: 0 0 t.$space-4;

  strong {
    color: t.$zuri-text-heading;
  }
}

// --- Input ---
.input-group-custom {
  margin-bottom: t.$space-5;
}

.input-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-body;
  margin-bottom: t.$space-2;
}

.required-hint {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-normal;
  color: t.$zuri-danger;
}

.input-textarea {
  width: 100%;
  padding: t.$space-3;
  font-size: t.$font-size-sm;
  font-family: t.$font-family-base;
  color: t.$zuri-text-heading;
  background: t.$zuri-surface;
  border: 1.5px solid t.$zuri-border;
  border-radius: t.$radius-md;
  outline: none;
  resize: vertical;
  transition: border-color t.$transition-base, box-shadow t.$transition-base;

  &::placeholder {
    color: t.$zuri-text-subtle;
  }

  &:focus {
    border-color: t.$zuri-accent;
    box-shadow: 0 0 0 3px rgba(98, 182, 203, 0.15);
  }
}

.char-count {
  display: block;
  text-align: right;
  font-size: t.$font-size-xs;
  color: t.$zuri-text-subtle;
  margin-top: t.$space-1;
  font-variant-numeric: tabular-nums;
}

// --- Actions ---
.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: t.$space-2;
}

.btn-danger-custom {
  width: 100%;
  padding: t.$space-3;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: #ffffff;
  background: t.$zuri-danger;
  border: none;
  border-radius: t.$radius-md;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all t.$transition-base;

  &:hover:not(:disabled) {
    background: darken(t.$zuri-danger, 8%);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.btn-cancel {
  width: 100%;
  padding: t.$space-3;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-muted;
  background: transparent;
  border: 1px solid t.$zuri-border;
  border-radius: t.$radius-md;
  cursor: pointer;
  transition: all t.$transition-base;

  &:hover {
    background: t.$zuri-surface;
  }
}

@keyframes sheetUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
</style>
