<template>
  <div class="reemplazos-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi" :class="viewMode === 'calendar' ? 'bi-calendar3 fs-4' : 'bi-arrow-repeat fs-4'"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Gestión de Reemplazos</h4>
          <p class="text-secondary small mb-0">
            <span v-if="viewMode === 'table'">
              Administra los reemplazos en el sistema ({{ replacementStore.reemplazosFiltrados.length }} registros)
            </span>
            <span v-else>
              Visualiza y gestiona la programación de turnos en calendario
            </span>
          </p>
        </div>
      </div>

      <div class="d-flex align-items-center gap-3">
        <!-- Switcher de Vistas: Tabla / Calendario (Deep Linking) -->
        <div class="btn-group p-1 bg-white border rounded-pill shadow-sm">
          <button
            type="button"
            class="btn btn-sm px-3 rounded-pill fw-semibold border-0"
            :class="viewMode === 'table' ? 'btn-primary text-white shadow-sm' : 'text-secondary bg-transparent'"
            @click="setViewMode('table')"
          >
            <i class="bi bi-table me-1"></i> Tabla
          </button>
          <button
            type="button"
            class="btn btn-sm px-3 rounded-pill fw-semibold border-0"
            :class="viewMode === 'calendar' ? 'btn-primary text-white shadow-sm' : 'text-secondary bg-transparent'"
            @click="setViewMode('calendar')"
          >
            <i class="bi bi-calendar3 me-1"></i> Calendario
          </button>
        </div>

        <div class="vr my-1 text-secondary opacity-25" v-if="viewMode === 'table'"></div>

        <button
          v-if="viewMode === 'table'"
          @click="replacementStore.limpiarFiltros()"
          class="btn btn-light border fw-semibold shadow-sm px-3"
        >
          <i class="bi bi-eraser me-2"></i>Limpiar Filtros
        </button>
        <router-link
          to="/app/operaciones/bolsa-reemplazos"
          class="btn btn-outline-primary fw-semibold shadow-sm px-3 d-flex align-items-center gap-2"
        >
          <i class="bi bi-megaphone"></i>
          <span>Bolsa de Reemplazos</span>
        </router-link>
        <button
          v-if="authStore.hasPermission('replacement.create')"
          @click="initCreateReplacement"
          class="btn btn-primary fw-bold shadow-sm px-4"
        >
          <i class="bi bi-plus-lg me-2"></i>Nuevo Reemplazo
        </button>
      </div>
    </div>

    <!-- VISTA TABLA -->
    <div v-if="viewMode === 'table'" class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="">
          <ReplacementFilter :lista-servicios="listaDeServicios" />
        </div>

        <!-- Table Section -->
        <div class="table-container position-relative">
          <TableLoader v-if="replacementStore.cargando" text="Actualizando registros..." />

          <div
            v-else-if="replacementStore.reemplazosFiltrados.length === 0"
            class="empty-state text-center py-5"
          >
            <div class="empty-icon-container mb-3 mx-auto">
              <i class="bi bi-search fs-1 text-muted opacity-50"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">No se encontraron resultados</h5>
            <p class="text-muted">Prueba ajustando los filtros de búsqueda</p>
          </div>

          <template v-else>
            <ReplacementTable
              :reemplazos="paginatedReplacements"
              @finalizar="handleFinalizar"
              @anular="handleAnular"
              @modificar="initUpdateReplacement"
              @exportar="exportReplacementToPDF"
            />

            <!-- Pagination -->
            <AppPagination
              :currentPage="currentPage"
              :totalPages="totalPages"
              @changePage="changePage"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- VISTA CALENDARIO (Montaje limpio con v-if para FullCalendar) -->
    <ReplacementCalendarTab v-else />

    <!-- MODAL CREAR -->
    <ReplacementModalCreate
      :visible="createModalVisible"
      :lista-de-turnos="listaDeTurnos"
      :lista-de-servicios="listaDeServicios"
      :registro="registroNuevo"
      :fechas-bloqueadas="fechasOcupadas"
      @cerrar="closeCreateModal"
      @guardar="guardarNuevoReemplazo"
    />

    <!-- MODAL EDITAR -->
    <ReplacementModalUpdate
      :visible="updateModalVisible"
      :registro="registroActual"
      :lista-de-turnos="listaDeTurnos"
      :lista-de-servicios="listaDeServicios"
      :fechas-bloqueadas="fechasOcupadas"
      @cerrar="closeUpdateModal"
      @guardar="handleUpdate"
      @sustituir-usuario="handleSustitucion"
      @update:registro="(nuevoRegistro) => (registroActual = nuevoRegistro)"
    />

    <!-- MODAL SUSTITUIR -->
    <ReplacementModalSubstitute
      :visible="substituteModalVisible"
      :registro-actual="registroActual"
      :fecha-corte-a="fechaCorteSustitucion"
      :nuevo-funcionario-b="nuevoEntranteSustitucion"
      @cerrar="closeSubstituteModal"
      @confirmar-sustitucion="confirmarSustitucion"
      @update:fecha-corte-a="(nuevaFecha) => (fechaCorteSustitucion = nuevaFecha)"
      @update:nuevo-funcionario-b="(val) => (nuevoEntranteSustitucion = val)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exportReplacementToPDF } from '@/utils/exportHelpers'
import { useReplacements } from '@/composables/active-replacements/useActiveReplacements'
import {
  ReplacementFilter,
  ReplacementTable,
  ReplacementModalUpdate,
  ReplacementModalCreate,
  ReplacementModalSubstitute,
  ReplacementCalendarTab
} from '@/components/replacements'
import TableLoader from '@/components/common/TableLoader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Sincronización reactiva con URL Query Parameter (?view=table|calendar)
const viewMode = computed(() => (route.query.view === 'calendar' ? 'calendar' : 'table'))

const setViewMode = (mode: 'table' | 'calendar') => {
  router.replace({
    query: {
      ...route.query,
      view: mode === 'table' ? undefined : mode
    }
  })
}

const {
  replacementStore,
  paginatedReplacements,
  currentPage,
  totalPages,
  changePage,

  // Data Lists
  listaDeTurnos,
  listaDeServicios,
  fechasOcupadas,

  // Modals Visibility & Data
  updateModalVisible,
  createModalVisible,
  substituteModalVisible,
  registroActual,
  registroNuevo,
  nuevoEntranteSustitucion,
  fechaCorteSustitucion,

  // Modal Actions
  closeUpdateModal,
  closeCreateModal,
  closeSubstituteModal,

  // Actions
  initCreateReplacement,
  initUpdateReplacement,
  guardarNuevoReemplazo,
  handleFinalizar,
  handleAnular,
  handleUpdate,
  handleSustitucion,
  confirmarSustitucion
} = useReplacements()
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

.reemplazos-view {
  background-color: #f8fafc;
  min-height: calc(100vh - 71px);
  display: flex;
  flex-direction: column;
}

.empty-state {
  min-height: 300px;
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

/* Modal hacks */
:deep(.modal-header) {
  margin-bottom: 0;
  padding-bottom: 0;
}
</style>
