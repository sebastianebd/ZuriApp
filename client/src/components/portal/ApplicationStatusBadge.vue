<template>
  <span
    :class="['application-status-badge status-badge badge', badgeClass]"
    data-test="application-status-badge"
  >
    <span class="status-inner">
      <i :class="['bi', iconClass]"></i>
      {{ statusText }}
    </span>

    <span
      v-if="status === 'withdrawn_conflict' && showExplanation"
      data-test="conflict-explanation"
      class="conflict-note"
    >
      <i class="bi bi-info-circle"></i>
      Fuiste seleccionado para otro turno en el mismo horario. Postulación cancelada automáticamente.
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    status: 'pending' | 'selected' | 'not_selected' | 'cancelled_by_staff' | 'withdrawn_conflict'
    offerStatus?: 'open' | 'evaluating' | 'awarded' | 'cancelled' | 'expired' | string
    showExplanation?: boolean
  }>(),
  {
    showExplanation: true,
  }
)

const isEvaluating = computed(() => {
  return (
    props.status === 'pending' &&
    props.offerStatus &&
    props.offerStatus !== 'open' &&
    props.offerStatus !== 'cancelled'
  )
})

const statusText = computed(() => {
  if (props.offerStatus === 'cancelled') {
    return 'Anulada'
  }
  switch (props.status) {
    case 'selected':
      return 'Adjudicado'
    case 'not_selected':
      return 'No seleccionado'
    case 'withdrawn_conflict':
      return 'Retirado por conflicto'
    case 'cancelled_by_staff':
      return 'Cancelado'
    case 'pending':
    default:
      return isEvaluating.value ? 'En evaluación' : 'En postulación'
  }
})

const badgeClass = computed(() => {
  if (props.offerStatus === 'cancelled') {
    return 'status-badge--cancelled'
  }
  switch (props.status) {
    case 'selected':
      return 'status-badge--success'
    case 'not_selected':
      return 'status-badge--muted'
    case 'withdrawn_conflict':
      return 'status-badge--danger'
    case 'cancelled_by_staff':
      return 'status-badge--muted'
    case 'pending':
    default:
      return isEvaluating.value ? 'status-badge--evaluating' : 'status-badge--pending'
  }
})

const iconClass = computed(() => {
  if (props.offerStatus === 'cancelled') {
    return 'bi-slash-circle'
  }
  switch (props.status) {
    case 'selected':
      return 'bi-trophy-fill'
    case 'not_selected':
      return 'bi-x-circle'
    case 'withdrawn_conflict':
      return 'bi-arrow-left-right'
    case 'cancelled_by_staff':
      return 'bi-slash-circle'
    case 'pending':
    default:
      return isEvaluating.value ? 'bi-hourglass-split' : 'bi-clock-history'
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/portal-theme' as t;

.status-badge {
  display: inline-flex;
  flex-direction: column;
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  padding: 3px t.$space-2;
  border-radius: t.$radius-sm;
  white-space: normal;

  &--success {
    background: t.$zuri-success-subtle;
    color: t.$zuri-success;
  }

  &--muted {
    background: t.$zuri-divider;
    color: t.$zuri-text-muted;
  }

  &--danger {
    background: t.$zuri-danger-subtle;
    color: t.$zuri-danger;
  }

  &--cancelled {
    background: t.$zuri-text-heading;
    color: #ffffff;
  }

  &--evaluating {
    background: t.$zuri-divider;
    color: t.$zuri-text-muted;
  }

  &--pending {
    background: t.$zuri-warning-subtle;
    color: darken(t.$zuri-warning, 15%);
  }
}

.status-inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.conflict-note {
  display: block;
  margin-top: 4px;
  font-size: 0.7rem;
  font-weight: t.$font-weight-normal;
  line-height: 1.3;
  opacity: 0.85;
  padding: 3px 4px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}
</style>
