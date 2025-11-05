<template>
  <div class="modal fade show d-block" tabindex="-1" role="dialog" v-if="visible">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content border-0 rounded-3 shadow-lg">
        <div class="modal-header bg-warning text-dark rounded-top">
          <h5 class="modal-title fw-bold">Confirmar acción</h5>
          <button type="button" class="btn-close" @click="$emit('cancelar')" />
        </div>

        <div class="modal-body bg-light text-center">
          <p class="fs-5 mb-3">{{ mensaje}}</p>
        </div>

        <div class="modal-footer d-flex justify-content-center border-0 pb-3">
          <button class="btn btn-secondary px-4 fw-semibold" @click="$emit('cancelar')">
            No
          </button>
          <button class="btn btn-primary px-4 fw-semibold" @click="$emit('confirmar')">
            Sí
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean; mensaje: string }>()
defineEmits<{ (e: 'confirmar'): void; (e: 'cancelar'): void }>()
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  animation: fadeInModal 0.25s ease;
}

@keyframes fadeInModal {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
