import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

import AlertMessage from '@/components/common/AlertMessage.vue'

export function useProfileSecurity() {
  const authStore = useAuthStore()

  const alertComponent = ref<InstanceType<typeof AlertMessage> | null>(null)

  // Tabs Management
  const activeTab = ref('profile')

  // Password Change Logic
  const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const showPassword = reactive({
    current: false,
    new: false,
    confirm: false
  })

  const isSubmitting = ref(false)
  const showConfirmModal = ref(false)

  // History Logic
  const loginHistory = ref<any[]>([])
  const loadingHistory = ref(false)

  const loadHistory = async () => {
    loadingHistory.value = true
    try {
      loginHistory.value = await authStore.fetchLoginHistory()
    } catch (e) {
      console.error(e)
    } finally {
      loadingHistory.value = false
    }
  }

  // Watch activeTab to load history
  watch(activeTab, (newTab) => {
    if (newTab === 'security') {
      loadHistory()
    }
  })

  // User Agent Parser Helper
  const parseUserAgent = (ua: string) => {
    if (ua.includes('Windows')) return 'Windows PC'
    if (ua.includes('Macintosh')) return 'Mac'
    if (ua.includes('Linux')) return 'Linux PC'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
    return 'Desconocido'
  }

  // Real-time Requirements
  const reqs = reactive({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  const validatePasswordStrength = () => {
    const p = passwordForm.newPassword
    reqs.length = p.length >= 6 && p.length <= 8
    reqs.uppercase = /[A-Z]/.test(p)
    reqs.lowercase = /[a-z]/.test(p)
    reqs.number = /[0-9]/.test(p)
    reqs.special = /[@#$%&*\-_+=!?]/.test(p)
  }

  const passwordMismatch = computed(() => {
    return passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
  })

  const isFormValid = computed(() => {
    return (
      reqs.length &&
      reqs.uppercase &&
      reqs.lowercase &&
      reqs.number &&
      reqs.special &&
      !passwordMismatch.value &&
      passwordForm.currentPassword
    )
  })

  // Step 1: Trigger Modal
  const handleChangePassword = () => {
    if (!isFormValid.value) return
    showConfirmModal.value = true
  }

  // Step 2: Actually Submit
  const confirmChangePassword = async () => {
    showConfirmModal.value = false
    isSubmitting.value = true

    const result = await authStore.changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword,
      passwordForm.confirmPassword
    )

    isSubmitting.value = false

    if (result.success) {
      if (alertComponent.value) {
        alertComponent.value.show('¡Éxito!', 'Contraseña actualizada correctamente', 'success')
      }

      // Reset form
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      validatePasswordStrength() // Reset validations
    } else {
      if (alertComponent.value) {
        alertComponent.value.show('Error', result.message || 'Error desconocido', 'error')
      }
    }
  }

  return {
    activeTab,
    passwordForm,
    showPassword,
    isSubmitting,
    showConfirmModal,
    loginHistory,
    loadingHistory,
    reqs,
    passwordMismatch,
    isFormValid,
    parseUserAgent,
    validatePasswordStrength,
    handleChangePassword,
    confirmChangePassword,
    alertComponent
  }
}
