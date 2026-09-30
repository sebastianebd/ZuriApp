import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StaffTable from './StaffTable.vue'

// Mock Auth Store
const mockHasPermission = vi.fn((perm: string) => perm === 'users.update' || perm === 'users.delete')
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

describe('StaffTable', () => {
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

  it('renders staff information correctly', () => {
    const wrapper = mount(StaffTable, {
      props: {
        usuarios: dummyUsuarios,
        loginUser: dummyLoginUser
      }
    })

    expect(wrapper.text()).toContain('12.345.678-9')
    expect(wrapper.text()).toContain('Juan P.')
    expect(wrapper.text()).toContain('juan@hospital.cl')
  })

  it('does NOT render legacy btn-ficha', () => {
    const wrapper = mount(StaffTable, {
      props: {
        usuarios: dummyUsuarios,
        loginUser: dummyLoginUser
      }
    })

    expect(wrapper.find('.btn-ficha').exists()).toBe(false)
  })

  it('emits "editar" when edit button is clicked', async () => {
    const wrapper = mount(StaffTable, {
      props: {
        usuarios: dummyUsuarios,
        loginUser: dummyLoginUser
      }
    })

    const editBtn = wrapper.find('.btn-edit')
    expect(editBtn.exists()).toBe(true)
    await editBtn.trigger('click')

    expect(wrapper.emitted('editar')).toBeTruthy()
    expect(wrapper.emitted('editar')![0]).toEqual([dummyUsuarios[0]])
  })

  it('emits "detalle" when history button is clicked', async () => {
    const wrapper = mount(StaffTable, {
      props: {
        usuarios: dummyUsuarios,
        loginUser: dummyLoginUser
      }
    })

    const historyBtn = wrapper.find('.btn-history')
    expect(historyBtn.exists()).toBe(true)
    await historyBtn.trigger('click')

    expect(wrapper.emitted('detalle')).toBeTruthy()
    expect(wrapper.emitted('detalle')![0]).toEqual([dummyUsuarios[0]])
  })
})
