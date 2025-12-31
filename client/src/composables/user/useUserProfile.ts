import { computed, onMounted, ref, reactive } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import * as profileService from '../../services/profile.service'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function useUserProfile() {
  const authStore = useAuthStore()

  const user = computed(() => {
    return authStore.userDetail
  })

  // Stats
  const stats = ref({
    total: 0,
    monthly: 0
  })

  // Chart Data
  const chartData = reactive({
    labels: [] as string[],
    datasets: [
      {
        backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'],
        data: [] as number[],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  })

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 11
          }
        }
      }
    },
    cutout: '70%'
  }

  // Activity
  const recentActivity = ref<any[]>([])

  function formatDate(dateString: string | Date) {
    if (!dateString) return 'N/A'
    const date = dateString instanceof Date ? dateString : new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function formatRelativeTime(dateString: string) {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
  }

  function getActionClass(action: string) {
    switch (action) {
      case 'CREAR':
        return 'bg-success'
      case 'MODIFICAR':
        return 'bg-warning'
      case 'ELIMINAR':
      case 'ANULAR':
        return 'bg-danger'
      case 'FINALIZAR':
        return 'bg-info'
      default:
        return 'bg-primary'
    }
  }

  // Loading State
  const loading = ref(false)

  async function loadProfileData() {
    const apiPrivate = authStore.usePrivateApi()
    loading.value = true
    try {
      const [statsRes, serviceRes, activityRes] = await Promise.all([
        profileService.getReplacementStats(apiPrivate),
        profileService.getServiceStats(apiPrivate),
        profileService.getRecentActivity(apiPrivate)
      ])

      stats.value = statsRes

      // Process chart data
      chartData.labels = serviceRes.map((s: any) => s.servicio)
      chartData.datasets[0].data = serviceRes.map((s: any) => s.cantidad)

      recentActivity.value = activityRes
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    try {
      if (!authStore.user) {
        await authStore.getUser()
      }
      await loadProfileData()
    } catch (err) {
      console.error('UserProfile Mount Error:', err)
    }
  })

  return {
    user,
    stats,
    loading,
    chartData,
    chartOptions,
    recentActivity,
    formatDate,
    formatRelativeTime,
    getActionClass
  }
}
