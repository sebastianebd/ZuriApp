<template>
  <main>
    <div class="tabla-reemplazos-container mt-2">
      <div class="pt-3 pb-2 d-flex justify-content-between align-items-center">
        <h5 class="card-title m-b-0 text-secondary">
          Historial Reemplazos ({{ totalRegistros }} Registros)
        </h5>
        <button
          @click="limpiarFiltros"
          class="btn btn-outline-secondary btn-sm fw-semibold shadow-sm"
        >
          Limpiar Filtros
        </button>
      </div>

      <div class="pb-3">
        <HistoryFilter
          v-model="filtros"
          :lista-servicios="listaDeServicios"
          @update:model-value="handleFiltroCambiado"
        />
      </div>

      <div class="table-responsive overflow-hidden">
        <table class="table table-hover align-middle tabla-reemplazos">
          <thead class="table-primary text-white">
            <tr>
              <th scope="col" class="small">Código</th>
              <th scope="col" class="small">Rut Saliente</th>
              <th scope="col" class="small">Nombre Saliente</th>
              <th scope="col" class="small">Rut Entrante</th>
              <th scope="col" class="small">Nombre Entrante</th>
              <th scope="col" class="small">Tipo de Turno</th>
              <th scope="col" class="small">Fecha Inicio</th>
              <th scope="col" class="small">Fecha Termino</th>
              <th scope="col" class="small">Servicio</th>
              <th scope="col" class="small">Creado por</th>
              <th scope="col" class="small">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(reemplazo, index) in reemplazosHistorico"
              :key="index"
              class="border-bottom align-middle hover-row"
            >
              <td class="small text-secondary">{{ reemplazo.id_negocio }}</td>
              <td class="small text-secondary bg-warning-light">{{ reemplazo.rut_saliente }}</td>
              <td class="small text-secondary fw-semibold bg-warning-light">
                {{ reemplazo.nombre_saliente }}&nbsp;&nbsp;&nbsp;{{ reemplazo.apellido_saliente }}
              </td>
              <td class="small text-secondary bg-success-light">{{ reemplazo.rut_entrante }}</td>
              <td class="small text-secondary fw-semibold bg-success-light">
                {{ reemplazo.nombre_entrante }}&nbsp;&nbsp;&nbsp;{{ reemplazo.apellido_entrante }}
              </td>

              <td class="small text-secondary">{{ reemplazo.tipo_turno }}</td>
              <td class="small text-secondary">{{ formatearFecha(reemplazo.fecha_inicio) }}</td>
              <td class="small text-secondary">{{ formatearFecha(reemplazo.fecha_termino) }}</td>
              <td class="small text-secondary">{{ reemplazo.servicio }}</td>
              <td class="small text-secondary">{{ getCreatorName(reemplazo) }}</td>
              <td class="small fw-semibold">
                <span
                  :class="[
                    'badge rounded-pill',
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

      <div class="d-flex justify-content-center align-items-center my-3" v-if="totalPages > 1">
        <button
          v-if="currentPage > 1"
          class="btn btn-outline-primary btn-sm mx-1"
          @click="changePage(currentPage - 1)"
        >
          ◀ Anterior
        </button>

        <span class="mx-2 text-secondary">Página {{ currentPage }} de {{ totalPages }}</span>

        <button
          v-if="currentPage < totalPages"
          class="btn btn-outline-primary btn-sm mx-1"
          @click="changePage(currentPage + 1)"
        >
          Siguiente ▶
        </button>
      </div>
      
      <div v-if="!cargando && reemplazosHistorico.length === 0" class="p-3 text-center text-muted">
        No se encontraron reemplazos con los filtros actuales.
      </div>
      
      <div v-if="cargando" class="p-3 text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue' // Ya no se necesita 'computed'
import { useAuthStore } from '../../stores/auth.store'
import type { RegisterDataReemplazo, User } from '@/types/models'
import HistoryFilter from '@/components/historial/HistorialFilter.vue' // Importación corregida
import { useOptionStore } from '@/stores/option.store'
// 💡 Importar la función de servicio que creamos para Server-Side Pagination
import { obtenerInactivosPaginados } from '@/services/replacement.service' 

