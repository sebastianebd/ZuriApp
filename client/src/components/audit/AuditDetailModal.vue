<template>
  <div
    class="modal fade show d-block"
    style="background: rgba(0, 0, 0, 0.5); z-index: 1050"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
      role="document"
    >
      <div class="modal-content border-0 rounded-4 shadow-lg">
        <div class="modal-header border-bottom-0 ps-4 pt-4">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
              <i class="bi bi-braces fs-4"></i>
            </div>
            <div>
              <h5 class="modal-title fw-bold text-dark mb-0">Detalle Técnico</h5>
              <small class="text-muted">ID Auditoría: {{ log._id }}</small>
            </div>
          </div>
          <button
            type="button"
            class="btn-close me-2 mt-2"
            aria-label="Close"
            @click="emit('close')"
          ></button>
        </div>
        <div class="modal-body p-4">
          <div class="bg-dark rounded-3 overflow-hidden shadow-inner">
            <div
              class="d-flex align-items-center justify-content-between px-3 py-2 bg-black bg-opacity-25 border-bottom border-secondary border-opacity-25"
            >
              <small class="text-light font-monospace opacity-75">Payload JSON</small>
              <div class="d-flex align-items-center gap-2">
                <span
                  v-if="copied"
                  class="badge bg-secondary bg-opacity-25 text-success border border-success border-opacity-25 px-2 py-1 rounded-2 d-flex align-items-center gap-1"
                  style="font-size: 0.72rem"
                >
                  Copiado! <i class="bi bi-check-lg text-success"></i>
                </span>
                <button
                  v-else
                  class="btn btn-sm btn-link text-decoration-none text-light p-0 opacity-50 hover-opacity-100"
                  title="Copiar JSON"
                  @click="copyJson"
                >
                  <i class="bi bi-clipboard"></i>
                </button>
              </div>
            </div>
            <pre
              class="m-0 p-3 text-light font-monospace custom-scrollbar"
              style="max-height: 400px; overflow: auto; font-size: 0.8rem"
              >{{ JSON.stringify(log, null, 2) }}</pre
            >
          </div>
        </div>
        <div class="modal-footer border-top-0 pe-4 pb-4">
          <button
            type="button"
            class="btn btn-light border px-4 rounded-3 fw-medium"
            @click="emit('close')"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AuditLog } from '@/types/audit.types'

const props = defineProps<{
  log: AuditLog
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const copied = ref(false)

async function copyJson() {
  if (!props.log) return
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.log, null, 2))
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (e) {
    console.error('Failed to copy JSON', e)
  }
}
</script>

<style scoped>
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #475569;
  border-radius: 20px;
}
</style>
