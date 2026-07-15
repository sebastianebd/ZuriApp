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
  deleted_at?: string
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

  const getServiceName = (idOrName: any): string => {
    if (!idOrName) return '—'
    const target =
      typeof idOrName === 'object' && idOrName !== null && idOrName._id
        ? String(idOrName._id)
        : String(idOrName)
    const svc = services.value.find(
      (s) =>
        String(s._id) === target || String((s as any).id) === target || String(s.nombre) === target
    )
    return svc ? svc.nombre : target
  }

  const isServiceMatch = (serviceData: any, filterValue: any): boolean => {
    if (!filterValue) return true
    const target =
      typeof serviceData === 'object' && serviceData !== null && serviceData._id
        ? String(serviceData._id)
        : String(serviceData)

    if (target === String(filterValue)) return true

    // Check if filterValue is an ID but target is a name (legacy data)
    const svc = services.value.find(
      (s) => String(s._id) === String(filterValue) || String((s as any).id) === String(filterValue)
    )
    if (svc && String(svc.nombre) === target) return true

    // Check if filterValue is a name but target is an ID
    const svc2 = services.value.find(
      (s) => String(s._id) === target || String((s as any).id) === target
    )
    if (svc2 && String(svc2.nombre) === String(filterValue)) return true

    return false
  }

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
    deleteService,
    getServiceName,
    isServiceMatch
  }
})
