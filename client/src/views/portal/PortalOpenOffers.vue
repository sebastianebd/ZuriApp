<template>
  <div class="portal-open-offers">
    <!-- Header -->
    <section class="offers-header">
      <div>
        <h2 class="page-title">Bolsa de Reemplazos</h2>
        <span class="page-desc">Convocatorias para funcionarios a honorarios</span>
      </div>

      <button
        type="button"
        class="refresh-btn"
        data-test="refresh-btn"
        :disabled="isLoading"
        aria-label="Refrescar convocatorias"
        @click="refreshCurrentTab"
      >
        <i :class="['bi bi-arrow-clockwise', { 'spin-icon': isLoading }]"></i>
      </button>
    </section>

    <!-- Feedback / Alerta de Acción -->
    <div
      v-if="feedbackMessage"
      :class="['feedback-toast', feedbackClassComputed]"
      role="alert"
      data-test="feedback-alert"
    >
      <i :class="['bi', feedbackIcon]"></i>
      <span>{{ feedbackMessage }}</span>
      <button
        type="button"
        class="feedback-close"
        aria-label="Cerrar"
        @click="feedbackMessage = null"
      >
        <i class="bi bi-x"></i>
      </button>
    </div>

    <!-- Segmented Tabs -->
    <div class="segmented-tabs" role="tablist">
      <button
        type="button"
        class="seg-tab"
        :class="{ 'seg-tab--active': activeTab === 'open' }"
        data-test="tab-open-offers"
        role="tab"
        :aria-selected="activeTab === 'open'"
        @click="setActiveTab('open')"
      >
        <i class="bi bi-megaphone-fill"></i>
        <span>Convocatorias</span>
        <span v-if="openOffers.length > 0" class="seg-count" data-test="open-count-badge">
          {{ openOffers.length }}
        </span>
      </button>

      <button
        type="button"
        class="seg-tab"
        :class="{ 'seg-tab--active': activeTab === 'my-applications' }"
        data-test="tab-my-applications"
        role="tab"
        :aria-selected="activeTab === 'my-applications'"
        @click="setActiveTab('my-applications')"
      >
        <i class="bi bi-person-check-fill"></i>
        <span>Mis Postulaciones</span>
        <span v-if="myApplications.length > 0" class="seg-count" data-test="my-apps-count-badge">
          {{ myApplications.length }}
        </span>
      </button>
    </div>

    <!-- TAB 1: Convocatorias Abiertas -->
    <div v-if="activeTab === 'open'" class="tab-content" role="tabpanel">
      <div v-if="loadingOffers" class="loading-state">
        <div class="spinner-border spinner-border-sm" role="status"></div>
        <span>Buscando convocatorias compatibles...</span>
      </div>

      <div
        v-else-if="openOffers.length === 0"
        class="empty-state-card"
        data-test="empty-offers"
      >
        <div class="empty-icon"><i class="bi bi-inbox"></i></div>
        <h3 class="empty-title">No hay convocatorias abiertas</h3>
        <p class="empty-desc">
          En este momento no hay solicitudes de reemplazo disponibles para tu estamento o cargo.
        </p>
      </div>

      <div v-else class="offers-list">
        <OfferCard
          v-for="offer in openOffers"
          :key="offer.id"
          :offer="offer"
          :loading="actionLoadingId === offer.id"
          @apply="handleApply"
          @withdraw="handleWithdraw"
        />
      </div>
    </div>

    <!-- TAB 2: Mis Postulaciones -->
    <div v-else-if="activeTab === 'my-applications'" class="tab-content" role="tabpanel">
      <div v-if="loadingMyApps" class="loading-state">
        <div class="spinner-border spinner-border-sm" role="status"></div>
        <span>Cargando tus postulaciones...</span>
      </div>

      <div
        v-else-if="myApplications.length === 0"
        class="empty-state-card"
        data-test="empty-applications"
      >
        <div class="empty-icon"><i class="bi bi-file-earmark-check"></i></div>
        <h3 class="empty-title">Sin postulaciones registradas</h3>
        <p class="empty-desc">
          Aún no has postulado a ninguna convocatoria. Revisa la pestaña "Convocatorias" para ver turnos disponibles.
        </p>
      </div>

      <div v-else class="applications-list">
        <div
          v-for="app in myApplications"
          :key="app.offerId"
          class="app-card"
          data-test="application-item"
        >
          <div class="app-card-top">
            <div>
              <h3 class="app-service">{{ app.serviceName }}</h3>
              <span class="app-position">
                <i class="bi bi-person-badge me-1"></i>{{ app.positionName }}
              </span>
            </div>
            <ApplicationStatusBadge
              :status="app.status"
              :offer-status="app.offerStatus"
            />
          </div>

          <div class="app-details">
            <span class="detail-chip">
              <i class="bi bi-clock"></i> {{ app.tipo_turno }}
            </span>
            <span class="detail-date">
              <i class="bi bi-calendar-event"></i>
              {{ formatDate(app.fecha_inicio) }} - {{ formatDate(app.fecha_termino) }}
            </span>
          </div>

          <div class="app-meta">
            <i class="bi bi-send"></i>
            Postulado el {{ formatDateTime(app.appliedAt) }}
          </div>

          <div v-if="app.status === 'selected'" class="app-action">
            <button
              type="button"
              class="awarded-btn"
              data-test="go-to-my-shifts-btn"
              @click="goToMyShifts"
            >
              <i class="bi bi-calendar-check-fill"></i>
              Adjudicado — Ir a Mis Turnos
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import portalService from '@/services/portal.service'
import type { PwaOpenOfferItem, PwaMyApplicationItem } from '@/types/portal.types'
import OfferCard from '@/components/portal/OfferCard.vue'
import ApplicationStatusBadge from '@/components/portal/ApplicationStatusBadge.vue'

