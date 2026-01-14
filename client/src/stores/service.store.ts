import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/config/axios'

export interface Service {
  _id: string
  nombre: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

export const useServiceStore = defineStore('service', () => {
  const services = ref<Service[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchServices = async (force = false) => {
    if (services.value.length > 0 && !force) return

    loading.value = true
    error.value = null
    try {
      // Fetch all services, maybe filter active only?
      // API defaults to active=true unless ?all=true
      const { data } = await axios.get('/services')
      services.value = data
    } catch (err: any) {
      console.error('Error fetching services:', err)
      error.value = err.response?.data?.message || 'Error al cargar servicios'
    } finally {
      loading.value = false
    }
  }

  const createService = async (nombre: string) => {
    loading.value = true
    error.value = null
    try {
      const { data } = await axios.post('/services', { nombre })
      services.value.push(data)
      services.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
      return data
    } catch (err: any) {
      console.error('Error creating service:', err)
      throw err // Re-throw for component handling
    } finally {
      loading.value = false
    }
  }

  const updateService = async (id: string, nombre: string) => {
    loading.value = true
    error.value = null
    try {
      const { data } = await axios.put(`/services/${id}`, { nombre })
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
    try {
      await axios.delete(`/services/${id}`)
      services.value = services.value.filter((s) => s._id !== id)
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
