import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const user = computed(() => authStore.user)
  const authReady = computed(() => authStore.authReady)
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  const can = (permission: string) => authStore.hasPermission(permission)

  async function logout() {
    try {
      await authStore.logout()
      router.replace({ name: 'login' })
    } catch (err: any) {
      console.error('Logout error:', err.message)
    }
  }

  return {
    user,
    authReady,
    isAuthenticated,
    can,
    logout
  }
}
