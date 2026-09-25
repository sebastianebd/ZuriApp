<template>
  <div
    v-if="visible"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5); z-index: 1055;"
  >
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content shadow-lg border-0">
        <!-- Header -->
        <div class="modal-header bg-light border-bottom">
          <h5 class="modal-title fw-bold text-dark d-flex align-items-center gap-2">
            <span v-if="isCallList">📞 Búsqueda Activa (Llamada Directa)</span>
            <span v-else>👥 Postulantes de la Convocatoria</span>
          </h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="emit('close')"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <!-- Loading -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-muted mt-2">Calculando idoneidad clínica y scoring...</p>
          </div>

          <!-- Modo Búsqueda Activa (0 postulantes) -->
          <div v-else-if="isCallList">
            <div class="alert alert-warning d-flex align-items-start gap-3 shadow-sm mb-4">
              <span class="fs-4">⚠️</span>
              <div>
                <h6 class="fw-bold mb-1">Convocatoria Desierta (0 postulantes)</h6>
                <p class="mb-0 small text-muted">
                  El plazo de postulación concluyó sin postulantes registrados. A continuación se sugieren los 10 mejores funcionarios disponibles del hospital con su número telefónico directo para contactar de inmediato:
                </p>
              </div>
            </div>

            <div v-if="candidates.length === 0" class="text-center py-4 text-muted">
              No se encontraron funcionarios disponibles con los descansos normativos requeridos.
            </div>

            <div v-else class="list-group shadow-sm">
              <div
                v-for="(cand, idx) in candidates"
                :key="cand.staffId"
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3"
              >
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="badge bg-secondary">#{{ idx + 1 }}</span>
                    <h6 class="fw-bold mb-0 text-dark">{{ cand.fullName }}</h6>
                    <span class="badge bg-info text-dark">{{ cand.score }} pts</span>
                  </div>
                  <div class="small text-muted mb-2">
                    <span>RUT: {{ cand.rut }}</span> • <span>{{ cand.positionName }}</span>
                  </div>
                  <!-- Mini breakdown -->
                  <div class="d-flex flex-wrap gap-2 small">
                    <span v-if="cand.breakdown.previousReplacements > 0" class="badge bg-success-subtle text-success border border-success-subtle">
                      +30 exp. previa ({{ cand.breakdown.previousReplacements }})
                    </span>
                    <span class="badge bg-light text-dark border">
                      {{ cand.breakdown.accumulatedHoursMonthly }}h acumuladas en el mes
                    </span>
                    <span v-if="cand.breakdown.hoursSinceLastShift >= 24" class="badge bg-success-subtle text-success border border-success-subtle">
                      +20 descanso ({{ cand.breakdown.hoursSinceLastShift }}h)
                    </span>
                  </div>
                </div>

                <div class="text-end">
                  <a
                    :href="`tel:${cand.phone}`"
                    class="btn btn-outline-success btn-sm fw-semibold d-inline-flex align-items-center gap-1 shadow-sm px-3"
                  >
                    <span>📞 Llamar</span>
                    <span>{{ cand.phone }}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Modo Postulantes Registrados -->
          <div v-else>
            <div v-if="candidates.length === 0" class="text-center py-4 text-muted">
              No hay postulantes registrados en esta convocatoria.
            </div>

            <div v-else class="d-flex flex-column gap-3">
              <div
                v-for="(cand, idx) in candidates"
                :key="cand.staffId"
                class="card border shadow-sm"
              >
                <div class="card-body p-3">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div class="d-flex align-items-center gap-2">
                        <span class="badge" :class="idx === 0 ? 'bg-primary' : 'bg-secondary'">
                          Rank #{{ idx + 1 }}
                        </span>
                        <h6 class="fw-bold mb-0 text-dark">{{ cand.fullName }}</h6>
                        <span class="badge bg-primary fs-6">{{ cand.score }} pts</span>
                      </div>
                      <div class="small text-muted mt-1">
                        <span>RUT: {{ cand.rut }}</span> • <span>{{ cand.positionName }}</span>
                        <span v-if="cand.phone"> • Tel: {{ cand.phone }}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="btn btn-success btn-sm fw-semibold px-3 shadow-sm"
                      @click="emit('award', cand.staffId)"
                    >
                      ✓ Adjudicar Turno
                    </button>
                  </div>

                  <!-- Desglose de Scoring -->
                  <div class="bg-light p-2 rounded small mt-2">
                    <div class="fw-semibold text-muted mb-1">Desglose de Puntuación:</div>
                    <div class="d-flex flex-wrap gap-2">
                      <span
                        class="badge"
                        :class="cand.breakdown.previousReplacements > 0 ? 'bg-success' : 'bg-light text-muted border'"
                      >
                        {{ cand.breakdown.previousReplacements > 0 ? '+30 Exp. previa en el servicio' : '0 Sin exp. en servicio' }}
                      </span>
                      <span class="badge bg-light text-dark border">
                        Carga mensual: {{ cand.breakdown.accumulatedHoursMonthly }}h
                      </span>
                      <span
                        class="badge"
                        :class="cand.breakdown.hoursSinceLastShift >= 24 ? 'bg-success' : 'bg-warning text-dark'"
                      >
                        Descanso: {{ cand.breakdown.hoursSinceLastShift }}h
                      </span>
                      <span
                        class="badge"
                        :class="cand.breakdown.cleanRecord ? 'bg-success' : 'bg-warning text-dark'"
                      >
                        {{ cand.breakdown.cleanRecord ? '+10 Asistencia intachable' : 'Con avisos de indisponibilidad' }}
                      </span>
                      <span
                        v-if="cand.breakdown.nearWeeklyCapPenalty"
                        class="badge bg-danger"
                      >
                        -20 Límite semanal 44h
                      </span>
                      <span
                        v-if="cand.breakdown.nightShiftAdjacencyPenalty"
                        class="badge bg-danger"
                      >
                        -30 Noche contigua
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer bg-light border-top">
          <button
            type="button"
            class="btn btn-secondary"
            @click="emit('close')"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScoredCandidateItem } from '@/types/replacement-offer.types'

defineProps<{
  visible: boolean
  offerId: string
  isCallList: boolean
  candidates: ScoredCandidateItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'award', staffId: string): void
}>()
</script>

<style scoped>
.modal.show {
  display: block;
}
</style>
