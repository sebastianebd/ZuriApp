<template>
  <div class="replacement-offers-view container-fluid py-4">
    <!-- Header Vanguardista (Clinical Double-Bezel & Island CTA) -->
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 header-container">
      <div class="d-flex align-items-center gap-3">
        <!-- Clinical Squircle Icon Container -->
        <div class="header-icon-box shadow-sm">
          <i class="bi bi-megaphone-fill fs-4 text-primary"></i>
        </div>
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge-eyebrow">Operaciones • Honorarios</span>
            <span class="live-pulse-badge">
              <span class="pulse-dot"></span> En Vivo
            </span>
          </div>
          <h3 class="fw-bold text-dark mb-0 tracking-tight header-title">Bolsa de Reemplazos</h3>
          <p class="text-secondary small mb-0 mt-1">
            Tablón de convocatorias abiertas para honorarios, adjudicación atómica y scoring clínico.
          </p>
        </div>
      </div>

      <!-- Right Action Islands -->
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <router-link
          to="/app/operaciones/reemplazos"
          class="btn btn-secondary-pill d-flex align-items-center gap-2"
        >
          <span class="btn-icon-wrap"><i class="bi bi-journal-medical"></i></span>
          <span>Reemplazos Oficiales</span>
        </router-link>

        <button
          type="button"
          class="btn btn-primary-pill d-flex align-items-center gap-2"
          @click="showCreateModal = true"
        >
          <span class="btn-icon-wrap primary"><i class="bi bi-plus-lg"></i></span>
          <span>Nueva Convocatoria</span>
        </button>
      </div>
    </div>

    <!-- Alert / Toast de Adjudicación -->
    <transition name="fade-slide">
      <div
        v-if="lastAwardMessage"
        class="award-alert-card shadow-sm mb-4"
        role="alert"
      >
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-3">
            <div class="award-icon-box">
              <i class="bi bi-check-circle-fill fs-5 text-success"></i>
            </div>
            <div>
              <strong class="text-dark">✓ {{ lastAwardMessage }}</strong>
              <div class="text-secondary small mt-0.5">
                Candidato auto-retirado de convocatorias colisionantes.
                <router-link to="/app/operaciones/reemplazos" class="ms-2 fw-semibold text-decoration-none text-primary">
                  Ver en Reemplazos Oficiales ➔
                </router-link>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="btn-close ms-3"
            aria-label="Close"
            @click="lastAwardMessage = ''"
          ></button>
        </div>
      </div>
    </transition>

    <!-- Filtros de Estado: Segmented Capsule Bar -->
    <div class="filter-capsule-card mb-4 shadow-sm">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 p-2">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span class="filter-label text-secondary small fw-bold text-uppercase tracking-wider px-2">
            <i class="bi bi-funnel me-1"></i> Estado:
          </span>
          <div class="filter-pill-group bg-light p-1 rounded-pill d-inline-flex gap-1 border">
            <button
              type="button"
              class="filter-pill-btn btn btn-sm"
              :class="selectedStatus === '' ? 'btn-primary active' : 'btn-outline-secondary'"
              @click="selectedStatus = ''"
            >
              <span class="status-indicator-dot dot-all"></span>
              <span>Todas</span>
              <span class="pill-counter">({{ offers.length }})</span>
            </button>
            <button
              type="button"
              class="filter-pill-btn btn btn-sm"
              :class="selectedStatus === 'open' ? 'btn-primary active' : 'btn-outline-secondary'"
              @click="selectedStatus = 'open'"
            >
              <span class="status-indicator-dot dot-open"></span>
              <span>Abiertas</span>
              <span class="pill-counter count-open">({{ countByStatus('open') }})</span>
            </button>
            <button
              type="button"
              class="filter-pill-btn btn btn-sm"
              :class="selectedStatus === 'finalized' ? 'btn-primary active' : 'btn-outline-secondary'"
              @click="selectedStatus = 'finalized'"
            >
              <span class="status-indicator-dot dot-finalized"></span>
              <span>Finalizadas</span>
              <span class="pill-counter">({{ countByStatus('finalized') }})</span>
            </button>
            <button
              type="button"
              class="filter-pill-btn btn btn-sm"
              :class="selectedStatus === 'filled' ? 'btn-primary active' : 'btn-outline-secondary'"
              @click="selectedStatus = 'filled'"
            >
              <span class="status-indicator-dot dot-filled"></span>
              <span>Adjudicadas</span>
              <span class="pill-counter">({{ countByStatus('filled') }})</span>
            </button>
            <button
              type="button"
              class="filter-pill-btn btn btn-sm"
              :class="selectedStatus === 'cancelled' ? 'btn-primary active' : 'btn-outline-secondary'"
              @click="selectedStatus = 'cancelled'"
            >
              <span class="status-indicator-dot dot-cancelled"></span>
              <span>Canceladas</span>
              <span class="pill-counter">({{ countByStatus('cancelled') }})</span>
            </button>
          </div>
        </div>

        <div class="d-none d-lg-flex align-items-center gap-2 pe-3 text-muted small">
          <i class="bi bi-shield-check text-primary"></i>
          <span class="fw-medium">Adjudicación Atómica & Scoring Clínico</span>
        </div>
      </div>
    </div>

    <!-- Tabla Principal de Convocatorias (Nested Card / Double-Bezel) -->
    <div class="vanguard-table-card shadow-sm border-0">
      <div class="table-card-body p-0">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5 loading-state-container">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="text-secondary fw-semibold mt-3 mb-0">Cargando convocatorias clínicas...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredOffers.length === 0" class="empty-state-container text-center py-5">
          <div class="empty-icon-capsule mb-3 mx-auto">
            <i class="bi bi-inbox fs-2 text-secondary opacity-75"></i>
          </div>
          <h5 class="fw-bold text-dark mb-1">Sin convocatorias encontradas</h5>
          <p class="text-secondary small mb-3">No hay convocatorias que coincidan con el filtro seleccionado.</p>
          <button
            v-if="selectedStatus !== ''"
            type="button"
            class="btn btn-sm btn-light border rounded-pill px-3 shadow-sm fw-semibold"
            @click="selectedStatus = ''"
          >
            <i class="bi bi-arrow-counterclockwise me-1"></i> Ver todas las convocatorias
          </button>
        </div>

        <!-- Table Data -->
        <div v-else class="table-responsive">
          <table class="table vanguard-table align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-4">Servicio & Cargo</th>
                <th>Titular Ausente</th>
                <th>Causal</th>
                <th>Fechas & Turno</th>
                <th>Tiempo Restante</th>
                <th>Postulantes</th>
                <th class="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(offer, index) in filteredOffers"
                :key="offer.id"
                class="vanguard-row"
                :style="{ animationDelay: `${index * 30}ms` }"
              >
                <!-- Servicio & Cargo -->
                <td class="ps-4 cell-service">
                  <div class="d-flex align-items-center gap-3">
                    <div class="service-avatar-box">
                      {{ getServiceInitials(offer.serviceName) }}
                    </div>
                    <div>
                      <div class="service-name fw-bold text-dark">{{ offer.serviceName }}</div>
                      <div class="position-name text-secondary">{{ offer.positionName }}</div>
                    </div>
                  </div>
                </td>

                <!-- Titular Ausente -->
                <td class="cell-staff">
                  <div class="staff-name fw-semibold text-dark">{{ offer.nombre_saliente || 'No especificado' }}</div>
                  <div class="staff-rut monospace-rut">{{ offer.rut_saliente }}</div>
                </td>

                <!-- Causal -->
                <td class="cell-causal">
                  <span class="causal-tag" :class="getCausalClass(offer.motivo)">
                    <i class="bi bi-bandaid me-1 opacity-75"></i>
                    {{ formatMotivo(offer.motivo) }}
                  </span>
                </td>

                <!-- Fechas & Turno -->
                <td class="cell-dates">
                  <div class="date-range-text fw-semibold text-dark">
                    <i class="bi bi-calendar3 me-1 text-primary opacity-75"></i>
                    {{ formatDate(offer.fecha_inicio) }} al {{ formatDate(offer.fecha_termino) }}
                  </div>
                  <span class="turno-pill">
                    {{ offer.tipo_turno }}
                  </span>
                </td>

                <!-- Tiempo Restante -->
                <td class="cell-timer">
                  <span class="timer-badge" :class="getTimeBadgeClass(offer)">
                    <i class="bi me-1" :class="getTimeIconClass(offer)"></i>
                    {{ formatRemainingTime(offer.expiresAt, offer.status) }}
                  </span>
                </td>

                <!-- Postulantes / Scoring -->
                <td class="cell-applicants">
                  <button
                    type="button"
                    class="btn btn-sm applicant-pill-btn d-flex align-items-center gap-2"
                    :class="offer.applicantsCount > 0 ? 'btn-outline-primary has-applicants' : 'btn-outline-warning no-applicants'"
                    @click="openApplicantsModal(offer)"
                  >
                    <span class="applicant-icon-capsule">
                      <i class="bi" :class="offer.applicantsCount > 0 ? 'bi-people-fill' : 'bi-person-plus'"></i>
                    </span>
                    <span class="fw-semibold">{{ offer.applicantsCount }} Postulantes</span>
                    <span v-if="offer.applicantsCount > 0" class="badge-scoring-hint" title="Scoring clínico disponible">
                      <i class="bi bi-stars"></i>
                    </span>
                  </button>
                </td>

                <!-- Acciones -->
                <td class="text-end pe-4 cell-actions">
                  <div class="d-flex justify-content-end align-items-center gap-1">
                    <button
                      v-if="offer.status === 'open'"
                      type="button"
                      class="btn btn-sm btn-cancel-offer"
                      title="Anular convocatoria"
                      @click="handleCancel(offer.id)"
                    >
                      <i class="bi bi-x-circle me-1"></i> Anular
                    </button>
                    <span v-else-if="offer.status === 'filled'" class="status-badge-filled">
                      <i class="bi bi-check2-circle me-1"></i> Adjudicada
                    </span>
                    <span v-else-if="offer.status === 'finalized'" class="status-badge-finalized">
                      <i class="bi bi-clock-history me-1"></i> Concluida
                    </span>
                    <span v-else class="status-badge-cancelled">
                      <i class="bi bi-slash-circle me-1"></i> Anulada
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Dual de Candidatos & Scoring -->
    <ReplacementOfferApplicantsModal
      v-if="activeOffer"
      :visible="showApplicantsModal"
      :offer-id="activeOffer.id"
      :is-call-list="isCallList"
      :candidates="currentCandidates"
      :loading="scoringLoading"
      @close="closeApplicantsModal"
      @award="handleAward"
    />

    <!-- Modal de Creación de Reemplazos / Convocatorias -->
    <ReplacementModalCreate
      :visible="showCreateModal"
      :lista-de-turnos="listaDeTurnos"
      :lista-de-servicios="listaDeServicios"
      :initial-bolsa-mode="true"
      @cerrar="showCreateModal = false"
      @guardar="onOfferCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useReplacementOfferStore } from '@/stores/replacement-offer.store'