// --- ESTADO Y STORES ---
const authStore = useAuthStore()
const useApi = authStore.usePrivateApi()
const optionStore = useOptionStore()

// --- ESTADO DE PAGINACIÓN Y DATOS ---
const reemplazosHistorico = ref<RegisterDataReemplazo[]>([]) // Almacena SOLO la data de la página actual
const listaDeServicios = ref<string[]>([])
const cargando = ref(true)

// --- ESTADO DE FILTROS (se vincula con HistoryFilter.vue) ---
const filtros = ref({
  rutSaliente: '', // Ahora incluimos todos los filtros del componente
  rutEntrante: '',
  fechaInicio: '',
  fechaFin: '',
  servicio: '',
  // Eliminamos 'status' ya que está fijo en el backend
})

// --- ESTADO DE PAGINACIÓN (Viene del backend) ---
const currentPage = ref(1)
const totalPages = ref(1)
const totalRegistros = ref(0) // Usado para el contador
const itemsPerPage = 10 // Constante de límite de registros por página

// -----------------------------------------------------
// 💡 LÓGICA CLAVE: LA FUNCIÓN QUE HACE LA LLAMADA AL BACKEND
// -----------------------------------------------------
async function cargarHistorial() {
  cargando.value = true
  try {
    const resultado = await obtenerInactivosPaginados(
      useApi,
      filtros.value,
      currentPage.value,
      itemsPerPage
    )

    // Actualiza el estado con la respuesta del servidor
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

// -----------------------------------------------------
// 💡 HANDLERS (Simplemente llaman a cargarHistorial)
// -----------------------------------------------------

// Handler para recibir los cambios del componente HistoryFilter (v-model)
const handleFiltroCambiado = () => {
  // 1. Los filtros.value ya fueron actualizados por el v-model.
  // 2. Reiniciar la página a 1 al aplicar un nuevo filtro.
  currentPage.value = 1
  // 3. Ejecutar la nueva búsqueda en el backend.
  cargarHistorial()
}

// Handler para el cambio de página (botón Anterior/Siguiente)
const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // Ejecutar la nueva búsqueda en el backend.
    cargarHistorial()
  }
}

const limpiarFiltros = () => {
  // Resetear todos los filtros a su estado inicial
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

// --- FUNCIONES AUXILIARES (Sin cambios) ---
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

// --- MONTAJE ---
onMounted(async () => {
  try {
    const opciones = await optionStore.mostrarOpciones()
    listaDeServicios.value = opciones.servicios
    // Carga inicial de la primera página
    await cargarHistorial() 
  } catch (error) {
    console.error('Error en el montaje:', error)
  }
})
</script>

<style scoped>
/* ... (Estilos omitidos por brevedad) ... */
</style>

<style scoped>
/* 🌙 Contenedor general */
.tabla-reemplazos-container {
  border-radius: 0.75rem;
}

/* 🧭 Encabezado */
.table-primary {
  background: linear-gradient(90deg, #0d6efd, #3d8bfd);
  border-bottom: 2px solid #bcd0ff;
}

.table th {
  font-weight: 600;
  vertical-align: middle;
  letter-spacing: 0.3px;
}

/* 🦓 Estilo para filas pares/impares y la tabla principal */
.tabla-reemplazos tbody tr:nth-child(odd) {
  background-color: #ffffff;
}
.tabla-reemplazos tbody tr:nth-child(even) {
  background-color: #f6f8fa;
}

/* ✨ Hover */
.hover-row:hover {
  background-color: #e9f3ff !important;
  transition: background-color 0.25s ease;
}

/* 🔘 Celdas y bordes */
.table td {
  vertical-align: middle;
  border-color: #dee2e6;
  padding: 0.5rem;
  color: #495057;
}

/* 🌈 Colores de fondo */
.bg-warning-light {
  background-color: #fff7e0 !important;
}
.bg-success-light {
  background-color: #e3f7ea !important;
}

/* Nota: No necesitas bg-created-light ni action-cell aquí, a menos que tu historial también los use. */

/* Estilos de tabla final (bordes redondeados y separación) */
.table {
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 0.75rem;
  overflow: hidden;
}

/* Asegura que la sombra pequeña de Bootstrap se vea igual */
.shadow-sm {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
}
</style>
