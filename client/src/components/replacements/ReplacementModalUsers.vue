<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      v-if="visible"
      style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
        <div class="modal-content shadow-lg border-0 rounded-4">
          <!-- Header -->
          <div class="modal-header border-0 bg-primary bg-gradient text-white p-4 rounded-top-4">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-person-check-fill me-2"></i>SELECCIONAR USUARIO
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="$emit('cerrar')"
              aria-label="Close"
            ></button>
          </div>

          <!-- Body -->
          <div class="modal-body p-4 bg-white">
            <!-- 🏢 ENTERPRISE: Unified search field -->
            <div class="mb-4">
              <label class="form-label text-secondary fw-semibold mb-2">
                <i class="bi bi-search me-2"></i>Buscar Usuario
              </label>
              <div class="input-group input-group-lg rounded-3 overflow-hidden shadow-sm border">
                <span class="input-group-text bg-light border-0">
                  <i class="bi bi-search text-primary"></i>
                </span>
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Busca por RUT o Nombre (mínimo 2 caracteres)..."
                  class="form-control border-0 bg-white"
                  autofocus
                />
                <span v-if="isLoading" class="input-group-text bg-light border-0">
                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Buscando...</span>
                  </div>
                </span>
              </div>
              <small class="text-muted d-block mt-2">
                <i class="bi bi-info-circle me-1"></i>
                {{ totalItems }} resultado(s) encontrado(s)
              </small>
            </div>

            <div class="table-responsive rounded-3 border shadow-xs">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-primary bg-gradient text-white">
                  <tr>
                    <th scope="col" class="py-2 px-3 tracking-wider x-small fw-bold text-uppercase">
                      RUT
                    </th>
                    <th scope="col" class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase">
                      Nombre
                    </th>
                    <th scope="col" class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase">
                      Cargo
                    </th>
                    <th scope="col" class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase">
                      Dirección
                    </th>
                    <th scope="col" class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase">
                      Teléfono
                    </th>
                    <th scope="col" class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase">
                      Email
                    </th>
                    <th
                      scope="col"
                      class="py-2 px-3 tracking-wider x-small fw-bold text-uppercase text-center"
                    >
                      Habilitado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="(usuario, index) in usuariosFiltrados"
                    :key="index"
                    @click="handleClick(usuario)"
                    class="cursor-pointer border-bottom hover-row"
                    :class="{
                      'table-active fw-bold': usuarioSeleccionado?.rut === usuario.rut
                    }"
                  >
                    <td class="px-3 py-2">
                      <span class="fw-bold text-dark x-small">{{ usuario.rut }}</span>
                    </td>
                    <td class="px-2 py-2 text-dark x-small">
                      {{ usuario.firstName }} {{ usuario.lastName }}
                    </td>
                    <td class="px-2 py-2">
                      <span
                        class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill x-small fw-bold"
                      >
                        {{ usuario.positionId?.name || usuario.roleId?.name || '-' }}
                      </span>
                    </td>
                    <td class="px-2 py-2">
                      <span class="x-small text-secondary">{{ usuario.address || '-' }}</span>
                    </td>
                    <td class="px-2 py-2">
                      <span class="x-small text-secondary">
                        <i class="bi bi-telephone me-1"></i>{{ usuario.phone }}
                      </span>
                    </td>
                    <td class="px-2 py-2">
                      <span
                        class="x-small text-secondary text-truncate d-inline-block"
                        style="max-width: 140px"
                      >
                        <i class="bi bi-envelope me-1"></i>{{ usuario.email }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-center">
                      <span
                        class="badge px-2 py-1 rounded-pill x-small fw-bold shadow-xs"
                        :class="
                          usuario.isActive
                            ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                            : 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                        "
                      >
                        {{ usuario.isActive ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                  </tr>

                  <tr v-if="usuariosFiltrados.length === 0">
                    <td colspan="7" class="text-center text-muted py-5">
                      <i class="bi bi-search me-2"></i>
                      <span v-if="!searchQuery"
                        >Ingresa un término de búsqueda para ver resultados</span
                      >
                      <span v-else-if="isLoading">Buscando...</span>
                      <span v-else
                        >No se encontraron usuarios que coincidan con "{{ searchQuery }}"</span
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación Footer -->
            <div class="d-flex align-items-center justify-content-between mt-4 p-3 rounded-3">
              <div class="text-secondary small fw-medium">
                {{ usuariosFiltrados.length }} usuarios encontrados
              </div>

              <!-- Botones de paginación -->
              <div class="d-flex align-items-center gap-3" v-if="totalPages > 1">
                <button
                  class="btn btn-white btn-sm border shadow-xs px-3 fw-bold"
                  :disabled="currentPage === 1"
                  @click="changePage(currentPage - 1)"
                >
                  <i class="bi bi-chevron-left me-1"></i>Anterior
                </button>

                <div class="small fw-bold text-dark">
                  Página {{ currentPage }} <span class="text-secondary fw-normal">de</span>
                  {{ totalPages }}
                </div>

                <button
                  class="btn btn-white btn-sm border shadow-xs px-3 fw-bold"
                  :disabled="currentPage === totalPages"
                  @click="changePage(currentPage + 1)"
                >
                  Siguiente<i class="bi bi-chevron-right ms-1"></i>
                </button>
              </div>

              <!-- Botón cerrar -->
              <div>
                <button
                  type="button"
                  class="btn btn-secondary px-4 fw-bold shadow-sm"
                  @click="$emit('cerrar')"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStaffStore } from '@/stores/staff.store'
import { type IStaff } from '@/types/staff.types'

// 🏢 ENTERPRISE: Self-contained modal with server-side search
const props = defineProps<{
  visible: boolean
  grupo: 1 | 2 // 👈 paso actual (1 = saliente, 2 = entrante)
  listaDeCargos: string[]
  cargoFiltro?: string // For grupo=2, filter by cargo
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'usuario-seleccionado', usuario: IStaff): void
}>()

const staffStore = useStaffStore()

// --- Estado local
const searchQuery = ref('')
const filtroCargoLocal = ref<string | null>(null)
const usuarioSeleccionado = ref<IStaff | null>(null)
let lastClickTime = 0
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// --- Computed from store
const usuarios = computed(() => staffStore.searchResults)
const isLoading = computed(() => staffStore.isSearching)
const currentPage = computed(() => staffStore.searchPagination.currentPage)
const totalPages = computed(() => staffStore.searchPagination.totalPages)
const totalItems = computed(() => staffStore.searchPagination.totalItems)

// 🏢 ENTERPRISE: Debounced server-side search (300ms)
const performSearch = async (query: string, page: number = 1) => {
  if (!query || query.trim().length < 2) {
    staffStore.searchResults = []
    return
  }

  try {
    await staffStore.searchStaff({
      search: query.trim(),
      page,
      limit: 20
    })
  } catch (error) {
    console.error('[ReplacementModalUsers] Search error:', error)
  }
}

// Watch search query with debounce
watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (!newQuery || newQuery.trim().length < 2) {
    staffStore.searchResults = []
    return
  }

  searchTimeout = setTimeout(() => {
    performSearch(newQuery, 1)
  }, 300)
})