const router = useRouter()

const activeTab = ref<'open' | 'my-applications'>('open')
const openOffers = ref<PwaOpenOfferItem[]>([])
const myApplications = ref<PwaMyApplicationItem[]>([])

const loadingOffers = ref(false)
const loadingMyApps = ref(false)
const actionLoadingId = ref<string | null>(null)

const feedbackMessage = ref<string | null>(null)
const feedbackType = ref<'success' | 'danger' | 'info'>('success')

const isLoading = computed(() => loadingOffers.value || loadingMyApps.value)

const feedbackClassComputed = computed(() => {
  switch (feedbackType.value) {
    case 'success':
      return 'feedback-toast--success'
    case 'danger':
      return 'feedback-toast--danger'
    default:
      return 'feedback-toast--info'
  }
})

const feedbackIcon = computed(() => {
  switch (feedbackType.value) {
    case 'success':
      return 'bi-check-circle-fill'
    case 'danger':
      return 'bi-exclamation-triangle-fill'
    default:
      return 'bi-info-circle-fill'
  }
})

const showFeedback = (message: string, type: 'success' | 'danger' | 'info' = 'success') => {
  feedbackMessage.value = message
  feedbackType.value = type
  setTimeout(() => {
    if (feedbackMessage.value === message) {
      feedbackMessage.value = null
    }
  }, 4000)
}

const fetchOffers = async () => {
  loadingOffers.value = true
  try {
    const data = await portalService.getOpenOffers()
    openOffers.value = data || []
  } catch (err: any) {
    showFeedback(err.response?.data?.message || 'Error al cargar convocatorias abiertas', 'danger')
  } finally {
    loadingOffers.value = false
  }
}

const fetchMyApplications = async () => {
  loadingMyApps.value = true
  try {
    const data = await portalService.getMyApplications()
    myApplications.value = data || []
  } catch (err: any) {
    showFeedback(err.response?.data?.message || 'Error al cargar tus postulaciones', 'danger')
  } finally {
    loadingMyApps.value = false
  }
}

const setActiveTab = (tab: 'open' | 'my-applications') => {
  activeTab.value = tab
  if (tab === 'open') {
    fetchOffers()
  } else {
    fetchMyApplications()
  }
}

const refreshCurrentTab = () => {
  if (activeTab.value === 'open') {
    fetchOffers()
  } else {
    fetchMyApplications()
  }
}

const handleApply = async (offerId: string) => {
  actionLoadingId.value = offerId
  try {
    await portalService.applyToOffer(offerId)
    showFeedback('Postulación enviada exitosamente', 'success')
    const found = openOffers.value.find((o) => o.id === offerId)
    if (found) {
      found.alreadyApplied = true
      found.hasApplied = true
    }
    fetchOffers()
  } catch (err: any) {
    showFeedback(err.response?.data?.message || 'No fue posible registrar tu postulación', 'danger')
  } finally {
    actionLoadingId.value = null
  }
}

