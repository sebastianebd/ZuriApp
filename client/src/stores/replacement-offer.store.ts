import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ReplacementOfferItem,
  OfferScoringData,
} from '../types/replacement-offer.types'
import { useApiPrivate } from '../composables/useApi'
import socket from '../plugins/socket'

export const useReplacementOfferStore = defineStore('replacement-offer', () => {
  const offers = ref<ReplacementOfferItem[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const selectedScoring = ref<OfferScoringData | null>(null)
  const scoringLoading = ref<boolean>(false)
  const lastUpdatedOfferId = ref<string | null>(null)

  let socketBound = false

  const openOffersCount = computed(() => {
    return offers.value.filter((o) => o.status === 'open').length
  })

  const fetchOffers = async (
    filters?: { serviceId?: string; status?: string },
    options?: { silent?: boolean }
  ) => {
    if (!options?.silent) {
      loading.value = true
    }
    error.value = null
    try {
      const api = useApiPrivate()
      const params: any = {}
      if (filters?.serviceId) params.serviceId = filters.serviceId
      if (filters?.status) params.status = filters.status

      const response = await api.get('/replacement-offers', { params })
      if (response.data && response.data.data) {
        offers.value = response.data.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al cargar convocatorias'
    } finally {
      if (!options?.silent) {
        loading.value = false
      }
    }
  }

  const fetchScoring = async (offerId: string) => {
    scoringLoading.value = true
    try {
      const api = useApiPrivate()
      const response = await api.get(`/replacement-offers/${offerId}/scoring`)
      if (response.data && response.data.data) {
        selectedScoring.value = response.data.data
        return response.data.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al obtener postulantes'
      throw err
    } finally {
      scoringLoading.value = false
    }
  }

  const createOffer = async (payload: any) => {
    loading.value = true
    try {
      const api = useApiPrivate()
      const response = await api.post('/replacement-offers', payload)
      await fetchOffers()
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al publicar convocatoria'
      throw err
    } finally {
      loading.value = false
    }
  }

  const awardOffer = async (offerId: string, targetStaffId: string) => {
    loading.value = true
    try {
      const api = useApiPrivate()
      const response = await api.post(`/replacement-offers/${offerId}/award`, {
        targetStaffId,
      })
      await fetchOffers()
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al adjudicar convocatoria'
      throw err
    } finally {
      loading.value = false
    }
  }

  const cancelOffer = async (offerId: string, reason?: string) => {
    loading.value = true
    try {
      const api = useApiPrivate()
      const response = await api.patch(`/replacement-offers/${offerId}/cancel`, {
        reason,
      })
      await fetchOffers()
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cancelar convocatoria'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setupSocketListeners = () => {
    if (socketBound || !socket) return
    socketBound = true

    if (!socket.connected && typeof socket.connect === 'function') {
      try {
        const rawAuth = sessionStorage.getItem('auth')
        const token = rawAuth ? JSON.parse(rawAuth)?.accessToken : undefined
        if (token) {
          socket.auth = { ...socket.auth, token }
        }
      } catch {
        // Ignorar
      }
      socket.connect()
    }

    socket.on('offer:created', () => {
      fetchOffers(undefined, { silent: true })
    })

    socket.on('offer:applied', (payload: any) => {
      if (payload?.offerId && payload?.applicantsCount !== undefined) {
        const targetOffer = offers.value.find((o) => o.id === payload.offerId)
        if (targetOffer) {
          targetOffer.applicantsCount = payload.applicantsCount
        }
        lastUpdatedOfferId.value = payload.offerId
      }
    })

    socket.on('offer:applicant_withdrawn', (payload: any) => {
      if (payload?.offerId && payload?.applicantsCount !== undefined) {
        const targetOffer = offers.value.find((o) => o.id === payload.offerId)
        if (targetOffer) {
          targetOffer.applicantsCount = payload.applicantsCount
        }
        lastUpdatedOfferId.value = payload.offerId
      }
    })

    socket.on('offer:cancelled', (payload: any) => {
      if (payload?.offerId) {
        const targetOffer = offers.value.find((o) => o.id === payload.offerId)
        if (targetOffer) {
          targetOffer.status = 'cancelled'
        }
        lastUpdatedOfferId.value = payload.offerId
      }
    })
  }

  return {
    offers,
    openOffersCount,
    loading,
    error,
    selectedScoring,
    scoringLoading,
    lastUpdatedOfferId,
    fetchOffers,
    fetchScoring,
    createOffer,
    awardOffer,
    cancelOffer,
    setupSocketListeners,
  }
})
