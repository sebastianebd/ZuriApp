import { reactive, ref } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import { useRouter } from 'vue-router'
import type { LoginData } from '../../types/models'
import { validateRut, formatRut } from '@fdograph/rut-utilities'
import { useForm } from 'vee-validate'
import * as yup from 'yup'

export function useLogin() {
  const authStore = useAuthStore()
  const router = useRouter()

  const schemaForm = yup.object({
    rut: yup.string().max(10),
    password: yup.string().min(6)
  })

  // We are not using useField here, so errors object is from the form context
  const { errors, validate } = useForm({
    validationSchema: schemaForm
  })

  const loginData = reactive<LoginData>({
    rut: '',
    password: ''
  })

  const rutError = ref<string>('')
  const passwordError = ref<string>('')
  const loginError = ref<string>('')
  const accountInUseError = ref<string>('')
  const isSubmitting = ref(false)

  function validateRutInput() {
    const value = loginData.rut.trim()

    if (value.length === 0) {
      rutError.value = ''
      return
    }

    if (!validateRut(value)) {
      rutError.value = 'RUT inválido'
    } else {
      rutError.value = ''
    }
  }

  async function onSubmit() {
    isSubmitting.value = true
    loginError.value = '' // Clear previous errors
    accountInUseError.value = ''

    const { valid } = await validate()

    // Manual RUT Validation check
    let manualValid = true
    if (!validateRut(loginData.rut)) {
      rutError.value = 'RUT inválido'
      manualValid = false
    }

    if (loginData.password.length === 0) {
      passwordError.value = 'Ingrese Contraseña'
      manualValid = false
    } else {
      passwordError.value = ''
    }

    if (!valid || !manualValid) {
      isSubmitting.value = false
      return
    }

    // Format RUT before sending
    loginData.rut = formatRut(loginData.rut)

    try {
      await authStore.login(loginData)
      router.replace({ name: 'dashboard' })
    } catch (err: any) {
      // Check for 409 status (injected by errorHandler or raw response)
      const status = err.status || (err.response && err.response.status)
      if (status === 409) {
        accountInUseError.value = 'Cuenta conectada'
      } else {
        loginError.value = 'Rut o Contraseña incorrectos'
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    loginData,
    errors,
    rutError,
    passwordError,
    loginError,
    isSubmitting,
    validateRutInput,
    onSubmit,
    accountInUseError
  }
}