import { useServiceStore } from '@/stores/service.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import type { ReplacementOfferItem, ScoredCandidateItem } from '@/types/replacement-offer.types'
import ReplacementOfferApplicantsModal from '@/components/replacements/ReplacementOfferApplicantsModal.vue'
import ReplacementModalCreate from '@/components/replacements/ReplacementModalCreate.vue'

const store = useReplacementOfferStore()
const serviceStore = useServiceStore()
const turnTypeStore = useTurnTypeStore()

const listaDeServicios = computed(() => {
  if (Array.isArray(serviceStore.services)) return serviceStore.services
  return (serviceStore.services as any)?.value || []
})

const listaDeTurnos = computed(() => {
  const types = Array.isArray(turnTypeStore.turnTypes)
    ? turnTypeStore.turnTypes
    : (turnTypeStore.turnTypes as any)?.value || []
  return types.map((t: any) => t.nombre || t.name)
})

const selectedStatus = ref<string>('')
const showApplicantsModal = ref<boolean>(false)
const showCreateModal = ref<boolean>(false)
const activeOffer = ref<ReplacementOfferItem | null>(null)
const isCallList = ref<boolean>(false)
const currentCandidates = ref<ScoredCandidateItem[]>([])
const scoringLoading = ref<boolean>(false)
const lastAwardMessage = ref<string>('')

