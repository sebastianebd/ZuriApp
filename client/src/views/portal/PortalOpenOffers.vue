<template>
  <div class="portal-open-offers p-3">
    <!-- Header del Módulo -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5 class="fw-bold text-dark mb-0">Bolsa de Reemplazos</h5>
        <small class="text-muted">Convocatorias para funcionarios a honorarios</small>
      </div>

      <button
        type="button"
        class="btn btn-sm btn-light border rounded-circle p-2"
        data-test="refresh-btn"
        :disabled="isLoading"
        aria-label="Refrescar convocatorias"
        @click="refreshCurrentTab"
      >
        <i :class="['bi bi-arrow-clockwise', { 'spin-icon': isLoading }]"></i>
      </button>
    </div>

    <!-- Feedback / Alerta de Acción -->
    <div
      v-if="feedbackMessage"
      :class="['alert alert-dismissible fade show py-2 px-3 mb-3 small shadow-sm', feedbackClass]"
      role="alert"
      data-test="feedback-alert"
    >
      <i :class="['bi me-2', feedbackIcon]"></i>
      {{ feedbackMessage }}
      <button
        type="button"
        class="btn-close py-2"
        aria-label="Cerrar"
        @click="feedbackMessage = null"
      ></button>
    </div>

    <!-- Control Segmentado Superior (Pestañas) -->
    <div class="segmented-control bg-light p-1 rounded-pill mb-3 d-flex" role="tablist">
      <button
        type="button"
        class="btn btn-sm flex-fill rounded-pill py-2 text-center position-relative"
        :class="activeTab === 'open' ? 'btn-primary shadow-sm fw-bold' : 'btn-light text-muted'"
        data-test="tab-open-offers"
        role="tab"
        :aria-selected="activeTab === 'open'"
        @click="setActiveTab('open')"
      >
        <i class="bi bi-megaphone-fill me-1"></i>
        Convocatorias
        <span
          v-if="openOffers.length > 0"
          class="badge bg-white text-primary ms-1 rounded-pill"
          data-test="open-count-badge"
        >
          {{ openOffers.length }}
        </span>
      </button>

      <button
        type="button"
        class="btn btn-sm flex-fill rounded-pill py-2 text-center position-relative"
        :class="activeTab === 'my-applications' ? 'btn-primary shadow-sm fw-bold' : 'btn-light text-muted'"
        data-test="tab-my-applications"
        role="tab"
        :aria-selected="activeTab === 'my-applications'"
        @click="setActiveTab('my-applications')"
      >
        <i class="bi bi-person-check-fill me-1"></i>
        Mis Postulaciones
        <span
          v-if="myApplications.length > 0"
          class="badge bg-white text-primary ms-1 rounded-pill"
          data-test="my-apps-count-badge"
        >
          {{ myApplications.length }}
        </span>
      </button>
    </div>

    <!-- TAB 1: Convocatorias Abiertas -->
    <div v-if="activeTab === 'open'" class="tab-content" role="tabpanel">
      <!-- Loading State -->
      <div v-if="loadingOffers" class="text-center py-5 text-muted">
        <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
        <p class="small mb-0">Buscando convocatorias compatibles...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="openOffers.length === 0"
        class="card border-0 shadow-sm text-center py-5 px-3 rounded-3"
        data-test="empty-offers"
      >
        <div class="empty-state-icon text-muted mb-2">
          <i class="bi bi-inbox fs-1"></i>
        </div>
        <h6 class="fw-bold text-dark">No hay convocatorias abiertas</h6>
        <p class="text-muted small mb-0">
          En este momento no hay solicitudes de reemplazo disponibles para tu estamento o cargo.
        </p>
      </div>

      <!-- Lista de Convocatorias -->
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
      <!-- Loading State -->
      <div v-if="loadingMyApps" class="text-center py-5 text-muted">
        <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
        <p class="small mb-0">Cargando tus postulaciones...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="myApplications.length === 0"
        class="card border-0 shadow-sm text-center py-5 px-3 rounded-3"
        data-test="empty-applications"
      >
        <div class="empty-state-icon text-muted mb-2">
          <i class="bi bi-file-earmark-check fs-1"></i>
        </div>
        <h6 class="fw-bold text-dark">Sin postulaciones registradas</h6>
        <p class="text-muted small mb-0">
          Aún no has postulado a ninguna convocatoria de reemplazo. Revisa la pestaña "Convocatorias" para ver turnos disponibles.
        </p>
      </div>

      <!-- Lista de Postulaciones -->
      <div v-else class="applications-list">
        <div
          v-for="app in myApplications"
          :key="app.offerId"
          class="card border-0 shadow-sm mb-3 rounded-3 application-item"
          data-test="application-item"
        >
          <div class="card-body p-3">
            <!-- Encabezado de la postulación: Servicio y Badge -->
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <div>
                <h6 class="fw-bold text-dark mb-0">{{ app.serviceName }}</h6>
                <small class="text-muted">
                  <i class="bi bi-person-badge me-1"></i>{{ app.positionName }}
                </small>
              </div>

              <!-- Badge de estado hospitalario -->
              <ApplicationStatusBadge
                :status="app.status"
                :offer-status="app.offerStatus"
              />
            </div>

            <!-- Detalles del Turno -->
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2 text-secondary small">
              <span class="badge bg-light text-dark border">
                <i class="bi bi-clock me-1 text-primary"></i>{{ app.tipo_turno }}
              </span>
              <span>
                <i class="bi bi-calendar-event me-1 text-primary"></i>
                {{ formatDate(app.fecha_inicio) }} - {{ formatDate(app.fecha_termino) }}
              </span>
            </div>

            <!-- Fecha de postulación -->
            <div class="text-muted small mb-2 fst-italic">
              <i class="bi bi-send me-1"></i>
              Postulado el {{ formatDateTime(app.appliedAt) }}
            </div>

            <!-- Botón de acción: Si fue adjudicado -> Ir a Mis Turnos -->
            <div v-if="app.status === 'selected'" class="mt-3 pt-2 border-top">
              <button
                type="button"
                class="btn btn-success btn-sm w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                data-test="go-to-my-shifts-btn"
                @click="goToMyShifts"
              >
                <i class="bi bi-calendar-check-fill"></i>
                <span>¡Adjudicado! Ir a Mis Turnos</span>
              </button>
            </div>
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

const feedbackClass = computed(() => {
  switch (feedbackType.value) {
    case 'success':
      return 'alert-success text-success-emphasis border-success-subtle'
    case 'danger':
      return 'alert-danger text-danger-emphasis border-danger-subtle'
    default:
      return 'alert-info text-info-emphasis border-info-subtle'
  }
})

const feedbackIcon = computed(() => {
  switch (feedbackType.value) {
    case 'success':
      return 'bi-check-circle-fill text-success'
    case 'danger':
      return 'bi-exclamation-triangle-fill text-danger'
    default:
      return 'bi-info-circle-fill text-info'
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
    showFeedback('¡Postulación enviada exitosamente!', 'success')
    // Actualizar estado local inmediato
    const found = openOffers.value.find((o) => o.id === offerId)
    if (found) {
      found.alreadyApplied = true
      found.hasApplied = true
    }
    // Refrescar en background
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
    // Actualizar estado local inmediato
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
.portal-open-offers {
  max-width: 540px;
  margin: 0 auto;
}

.segmented-control {
  background-color: #e9ecef !important;

  .btn {
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }
}

.application-item {
  background: #ffffff;
  border-left: 4px solid #0d6efd !important;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
