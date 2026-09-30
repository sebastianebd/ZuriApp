<template>
  <div
    v-if="visible"
    class="modal fade show vanguard-modal"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    @click.self="emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
      <div class="modal-content vanguard-modal-content">
        <!-- Header -->
        <div class="modal-header border-0 pb-0 pt-4 px-4">
          <div class="d-flex align-items-center gap-3">
            <div class="modal-icon-box">
              <i class="bi bi-people"></i>
            </div>
            <div>
              <h5 class="modal-title fw-bold mb-0 text-dark">Gestión de Postulantes</h5>
              <p class="text-muted small mb-0 mt-1">Evalúa y adjudica el turno de reemplazo</p>
            </div>
          </div>
          <button
            type="button"
            class="btn-close shadow-none"
            aria-label="Close"
            @click="emit('close')"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body px-4 py-4">
          <!-- Loading State (Skeleton Loader) -->
          <div v-if="loading" class="skeleton-container">
            <div class="skeleton-row" v-for="i in 3" :key="i">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="skeleton-block rounded" style="width: 24px; height: 16px;"></div>
                <div class="skeleton-block rounded" style="width: 160px; height: 18px;"></div>
                <div class="skeleton-block rounded-pill ms-2" style="width: 55px; height: 20px;"></div>
              </div>
              <div class="d-flex gap-2">
                <div class="skeleton-block rounded" style="width: 90px; height: 14px;"></div>
                <div class="skeleton-block rounded" style="width: 130px; height: 14px;"></div>
              </div>
            </div>
          </div>

          <!-- Banners de Estado -->
          <template v-if="!loading">
            <div v-if="offerStatus === 'cancelled'" class="vanguard-alert alert-danger-subtle mb-4">
              <i class="bi bi-x-circle alert-icon"></i>
              <div>
                <strong class="d-block text-danger-emphasis mb-1">Convocatoria Anulada</strong>
                <span class="text-danger-emphasis opacity-75">El proceso fue cancelado. <span v-if="candidates.length > 0">Los siguientes funcionarios postularon antes del cierre temporal.</span></span>
              </div>
            </div>

            <div v-else-if="offerStatus === 'filled'" class="vanguard-alert alert-success-subtle mb-4">
              <i class="bi bi-check2-circle alert-icon"></i>
              <div>
                <strong class="d-block text-success-emphasis mb-1">Convocatoria Adjudicada</strong>
                <span class="text-success-emphasis opacity-75">El turno ya fue asignado. El funcionario seleccionado se encuentra resaltado.</span>
              </div>
            </div>

            <div v-else-if="offerStatus === 'finalized' && !isCallList" class="vanguard-alert alert-warning-subtle mb-4">
              <i class="bi bi-bell alert-icon pulse-icon"></i>
              <div>
                <strong class="d-block text-warning-emphasis mb-1">Periodo Finalizado (Por Adjudicar)</strong>
                <span class="text-warning-emphasis opacity-75">El tiempo límite terminó. Por favor, seleccione al funcionario idóneo para asignar el turno.</span>
              </div>
            </div>

            <!-- Modo Búsqueda Activa (0 postulantes) -->
            <div v-if="isCallList">
              <div class="vanguard-alert alert-info-subtle mb-4">
                <i class="bi bi-wind alert-icon"></i>
                <div>
                  <strong class="d-block text-info-emphasis mb-1">Convocatoria Desierta (Búsqueda Activa)</strong>
                  <span class="text-info-emphasis opacity-75">
                    No hubo postulantes registrados. A continuación se sugieren los mejores funcionarios disponibles para contactar directamente.
                  </span>
                </div>
              </div>

              <div v-if="candidates.length === 0" class="empty-state">
                <div class="empty-state-icon"><i class="bi bi-search"></i></div>
                <h6>Sin candidatos elegibles</h6>
                <p>No se encontraron funcionarios disponibles que cumplan con los descansos normativos requeridos.</p>
              </div>

              <div v-else class="candidate-list">
                <div
                  v-for="(cand, idx) in candidates"
                  :key="cand.staffId"
                  class="candidate-row"
                >
                  <div class="candidate-info">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <span class="rank-badge text-muted">#{{ idx + 1 }}</span>
                      <h6 class="fw-bold mb-0 text-dark">{{ cand.fullName }}</h6>
                    </div>
                    <div class="candidate-meta">
                      <span class="rut-text">{{ cand.rut }}</span>
                      <span class="meta-dot">•</span>
                      <span>{{ cand.positionName }}</span>
                    </div>
                  </div>

                  <div class="candidate-action">
                    <span class="text-dark fw-medium" style="font-size: 0.9rem;">
                      <i class="bi bi-telephone text-muted me-1"></i> {{ cand.phone || 'Sin número' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modo Postulantes Registrados -->
            <div v-else>
              <div v-if="candidates.length === 0" class="empty-state">
                <div class="empty-state-icon"><i class="bi bi-inbox"></i></div>
                <h6>Sin postulantes</h6>
                <p>No hay postulantes registrados en esta convocatoria.</p>
              </div>

              <div v-else class="candidate-list">
                <div
                  v-for="(cand, idx) in candidates"
                  :key="cand.staffId"
                  class="candidate-row"
                  :class="{ 'is-awarded': offerStatus === 'filled' && awardedStaffId === cand.staffId, 'is-invalid': cand.isValid === false && offerStatus !== 'filled' }"
                >
                  <div class="candidate-info">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <span class="rank-badge" :class="{ 'text-primary': idx === 0 }">#{{ idx + 1 }}</span>
                      <h6 class="fw-bold mb-0 text-dark">{{ cand.fullName }}</h6>
                    </div>
                    <div class="candidate-meta">
                      <span class="rut-text">{{ cand.rut }}</span>
                      <span class="meta-dot">•</span>
                      <span>{{ cand.positionName }}</span>
                      <template v-if="cand.phone">
                        <span class="meta-dot">•</span>
                        <span>{{ cand.phone }}</span>
                      </template>
                    </div>
                  </div>

                  <div class="candidate-action">
                    <button
                      v-if="['open', 'finalized'].includes(offerStatus || 'open')"
                      type="button"
                      class="btn btn-primary btn-vanguard-sm"
                      :disabled="cand.isValid === false"
                      @click="emit('award', cand.staffId)"
                    >
                      Adjudicar
                    </button>
                    <span v-else-if="offerStatus === 'filled' && awardedStaffId === cand.staffId" class="awarded-badge">
                      <i class="bi bi-check2 me-1"></i> Adjudicado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-0 pt-0 pb-4 px-4 d-flex justify-content-between">
          <button
            v-if="['open', 'finalized'].includes(offerStatus || '')"
            type="button"
            class="btn btn-outline-danger btn-vanguard-sm"
            @click="emit('cancel-offer')"
          >
            Anular Convocatoria
          </button>
          <div v-else></div>
          
          <button
            type="button"
            class="btn btn-light fw-medium px-4 rounded-pill shadow-sm border"
            @click="emit('close')"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- Backdrop (Solo visual) -->
  <div v-if="visible" class="modal-backdrop fade show"></div>
</template>

<script setup lang="ts">
import type { ScoredCandidateItem } from '@/types/replacement-offer.types'

defineProps<{
  visible: boolean
  offerId: string
  isCallList: boolean
  candidates: ScoredCandidateItem[]
  loading?: boolean
  offerStatus?: string
  awardedStaffId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'award', staffId: string): void
  (e: 'cancel-offer'): void
}>()
</script>

<style scoped>
/* ==========================================================================
   VANGUARD CLINICAL DESIGN SYSTEM - MODAL REDESIGN
   ========================================================================== */

.modal.show {
  display: block;
}

.vanguard-modal-content {
  border: none;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  height: 65vh; /* Altura estándar fija */
  min-height: 550px;
  max-height: 850px;
  display: flex;
  flex-direction: column;
}

.modal-body {
  flex: 1 1 auto;
  overflow-y: auto;
}

/* --- Skeleton Loader --- */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 380px; /* Previene el salto visual en la carga */
}

