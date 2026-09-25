import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import SidebarMenu from './SidebarMenu.vue'

// Mock useAuth
const mockCan = vi.fn()
const mockIsAuthenticated = ref(true)

vi.mock('../../composables/login/useAuth', () => ({
  useAuth: () => ({
    can: mockCan,
    isAuthenticated: mockIsAuthenticated
  })
}))

// Mock router-link
const routerLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="to.name"><slot /></a>'
}

describe('SidebarMenu (Épica 5: Consolidación de Módulos & RBAC)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated.value = true
  })

  it('renders all 6 modules for SYS_ADMIN with full permissions', () => {
    mockCan.mockReturnValue(true)

    const wrapper = mount(SidebarMenu, {
      global: {
        stubs: {
          'router-link': routerLinkStub
        }
      }
    })

    const text = wrapper.text()
    expect(text).toContain('Funcionarios')
    expect(text).toContain('Turnos')
    expect(text).toContain('Reemplazos')
    expect(text).toContain('Bolsa de Reemplazos')
    expect(text).toContain('Centro de Reportes')
    expect(text).toContain('Auditoría de Cambios')
    expect(text).toContain('Configuración')
  })

  it('hides "Auditoría de Cambios" for users without audit.view permission', () => {
    mockCan.mockImplementation((perm: string) => {
      if (perm === 'audit.view') return false
      return true
    })

    const wrapper = mount(SidebarMenu, {
      global: {
        stubs: {
          'router-link': routerLinkStub
        }
      }
    })

    const text = wrapper.text()
    expect(text).toContain('Funcionarios')
    expect(text).toContain('Turnos')
    expect(text).toContain('Reemplazos')
    expect(text).toContain('Centro de Reportes')
    expect(text).toContain('Configuración')
    expect(text).not.toContain('Auditoría de Cambios')
  })

  it('renders only authorized groups for standard operational users', () => {
    // Standard user only has users.view
    mockCan.mockImplementation((perm: string) => perm === 'users.view')

    const wrapper = mount(SidebarMenu, {
      global: {
        stubs: {
          'router-link': routerLinkStub
        }
      }
    })

    const text = wrapper.text()
    expect(text).toContain('Funcionarios')
    expect(text).not.toContain('Operaciones')
    expect(text).not.toContain('Turnos')
    expect(text).not.toContain('Reemplazos')
    expect(text).not.toContain('Reportes & Auditoría')
    expect(text).not.toContain('Centro de Reportes')
    expect(text).not.toContain('Auditoría de Cambios')
    expect(text).not.toContain('Configuración')
  })
})
