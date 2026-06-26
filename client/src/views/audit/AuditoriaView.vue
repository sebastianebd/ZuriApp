<template>
  <div class="audit-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi bi-shield-check fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Registro de Auditoría</h4>
          <p class="text-secondary small mb-0">
            Seguimiento detallado de cambios y acciones en el sistema ({{ logs.length }} logs
            mostrados)
          </p>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-light border fw-semibold shadow-sm px-3" @click="openExportModal">
          <i class="bi bi-cloud-download text-primary me-2"></i>Exportar
        </button>
        <button @click="limpiarFiltros" class="btn btn-light border fw-semibold shadow-sm px-3">
          <i class="bi bi-eraser me-2"></i>Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Main Card Container -->
    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="">
          <AuditFilter
            ref="filterComponent"
            :moduleOptions="moduleOptions"
            :actionOptions="actionOptions"
            @filter="handleFilter"
          />
        </div>

        <!-- Table Container -->
        <div class="table-container position-relative">
          <!-- Loading State -->
          <TableLoader v-if="loading" text="Cargando registros de auditoría..." />

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger border-0 shadow-sm rounded-3 py-3">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ error }}
          </div>

          <!-- Table and Pagination -->
          <div v-else>
            <AuditTable :logs="logs" @view-details="handleViewDetails" />

            <!-- Pagination (Reusable Component) -->
            <AppPagination
              :currentPage="currentPage"
              :totalPages="totalPages"
              @changePage="changePage"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <ExportFormatModal
      :visible="exportModalVisible"
      @close="closeExportModal"
      @select="handleExportFormat"
    />

    <!-- Modal Detalles (Raw JSON) -->
    <AuditDetailModal
      v-if="selectedLog"
      :log="selectedLog"
      @close="selectedLog = null"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuditStore } from '@/stores/audit.store'
import { useAudit } from '@/composables/audit/useAudit'
import AuditFilter from '@/components/audit/AuditFilter.vue'
import AuditTable from '@/components/audit/AuditTable.vue'
import AuditDetailModal from '@/components/audit/AuditDetailModal.vue'
import TableLoader from '@/components/common/TableLoader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import ExportFormatModal from '@/components/users/ExportFormatModal.vue'
import socket from '@/plugins/socket'
import { useExport } from '@/composables/useExport'
import type { AuditLog } from '@/types/audit.types'

const auditStore = useAuditStore()
const { logs, loading, error, currentPage, totalPages, currentFilters } = storeToRefs(auditStore)
const { moduleOptions, actionOptions } = useAudit()
const filterComponent = ref<InstanceType<typeof AuditFilter> | null>(null)
const selectedLog = ref<AuditLog | null>(null)

const { exportAuditToPDF, exportAuditToExcel } = useExport()
const exportModalVisible = ref(false)
const openExportModal = () => (exportModalVisible.value = true)
const closeExportModal = () => (exportModalVisible.value = false)

function handleViewDetails(log: AuditLog) {
  selectedLog.value = log
}

const handleExportFormat = async (format: 'pdf' | 'excel') => {
  const allLogs = await auditStore.getLogsForExport(currentFilters.value)
  if (format === 'pdf') {
    exportAuditToPDF(allLogs, currentFilters.value)
  } else {
    exportAuditToExcel(allLogs)
  }
  closeExportModal()
}

function handleFilter(filters: any) {
  auditStore.fetchLogs(1, 10, filters)
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    auditStore.fetchLogs(page, 10, currentFilters.value)
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
  auditStore.fetchLogs(1, 10)

  socket.on('audit:update', () => {
    auditStore.fetchLogs(currentPage.value, 10, currentFilters.value)
  })
})

onUnmounted(() => {
  socket.off('audit:update')
})
</script>

<style scoped>
.icon-square {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

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