const offers = computed(() => {
  if (Array.isArray(store.offers)) return store.offers
  return (store.offers as any)?.value || []
})
const loading = computed(() => {
  if (typeof store.loading === 'boolean') return store.loading
  return Boolean((store.loading as any)?.value)
})

const filteredOffers = computed(() => {
  if (!selectedStatus.value) return offers.value
  return offers.value.filter((o: any) => o.status === selectedStatus.value)
})

const countByStatus = (status: string) => {
  return offers.value.filter((o: any) => o.status === status).length
}

const getServiceInitials = (name?: string) => {
  if (!name) return 'SRV'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.slice(0, 3).toUpperCase()
}

const formatMotivo = (motivo?: string) => {
  if (!motivo) return 'Otro'
  const map: Record<string, string> = {
    LICENCIA_MEDICA: 'Licencia Médica',
    PRE_POST_NATAL: 'Pre/Post Natal',
    PERMISO_ADMINISTRATIVO: 'Permiso Administrativo',
    FERIADO_LEGAL: 'Feriado Legal',
    DIA_COMPENSATORIO: 'Día Compensatorio',
    COMISION_SERVICIO: 'Comisión de Servicio',
    PERMISO_GREMIAL: 'Permiso Gremial',
    OTRO: 'Otro',
  }
  return map[motivo] || motivo
}