const handleWithdraw = async (offerId: string) => {
  actionLoadingId.value = offerId
  try {
    await portalService.withdrawApplication(offerId)
    showFeedback('Postulación retirada voluntariamente', 'info')
    const found = openOffers.value.find((o) => o.id === offerId)
    if (found) {
      found.alreadyApplied = false
      found.hasApplied = false
    }
    fetchOffers()
  } catch (err: any) {
    showFeedback(err.response?.data?.message || 'Error al retirar la postulación', 'danger')
  } finally {
    actionLoadingId.value = null
  }
}

const goToMyShifts = () => {
  router.push('/portal/shifts')
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

onMounted(() => {
  fetchOffers()
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/portal-theme' as t;

.portal-open-offers {
  max-width: t.$portal-max-width;
  margin: 0 auto;
  padding: t.$space-4;
  display: flex;
  flex-direction: column;
  gap: t.$space-4;
}

// --- Header ---
.offers-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-size: t.$font-size-xl;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  margin: 0 0 2px;
}

.page-desc {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  border: 1px solid t.$zuri-border;
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: t.$zuri-text-muted;
  cursor: pointer;
  transition: all t.$transition-base;

  &:hover {
    border-color: t.$zuri-accent;
    color: t.$zuri-brand;
  }

  &:disabled {
    opacity: 0.5;
  }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

// --- Feedback Toast ---
.feedback-toast {
  display: flex;
  align-items: center;
  gap: t.$space-2;
  padding: t.$space-3 t.$space-4;
  border-radius: t.$radius-md;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-medium;

  &--success {
    background: t.$zuri-success-subtle;
    color: t.$zuri-success;
  }

  &--danger {
    background: t.$zuri-danger-subtle;
    color: t.$zuri-danger;
  }

  &--info {
    background: t.$zuri-accent-subtle;
    color: t.$zuri-brand;
  }
}

.feedback-close {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;

  &:hover { opacity: 1; }
}

// --- Segmented Tabs ---
.segmented-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: t.$zuri-divider;
  border-radius: t.$radius-md;
}

.seg-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: t.$space-1;
  padding: t.$space-2 t.$space-2;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-muted;
  background: transparent;
  border: none;
  border-radius: t.$radius-sm;
  cursor: pointer;
  transition: all t.$transition-base;

  &--active {
    background: t.$zuri-surface-raised;
    color: t.$zuri-brand;
    font-weight: t.$font-weight-semi;
    box-shadow: t.$shadow-xs;
  }
}

.seg-count {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-bold;
  background: t.$zuri-brand;
  color: #ffffff;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: t.$radius-pill;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

// --- Loading ---
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: t.$space-3;
  padding: t.$space-10;
  color: t.$zuri-text-muted;
  font-size: t.$font-size-sm;

  .spinner-border {
    color: t.$zuri-brand;
  }
}

// --- Applications List ---
.applications-list {
  display: flex;
  flex-direction: column;
  gap: t.$space-3;
}

.app-card {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  padding: t.$space-4;
  box-shadow: t.$shadow-sm;
  border-left: 3px solid t.$zuri-accent;
}

.app-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: t.$space-2;
  margin-bottom: t.$space-3;
}

.app-service {
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
  margin: 0 0 2px;
}

.app-position {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
}

.app-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: t.$space-2;
  margin-bottom: t.$space-2;
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
}

.detail-date {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.app-meta {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-subtle;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-action {
  margin-top: t.$space-3;
  padding-top: t.$space-3;
  border-top: 1px solid t.$zuri-divider;
}

.awarded-btn {
  width: 100%;
  padding: t.$space-3;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: #ffffff;
  background: t.$zuri-success;
  border: none;
  border-radius: t.$radius-md;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: t.$space-2;
  transition: all t.$transition-base;

  &:hover {
    background: darken(t.$zuri-success, 5%);
    box-shadow: t.$shadow-md;
  }

  &:active {
    transform: scale(0.98);
  }
}

// --- Shared Empty State ---
.empty-state-card {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  padding: t.$space-8 t.$space-4;
  text-align: center;
  border: 1px dashed t.$zuri-border;
}

.empty-icon {
  font-size: 2rem;
  color: t.$zuri-text-subtle;
  margin-bottom: t.$space-3;
}

.empty-title {
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-body;
  margin: 0 0 t.$space-1;
}

.empty-desc {
  font-size: t.$font-size-sm;
  color: t.$zuri-text-muted;
  margin: 0;
}
</style>
