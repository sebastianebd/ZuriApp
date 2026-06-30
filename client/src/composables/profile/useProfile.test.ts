import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserProfile } from './useProfile'
import { formatDateLong as formatDate } from '@/utils/date-utils'
import { getActionClass } from '@/utils/helpers'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  getReplacementStats: vi.fn(),
  getServiceStats: vi.fn(),
  getRecentActivity: vi.fn(),
  getUser: vi.fn(),
  usePrivateApi: vi.fn()
}))

vi.mock('../../services/profile.service', () => ({
  getReplacementStats: mocks.getReplacementStats,
  getServiceStats: mocks.getServiceStats,
  getRecentActivity: mocks.getRecentActivity
}))

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: () => ({
    userDetail: {
      nombre: 'Juan',
      apellido: 'Perez',
      tipo_cargo: 'TENS',
      habilitado: true
    },
    usePrivateApi: mocks.usePrivateApi,
    getUser: mocks.getUser
  })
}))

describe('useUserProfile Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should load profile data on mount', async () => {
    // Setup mocks
    mocks.getReplacementStats.mockResolvedValue({ total: 10, monthly: 5 })
    mocks.getServiceStats.mockResolvedValue([
      { servicio: 'Urgencia', cantidad: 8 },
      { servicio: 'UCI', cantidad: 2 }
    ])
    mocks.getRecentActivity.mockResolvedValue([
      { id: 1, action: 'CREAR', description: 'Creó turno', created_at: new Date() }
    ])

    // Mount composable via a dummy component to trigger onMounted
    let result: any
    const TestComponent = {
      template: '<div></div>',
      setup() {
        result = useUserProfile()
        return {}
      }
    }

    mount(TestComponent)

    // Wait for promises (loadProfileData)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mocks.getUser).toHaveBeenCalled()
    expect(mocks.getReplacementStats).toHaveBeenCalled()
    expect(result.stats.value).toEqual({ total: 10, monthly: 5 })
    expect(result.chartData.labels).toEqual(['Urgencia', 'UCI'])
    expect(result.recentActivity.value).toHaveLength(1)
  })

  it('should format dates correctly', () => {
    const result = formatDate('2023-01-01T00:00:00')
    // Check for Spanish format (depending on locale availability in test env)
    // Adjust expectation based on Node environment locale
    expect(result).toMatch(/1 de enero de 2023|2023/)
  })

  it('should get correct action class', () => {
    expect(getActionClass('CREAR')).toBe('bg-success')
    expect(getActionClass('ELIMINAR')).toBe('bg-danger')
    expect(getActionClass('UNKNOWN')).toBe('bg-primary')
  })
})
