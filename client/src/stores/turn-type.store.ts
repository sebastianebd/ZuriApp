import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/config/axios'

export interface TurnType {
  _id: string
  nombre: string
  descripcion?: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

export const useTurnTypeStore = defineStore('turn-type', () => {
  const turnTypes = ref<TurnType[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTurnTypes = async (force = false) => {
    if (turnTypes.value.length > 0 && !force) return

    loading.value = true
    error.value = null
    try {
      // API defaults to active=true unless ?all=true
      const { data } = await axios.get('/turn-types')
      turnTypes.value = data
    } catch (err: any) {
      console.error('Error fetching turn types:', err)
      error.value = err.response?.data?.message || 'Error al cargar tipos de turno'
    } finally {
      loading.value = false
    }
  }

  const createTurnType = async (nombre: string, descripcion?: string) => {
    loading.value = true
    error.value = null
    try {
      const { data } = await axios.post('/turn-types', { nombre, descripcion })
      turnTypes.value.push(data)
      turnTypes.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
      return data
    } catch (err: any) {
      console.error('Error creating turn type:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTurnType = async (id: string, nombre: string, descripcion?: string) => {
    loading.value = true
    error.value = null
    try {
      const { data } = await axios.put(`/turn-types/${id}`, { nombre, descripcion })
      const index = turnTypes.value.findIndex((t) => t._id === id)
      if (index !== -1) {
        turnTypes.value[index] = data
        turnTypes.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
      }
      return data
    } catch (err: any) {
      console.error('Error updating turn type:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTurnType = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await axios.delete(`/turn-types/${id}`)
      turnTypes.value = turnTypes.value.filter((t) => t._id !== id)
    } catch (err: any) {
      console.error('Error deleting turn type:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    turnTypes,
    loading,
    error,
    fetchTurnTypes,
    createTurnType,
    updateTurnType,
    deleteTurnType
  }
})
