import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'

export interface ServiceUserStub {
  _id: string
  nombre: string
  apellido: string
  rut: string
}

export interface Service {
  _id: string
  nombre: string
  codigo?: string
  jefe_servicio?: ServiceUserStub | string
  supervisor?: ServiceUserStub | string
  coordinadores?: (ServiceUserStub | string)[]
  jefes_turno?: (ServiceUserStub | string)[]
  centro_costo?: string
  ubicacion?: string
  anexo?: string
  email?: string
  activo: boolean
  deleted_at?: string // Date string from API
  createdAt: string
  updatedAt: string
}

export interface ServiceDTO {
  nombre: string
  jefe_servicio?: string | null
  supervisor?: string | null
  coordinadores?: string[]
  jefes_turno?: string[]
  centro_costo?: string
  ubicacion?: string
  anexo?: string
  email?: string
  activo?: boolean
}

export const useServiceStore = defineStore('service', () => {
  const services = ref<Service[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchServices = async (force = false) => {
    if (services.value.length > 0 && !force) return

    loading.value = true
    error.value = null
    const authStore = useAuthStore()
    const api = authStore.usePrivateApi()

    try {
      // Fetch all (including inactive if managing)
      // Backend now filters out 'eliminado: true', returns mixed active/inactive
      const { data } = await api.get<Service[]>('/services?all=true')
      services.value = data
    } catch (err: any) {
      console.error('Error fetching services:', err)
      error.value = err.response?.data?.message || 'Error al cargar servicios'
    } finally {
      loading.value = false
    }
  }

  const createService = async (serviceData: ServiceDTO) => {
    loading.value = true
    error.value = null
    const authStore = useAuthStore()
    const api = authStore.usePrivateApi()

    try {
      const { data } = await api.post<Service>('/services', serviceData)
      services.value.push(data)
      services.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
      return data
    } catch (err: any) {
      console.error('Error creating service:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateService = async (id: string, serviceData: ServiceDTO) => {
    loading.value = true
    error.value = null
    const authStore = useAuthStore()
    const api = authStore.usePrivateApi()

    try {
      const { data } = await api.put<Service>(`/services/${id}`, serviceData)
      const index = services.value.findIndex((s) => s._id === id)
      if (index !== -1) {
        services.value[index] = data
        services.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
      }
      return data
    } catch (err: any) {
      console.error('Error updating service:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteService = async (id: string) => {
    loading.value = true
    error.value = null
    const authStore = useAuthStore()
    const api = authStore.usePrivateApi()

    try {
      await api.delete(`/services/${id}`)
      // Soft delete: Remove from local list as it is no longer returned by backend
      const index = services.value.findIndex((s) => s._id === id)
      if (index !== -1) {
        services.value.splice(index, 1)
      }
    } catch (err: any) {
      console.error('Error deleting service:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService
  }
})
