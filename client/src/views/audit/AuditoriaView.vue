<template>
  <div class="container-fluid pt-3">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1 text-dark">Registro de Auditoría</h2>
        <p class="text-secondary mb-0">Seguimiento detallado de cambios en el sistema</p>
      </div>
      <div>
        <!-- Espacio para botones globales si fuera necesario -->
      </div>
    </div>

    <!-- Filtros -->
    <AuditFilter @filter="handleFilter" />

    <!-- Tabla -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger shadow-sm rounded-4 border-0">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <div v-else>
      <AuditTable :logs="logs" />

      <!-- Paginación -->
      <div
        v-if="totalPages > 1"
        class="d-flex justify-content-center align-items-center gap-3 mt-3"
      >
        <button
          class="btn btn-sm btn-outline-primary"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          <i class="bi bi-chevron-left"></i> Anterior
        </button>

        <span class="text-secondary fw-semibold">
          Página {{ currentPage }} de {{ totalPages }}
        </span>

        <button
          class="btn btn-sm btn-outline-primary"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          Siguiente <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuditStore } from '@/stores/audit.store'
import AuditFilter from '@/components/audit/AuditFilter.vue'
import AuditTable from '@/components/audit/AuditTable.vue'

const auditStore = useAuditStore()
const { logs, loading, error, currentPage, totalPages, currentFilters } = storeToRefs(auditStore)

function handleFilter(filters: any) {
  auditStore.fetchLogs(1, 14, filters)
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    auditStore.fetchLogs(page, 14, currentFilters.value)
  }
}

onMounted(() => {
  auditStore.fetchLogs()
})
</script>
