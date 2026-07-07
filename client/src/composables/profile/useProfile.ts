import { computed, onMounted, ref, reactive } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import * as profileService from '../../services/profile.service'
import { useServiceStore } from '../../stores/service.store'

export function useUserProfile() {
  const authStore = useAuthStore()
  const serviceStore = useServiceStore()

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

  const recentActivity = ref<any[]>([])

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

      chartData.labels = serviceRes.map((s: any) => serviceStore.getServiceName(s.servicio))
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
    recentActivity
  }
}
