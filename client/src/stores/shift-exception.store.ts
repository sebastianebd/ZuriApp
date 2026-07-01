import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'
import {
  fetchExceptions,
  createShiftException,
  deleteShiftException,
  type CreateExceptionPayload
} from '../services/shift-exception.service'

export interface ShiftException {
  _id: string
  assignment_id: string
  date: string
  original_type: string
  override_type: string
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
      const api = authStore.usePrivateApi()
      const params: { assignment_id?: string; start_date?: string; end_date?: string } = {}
      if (assignmentId) params.assignment_id = assignmentId
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      exceptions.value = await fetchExceptions(api, params)
      return exceptions.value
    } catch (error) {
      console.error('Error loading exceptions:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createException(data: CreateExceptionPayload) {
    loading.value = true
    try {
      const api = authStore.usePrivateApi()
      const created = await createShiftException(api, data)

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
          created,
          ...exceptions.value.slice(existingIndex + 1)
        ]
      } else {
        // Add new
        exceptions.value.push(created)
      }

      return created
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
      const api = authStore.usePrivateApi()
      await deleteShiftException(api, id)
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