const getCausalClass = (motivo?: string) => {
  switch (motivo) {
    case 'LICENCIA_MEDICA':
      return 'causal-medical'
    case 'PRE_POST_NATAL':
      return 'causal-maternal'
    case 'PERMISO_ADMINISTRATIVO':
      return 'causal-admin'
    case 'FERIADO_LEGAL':
      return 'causal-vacation'
    default:
      return 'causal-default'
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const dateOnly = String(dateStr).slice(0, 10)
  const parts = dateOnly.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`
  }
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}

const formatRemainingTime = (expiresAt: string, status: string) => {
  if (status !== 'open') {
    return 'Plazo concluido'
  }
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return 'Plazo concluido'

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes}m restantes`
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  return `${hours}h ${remMin}m restantes`
}

const getTimeBadgeClass = (offer: ReplacementOfferItem) => {
  if (offer.status !== 'open') return 'timer-concluded'
  const diffMs = new Date(offer.expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return 'timer-concluded'
  if (diffMs < 3600000) return 'timer-urgent' // Menos de 1h
  return 'timer-active'
}

const getTimeIconClass = (offer: ReplacementOfferItem) => {
  if (offer.status !== 'open') return 'bi-clock-history'
  const diffMs = new Date(offer.expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return 'bi-clock-history'
  if (diffMs < 3600000) return 'bi-alarm-fill'
  return 'bi-stopwatch'
}

const openApplicantsModal = async (offer: ReplacementOfferItem) => {
  activeOffer.value = offer
  showApplicantsModal.value = true
  scoringLoading.value = true

  try {
    const data = await store.fetchScoring(offer.id)
    if (data) {
      isCallList.value = data.isCallList
      currentCandidates.value = data.candidates || []
    }
  } catch {
    currentCandidates.value = []
  } finally {
    scoringLoading.value = false
  }
}

const closeApplicantsModal = () => {
  showApplicantsModal.value = false
  activeOffer.value = null
  currentCandidates.value = []
}

const handleAward = async (staffId: string) => {
  if (!activeOffer.value) return
  try {
    const res = await store.awardOffer(activeOffer.value.id, staffId)
    closeApplicantsModal()
    lastAwardMessage.value = res.message || 'Turno adjudicado exitosamente.'
  } catch (err: any) {
    alert(err.message || 'Error al adjudicar turno')
  }
}

const handleCancel = async (offerId: string) => {
  if (confirm('¿Estás segura de anular esta convocatoria?')) {
    await store.cancelOffer(offerId)
  }
}

const onOfferCreated = () => {
  showCreateModal.value = false
  store.fetchOffers()
}

watch(
  () => store.lastUpdatedOfferId,
  async (offerId) => {
    if (offerId && showApplicantsModal.value && activeOffer.value?.id === offerId) {
      try {
        const data = await store.fetchScoring(offerId)
        if (data) {
          isCallList.value = data.isCallList
          currentCandidates.value = data.candidates || []
        }
      } catch {
        // silent refresh
      }
    }
  }
)

onMounted(async () => {
  store.fetchOffers()
  store.setupSocketListeners()
  if (serviceStore.services.length === 0) {
    await serviceStore.fetchServices()
  }
  if (turnTypeStore.turnTypes.length === 0) {
    await turnTypeStore.fetchTurnTypes(true)
  }
})
</script>

<style scoped>
/* ==========================================================================
   VANGUARD CLINICAL DESIGN SYSTEM - BOLSA DE REEMPLAZOS
   ========================================================================== */

.replacement-offers-view {
  min-height: 85vh;
  color: #0f172a;
}

/* --- Header & Eyebrow --- */
.header-container {
  padding-bottom: 0.5rem;
}

.header-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(191, 219, 254, 0.6);
}

.badge-eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
  background-color: #eff6ff;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(191, 219, 254, 0.5);
}

.live-pulse-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: #059669;
  background-color: #ecfdf5;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid rgba(167, 243, 208, 0.6);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.header-title {
  letter-spacing: -0.02em;
}

