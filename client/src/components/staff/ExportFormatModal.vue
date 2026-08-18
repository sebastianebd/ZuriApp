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
          <!-- Header -->
          <div class="modal-header border-0 bg-white pt-4 pb-0 px-4 d-flex justify-content-center">
            <div class="text-center">
              <div
                class="icon-container bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style="width: 60px; height: 60px"
              >
                <i class="bi bi-cloud-download-fill fs-2"></i>
              </div>
              <h5 class="modal-title fw-bold text-dark">Exportar Registros</h5>
            </div>
          </div>

          <!-- Body -->
          <div class="modal-body bg-white px-4 pt-2 pb-4 text-center">
            <p class="text-secondary mb-4 fw-medium px-2">
              Selecciona el formato en el que deseas descargar la información:
            </p>

            <div class="d-flex flex-column gap-3 px-3">
              <button
                class="btn btn-outline-danger p-3 d-flex align-items-center justify-content-between rounded-3 shadow-xs border-2 hover-scale"
                @click="$emit('select', 'pdf')"
              >
                <div class="d-flex align-items-center gap-3">
                  <div
                    class="rounded-circle bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center"
                    style="width: 40px; height: 40px"
                  >
                    <i class="bi bi-file-earmark-pdf-fill fs-5"></i>
                  </div>
                  <div class="text-start">
                    <div class="fw-bold text-dark">Formato PDF</div>
                    <small class="text-muted">Ideal para impresión y reportes</small>
                  </div>
                </div>
                <i class="bi bi-chevron-right text-muted small"></i>
              </button>

              <button
                class="btn btn-outline-success p-3 d-flex align-items-center justify-content-between rounded-3 shadow-xs border-2 hover-scale"
                @click="$emit('select', 'excel')"
              >
                <div class="d-flex align-items-center gap-3">
                  <div
                    class="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                    style="width: 40px; height: 40px"
                  >
                    <i class="bi bi-file-earmark-excel-fill fs-5"></i>
                  </div>
                  <div class="text-start">
                    <div class="fw-bold text-dark">Formato Excel</div>
                    <small class="text-muted">Ideal para análisis de datos</small>
                  </div>
                </div>
                <i class="bi bi-chevron-right text-muted small"></i>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer border-0 pb-4 px-4 justify-content-center">
            <button
              class="btn btn-light border px-4 py-2 fw-bold text-secondary shadow-xs rounded-pill"
              @click="$emit('close')"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean }>()
defineEmits<{
  (e: 'select', format: 'pdf' | 'excel'): void
  (e: 'close'): void
}>()
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
  max-width: 400px;
  margin: auto;
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

.hover-scale {
  transition: all 0.2s ease;
}

.hover-scale:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.btn-outline-danger:hover {
  background-color: #fff5f5;
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-success:hover {
  background-color: #f0fdf4;
  color: #198754;
  border-color: #198754;
}
</style>
