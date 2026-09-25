import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PortalLogin from '../PortalLogin.vue'
import { usePortalStore } from '@/stores/portal.store'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('PortalLogin.vue - Login OTP Móvil (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('muestra error de validación cuando se ingresa un RUT con formato inválido', async () => {
    const wrapper = mount(PortalLogin)

    const rutInput = wrapper.find('[data-test="rut-input"]')
    await rutInput.setValue('123')

    const submitBtn = wrapper.find('[data-test="request-otp-btn"]')
    await submitBtn.trigger('click')

    const errorMsg = wrapper.find('[data-test="rut-error"]')
    expect(errorMsg.exists()).toBe(true)
    expect(errorMsg.text()).toMatch(/rut/i)
  })

  it('solicita OTP con éxito para un RUT válido y avanza al paso de ingreso de código OTP con temporizador de 60s', async () => {
    const portalStore = usePortalStore()
    const requestOtpSpy = vi.spyOn(portalStore, 'requestOtp').mockResolvedValue({
      success: true,
      maskedPhone: '+56 9 **** 678',
      expiresInSeconds: 600,
      resendCooldownSeconds: 60,
    } as any)

    const wrapper = mount(PortalLogin)

    const rutInput = wrapper.find('[data-test="rut-input"]')
    await rutInput.setValue('12.345.678-9')

    const submitBtn = wrapper.find('[data-test="request-otp-btn"]')
    await submitBtn.trigger('click')

    expect(requestOtpSpy).toHaveBeenCalledWith('12.345.678-9')

    // Ahora debe mostrar el paso OTP
    expect(wrapper.find('[data-test="otp-step"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="masked-phone"]').text()).toContain('+56 9 **** 678')
    expect(wrapper.find('[data-test="resend-timer"]').text()).toMatch(/60|59/i)
  })

  it('permite ingresar el código OTP de 6 dígitos y valida la sesión', async () => {
    const portalStore = usePortalStore()
    vi.spyOn(portalStore, 'requestOtp').mockResolvedValue({
      success: true,
      maskedPhone: '+56 9 **** 678',
      expiresInSeconds: 600,
      resendCooldownSeconds: 60,
    } as any)

    const verifyOtpSpy = vi.spyOn(portalStore, 'verifyOtp').mockResolvedValue({
      success: true,
      user: {
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
      },
    } as any)

    const wrapper = mount(PortalLogin)

    // Paso 1: RUT
    await wrapper.find('[data-test="rut-input"]').setValue('12.345.678-9')
    await wrapper.find('[data-test="request-otp-btn"]').trigger('click')

    // Paso 2: OTP
    const otpInput = wrapper.find('[data-test="otp-input"]')
    expect(otpInput.exists()).toBe(true)
    await otpInput.setValue('123456')

    const verifyBtn = wrapper.find('[data-test="verify-otp-btn"]')
    await verifyBtn.trigger('click')

    expect(verifyOtpSpy).toHaveBeenCalledWith('12.345.678-9', '123456')
  })
})
