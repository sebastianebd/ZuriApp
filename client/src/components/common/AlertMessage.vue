<template>
  <transition name="fade-scale">
    <div
      v-if="visible"
      class="position-fixed top-50 start-50 translate-middle bg-white border-0 rounded-4 shadow-lg p-4 text-center d-flex flex-column align-items-center"
      style="z-index: 2000; min-width: 320px; max-width: 400px;"
    >
      <img
        v-if="iconSrc"
        :src="iconSrc"
        alt="icono"
        class="mb-3"
        style="width: 60px; height: 60px;"
      />
      <h5 class="fw-bold mb-2" :style="{ color: color }">{{ title }}</h5>
      <p class="mb-0 text-secondary">{{ message }}</p>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// estados reactivos
const visible = ref(false)
const title = ref('')
const message = ref('')
const iconSrc = ref('')
//const color = ref('#198754') // por defecto verde

// Muestra la alerta con ícono opcional
function show(
  t: string,
  m: string,
  type: 'success' | 'error' | 'info' = 'success',
  duration = 2000
) {
  title.value = t
  message.value = m

  // Puedes usar íconos PNG de tu carpeta de assets/icons/
  switch (type) {
    case 'success':
      iconSrc.value = new URL('../../assets/icons/checkmark-icon.png', import.meta.url).href
      //color.value = '#198754'
      break
    case 'error':
      iconSrc.value = new URL('@/assets/icons/error-red.png', import.meta.url).href
      //color.value = '#dc3545'
      break
    case 'info':
      iconSrc.value = new URL('@/assets/icons/info-blue.png', import.meta.url).href
      //color.value = '#0dcaf0'
      break
  }

  visible.value = true
  setTimeout(() => (visible.value = false), duration)
}

defineExpose({ show })
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.35s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>

