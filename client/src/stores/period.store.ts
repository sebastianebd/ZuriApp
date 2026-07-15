import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth.store'

export interface Period {
  _id?: string
  month: number
  year: number
  status: 'OPEN' | 'CLOSED'
  unlockedUsers: string[]
  closedAt?: string
}

export const usePeriodStore = defineStore('period', () => {
  const period = ref<Period | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()
  const api = authStore.usePrivateApi()

  const isClosed = computed(() => period.value?.status === 'CLOSED')
  const isUserUnlocked = (userId: string) =>
    period.value?.unlockedUsers.includes(userId) ?? false

  /** Carga el estado del período para un mes/año dado */
  async function fetchPeriod(month: number, year: number) {
    try {
      isLoading.value = true
      error.value = null
      const { data } = await api.get('/periods', { params: { month, year } })
      period.value = data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al obtener el período'
    } finally {
      isLoading.value = false
    }
  }

  /** Cierra globalmente el período */
  async function closePeriod(month: number, year: number) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.put('/periods/close', { month, year })
      period.value = data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cerrar período'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /** Agrega un usuario a las excepciones del período */
  async function addException(periodId: string, userId: string) {
    const { data } = await api.post(`/periods/${periodId}/exceptions`, { userId })
    period.value = data
    return data
  }

  /** Revoca la excepción de un usuario */
  async function removeException(periodId: string, userId: string) {
    const { data } = await api.delete(`/periods/${periodId}/exceptions/${userId}`)
    period.value = data
    return data
  }

  /** Sella la excepción generando el snapshot oficial */
  async function sealException(payload: {
    month: number
    year: number
    userId: string
    periodId: string
  }) {
    const { data } = await api.post('/reports/seal-exception', payload)
    // Refresca el período para actualizar unlockedUsers en UI
    if (period.value) {
      await fetchPeriod(payload.month, payload.year)
    }
    return data
  }

  return {
    period,
    isLoading,
    error,
    isClosed,
    isUserUnlocked,
    fetchPeriod,
    closePeriod,
    addException,
    removeException,
    sealException,
  }
})
