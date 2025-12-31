<template>
  <div class="table-loader d-flex flex-column align-items-center justify-content-center">
    <div class="spinner-border text-primary mb-3" role="status">
      <span class="visually-hidden">Cargando...</span>
    </div>
    <p class="text-muted">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  text: {
    type: String,
    default: 'Cargando registros...'
  }
})
</script>

<style scoped>
.table-loader {
  min-height: 400px;
  width: 100%;
  background-color: transparent;
}
</style>
