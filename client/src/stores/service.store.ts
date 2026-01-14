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
  jefe_medico?: ServiceUserStub | string
  enfermero_coordinador?: ServiceUserStub | string
  centro_costo?: string
  ubicacion?: string
  anexo?: string
  email?: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceDTO {
  nombre: string
  jefe_medico?: string | null
  enfermero_coordinador?: string | null
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
      // Fetch all (including inactive if managing) - controller supports ?all=true
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
      // Retrieve the service to update local state properly (if soft delete)
      // Since backend returns { message, service } where service is the deactivated doc
      // We can just set active=false locally or re-fetch.
      // Easiest is to update the local service active state to false
      const index = services.value.findIndex((s) => s._id === id)
      if (index !== -1) {
        services.value[index].activo = false
      }
      // Or filter it out if we only show active? But we fetch ?all=true now.
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
