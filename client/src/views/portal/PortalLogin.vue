<template>
  <div class="portal-login-view d-flex flex-column justify-content-center align-items-center min-vh-100 p-3">
    <div class="card border-0 shadow-sm rounded-4 w-100 login-card p-4">
      <!-- Header -->
      <div class="text-center mb-4">
        <div class="logo-circle mx-auto mb-3">
          <i class="bi bi-hospital-fill text-primary fs-2"></i>
        </div>
        <h4 class="fw-bold text-dark mb-1">ZuriApp</h4>
        <p class="text-muted small mb-0">Portal del Funcionario de Turno</p>
      </div>

      <!-- PASO 1: Ingreso de RUT -->
      <div v-if="step === 'rut'">
        <div class="mb-3">
          <label for="rutInput" class="form-label fw-semibold">
            RUT del Funcionario
          </label>
          <input
            id="rutInput"
            v-model="rut"
            type="text"
            class="form-control form-control-lg text-center fw-bold"
            placeholder="12.345.678-9"
            data-test="rut-input"
            @keyup.enter="handleRequestOtp"
          />
          <div
            v-if="rutError"
            class="text-danger small mt-1"
            data-test="rut-error"
          >
            {{ rutError }}
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-lg w-100 fw-semibold py-2 mb-3"
          :disabled="isSubmitting"
          data-test="request-otp-btn"
          @click="handleRequestOtp"
        >
          <span
            v-if="isSubmitting"
            class="spinner-border spinner-border-sm me-2"
          ></span>
          <i v-else class="bi bi-whatsapp me-2"></i>
          Solicitar Código WhatsApp
        </button>

        <p class="text-muted text-center small mb-0">
          Enviaremos un código de seguridad de 6 dígitos a tu número registrado.
        </p>
      </div>

      <!-- PASO 2: Ingreso de OTP -->
      <div v-else-if="step === 'otp'" data-test="otp-step">
        <div class="alert alert-light border rounded-3 text-center mb-4 py-2">
          <span class="text-muted small d-block">Código enviado a:</span>
          <strong class="text-dark" data-test="masked-phone">{{ maskedPhone || 'tu número registrado' }}</strong>
        </div>

        <div class="mb-3">
          <label for="otpInput" class="form-label fw-semibold text-center d-block">
            Ingresa el Código de 6 Dígitos
          </label>
          <input
            id="otpInput"
            v-model="otp"
            type="text"
            maxlength="6"
            class="form-control form-control-lg text-center fw-bold letter-spacing-lg"
            placeholder="000000"
            data-test="otp-input"
            @keyup.enter="handleVerifyOtp"
          />
          <div v-if="otpError" class="text-danger small text-center mt-1">
            {{ otpError }}
          </div>
        </div>

        <button
          type="button"
          class="btn btn-success btn-lg w-100 fw-semibold py-2 mb-3"
          :disabled="isSubmitting || otp.length < 6"
          data-test="verify-otp-btn"
          @click="handleVerifyOtp"
        >
          <span
            v-if="isSubmitting"
            class="spinner-border spinner-border-sm me-2"
          ></span>
          <i v-else class="bi bi-shield-check me-2"></i>
          Ingresar al Portal
        </button>

        <div class="text-center">
          <div class="small text-muted mb-2">
            ¿No recibiste el código?
          </div>
          <button
            type="button"
            class="btn btn-link btn-sm text-decoration-none p-0"
            :disabled="resendCooldown > 0 || isSubmitting"
            @click="handleRequestOtp"
          >
            <span v-if="resendCooldown > 0" data-test="resend-timer">
              Reenviar en {{ resendCooldown }}s
            </span>
            <span v-else>Reenviar código por WhatsApp</span>
          </button>
        </div>

        <div class="text-center mt-3 pt-3 border-top">
          <button
            type="button"
            class="btn btn-link btn-sm text-secondary text-decoration-none"
            @click="step = 'rut'; otp = ''; otpError = ''"
          >
            ← Cambiar RUT
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal.store'

const router = useRouter()
const portalStore = usePortalStore()

const step = ref<'rut' | 'otp'>('rut')
const rut = ref('')
const otp = ref('')
const maskedPhone = ref('')
const rutError = ref('')
const otpError = ref('')
const isSubmitting = ref(false)
const resendCooldown = ref(0)
let timerInterval: any = null

function validateRutFormat(val: string): boolean {
  const clean = val.replace(/[.-]/g, '').trim()
  if (clean.length < 8 || clean.length > 9) return false
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1).toUpperCase()
  return /^[0-9]+$/.test(body) && /^[0-9K]$/.test(dv)
}

function startCooldown(seconds: number) {
  resendCooldown.value = seconds
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--
    } else {
      clearInterval(timerInterval)
    }
  }, 1000)
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

async function handleRequestOtp() {
  rutError.value = ''
  if (!validateRutFormat(rut.value)) {
    rutError.value = 'RUT inválido. Formato esperado: 12.345.678-9'
    return
  }

  isSubmitting.value = true
  try {
    const result = await portalStore.requestOtp(rut.value.trim())
    if (result && result.success) {
      maskedPhone.value = result.maskedPhone || 'tu número registrado'
      step.value = 'otp'
      startCooldown(result.resendCooldownSeconds || 60)
    }
  } catch (error: any) {
    rutError.value = error.response?.data?.message || 'Error al solicitar el código OTP'
  } finally {
    isSubmitting.value = false
  }
}

async function handleVerifyOtp() {
  otpError.value = ''
  if (otp.value.length < 6) {
    otpError.value = 'El código debe tener 6 dígitos'
    return
  }

  isSubmitting.value = true
  try {
    const result = await portalStore.verifyOtp(rut.value.trim(), otp.value.trim())
    if (result && result.success) {
      if (router) {
        router.push({ name: 'portal-home' })
      }
    }
  } catch (error: any) {
    otpError.value = error.response?.data?.message || 'Código OTP inválido o expirado'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped lang="scss">
.portal-login-view {
  background: linear-gradient(180deg, #f0f4f8 0%, #e2e8f0 100%);
}

.login-card {
  max-width: 420px;
  background: #ffffff;
}

.logo-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e7f1ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.letter-spacing-lg {
  letter-spacing: 0.35rem;
}
</style>
