import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PortalLayout from '../PortalLayout.vue'
import { usePortalStore } from '@/stores/portal.store'
import type { PwaUserProfile } from '@/types/portal.types'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/services/portal.service', () => ({
  default: {
    getOpenOffers: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/plugins/socket', () => ({
  default: {
    connected: false,
    connect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

describe('PortalLayout.vue - Mobile App Shell & Bottom Navigation (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const baseHonorarioUser: PwaUserProfile = {
    id: 'staff-hon-1',
    rut: '12.345.678-9',
    firstName: 'Juan',
    lastName: 'Pérez',
    fullName: 'Juan Pérez',
    phone: '+56912345678',
    email: 'juan@hospital.cl',
    contractType: 'HONORARIO',
    positionName: 'Tens',
    estamento: 'TECNICO',
  }

  const basePlantaUser: PwaUserProfile = {
    ...baseHonorarioUser,
    id: 'staff-planta-1',
    contractType: 'PLANTA',
  }

  it('muestra 4 pestañas en la barra inferior para funcionarios HONORARIOS (incluyendo Bolsa)', () => {
    const portalStore = usePortalStore()
    portalStore.user = baseHonorarioUser
    portalStore.isAuthenticated = true

    const wrapper = mount(PortalLayout, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
          'router-view': true,
        },
      },
    })

    const navItems = wrapper.findAll('[data-test="bottom-nav-item"]')
    expect(navItems.length).toBe(4)

    const bolsaTab = wrapper.find('[data-test="nav-tab-offers"]')
    expect(bolsaTab.exists()).toBe(true)
    expect(bolsaTab.text()).toMatch(/bolsa/i)
  })

  it('muestra solo 3 pestañas para funcionarios de PLANTA o CONTRATA (ocultando Bolsa)', () => {
    const portalStore = usePortalStore()
    portalStore.user = basePlantaUser
    portalStore.isAuthenticated = true

    const wrapper = mount(PortalLayout, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
          'router-view': true,
        },
      },
    })

    const navItems = wrapper.findAll('[data-test="bottom-nav-item"]')
    expect(navItems.length).toBe(3)

    const bolsaTab = wrapper.find('[data-test="nav-tab-offers"]')
    expect(bolsaTab.exists()).toBe(false)
  })

  it('permite abrir y cerrar el ProfileDrawer desde el botón de avatar del header', async () => {
    const portalStore = usePortalStore()
    portalStore.user = baseHonorarioUser
    portalStore.isAuthenticated = true

    const wrapper = mount(PortalLayout, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
          'router-view': true,
        },
      },
    })

    const avatarBtn = wrapper.find('[data-test="header-profile-btn"]')
    expect(avatarBtn.exists()).toBe(true)

    expect(wrapper.find('[data-test="profile-drawer"]').classes()).not.toContain('show')
    await avatarBtn.trigger('click')
    expect(wrapper.find('[data-test="profile-drawer"]').classes()).toContain('show')
  })
})
