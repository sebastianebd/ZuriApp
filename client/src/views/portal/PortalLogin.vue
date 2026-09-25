<template>
  <div class="portal-login-view">
    <!-- Decorative background -->
    <div class="login-bg-pattern"></div>

    <div class="login-container">
      <!-- Header / Branding -->
      <header class="login-header">
        <div class="brand-mark">
          <div class="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
              <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/>
              <line x1="12" y1="13" x2="12" y2="17"/>
              <line x1="10" y1="15" x2="14" y2="15"/>
            </svg>
          </div>
        </div>
        <h1 class="brand-name">ZuriApp</h1>
        <p class="brand-tagline">Portal del Funcionario de Turno</p>
      </header>

      <!-- Login Card -->
      <div class="login-card">
        <!-- PASO 1: Ingreso de RUT -->
        <div v-if="step === 'rut'">
          <div class="input-group-custom">
            <label for="rutInput" class="input-label">
              RUT del Funcionario
            </label>
            <input
              id="rutInput"
              v-model="rut"
              type="text"
              class="input-field"
              placeholder="12.345.678-9"
              autocomplete="off"
              inputmode="numeric"
              data-test="rut-input"
              @keyup.enter="handleRequestOtp"
            />
            <div
              v-if="rutError"
              class="input-error"
              data-test="rut-error"
            >
              <i class="bi bi-exclamation-circle me-1"></i>
              {{ rutError }}
            </div>
          </div>

          <button
            type="button"
            class="btn-primary-custom"
            :disabled="isSubmitting"
            data-test="request-otp-btn"
            @click="handleRequestOtp"
          >
            <span
              v-if="isSubmitting"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            <i v-else class="bi bi-whatsapp me-2"></i>
            Solicitar código WhatsApp
          </button>

          <p class="login-hint">
            Enviaremos un código de seguridad de 6 dígitos a tu número registrado.
          </p>
        </div>

        <!-- PASO 2: Ingreso de OTP -->
        <div v-else-if="step === 'otp'" data-test="otp-step">
          <div class="otp-sent-banner">
            <span class="otp-sent-label">Código enviado a</span>
            <strong data-test="masked-phone">{{ maskedPhone || 'tu número registrado' }}</strong>
          </div>

          <div class="input-group-custom">
            <label for="otpInput" class="input-label text-center d-block">
              Ingresa el código de 6 dígitos
            </label>
            <input
              id="otpInput"
              v-model="otp"
              type="text"
              maxlength="6"
              inputmode="numeric"
              autocomplete="one-time-code"
              class="input-field otp-input"
              placeholder="000000"
              data-test="otp-input"
              @keyup.enter="handleVerifyOtp"
            />
            <div v-if="otpError" class="input-error text-center">
              <i class="bi bi-exclamation-circle me-1"></i>
              {{ otpError }}
            </div>
          </div>

          <button
            type="button"
            class="btn-primary-custom btn-verify"
            :disabled="isSubmitting || otp.length < 6"
            data-test="verify-otp-btn"
            @click="handleVerifyOtp"
          >
            <span
              v-if="isSubmitting"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            <i v-else class="bi bi-shield-check me-2"></i>
            Ingresar al portal
          </button>

          <div class="resend-section">
            <span class="resend-label">¿No recibiste el código?</span>
            <button
              type="button"
              class="resend-btn"
              :disabled="resendCooldown > 0 || isSubmitting"
              @click="handleRequestOtp"
            >
              <span v-if="resendCooldown > 0" data-test="resend-timer">
                Reenviar en {{ resendCooldown }}s
              </span>
              <span v-else>Reenviar código por WhatsApp</span>
            </button>
          </div>

          <div class="back-section">
            <button
              type="button"
              class="back-btn"
              @click="step = 'rut'; otp = ''; otpError = ''"
            >
              <i class="bi bi-arrow-left me-1"></i>
              Cambiar RUT
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="login-footer">
        <span>Hospital Base San José de Osorno</span>
      </footer>
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
@use '@/assets/styles/portal-theme' as t;

.portal-login-view {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: t.$zuri-brand;
  position: relative;
  overflow: hidden;
  padding: t.$space-4;
}

