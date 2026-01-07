<template>
  <div class="historial-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-clock-history text-primary me-2"></i>Historial de Reemplazos
        </h4>
        <p class="text-secondary mb-0">
          Consulta el registro histórico de movimientos ({{ totalRegistros }} registros encontrados)
        </p>
      </div>
      <div class="d-flex gap-2">
        <button
          @click="handleExport"
          class="btn btn-light border fw-semibold shadow-sm px-3"
          :disabled="exportLoading"
        >
          <i v-if="exportLoading" class="spinner-border spinner-border-sm me-2"></i>
          <i v-else class="bi bi-file-earmark-pdf text-danger me-2"></i>Exportar PDF
        </button>
        <button @click="limpiarFiltros" class="btn btn-light border fw-semibold shadow-sm px-3">
          <i class="bi bi-eraser me-2"></i>Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="">
          <HistoryFilter
            v-model="filtros"
            :lista-servicios="listaDeServicios"
            @update:model-value="handleFiltroCambiado"
          />
        </div>

        <!-- History Table Section -->
        <div class="table-container position-relative">
          <TableLoader v-if="cargando" text="Cargando historial..." />

          <div v-else-if="reemplazosHistorico.length === 0" class="empty-state text-center py-5">
            <div class="empty-icon-container mb-3 mx-auto">
              <i class="bi bi-journal-x fs-1 text-muted opacity-50"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">Sin registros históricos</h5>
            <p class="text-muted">No se encontraron movimientos con los filtros aplicados</p>
          </div>

          <template v-else>
            <div class="table-responsive rounded-3 border overflow-hidden">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-primary bg-gradient text-white">
                  <tr>
                    <th scope="col" class="py-2 px-4 x-small fw-bold text-uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
                      Funcionario Saliente
                    </th>
                    <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
                      Reemplazante (Entrante)
                    </th>
                    <th
                      scope="col"
                      class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider text-center"
                    >
                      Turno
                    </th>
                    <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
                      Período
                    </th>
                    <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
                      Servicio
                    </th>
                    <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
                      Creado por
                    </th>
                    <th
                      scope="col"
                      class="py-2 px-4 x-small fw-bold text-uppercase tracking-wider text-center"
                    >
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(reemplazo, index) in reemplazosHistorico"
                    :key="index"
                    class="border-bottom hover-row"
                  >
                    <td class="px-4 py-2">
                      <span class="badge bg-light text-dark fw-bold border x-small">{{
                        reemplazo.id_negocio
                      }}</span>
                    </td>
                    <td class="px-3 py-2">
                      <div class="d-flex align-items-center">
                        <div
                          class="avatar-placeholder me-2 rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fw-bold x-small border border-primary border-opacity-10"
                          style="width: 28px; height: 28px"
                        >
                          {{
                            getInitials(
                              reemplazo.nombre_saliente + ' ' + reemplazo.apellido_saliente
                            )
                          }}
                        </div>
                        <div class="d-flex flex-column">
                          <span class="fw-bold text-dark x-small"
                            >{{ reemplazo.nombre_saliente }} {{ reemplazo.apellido_saliente }}</span
                          >
                          <span class="text-muted x-small"
                            ><i class="bi bi-person-badge me-1"></i
                            >{{ reemplazo.rut_saliente }}</span
                          >
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <div class="d-flex align-items-center">
                        <div
                          class="avatar-placeholder me-2 rounded-3 bg-success bg-opacity-10 d-flex align-items-center justify-content-center text-success fw-bold x-small border border-success border-opacity-10"
                          style="width: 28px; height: 28px"
                        >
                          {{
                            getInitials(
                              reemplazo.nombre_entrante + ' ' + reemplazo.apellido_entrante
                            )
                          }}
                        </div>
                        <div class="d-flex flex-column">
                          <span class="fw-bold text-dark x-small"
                            >{{ reemplazo.nombre_entrante }} {{ reemplazo.apellido_entrante }}</span
                          >
                          <span class="text-muted x-small"
                            ><i class="bi bi-person-badge me-1"></i
                            >{{ reemplazo.rut_entrante }}</span
                          >
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2 text-center">
                      <span class="x-small text-secondary">{{ reemplazo.tipo_turno }}</span>
                    </td>
                    <td class="px-3 py-2">
                      <div class="d-flex flex-column x-small text-secondary">
                        <span
                          ><i class="bi bi-arrow-right-short text-success me-1"></i
                          >{{ formatearFecha(reemplazo.fecha_inicio) }}</span
                        >
                        <span
                          ><i class="bi bi-arrow-left-short text-danger me-1"></i
                          >{{ formatearFecha(reemplazo.fecha_termino) }}</span
                        >
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <span
                        class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1 rounded-pill x-small"
                      >
                        {{ reemplazo.servicio }}
                      </span>
                    </td>
                    <td class="px-3 py-2">
                      <span class="x-small text-muted fw-medium">{{
                        getCreatorName(reemplazo)
                      }}</span>
                    </td>
                    <td class="px-4 py-2 text-center">
                      <span
                        class="badge px-3 py-1 rounded-pill x-small fw-bold"
                        :class="[
                          reemplazo.status === 'FINALIZADO'
                            ? 'bg-secondary'
                            : reemplazo.status === 'ANULADO'
                            ? 'bg-danger'
                            : 'bg-info'
                        ]"
                      >
                        {{ reemplazo.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
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
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHistory } from '@/composables/replacement/useHistory'
import { useExport } from '@/composables/useExport'
import { useAuthStore } from '@/stores/auth.store'
import { obtenerInactivosPaginados } from '@/services/replacement.service'
import { ref } from 'vue'
import HistoryFilter from '@/components/historial/HistorialFilter.vue'
import TableLoader from '@/components/common/TableLoader.vue'

const {
  // Data & State
  reemplazosHistorico,
  listaDeServicios,
  cargando,

  // Filters
  filtros,
  handleFiltroCambiado,
  limpiarFiltros,

  // Pagination
  currentPage,
  totalPages,
  totalRegistros,
  changePage,

  // Helpers
  formatearFecha,
  getCreatorName,
  getInitials
} = useHistory()

const { exportHistoryToPDF } = useExport()
const authStore = useAuthStore()
const api = authStore.usePrivateApi()

const exportLoading = ref(false)

const handleExport = async () => {
  exportLoading.value = true
  try {
    // 5000 limit to simulate "fetch all" for report
    const { registros } = await obtenerInactivosPaginados(api, filtros.value, 1, 5000)
    exportHistoryToPDF(registros, filtros.value)
  } catch (error) {
    console.error('Error exporting PDF:', error)
  } finally {
    exportLoading.value = false
  }
}
</script>

<style scoped>
.historial-view {
  background-color: #f8fafc;
}

.filter-section {
  background-color: #f1f5f9 !important;
}

.empty-state {
  min-height: 400px;
}

.empty-icon-container {
  width: 80px;
  height: 80px;
  background-color: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hover-row:hover {
  background-color: #f8fafc !important;
}

.smaller {
  font-size: 0.75rem;
}

.x-small {
  font-size: 0.71rem;
}

.avatar-placeholder {
  flex-shrink: 0;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.pagination .page-link {
  color: #475569;
  font-weight: 500;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination .active .page-link {
  background-color: #3b82f6 !important;
  color: white !important;
}

.pagination .page-item.disabled .page-link {
  opacity: 0.5;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

th {
  border: none !important;
}

.table td,
.table th {
  border-color: #f1f5f9;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
</style>
