<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      v-if="visible"
      style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          <!-- Header (Suave y con icono) -->
          <div class="modal-header border-0 bg-white pt-4 pb-0 px-4 d-flex justify-content-center">
            <div class="text-center">
              <div
                class="icon-container bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style="width: 60px; height: 60px"
              >
                <i class="bi bi-exclamation-triangle-fill fs-2"></i>
              </div>
              <h5 class="modal-title fw-bold text-dark">Confirmar Acción</h5>
            </div>
          </div>

          <!-- Body -->
          <div class="modal-body bg-white px-4 pt-2 pb-4 text-center">
            <p class="text-secondary mb-0 fw-medium px-2">{{ mensaje }}</p>
          </div>

          <!-- Footer (Botones Premium) -->
          <div class="modal-footer d-flex justify-content-center gap-3 border-0 pb-4 px-4">
            <button
              class="btn btn-light border px-4 py-2 fw-bold text-secondary shadow-xs"
              @click="$emit('cancelar')"
            >
              Cancelar
            </button>
            <button class="btn btn-primary px-4 py-2 fw-bold shadow-sm" @click="$emit('confirmar')">
              Sí, Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean; mensaje: string }>()
defineEmits<{ (e: 'confirmar'): void; (e: 'cancelar'): void }>()
</script>

<style scoped>
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-content {
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: modalScaleUp 0.3s ease-out;
}

@keyframes modalScaleUp {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn {
  transition: all 0.2s ease;
  border-radius: 0.75rem;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
}

.btn-primary:hover {
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
</style>
