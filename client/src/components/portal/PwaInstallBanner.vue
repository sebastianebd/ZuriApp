<template>
  <div
    v-if="canInstall && !dismissed"
    class="pwa-install-banner"
    role="alert"
    data-test="pwa-install-banner"
  >
    <div class="banner-icon">
      <i class="bi bi-phone-vibrate-fill"></i>
    </div>
    <div class="banner-content">
      <strong class="banner-title">Instala ZuriApp en tu pantalla</strong>
      <div class="banner-desc">Acceso instantáneo con un solo toque y avisos directos.</div>
    </div>
    <div class="banner-actions">
      <button
        type="button"
        class="banner-btn-install"
        @click="promptInstall"
      >
        Instalar
      </button>
      <button
        type="button"
        class="banner-btn-close"
        aria-label="Close"
        @click="dismiss"
      >
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
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
@use '@/assets/styles/portal-theme' as t;

.pwa-install-banner {
  background: t.$zuri-accent-subtle;
  border-bottom: 1px solid t.$zuri-accent-muted;
  padding: t.$space-3 t.$space-4;
  display: flex;
  align-items: center;
  gap: t.$space-3;
  position: relative;
  z-index: 1025;
}

.banner-icon {
  width: 36px;
  height: 36px;
  border-radius: t.$radius-sm;
  background: rgba(27, 73, 101, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: t.$zuri-brand;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.banner-content {
  flex: 1;
  min-width: 0;
}

.banner-title {
  display: block;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  line-height: 1.2;
}

.banner-desc {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: t.$space-2;
  flex-shrink: 0;
}

.banner-btn-install {
  background: t.$zuri-brand;
  color: #ffffff;
  border: none;
  border-radius: t.$radius-sm;
  padding: t.$space-1 t.$space-3;
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  cursor: pointer;
  transition: all t.$transition-base;

  &:hover {
    background: t.$zuri-brand-light;
    box-shadow: t.$shadow-xs;
  }

  &:active {
    transform: scale(0.96);
  }
}

.banner-btn-close {
  background: transparent;
  border: none;
  color: t.$zuri-text-muted;
  padding: t.$space-1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.85rem;
  border-radius: t.$radius-xs;
  transition: all t.$transition-fast;

  &:hover {
    color: t.$zuri-text-heading;
    background: rgba(0, 0, 0, 0.05);
  }
}
</style>
