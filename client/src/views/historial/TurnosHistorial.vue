<template>
  <div class="container-fluid py-4">
    <!-- Header with Info Alert -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">
        <i class="bi bi-calendar-x me-2 text-secondary"></i>
        Historial de Turnos
      </h2>
    </div>

    <div class="alert alert-info d-flex align-items-center mb-4">
      <i class="bi bi-info-circle fs-4 me-3"></i>
      <div>
        <strong>Modo Solo Lectura</strong>
        <p class="mb-0">
          Visualiza turnos de meses anteriores. No es posible modificar turnos históricos.
        </p>
      </div>
    </div>

    <!-- Shifts Grid Component -->
    <ShiftsView :readonly="true" :historyMode="true" />
  </div>
</template>

<script setup lang="ts">
import ShiftsView from '@/views/shifts/ShiftsView.vue'
</script>

<style scoped>
.alert-info {
  background-color: #e7f3ff;
  border-color: #b3d9ff;
  color: #004085;
}
</style>
