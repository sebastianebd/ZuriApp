<template>
  <div class="card offer-card shadow-sm border-0 mb-3 rounded-3" data-test="offer-card">
    <div class="card-body p-3">
      <!-- Encabezado con Servicio y Countdown -->
      <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
        <div>
          <h6 class="card-title fw-bold text-dark mb-0" data-test="service-name">
            {{ offer.serviceName }}
          </h6>
          <span v-if="offer.serviceLocation" class="text-muted small">
            <i class="bi bi-geo-alt me-1"></i>{{ offer.serviceLocation }}
          </span>
        </div>

        <!-- Badge Countdown -->
        <span
          :class="['badge rounded-pill', countdownBadgeClass]"
          data-test="countdown-badge"
        >
          <i class="bi bi-hourglass-split me-1"></i>
          {{ countdownText }}
        </span>
      </div>

      <!-- Cargo y Tipo de Turno -->
      <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
        <span class="badge bg-light text-primary border" data-test="position-name">
          <i class="bi bi-person-badge me-1"></i>{{ offer.positionName }}
        </span>

        <span class="badge bg-primary-subtle text-primary border-0" data-test="shift-badge">
          <i class="bi bi-clock me-1"></i>{{ offer.tipo_turno }}
          <span v-if="offer.entryTime && offer.exitTime" class="ms-1">
            ({{ offer.entryTime }} - {{ offer.exitTime }})
          </span>
        </span>
      </div>

      <!-- Rango de Fechas -->
      <div class="dates-info text-secondary small mb-2" data-test="offer-dates">
        <i class="bi bi-calendar-event me-1 text-primary"></i>
        <span>{{ formattedDates }}</span>
        <span v-if="offer.totalShifts && offer.totalShifts > 1" class="ms-1 text-muted">
          ({{ offer.totalShifts }} turnos)
        </span>
      </div>

      <!-- Observaciones Clínicas -->
      <div
        v-if="offer.observaciones"
        class="offer-notes small text-muted bg-light p-2 rounded mb-3"
        data-test="offer-notes"
      >
        <i class="bi bi-info-circle me-1 text-secondary"></i>
        {{ offer.observaciones }}
      </div>

      <!-- Acción en 1-Toque -->
      <div class="offer-actions mt-3 pt-2 border-top">
        <button
          type="button"
          class="btn w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
          :class="isApplied ? 'btn-secondary text-white' : 'btn-primary'"
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

const countdownBadgeClass = computed(() => {
  if (isExpired.value) return 'bg-secondary text-white'
  if (remainingMinutes.value < 30) return 'bg-danger text-white'
  if (remainingMinutes.value < 120) return 'bg-warning text-dark'
  return 'bg-info text-dark'
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
.offer-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  background: #ffffff;
  border-left: 4px solid #0d6efd !important;

  &:active {
    transform: scale(0.99);
  }
}

.offer-notes {
  border-left: 3px solid #6c757d;
}
</style>