// Subtle texture pattern instead of flat gradient
.login-bg-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(98, 182, 203, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(98, 182, 203, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.login-container {
  width: 100%;
  max-width: t.$portal-max-width;
  position: relative;
  z-index: 1;
}

// --- Brand Header ---
.login-header {
  text-align: center;
  margin-bottom: t.$space-8;
}

.brand-mark {
  margin-bottom: t.$space-4;
}

.brand-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: t.$radius-lg;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.brand-name {
  font-family: t.$font-family-base;
  font-size: t.$font-size-2xl;
  font-weight: t.$font-weight-bold;
  letter-spacing: t.$letter-spacing-tight;
  color: #ffffff;
  margin: 0 0 t.$space-1;
}

.brand-tagline {
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-medium;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  letter-spacing: t.$letter-spacing-wide;
}

// --- Login Card ---
.login-card {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-xl;
  padding: t.$space-6;
  box-shadow: t.$shadow-xl;
}

// --- Input System ---
.input-group-custom {
  margin-bottom: t.$space-5;
}

.input-label {
  display: block;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-body;
  margin-bottom: t.$space-2;
  letter-spacing: t.$letter-spacing-wide;
}

.input-field {
  width: 100%;
  padding: t.$space-3 t.$space-4;
  font-size: t.$font-size-lg;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
  background: t.$zuri-surface;
  border: 1.5px solid t.$zuri-border;
  border-radius: t.$radius-md;
  outline: none;
  transition: border-color t.$transition-base, box-shadow t.$transition-base;
  text-align: center;

  &::placeholder {
    color: t.$zuri-text-subtle;
    font-weight: t.$font-weight-normal;
  }

  &:focus {
    border-color: t.$zuri-accent;
    box-shadow: 0 0 0 3px rgba(98, 182, 203, 0.15);
  }
}

.otp-input {
  letter-spacing: 0.4em;
  font-family: t.$font-family-mono;
  font-size: t.$font-size-xl;
}

.input-error {
  font-size: t.$font-size-xs;
  color: t.$zuri-danger;
  margin-top: t.$space-2;
}

// --- Button System ---
.btn-primary-custom {
  width: 100%;
  padding: t.$space-3 t.$space-4;
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-semi;
  color: #ffffff;
  background: t.$zuri-brand;
  border: none;
  border-radius: t.$radius-md;
  cursor: pointer;
  transition: background t.$transition-base, transform t.$transition-fast, box-shadow t.$transition-base;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: t.$space-4;

  &:hover:not(:disabled) {
    background: t.$zuri-brand-light;
    box-shadow: t.$shadow-md;
  }

  &:active:not(:disabled) {
    transform: scale(0.98) translateY(1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.btn-verify {
  background: t.$zuri-success;

  &:hover:not(:disabled) {
    background: darken(t.$zuri-success, 5%);
  }
}

// --- Supporting Elements ---
.login-hint {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

.otp-sent-banner {
  background: t.$zuri-accent-subtle;
  border: 1px solid t.$zuri-accent-muted;
  border-radius: t.$radius-md;
  padding: t.$space-3;
  text-align: center;
  margin-bottom: t.$space-5;

  .otp-sent-label {
    display: block;
    font-size: t.$font-size-xs;
    color: t.$zuri-text-muted;
    margin-bottom: t.$space-1;
  }

  strong {
    font-size: t.$font-size-base;
    color: t.$zuri-text-heading;
  }
}

.resend-section {
  text-align: center;
  margin-bottom: t.$space-4;

  .resend-label {
    display: block;
    font-size: t.$font-size-xs;
    color: t.$zuri-text-muted;
    margin-bottom: t.$space-1;
  }

  .resend-btn {
    background: none;
    border: none;
    font-size: t.$font-size-sm;
    font-weight: t.$font-weight-medium;
    color: t.$zuri-accent;
    cursor: pointer;
    padding: 0;
    transition: color t.$transition-base;

    &:hover:not(:disabled) {
      color: t.$zuri-brand;
    }

    &:disabled {
      color: t.$zuri-text-subtle;
      cursor: not-allowed;
    }
  }
}

.back-section {
  text-align: center;
  padding-top: t.$space-4;
  border-top: 1px solid t.$zuri-divider;

  .back-btn {
    background: none;
    border: none;
    font-size: t.$font-size-sm;
    font-weight: t.$font-weight-medium;
    color: t.$zuri-text-muted;
    cursor: pointer;
    padding: 0;
    transition: color t.$transition-base;

    &:hover {
      color: t.$zuri-text-body;
    }
  }
}

// --- Footer ---
.login-footer {
  text-align: center;
  margin-top: t.$space-6;
  font-size: t.$font-size-xs;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: t.$letter-spacing-wide;
}
</style>
