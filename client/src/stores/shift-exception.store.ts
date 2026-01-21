import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'

export interface ShiftException {
  _id: string
  assignment_id: string
  date: string
  original_type: 'LARGO' | 'NOCHE' | 'LIBRE'
  override_type: 'LARGO' | 'NOCHE' | 'LIBRE'
  reason?: string
  created_by: string
  created_at: string
}

export const useShiftExceptionStore = defineStore('shiftException', () => {
  const exceptions = ref<ShiftException[]>([])
  const loading = ref(false)
  const authStore = useAuthStore()

  async function loadExceptions(assignmentId?: string, startDate?: string, endDate?: string) {
    loading.value = true
    try {
      const params: any = {}
      if (assignmentId) params.assignment_id = assignmentId
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const privateApi = authStore.usePrivateApi()
      const response = await privateApi.get('/shift-exceptions', { params })
      exceptions.value = response.data
      return response.data
    } catch (error) {
      console.error('Error loading exceptions:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createException(data: {
    assignment_id: string
    assignment_model?: 'TurnAssignment' | 'Replacement' // 🏢
    date: string
    original_type: 'LARGO' | 'NOCHE' | 'LIBRE'
    override_type: 'LARGO' | 'NOCHE' | 'LIBRE'
    reason?: string
    created_by: string
  }) {
    loading.value = true
    try {
      const privateApi = authStore.usePrivateApi()
      const response = await privateApi.post('/shift-exceptions', data)

      // Handle both populated and non-populated assignment_id for comparison
      const datePrefix = data.date.split('T')[0]
      const existingIndex = exceptions.value.findIndex((e) => {
        const exceptionAssignmentId =
          typeof e.assignment_id === 'string' ? e.assignment_id : (e.assignment_id as any)?._id
        return exceptionAssignmentId === data.assignment_id && e.date.startsWith(datePrefix)
      })

      if (existingIndex !== -1) {
        // Replace entire array to trigger reactivity
        exceptions.value = [
          ...exceptions.value.slice(0, existingIndex),
          response.data,
          ...exceptions.value.slice(existingIndex + 1)
        ]
      } else {
        // Add new
        exceptions.value.push(response.data)
      }

      return response.data
    } catch (error) {
      console.error('Error creating exception:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteException(id: string) {
    loading.value = true
    try {
      const privateApi = authStore.usePrivateApi()
      await privateApi.delete(`/shift-exceptions/${id}`)
      exceptions.value = exceptions.value.filter((e) => e._id !== id)
    } catch (error) {
      console.error('Error deleting exception:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  function findException(assignmentId: string, date: Date): ShiftException | undefined {
    const dateStr = date.toISOString().split('T')[0]

    return exceptions.value.find((e) => {
      // Handle both populated and non-populated assignment_id
      const exceptionAssignmentId =
        typeof e.assignment_id === 'string' ? e.assignment_id : (e.assignment_id as any)?._id

      const dateMatch = e.date.startsWith(dateStr)
      const idMatch = exceptionAssignmentId === assignmentId

      return idMatch && dateMatch
    })
  }

  return {
    exceptions,
    loading,
    loadExceptions,
    createException,
    deleteException,
    findException
  }
})
