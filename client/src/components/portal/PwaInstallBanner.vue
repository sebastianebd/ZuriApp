<template>
  <div
    v-if="canInstall && !dismissed"
    class="install-banner alert alert-info alert-dismissible fade show d-flex align-items-center mb-0 border-0 rounded-0"
    role="alert"
    data-test="pwa-install-banner"
  >
    <div class="me-3">
      <i class="bi bi-phone-vibrate-fill fs-3 text-primary"></i>
    </div>
    <div class="flex-grow-1">
      <strong>Instala ZuriApp en tu pantalla</strong>
      <div class="small text-muted">Acceso instantáneo con un solo toque y avisos directos.</div>
    </div>
    <button
      type="button"
      class="btn btn-sm btn-primary ms-2 px-3 fw-semibold"
      @click="promptInstall"
    >
      Instalar
    </button>
    <button
      type="button"
      class="btn-close ms-2"
      aria-label="Close"
      @click="dismiss"
    ></button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const deferredPrompt = ref<any>(null)
const canInstall = ref(false)
const dismissed = ref(false)

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
  })

  window.addEventListener('appinstalled', () => {
    canInstall.value = false
    deferredPrompt.value = null
  })
})

async function promptInstall() {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    canInstall.value = false
  }
  deferredPrompt.value = null
}

function dismiss() {
  dismissed.value = true
}
</script>

<style scoped lang="scss">
.install-banner {
  background: #e7f1ff;
  border-bottom: 1px solid #b6d4fe !important;
}
</style>
