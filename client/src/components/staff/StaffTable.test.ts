import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StaffTable from './StaffTable.vue'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock Auth Store
const mockHasPermission = vi.fn((perm: string) => perm === 'shifts.view' || perm === 'users.update')
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    hasPermission: mockHasPermission
  })
}))

// Mock Role Store
vi.mock('@/stores/role.store', () => ({
  useRoleStore: () => ({
    roles: [],
    fetchRoles: vi.fn()
  })
}))

describe('StaffTable (Épica 3: Ficha de Turnos Quick Access)', () => {
  const dummyUsuarios = [
    {
      _id: 'usr-123456',
      rut: '12.345.678-9',
      firstName: 'JUAN',
      lastName: 'PEREZ',
      email: 'juan@hospital.cl',
      phone: '+56912345678',
      city: 'Santiago',
      address: 'Calle 1',
      isActive: true,
      positionId: { name: 'Enfermero' },
      roleId: { name: 'Usuario' }
    }
  ]

  const dummyLoginUser = {
    _id: 'admin-1',
    role: { level: 100 }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Ver Ficha de Turnos" quick action button when user has shifts.view permission', () => {
    const wrapper = mount(StaffTable, {
      props: {
        usuarios: dummyUsuarios,
        loginUser: dummyLoginUser
      }
    })

    const fichaButton = wrapper.find('.btn-ficha')
    expect(fichaButton.exists()).toBe(true)
    expect(fichaButton.attributes('title')).toBe('Ver Ficha de Turnos')
    expect(fichaButton.find('.bi-person-lines-fill').exists()).toBe(true)
  })

  it('navigates to personal-ficha-turnos with staffId query param when "Ver Ficha" is clicked', async () => {
    const wrapper = mount(StaffTable, {
      props: {
        usuarios: dummyUsuarios,
        loginUser: dummyLoginUser
      }
    })

    const fichaButton = wrapper.find('.btn-ficha')
    await fichaButton.trigger('click')

    expect(mockPush).toHaveBeenCalledWith({
      name: 'personal-ficha-turnos',
      query: { staffId: 'usr-123456' }
    })
  })

  it('hides "Ver Ficha de Turnos" button when user lacks shifts.view permission', () => {
    mockHasPermission.mockReturnValue(false)

    const wrapper = mount(StaffTable, {
      props: {
        usuarios: dummyUsuarios,
        loginUser: dummyLoginUser
      }
    })

    const fichaButton = wrapper.find('.btn-ficha')
    expect(fichaButton.exists()).toBe(false)
  })
})