/* --- Action Buttons (Island Architecture) --- */
.btn-secondary-pill {
  background: white;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  padding: 0.45rem 1.15rem 0.45rem 0.65rem;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.04);
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-secondary-pill:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
}

.btn-primary-pill {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  padding: 0.45rem 1.25rem 0.45rem 0.65rem;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-primary-pill:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  color: white;
}

.btn-primary-pill:active,
.btn-secondary-pill:active {
  transform: scale(0.98);
}

.btn-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.btn-icon-wrap.primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* --- Award Alert Toast --- */
.award-alert-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  padding: 1rem 1.25rem;
}

.award-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* --- Filter Capsule Card --- */
.filter-capsule-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
}

.filter-pill-group {
  background-color: #f1f5f9 !important;
  border-color: #e2e8f0 !important;
}

.filter-pill-btn {
  border: none !important;
  background: transparent;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px !important;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.18s cubic-bezier(0.32, 0.72, 0, 1);
}

.filter-pill-btn:hover {
  color: #1e293b;
  background: rgba(255, 255, 255, 0.6);
}

.filter-pill-btn.active,
.filter-pill-btn.btn-primary {
  background: white !important;
  color: #0f172a !important;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08) !important;
  border-color: transparent !important;
}

.status-indicator-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.dot-all { background-color: #94a3b8; }
.dot-open { background-color: #10b981; }
.dot-finalized { background-color: #64748b; }
.dot-filled { background-color: #3b82f6; }
.dot-cancelled { background-color: #ef4444; }

.pill-counter {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

.count-open {
  color: #059669;
  font-weight: 700;
}

/* --- Table Card & Grid Architecture --- */
.vanguard-table-card {
  background: white;
  border: 1px solid #e2e8f0 !important;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 4px 8px -2px rgba(15, 23, 42, 0.02) !important;
}

.vanguard-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.vanguard-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-top: none;
  border-bottom: 1px solid #e2e8f0;
  padding: 14px 16px;
  white-space: nowrap;
}

.vanguard-row {
  transition: all 0.18s cubic-bezier(0.32, 0.72, 0, 1);
}

.vanguard-row:hover {
  background-color: #f8fafc;
}

.vanguard-table td {
  padding: 16px 14px;
  border-top: none;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.vanguard-table tbody tr:last-child td {
  border-bottom: none;
}

/* --- Cell: Servicio & Cargo --- */
.service-avatar-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #166534;
  border: 1px solid rgba(187, 247, 208, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.service-name {
  font-size: 0.92rem;
  letter-spacing: -0.01em;
}

.position-name {
  font-size: 0.78rem;
  font-weight: 500;
}

/* --- Cell: Titular Ausente --- */
.staff-name {
  font-size: 0.875rem;
  color: #1e293b;
}

.monospace-rut {
  font-family: var(--bs-font-monospace, monospace);
  font-size: 0.75rem;
  color: #64748b;
  letter-spacing: 0.02em;
}

/* --- Cell: Causal Tags --- */
.causal-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  letter-spacing: 0.01em;
}

.causal-medical {
  background-color: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.causal-maternal {
  background-color: #fdf2f8;
  color: #9d174d;
  border: 1px solid #fbcfe8;
}

.causal-admin {
  background-color: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.causal-vacation {
  background-color: #fefce8;
  color: #854d0e;
  border: 1px solid #fef08a;
}

.causal-default {
  background-color: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

/* --- Cell: Fechas & Turno --- */
.date-range-text {
  font-size: 0.84rem;
  font-variant-numeric: tabular-nums;
  margin-bottom: 3px;
}

.turno-pill {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #475569;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 2px 7px;
  border-radius: 6px;
}

/* --- Cell: Tiempo Restante --- */
.timer-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 5px 11px;
  border-radius: 9999px;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
}

.timer-active {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.timer-urgent {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  animation: pulse-urgent 1.5s infinite;
}

@keyframes pulse-urgent {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; transform: scale(1.02); }
}

.timer-concluded {
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
  font-weight: 500;
}

/* --- Cell: Postulantes Button --- */
.applicant-pill-btn {
  border-radius: 9999px !important;
  padding: 0.38rem 0.85rem !important;
  font-size: 0.78rem !important;
  font-weight: 600 !important;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1) !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04) !important;
}

.applicant-pill-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08) !important;
}

.applicant-pill-btn:active {
  transform: scale(0.98);
}

.applicant-icon-capsule {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
}

.badge-scoring-hint {
  color: #3b82f6;
  font-size: 0.75rem;
}

/* --- Cell: Status Badges & Actions --- */
.btn-cancel-offer {
  color: #e11d48;
  border: 1px solid #fecdd3;
  background-color: #fff1f2;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.78rem;
  padding: 0.35rem 0.75rem;
  transition: all 0.18s ease;
}

.btn-cancel-offer:hover {
  background-color: #ffe4e6;
  border-color: #fda4af;
  color: #be123c;
  transform: translateY(-1px);
}

.status-badge-filled {
  display: inline-flex;
  align-items: center;
  background-color: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.status-badge-finalized {
  display: inline-flex;
  align-items: center;
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.status-badge-cancelled {
  display: inline-flex;
  align-items: center;
  background-color: #f8fafc;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 600;
}

/* --- Empty State --- */
.empty-state-container {
  padding: 3.5rem 1rem;
}

.empty-icon-capsule {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
}

/* --- Transitions --- */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
