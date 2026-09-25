import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ProfileDrawer from '../ProfileDrawer.vue'
import { usePortalStore } from '@/stores/portal.store'
import type { PwaUserProfile } from '@/types/portal.types'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('ProfileDrawer.vue - Drawer de Perfil y Preferencias (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockUser: PwaUserProfile = {
    id: 'staff-1',
    rut: '12.345.678-9',
    firstName: 'Juan',
    lastName: 'Pérez',
    fullName: 'Juan Pérez',
    phone: '+56912345678',
    email: 'juan@hospital.cl',
    contractType: 'HONORARIO',
    positionName: 'Tens',
    estamento: 'TECNICO',
    notificationPreferences: {
      shiftReminders: true,
      shiftChanges: true,
      openCallsEnabled: true,
      preferredServices: [],
      quietHours: { enabled: true, start: '22:00', end: '07:00' },
    },
  }

  it('muestra la información del funcionario (nombre, RUT, cargo y tipo de contrato)', () => {
    const portalStore = usePortalStore()
    portalStore.user = mockUser

    const wrapper = mount(ProfileDrawer, {
      props: {
        modelValue: true,
      },
    })

    expect(wrapper.find('[data-test="profile-fullname"]').text()).toContain('Juan Pérez')
    expect(wrapper.find('[data-test="profile-rut"]').text()).toContain('12.345.678-9')
    expect(wrapper.find('[data-test="profile-position"]').text()).toContain('Tens')
    expect(wrapper.find('[data-test="profile-contract"]').text()).toContain('HONORARIO')
  })

  it('permite alternar el horario silencioso y llama a updatePreferences', async () => {
    const portalStore = usePortalStore()
    portalStore.user = mockUser
    const updateSpy = vi.spyOn(portalStore, 'updatePreferences').mockResolvedValue()

    const wrapper = mount(ProfileDrawer, {
      props: {
        modelValue: true,
      },
    })

    const quietSwitch = wrapper.find<HTMLInputElement>('[data-test="quiet-hours-switch"]')
    expect(quietSwitch.element.checked).toBe(true)

    await quietSwitch.setValue(false)
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        quietHours: expect.objectContaining({ enabled: false }),
      })
    )
  })

  it('permite cerrar sesión invocando logout', async () => {
    const portalStore = usePortalStore()
    portalStore.user = mockUser
    const logoutSpy = vi.spyOn(portalStore, 'logout').mockResolvedValue()

    const wrapper = mount(ProfileDrawer, {
      props: {
        modelValue: true,
      },
    })

    const logoutBtn = wrapper.find('[data-test="logout-btn"]')
    await logoutBtn.trigger('click')

    expect(logoutSpy).toHaveBeenCalled()
  })
})
