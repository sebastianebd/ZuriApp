<template>
  <div class="container-fluid px-4 py-4">
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
      <nav v-if="totalPages > 1" class="d-flex justify-content-center mt-4">
        <ul class="pagination shadow-sm">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button
              class="page-link border-0 rounded-start-pill px-3"
              @click="changePage(currentPage - 1)"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
          </li>
          <li class="page-item disabled">
            <span class="page-link border-0 bg-white text-secondary fw-semibold">
              Página {{ currentPage }} de {{ totalPages }}
            </span>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button
              class="page-link border-0 rounded-end-pill px-3"
              @click="changePage(currentPage + 1)"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
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
  auditStore.fetchLogs(1, 20, filters)
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    auditStore.fetchLogs(page, 20, currentFilters.value)
  }
}

onMounted(() => {
  auditStore.fetchLogs()
})
</script>
