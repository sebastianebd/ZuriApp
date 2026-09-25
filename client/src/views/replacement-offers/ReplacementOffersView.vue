<template>
  <div class="replacement-offers-view container-fluid py-4">
    <!-- Header -->
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h3 class="fw-bold text-dark mb-1">📢 Bolsa de Reemplazos</h3>
        <p class="text-muted mb-0">
          Tablón de convocatorias abiertas para honorarios, adjudicación atómica y scoring clínico.
        </p>
      </div>

      <div class="d-flex gap-2">
        <router-link
          to="/app/operaciones/reemplazos"
          class="btn btn-outline-secondary d-flex align-items-center gap-2 shadow-sm"
        >
          <span>📋 Reemplazos Oficiales</span>
        </router-link>
        <button
          type="button"
          class="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
          @click="showCreateModal = true"
        >
          <span>➕ Nueva Convocatoria</span>
        </button>
      </div>
    </div>

    <!-- Alert / Toast de Adjudicación -->
    <div
      v-if="lastAwardMessage"
      class="alert alert-success alert-dismissible fade show shadow-sm mb-4"
      role="alert"
    >
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>✓ {{ lastAwardMessage }}</strong>
          <span class="ms-2">Candidato auto-retirado de convocatorias colisionantes.</span>
          <router-link to="/app/operaciones/reemplazos" class="ms-2 fw-bold text-decoration-underline text-success">
            [ Ver en Reemplazos Oficiales ➔ ]
          </router-link>
        </div>
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="lastAwardMessage = ''"
        ></button>
      </div>
    </div>

    <!-- Filtros de Estado -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body p-3 d-flex flex-wrap gap-2 align-items-center">
        <span class="text-muted fw-semibold me-2">Filtrar por estado:</span>
        <button
          type="button"
          class="btn btn-sm"
          :class="selectedStatus === '' ? 'btn-primary' : 'btn-outline-secondary'"
          @click="selectedStatus = ''"
        >
          Todas ({{ offers.length }})
        </button>
        <button
          type="button"
          class="btn btn-sm"
          :class="selectedStatus === 'open' ? 'btn-primary' : 'btn-outline-secondary'"
          @click="selectedStatus = 'open'"
        >
          Abiertas ({{ countByStatus('open') }})
        </button>
        <button
          type="button"
          class="btn btn-sm"
          :class="selectedStatus === 'finalized' ? 'btn-primary' : 'btn-outline-secondary'"
          @click="selectedStatus = 'finalized'"
        >
          Finalizadas ({{ countByStatus('finalized') }})
        </button>
        <button
          type="button"
          class="btn btn-sm"
          :class="selectedStatus === 'filled' ? 'btn-primary' : 'btn-outline-secondary'"
          @click="selectedStatus = 'filled'"
        >
          Adjudicadas ({{ countByStatus('filled') }})
        </button>
        <button
          type="button"
          class="btn btn-sm"
          :class="selectedStatus === 'cancelled' ? 'btn-primary' : 'btn-outline-secondary'"
          @click="selectedStatus = 'cancelled'"
        >
          Canceladas ({{ countByStatus('cancelled') }})
        </button>
      </div>
    </div>

    <!-- Tabla de Convocatorias -->
    <div class="card shadow-sm border-0">
      <div class="card-body p-0">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="text-muted mt-2">Cargando convocatorias...</p>
        </div>

        <div v-else-if="filteredOffers.length === 0" class="text-center py-5 text-muted">
          No hay convocatorias que coincidan con el filtro seleccionado.
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
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
              <tr v-for="offer in filteredOffers" :key="offer.id">
                <!-- Servicio & Cargo -->
                <td class="ps-4">
                  <div class="fw-bold text-dark">{{ offer.serviceName }}</div>
                  <div class="small text-muted">{{ offer.positionName }}</div>
                </td>

                <!-- Titular Ausente -->
                <td>
                  <div class="fw-semibold text-dark">{{ offer.nombre_saliente || 'No especificado' }}</div>
                  <div class="small text-muted">{{ offer.rut_saliente }}</div>
                </td>

                <!-- Causal -->
                <td>
                  <span class="badge bg-light text-dark border">
                    {{ formatMotivo(offer.motivo) }}
                  </span>
                </td>

                <!-- Fechas & Turno -->
                <td>
                  <div class="small fw-semibold text-dark">
                    {{ formatDate(offer.fecha_inicio) }} al {{ formatDate(offer.fecha_termino) }}
                  </div>
                  <span class="badge bg-secondary-subtle text-secondary">
                    {{ offer.tipo_turno }}
                  </span>
                </td>

                <!-- Tiempo Restante -->
                <td>
                  <span
                    class="badge"
                    :class="getTimeBadgeClass(offer)"
                  >
                    {{ formatRemainingTime(offer.expiresAt, offer.status) }}
                  </span>
                </td>

                <!-- Postulantes / Scoring -->
                <td>
                  <button
                    type="button"
                    class="btn btn-sm d-flex align-items-center gap-1"
                    :class="offer.applicantsCount > 0 ? 'btn-outline-primary' : 'btn-outline-warning'"
                    @click="openApplicantsModal(offer)"
                  >
                    <span>👥</span>
                    <span>{{ offer.applicantsCount }} Postulantes</span>
                  </button>
                </td>

                <!-- Acciones -->
                <td class="text-end pe-4">
                  <div class="d-flex justify-content-end gap-1">
                    <button
                      v-if="offer.status === 'open'"
                      type="button"
                      class="btn btn-outline-danger btn-sm"
                      title="Anular convocatoria"
                      @click="handleCancel(offer.id)"
                    >
                      Anular
                    </button>
                    <span v-else-if="offer.status === 'filled'" class="badge bg-success">
                      ✓ Adjudicada
                    </span>
                    <span v-else-if="offer.status === 'finalized'" class="badge bg-secondary">
                      Concluida
                    </span>
                    <span v-else class="badge bg-dark">
                      Anulada
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
  if (offer.status !== 'open') return 'bg-secondary'
  const diffMs = new Date(offer.expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return 'bg-secondary'
  if (diffMs < 3600000) return 'bg-danger' // Menos de 1h
  return 'bg-warning text-dark'
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
.replacement-offers-view {
  min-height: 80vh;
}
</style>
