<template>
  <div class="card border border-dashed shadow-xs h-100 empty-coverage-card">
    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center p-5">
      <div class="empty-icon-wrapper bg-light text-muted mb-3">
        <i class="bi bi-sliders fs-2 text-secondary"></i>
      </div>
      <h5 class="fw-bold mb-2 text-dark">Dotación Mínima No Configurada</h5>
      <p class="text-secondary small mb-4" style="max-width: 420px;">
        Este servicio clínico aún no cuenta con puestos mínimos definidos por turno (día y noche). Configure las metas para visualizar el semáforo y las alertas de déficit.
      </p>
      <button
        v-if="canEditStaffing"
        class="btn btn-primary rounded-pill px-4 shadow-xs d-flex align-items-center gap-2 fw-semibold"
        data-test="btn-configure-staffing-empty"
        @click="$emit('openStaffingModal')"
      >
        <i class="bi bi-gear-fill"></i>
        <span>Configurar Dotación Mínima</span>
      </button>
      <span v-else class="badge bg-light text-muted border px-3 py-2 rounded-pill">
        <i class="bi bi-lock me-1"></i> Solo lectura (Consulte a la supervisora del servicio)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canEditStaffing?: boolean
}>()

defineEmits(['openStaffingModal'])
</script>

<style scoped>
.empty-coverage-card {
  border-radius: 0.875rem;
  background-color: #ffffff;
  border-color: #cbd5e1 !important;
}
.empty-icon-wrapper {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.shadow-xs {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
</style>
