<template>
  <div class="historial-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1 text-dark">
          <i class="bi bi-clock-history text-primary me-2"></i>Historial de Reemplazos
        </h2>
        <p class="text-secondary mb-0">
          Consulta el registro histórico de movimientos ({{ totalRegistros }} registros encontrados)
        </p>
      </div>
      <button @click="limpiarFiltros" class="btn btn-light border fw-semibold shadow-sm px-3">
        <i class="bi bi-eraser me-2"></i>Limpiar Filtros
      </button>
    </div>

    <!-- Main Content Card -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
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
          <div
            v-if="cargando"
            class="loading-overlay d-flex flex-column align-items-center justify-content-center py-5"
          >
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-muted">Cargando historial...</p>
          </div>

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
                    <th scope="col" class="py-3 px-4 smaller fw-bold text-uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">
                      Funcionario Saliente
                    </th>
                    <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">
                      Reemplazante (Entrante)
                    </th>
                    <th
                      scope="col"
                      class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider text-center"
                    >
                      Turno
                    </th>
                    <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">
                      Período
                    </th>
                    <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">
                      Servicio
                    </th>
                    <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">
                      Creado por
                    </th>
                    <th
                      scope="col"
                      class="py-3 px-4 smaller fw-bold text-uppercase tracking-wider text-center"
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
                    <td class="px-4 py-3">
                      <span class="badge bg-light text-dark fw-bold border">{{
                        reemplazo.id_negocio
                      }}</span>
                    </td>
                    <td class="px-3">
                      <div class="d-flex flex-column">
                        <span class="fw-bold text-dark"
                          >{{ reemplazo.nombre_saliente }} {{ reemplazo.apellido_saliente }}</span
                        >
                        <span class="text-muted smaller"
                          ><i class="bi bi-person-badge me-1"></i>{{ reemplazo.rut_saliente }}</span
                        >
                      </div>
                    </td>
                    <td class="px-3">
                      <div class="d-flex flex-column">
                        <span class="fw-bold text-dark"
                          >{{ reemplazo.nombre_entrante }} {{ reemplazo.apellido_entrante }}</span
                        >
                        <span class="text-muted smaller"
                          ><i class="bi bi-person-badge me-1"></i>{{ reemplazo.rut_entrante }}</span
                        >
                      </div>
                    </td>
                    <td class="px-3 text-center">
                      <span class="small text-secondary">{{ reemplazo.tipo_turno }}</span>
                    </td>
                    <td class="px-3">
                      <div class="d-flex flex-column smaller text-secondary">
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
                    <td class="px-3">
                      <span
                        class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1 rounded-pill smaller"
                      >
                        {{ reemplazo.servicio }}
                      </span>
                    </td>
                    <td class="px-3">
                      <span class="smaller text-muted fw-medium">{{
                        getCreatorName(reemplazo)
                      }}</span>
                    </td>
                    <td class="px-4 text-center">
                      <span
                        class="badge px-3 py-2 rounded-pill smaller fw-bold"
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
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import type { RegisterDataReemplazo, User } from '@/types/models'
import HistoryFilter from '@/components/historial/HistorialFilter.vue'
import { useOptionStore } from '@/stores/option.store'
import { obtenerInactivosPaginados } from '@/services/replacement.service'

// --- ESTADO Y STORES ---
const authStore = useAuthStore()
const useApi = authStore.usePrivateApi()
const optionStore = useOptionStore()

// --- ESTADO DE PAGINACIÓN Y DATOS ---
const reemplazosHistorico = ref<RegisterDataReemplazo[]>([])
const listaDeServicios = ref<string[]>([])
const cargando = ref(true)

// --- ESTADO DE FILTROS ---
const filtros = ref({
  rutSaliente: '',
  rutEntrante: '',
  fechaInicio: '',
  fechaFin: '',
  servicio: ''
})

// --- ESTADO DE PAGINACIÓN ---
const currentPage = ref(1)
const totalPages = ref(1)
const totalRegistros = ref(0)
const itemsPerPage = 10

async function cargarHistorial() {
  cargando.value = true
  try {
    const resultado = await obtenerInactivosPaginados(
      useApi,
      filtros.value,
      currentPage.value,
      itemsPerPage
    )
    reemplazosHistorico.value = resultado.registros
    totalPages.value = resultado.totalPages
    totalRegistros.value = resultado.totalRegistros
  } catch (error) {
    console.error('Error al cargar historial paginado:', error)
    reemplazosHistorico.value = []
    totalRegistros.value = 0
    totalPages.value = 1
  } finally {
    cargando.value = false
  }
}

const handleFiltroCambiado = () => {
  currentPage.value = 1
  cargarHistorial()
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    cargarHistorial()
  }
}

const limpiarFiltros = () => {
  filtros.value = {
    rutSaliente: '',
    rutEntrante: '',
    fechaInicio: '',
    fechaFin: '',
    servicio: ''
  }
  currentPage.value = 1
  cargarHistorial()
}

const formatearFecha = (fecha: string) => {
  if (!fecha) return ''
  return new Date(fecha).toISOString().split('T')[0].split('-').reverse().join('-')
}

const getCreatorName = (reemplazo: RegisterDataReemplazo): string => {
  const creator = reemplazo.creado_por
  if (typeof creator !== 'string' && creator && 'nombre' in creator && 'apellido' in creator) {
    const user = creator as User
    return `${user.nombre} ${user.apellido}`
  }
  return String(creator) || 'Usuario no asignado'
}

onMounted(async () => {
  try {
    const opciones = await optionStore.mostrarOpciones()
    listaDeServicios.value = opciones.servicios
    await cargarHistorial()
  } catch (error) {
    console.error('Error en el montaje:', error)
  }
})
</script>

<style scoped>
.historial-view {
  background-color: #f8fafc;
  min-height: 100vh;
}

.filter-section {
  background-color: #f1f5f9 !important;
}

.loading-overlay {
  min-height: 400px;
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
</style>
