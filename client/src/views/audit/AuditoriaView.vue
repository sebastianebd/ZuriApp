<template>
  <div class="audit-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1 text-dark">
          <i class="bi bi-shield-check text-primary me-2"></i>Registro de Auditoría
        </h2>
        <p class="text-secondary mb-0">
          Seguimiento detallado de cambios y acciones en el sistema ({{ logs.length }} logs
          mostrados)
        </p>
      </div>
      <div class="d-flex gap-2">
        <button @click="limpiarFiltros" class="btn btn-light border fw-semibold shadow-sm px-3">
          <i class="bi bi-eraser me-2"></i>Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Main Card Container -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="">
          <AuditFilter ref="filterComponent" @filter="handleFilter" />
        </div>

        <!-- Table Container -->
        <div class="table-container position-relative">
          <!-- Loading State -->
          <div
            v-if="loading"
            class="loading-overlay d-flex flex-column align-items-center justify-content-center py-5"
          >
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-muted small">Actualizando registros de auditoría...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger border-0 shadow-sm rounded-3 py-3">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ error }}
          </div>

          <!-- Table and Pagination -->
          <div v-else>
            <AuditTable :logs="logs" />

            <!-- Pagination (Standardized with ReemplazosView) -->
            <div
              class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top"
              v-if="totalPages > 1"
            >
              <span class="text-muted small"
                >Mostrando página {{ currentPage }} de {{ totalPages }}</span
              >
              <nav aria-label="Page navigation">
                <ul class="pagination pagination-sm mb-0 gap-1">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button
                      class="page-link rounded-2 border-0 bg-light text-dark shadow-xs"
                      @click="changePage(currentPage - 1)"
                    >
                      <i class="bi bi-chevron-left small"></i>
                    </button>
                  </li>
                  <li
                    class="page-item"
                    v-for="page in totalPages"
                    :key="page"
                    :class="{ active: currentPage === page }"
                  >
                    <button
                      class="page-link rounded-2 border-0 mx-1 shadow-xs"
                      @click="changePage(page)"
                    >
                      {{ page }}
                    </button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button
                      class="page-link rounded-2 border-0 bg-light text-dark shadow-xs"
                      @click="changePage(currentPage + 1)"
                    >
                      <i class="bi bi-chevron-right small"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuditStore } from '@/stores/audit.store'
import AuditFilter from '@/components/audit/AuditFilter.vue'
import AuditTable from '@/components/audit/AuditTable.vue'

const auditStore = useAuditStore()
const { logs, loading, error, currentPage, totalPages, currentFilters } = storeToRefs(auditStore)
const filterComponent = ref<InstanceType<typeof AuditFilter> | null>(null)

function handleFilter(filters: any) {
  auditStore.fetchLogs(1, 14, filters)
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    auditStore.fetchLogs(page, 14, currentFilters.value)
  }
}

function limpiarFiltros() {
  if (filterComponent.value) {
    filterComponent.value.clear()
    handleFilter({
      startDate: '',
      endDate: '',
      module: 'TODOS',
      action: 'TODOS',
      userId: ''
    })
  }
}

onMounted(() => {
  auditStore.fetchLogs()
})
</script>

<style scoped>
.audit-view {
  background-color: #f8fafc;
  min-height: calc(100vh - 70px);
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.page-link {
  padding: 0.5rem 0.8rem;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
}

.page-item.active .page-link {
  background-color: #3b82f6 !important;
  color: white !important;
}

.page-link:hover:not(.active) {
  background-color: #e2e8f0 !important;
}
</style>
