import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'
import { useApiPrivate } from '../composables/useApi'
import {
  fetchAssignments,
  createAssignment as createAssignmentService,
  deleteAssignment as deleteAssignmentService
} from '../services/turn-assignment.service'
import type { TurnAssignment } from '@/types/models'

export const useTurnAssignmentStore = defineStore('turnAssignment', () => {
  const assignments = ref<TurnAssignment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()
  const apiPrivate = useApiPrivate(
    () => authStore.accessToken,
    authStore.refreshToken,
    authStore.logout
  )

  const loadAssignments = async () => {
    loading.value = true
    error.value = null
    try {
      assignments.value = await fetchAssignments(apiPrivate)
    } catch (err: any) {
      error.value = err.message || 'Error loading assignments'
    } finally {
      loading.value = false
    }
  }

  const addAssignment = async (payload: any) => {
    loading.value = true
    error.value = null
    try {
      await createAssignmentService(apiPrivate, payload)
      await loadAssignments() // Refresh list
    } catch (err: any) {
      error.value = err.message || 'Error creating assignment'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeAssignment = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await deleteAssignmentService(apiPrivate, id)
      await loadAssignments()
    } catch (err: any) {
      error.value = err.message || 'Error deleting assignment'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAssignmentsByUser = async (userId: string) => {
    try {
      return await fetchAssignments(apiPrivate, { user_id: userId })
    } catch (err: any) {
      console.error('Error fetching user assignments', err)
      return []
    }
  }

  return {
    assignments,
    loading,
    error,
    loadAssignments,
    addAssignment,
    removeAssignment,
    fetchAssignmentsByUser
  }
})
