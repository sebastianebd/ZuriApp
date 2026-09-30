<template>
  <div class="reemplazos-view p-4">
    <!-- Header Vanguardista (Clinical Double-Bezel & Island CTAs) -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 header-container">
      <div class="d-flex align-items-center gap-3">
        <!-- Clinical Squircle Icon -->
        <div class="header-icon-box shadow-sm">
          <i class="bi fs-4 text-primary bi-arrow-left-right"></i>
        </div>
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <h4 class="fw-bold mb-0 text-dark header-title">Gestión de Reemplazos</h4>
            <span class="live-counter-badge">
              {{ replacementStore.reemplazosFiltrados.length }} registros
            </span>
          </div>
          <p class="text-secondary small mb-0 mt-1">
            Administra, audita y fiscaliza los reemplazos y coberturas en el sistema.
          </p>
        </div>
      </div>

      <!-- Action Islands -->
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <!-- Botón Mapa de Cobertura (Modal Cronograma & Solapamientos) -->
        <button
          type="button"
          class="btn btn-outline-primary rounded-pill d-flex align-items-center gap-2 px-3 fw-semibold shadow-xs coverage-btn"
          @click="coverageModalVisible = true"
        >
          <i class="bi bi-calendar3-range"></i>
          <span>Mapa de Cobertura</span>
        </button>

        <div class="vr my-1 text-secondary opacity-25 d-none d-md-block"></div>

        <!-- Botón Nuevo Reemplazo -->
        <button
          v-if="authStore.hasPermission('replacement.create')"
          @click="initCreateReplacement"
          class="btn btn-primary-pill d-flex align-items-center gap-2"
        >
          <span class="btn-icon-wrap primary"><i class="bi bi-plus-lg"></i></span>
          <span>Nuevo Reemplazo</span>
        </button>
      </div>
    </div>

    <!-- VISTA TABLA PRINCIPAL -->
    <div class="vanguard-card shadow-sm border-0">
      <div class="vanguard-card-body p-4">
        <!-- Filter Section -->
        <ReplacementFilter :lista-servicios="listaDeServicios" />

        <!-- Table Section -->
        <div class="table-container position-relative mt-2">
          <TableLoader v-if="replacementStore.cargando" text="Actualizando registros..." />

          <div
            v-else-if="replacementStore.reemplazosFiltrados.length === 0"
            class="empty-state-container text-center py-5"
          >
            <div class="empty-icon-capsule mb-3 mx-auto">
              <i class="bi bi-search fs-2 text-secondary opacity-75"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">No se encontraron resultados</h5>
            <p class="text-secondary small mb-3">Prueba ajustando o limpiando los filtros de búsqueda</p>
            <button
              type="button"
              class="btn btn-sm btn-light border rounded-pill px-3 shadow-sm fw-semibold"
              @click="replacementStore.limpiarFiltros()"
            >
              <i class="bi bi-arrow-counterclockwise me-1"></i> Restablecer filtros
            </button>
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
            <div class="mt-4 pt-3 border-top">
              <AppPagination
                :currentPage="currentPage"
                :totalPages="totalPages"
                @changePage="changePage"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- MODAL DE COBERTURA Y SOLAPAMIENTOS -->
    <ReplacementCoverageModal
      :visible="coverageModalVisible"
      @cerrar="coverageModalVisible = false"
    />

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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exportReplacementToPDF } from '@/utils/exportHelpers'
import { useReplacements } from '@/composables/active-replacements/useActiveReplacements'
import {
  ReplacementFilter,
  ReplacementTable,
  ReplacementModalUpdate,
  ReplacementModalCreate,
  ReplacementModalSubstitute,
  ReplacementCoverageModal
} from '@/components/replacements'
import TableLoader from '@/components/common/TableLoader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Estado del Modal de Cobertura
const coverageModalVisible = ref(false)

// Compatibilidad retroactiva: si venía con ?view=calendar, abrir el modal y limpiar el query
onMounted(() => {
  if (route.query.view === 'calendar') {
    coverageModalVisible.value = true
    router.replace({
      query: {
        ...route.query,
        view: undefined
      }
    })
  }
})

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
/* ==========================================================================
   VANGUARD CLINICAL DESIGN SYSTEM - GESTIÓN DE REEMPLAZOS
   ========================================================================== */

.reemplazos-view {
  background-color: #f8fafc;
  min-height: calc(100vh - 71px);
  display: flex;
  flex-direction: column;
}

/* --- Header & Eyebrow --- */
.header-container {
  padding-bottom: 0.25rem;
}

.header-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(191, 219, 254, 0.6);
}

.live-counter-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: #475569;
  background-color: #f1f5f9;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  font-variant-numeric: tabular-nums;
}

.header-title {
  letter-spacing: -0.02em;
}

/* --- Switcher & Island Actions --- */
.view-mode-switcher {
  border-color: #e2e8f0 !important;
}

.switcher-pill {
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-primary-pill {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  padding: 0.45rem 1.25rem 0.45rem 0.65rem;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-primary-pill:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  color: white;
}

.btn-primary-pill:active {
  transform: scale(0.98);
}

.btn-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.btn-icon-wrap.primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* --- Vanguard Card Container --- */
.vanguard-card {
  background: white;
  border: 1px solid #e2e8f0 !important;
  border-radius: 20px;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 4px 8px -2px rgba(15, 23, 42, 0.02) !important;
}

/* --- Empty State --- */
.empty-state-container {
  padding: 3.5rem 1rem;
}

.empty-icon-capsule {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
}

/* Modal hacks */
:deep(.modal-header) {
  margin-bottom: 0;
  padding-bottom: 0;
}
</style>