// Reset search when modal closes
watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      searchQuery.value = ''
      staffStore.searchResults = []
      usuarioSeleccionado.value = null
    }
  }
)

// --- Filtrar usuarios (client-side only AFTER search)
const usuariosFiltrados = computed(() => {
  let lista = usuarios.value.filter((u) => !['ADMIN-TI', 'RECURSOS HUMANOS'].includes((u.positionId?.name || u.roleId?.name || '').toUpperCase()))

  // Apply cargo filter if needed (for grupo=2)
  if (props.grupo === 2 && props.cargoFiltro) {
    lista = lista.filter((u) => (u.positionId?.name || u.roleId?.name) === props.cargoFiltro)
  }

  // Apply local cargo filter
  if (filtroCargoLocal.value && filtroCargoLocal.value !== 'Todos') {
    const cargoBusqueda = String(filtroCargoLocal.value).toLowerCase()
    lista = lista.filter((u) => (u.positionId?.name || u.roleId?.name || '').toLowerCase().includes(cargoBusqueda))
  }

  return lista
})

// Pagination is server-side now
function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value && searchQuery.value) {
    performSearch(searchQuery.value, page)
  }
}

// --- Click
function handleClick(usuario: IStaff) {
  const now = Date.now()
  const doubleClick = now - lastClickTime < 300

  if (doubleClick && usuarioSeleccionado.value?.rut === usuario.rut) {
    emit('usuario-seleccionado', usuario)
  } else {
    usuarioSeleccionado.value = usuario
  }

  lastClickTime = now
}
</script>

<style scoped>
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.cursor-pointer {
  cursor: pointer;
}

.hover-row:hover {
  background-color: #f8fafc !important;
}

.table-active {
  background-color: rgba(37, 99, 235, 0.05) !important;
}

.smaller {
  font-size: 0.75rem;
}

.x-small {
  font-size: 0.7rem;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Custom v-select */
.custom-v-select :deep(.vs__dropdown-toggle) {
  background: white;
  border: none;
  border-radius: 0;
  padding: 0;
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.8125rem;
  color: #1e293b;
  font-weight: 500;
  margin: 0;
  padding: 0 0.5rem;
  line-height: 27px; /* Align with input-group height */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.custom-v-select :deep(.vs__actions) {
  padding: 0 4px;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.7);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: none;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 8px;
  font-size: 0.8125rem;
  z-index: 1050;
  overflow: hidden;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.375rem;
  padding: 6px 12px;
  margin-bottom: 2px;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

.custom-v-select :deep(.vs__search) {
  margin: 0;
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
}

.filtro-group {
  width: 220px;
}

.table-responsive {
  max-height: 500px;
  overflow-y: auto;
}

.btn-white {
  background-color: white;
  color: #64748b;
}

.btn-white:hover:not(:disabled) {
  background-color: #f8fafc;
  color: #3b82f6;
  border-color: #3b82f6 !important;
}

button {
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

th {
  border: none !important;
}

.table td {
  border-color: #f1f5f9;
}
</style>
