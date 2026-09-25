<template>
  <span
    :class="['application-status-badge badge', badgeClass]"
    data-test="application-status-badge"
  >
    <span class="d-inline-flex align-items-center">
      <i :class="['bi me-1', iconClass]"></i>
      {{ statusText }}
    </span>

    <div
      v-if="status === 'withdrawn_conflict' && showExplanation"
      data-test="conflict-explanation"
      class="conflict-explanation small mt-1 text-wrap fw-normal text-start"
    >
      <i class="bi bi-info-circle me-1"></i>
      Fuiste seleccionado para otro turno en el mismo horario. Postulación cancelada automáticamente.
    </div>
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
    return 'bg-dark text-white'
  }
  switch (props.status) {
    case 'selected':
      return 'bg-success text-white'
    case 'not_selected':
      return 'bg-secondary text-white'
    case 'withdrawn_conflict':
      return 'bg-danger text-white'
    case 'cancelled_by_staff':
      return 'bg-secondary text-white'
    case 'pending':
    default:
      return isEvaluating.value ? 'bg-secondary text-white' : 'bg-warning text-dark'
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

<style scoped>
.application-status-badge {
  font-size: 0.82rem;
  padding: 0.4em 0.65em;
  white-space: normal;
}
.conflict-explanation {
  font-size: 0.75rem;
  line-height: 1.25;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 4px 6px;
  border-radius: 4px;
}
</style>
