import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLogin } from './useLogin'
import { setActivePinia, createPinia } from 'pinia'

// Mock dependencies
const mockLogin = vi.fn()
const mockRouterPush = vi.fn()
const mockRouterReplace = vi.fn()

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: () => ({
    login: mockLogin
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace
  })
}))

// Mock vee-validate useForm
vi.mock('vee-validate', () => ({
  useForm: () => ({
    validate: vi.fn().mockResolvedValue({ valid: true }),
    errors: {}
  })
}))

describe('useLogin Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { loginData, rutError, isSubmitting } = useLogin()

    expect(loginData.rut).toBe('')
    expect(loginData.password).toBe('')
    expect(rutError.value).toBe('')
    expect(isSubmitting.value).toBe(false)
  })

  it('should validate empty fields', async () => {
    const { onSubmit, loginData, passwordError } = useLogin()

    // Empty password
    loginData.rut = '12.345.678-5'
    loginData.password = ''

    await onSubmit()

    expect(passwordError.value).toBe('Ingrese Contraseña')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('should call authStore.login on successful submission', async () => {
    const { onSubmit, loginData } = useLogin()

    loginData.rut = '12.345.678-5'
    loginData.password = 'password123'

    await onSubmit()

    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        rut: expect.stringContaining('12345678-5'),
        password: 'password123'
      })
    )
    expect(mockRouterReplace).toHaveBeenCalledWith({ name: 'user' })
  })

  it('should handle login errors', async () => {
    const { onSubmit, loginData, loginError } = useLogin()

    // Simulate API error
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))

    loginData.rut = '12.345.678-5'
    loginData.password = 'wrongpass'

    await onSubmit()

    expect(loginError.value).toBe('Rut o Contraseña incorrectos')
  })
})
