import { defineStore } from 'pinia'
import type { AxiosError } from 'axios'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'

export interface TurnSigla {
  _id: string
  sigla: string
  nombre: string
  descripcion?: string
  color: string
  turno_entrada?: string | null
  turno_salida?: string | null
  activo: boolean
}

export const useTurnSiglaStore = defineStore('turnSigla', () => {
  const siglas = ref<TurnSigla[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSiglas(force = false) {
    if (siglas.value.length > 0 && !force) return

    loading.value = true
    error.value = null
    const authStore = useAuthStore()
    const api = authStore.usePrivateApi()

    try {
      const { data } = await api.get<TurnSigla[]>('/turn-siglas')
      siglas.value = data
    } catch (err: unknown) {
      const e = err as AxiosError
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error.value = (e.response?.data as any)?.message || e.message
      console.error('Error fetching TurnSiglas:', err)
    } finally {
      loading.value = false
    }
  }

  async function createSigla(payload: Partial<TurnSigla>) {
    loading.value = true
    error.value = null
    const authStore = useAuthStore()
    const api = authStore.usePrivateApi()

    try {
      const { data } = await api.post<TurnSigla>('/turn-siglas', payload)
      siglas.value.push(data)
      siglas.value.sort((a, b) => a.sigla.localeCompare(b.sigla))
      return data
    } catch (err: unknown) {
      const e = err as AxiosError
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error.value = (e.response?.data as any)?.message || e.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSigla(id: string, payload: Partial<TurnSigla>) {
    loading.value = true
    error.value = null
    const authStore = useAuthStore()
    const api = authStore.usePrivateApi()

    try {
      const { data } = await api.put<TurnSigla>(`/turn-siglas/${id}`, payload)
      const index = siglas.value.findIndex((s) => s._id === id)
      if (index !== -1) {
        siglas.value[index] = data
      }
      return data
    } catch (err: unknown) {
      const e = err as AxiosError
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error.value = (e.response?.data as any)?.message || e.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSigla(id: string) {
    loading.value = true
    error.value = null
    const authStore = useAuthStore()
    const api = authStore.usePrivateApi()

    try {
      await api.delete(`/turn-siglas/${id}`)
      siglas.value = siglas.value.filter((s) => s._id !== id)
    } catch (err: unknown) {
      const e = err as AxiosError
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error.value = (e.response?.data as any)?.message || e.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function mapSiglaToNombre(sigla: string): string {
    const s = sigla.toUpperCase()
    const found = siglas.value.find((t) => t.sigla === s)
    return found ? found.nombre : 'LIBRE' // Safe default if not found
  }

  return {
    siglas,
    loading,
    error,
    fetchSiglas,
    createSigla,
    updateSigla,
    deleteSigla,
    mapSiglaToNombre
  }
})
