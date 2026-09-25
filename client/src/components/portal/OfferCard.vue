<template>
  <div class="offer-card" data-test="offer-card">
    <!-- Top row: Service + Countdown -->
    <div class="offer-top">
      <div>
        <h3 class="offer-service" data-test="service-name">
          {{ offer.serviceName }}
        </h3>
        <span v-if="offer.serviceLocation" class="offer-location">
          <i class="bi bi-geo-alt"></i> {{ offer.serviceLocation }}
        </span>
      </div>

      <span
        :class="['countdown-chip', countdownChipClass]"
        data-test="countdown-badge"
      >
        <i class="bi bi-hourglass-split"></i>
        {{ countdownText }}
      </span>
    </div>

    <!-- Details row -->
    <div class="offer-details">
      <span class="detail-chip" data-test="position-name">
        <i class="bi bi-person-badge"></i> {{ offer.positionName }}
      </span>
      <span class="detail-chip detail-chip--accent" data-test="shift-badge">
        <i class="bi bi-clock"></i> {{ offer.tipo_turno }}
        <span v-if="offer.entryTime && offer.exitTime">
          ({{ offer.entryTime }} - {{ offer.exitTime }})
        </span>
      </span>
    </div>

    <!-- Date range -->
    <div class="offer-dates" data-test="offer-dates">
      <i class="bi bi-calendar-event"></i>
      {{ formattedDates }}
      <span v-if="offer.totalShifts && offer.totalShifts > 1" class="total-shifts">
        ({{ offer.totalShifts }} turnos)
      </span>
    </div>

    <!-- Notes -->
    <div
      v-if="offer.observaciones"
      class="offer-notes"
      data-test="offer-notes"
    >
      <i class="bi bi-info-circle"></i>
      {{ offer.observaciones }}
    </div>

    <!-- CTA Button -->
    <div class="offer-cta">
      <button
        type="button"
        class="apply-btn"
        :class="{
          'btn-secondary apply-btn--applied': isApplied,
          'apply-btn--expired': isExpired && !isApplied,
        }"
        data-test="apply-btn"
        :disabled="loading || isExpired || isApplied"
        @click="emit('apply', offer.id)"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
        <template v-else>
          <i v-if="isApplied" class="bi bi-check-circle-fill"></i>
          <i v-else-if="isExpired" class="bi bi-lock-fill"></i>
          <i v-else class="bi bi-hand-index-thumb"></i>
          <span>
            {{
              isApplied
                ? 'Ya aplicaste a este Reemplazo'
                : isExpired
                ? 'Convocatoria Cerrada'
                : 'Aplicar a Reemplazo'
            }}
          </span>
        </template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { PwaOpenOfferItem } from '@/types/portal.types'

const props = defineProps<{
  offer: PwaOpenOfferItem
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'apply', offerId: string): void
  (e: 'withdraw', offerId: string): void
}>()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const isApplied = computed(() => {
  return !!(props.offer.alreadyApplied || props.offer.hasApplied)
})

const expiresTimestamp = computed(() => {
  return new Date(props.offer.expiresAt).getTime()
})

const isExpired = computed(() => {
  return expiresTimestamp.value <= now.value
})

const remainingMinutes = computed(() => {
  const diffMs = expiresTimestamp.value - now.value
  return Math.max(0, Math.floor(diffMs / 60000))
})

const countdownText = computed(() => {
  if (isExpired.value) return 'Expirado'

  const mins = remainingMinutes.value
  if (mins < 60) {
    return `Cierra en ${mins}m`
  }
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins > 0 ? `Cierra en ${hours}h ${remMins}m` : `Cierra en ${hours}h`
})

const countdownChipClass = computed(() => {
  if (isExpired.value) return 'countdown-chip--expired'
  if (remainingMinutes.value < 30) return 'countdown-chip--urgent'
  if (remainingMinutes.value < 120) return 'countdown-chip--warning'
  return 'countdown-chip--default'
})

const formattedDates = computed(() => {
  try {
    const start = new Date(props.offer.fecha_inicio)
    const end = new Date(props.offer.fecha_termino)

    const startStr = start.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const endStr = end.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    return startStr === endStr ? startStr : `${startStr} al ${endStr}`
  } catch {
    return `${props.offer.fecha_inicio} al ${props.offer.fecha_termino}`
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/portal-theme' as t;

.offer-card {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  padding: t.$space-4;
  box-shadow: t.$shadow-sm;
  border-left: 3px solid t.$zuri-brand;
  margin-bottom: t.$space-3;
  transition: transform t.$transition-fast, box-shadow t.$transition-base;

  &:active {
    transform: scale(0.995);
  }
}

.offer-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: t.$space-2;
  margin-bottom: t.$space-3;
}

.offer-service {
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
  margin: 0 0 2px;
}

.offer-location {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  display: flex;
  align-items: center;
  gap: 3px;
}

// --- Countdown ---
.countdown-chip {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  padding: 2px t.$space-2;
  border-radius: t.$radius-sm;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;

  &--default {
    background: t.$zuri-accent-subtle;
    color: t.$zuri-brand;
  }

  &--warning {
    background: t.$zuri-warning-subtle;
    color: darken(t.$zuri-warning, 15%);
  }

  &--urgent {
    background: t.$zuri-danger-subtle;
    color: t.$zuri-danger;
  }

  &--expired {
    background: t.$zuri-divider;
    color: t.$zuri-text-subtle;
  }
}

// --- Details ---
.offer-details {
  display: flex;
  flex-wrap: wrap;
  gap: t.$space-2;
  margin-bottom: t.$space-3;
}

.detail-chip {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-body;
  background: t.$zuri-surface;
  border: 1px solid t.$zuri-border;
  padding: 2px t.$space-2;
  border-radius: t.$radius-xs;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &--accent {
    background: t.$zuri-accent-subtle;
    border-color: t.$zuri-accent-muted;
    color: t.$zuri-brand;
  }
}

.offer-dates {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: t.$space-2;

  .total-shifts {
    color: t.$zuri-text-subtle;
  }
}

.offer-notes {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  background: t.$zuri-surface;
  padding: t.$space-2 t.$space-3;
  border-radius: t.$radius-sm;
  border-left: 2px solid t.$zuri-text-subtle;
  margin-bottom: t.$space-3;
  display: flex;
  align-items: flex-start;
  gap: t.$space-2;
  line-height: 1.4;
}

// --- CTA ---
.offer-cta {
  padding-top: t.$space-3;
  border-top: 1px solid t.$zuri-divider;
}

.apply-btn {
  width: 100%;
  padding: t.$space-3;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: #ffffff;
  background: t.$zuri-brand;
  border: none;
  border-radius: t.$radius-md;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: t.$space-2;
  transition: all t.$transition-base;

  &:hover:not(:disabled) {
    background: t.$zuri-brand-light;
    box-shadow: t.$shadow-md;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    cursor: not-allowed;
  }

  &--applied {
    background: t.$zuri-text-subtle;
    opacity: 0.7;
  }

  &--expired {
    background: t.$zuri-divider;
    color: t.$zuri-text-subtle;
  }
}
</style>
