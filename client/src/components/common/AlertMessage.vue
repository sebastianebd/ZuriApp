<template>
  <Transition name="alert-fade">
    <div
      v-if="visible"
      class="position-fixed top-50 start-50 translate-middle alert-container"
      style="z-index: 2050"
    >
      <div
        class="alert-content bg-white shadow-lg rounded-4 p-4 text-center border-0 overflow-hidden"
      >
        <!-- Icon Container Dynamic -->
        <div
          class="icon-outer rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm"
          :class="alertTypeClasses.bg"
          style="width: 70px; height: 70px"
        >
          <i class="bi fs-1" :class="[alertTypeClasses.icon, alertTypeClasses.text]"></i>
        </div>

        <!-- Text Content -->
        <h5 class="fw-bold mb-2 text-dark">{{ title }}</h5>
        <p class="mb-0 text-secondary fw-medium">{{ message }}</p>

        <!-- Progress bar simple for duration visual -->
        <div class="progress-bar-container mt-4">
          <div
            class="progress-bar-fill"
            :class="alertTypeClasses.bg"
            :style="{ animationDuration: duration + 'ms' }"
          ></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// reactive states
const visible = ref(false)
const title = ref('')
const message = ref('')
const type = ref<'success' | 'error' | 'info'>('success')
const duration = ref(2000)

const alertTypeClasses = computed(() => {
  switch (type.value) {
    case 'success':
      return {
        bg: 'bg-success bg-opacity-10',
        text: 'text-success',
        icon: 'bi-check-circle-fill'
      }
    case 'error':
      return {
        bg: 'bg-danger bg-opacity-10',
        text: 'text-danger',
        icon: 'bi-x-circle-fill'
      }
    case 'info':
      return {
        bg: 'bg-primary bg-opacity-10',
        text: 'text-primary',
        icon: 'bi-info-circle-fill'
      }
    default:
      return {
        bg: 'bg-primary bg-opacity-10',
        text: 'text-primary',
        icon: 'bi-info-circle-fill'
      }
  }
})

// Show alert method
function show(t: string, m: string, tType: 'success' | 'error' | 'info' = 'success', d = 2000) {
  title.value = t
  message.value = m
  type.value = tType
  duration.value = d

  visible.value = true
  setTimeout(() => (visible.value = false), d)
}

defineExpose({ show })
</script>

<style scoped>
.alert-container {
  min-width: 320px;
  max-width: 420px;
}

.alert-content {
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  background: white;
}

/* Animations */
.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -60%) scale(0.9);
}

.icon-outer {
  border: 4px solid white;
}

/* Progress bar animation */
.progress-bar-container {
  height: 3px;
  width: 100%;
  background: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  width: 100%;
  transform-origin: left;
  animation: progressTimer linear forwards;
}

@keyframes progressTimer {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Blur backdrop when alert is visible could be handled here or globally */
</style>