.skeleton-row {
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 18px;
  animation: pulse-skeleton 1.5s infinite ease-in-out;
}

.skeleton-block {
  background-color: #cbd5e1;
  opacity: 0.4;
}

@keyframes pulse-skeleton {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* --- Header --- */
.modal-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #f8fafc;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  border: 1px solid #f1f5f9;
}

.modal-title {
  letter-spacing: -0.02em;
}

/* --- Banners --- */
.vanguard-alert {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 16px;
  font-size: 0.85rem;
  border: 1px solid transparent;
}

.alert-icon {
  font-size: 1.2rem;
  margin-top: 2px;
}

.pulse-icon {
  animation: vanguard-pulse 2s infinite;
}

@keyframes vanguard-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.alert-danger-subtle {
  background: #fff1f2;
  border-color: #ffe4e6;
}
.alert-danger-subtle .alert-icon { color: #e11d48; }

.alert-success-subtle {
  background: #f0fdf4;
  border-color: #dcfce7;
}
.alert-success-subtle .alert-icon { color: #16a34a; }

.alert-warning-subtle {
  background: #fffbeb;
  border-color: #fef3c7;
}
.alert-warning-subtle .alert-icon { color: #d97706; }

.alert-info-subtle {
  background: #f0f9ff;
  border-color: #e0f2fe;
}
.alert-info-subtle .alert-icon { color: #0284c7; }

/* --- Empty State --- */
.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  color: #64748b;
}

.empty-state-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #94a3b8;
  margin: 0 auto 1rem;
}

.empty-state h6 {
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 0.85rem;
  margin-bottom: 0;
  max-width: 300px;
  margin-inline: auto;
}

/* --- Candidate List --- */
.candidate-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.candidate-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.candidate-row:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.candidate-row.is-awarded {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.candidate-row.is-invalid {
  opacity: 0.7;
  background: #fafafa;
}

.candidate-row.is-invalid h6 {
  color: #94a3b8 !important;
}

.rank-badge {
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.incompatible-badge {
  background: #fee2e2;
  color: #b91c1c;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.candidate-meta {
  font-size: 0.8rem;
  color: #64748b;
}

.rut-text {
  font-family: var(--bs-font-monospace, monospace);
  font-size: 0.75rem;
}

.meta-dot {
  opacity: 0.5;
  margin: 0 6px;
}

.violation-text {
  font-size: 0.7rem;
  color: #ef4444;
  font-weight: 500;
}

/* --- Buttons & Badges --- */
.btn-vanguard-sm {
  border-radius: 9999px;
  padding: 0.4rem 1.2rem;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-vanguard-sm:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
}

.btn-vanguard-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #0f172a;
  border-color: #0f172a;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1e293b;
  border-color: #1e293b;
}

.awarded-badge {
  display: inline-flex;
  align-items: center;
  background: #dcfce7;
  color: #166534;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}
</style>
