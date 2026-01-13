<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        v-if="visible"
        style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px); z-index: 1070"
      >
        <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
          <div class="modal-content shadow-lg border-0 rounded-4">
            <!-- Header -->
            <div class="modal-header border-0 bg-primary bg-gradient text-white p-4 rounded-top-4">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-person-check-fill me-2"></i>SELECCIONAR FUNCIONARIO (PLANTA)
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
              <div class="mb-4 d-flex justify-content-start gap-4">
                <!-- Filtro por RUT -->
                <div class="filtro-group">
                  <label class="form-label text-secondary fw-semibold small mb-1">RUT</label>
                  <div
                    class="input-group input-group-sm rounded-3 overflow-hidden shadow-xs border"
                  >
                    <span class="input-group-text bg-light border-0"
                      ><i class="bi bi-search smaller text-primary"></i
                    ></span>
                    <input
                      type="text"
                      v-model="filtroRutLocal"
                      placeholder="Ingrese RUT"
                      class="form-control border-0 bg-white"
                    />
                  </div>
                </div>

                <!-- Filtro por Nombre -->
                <div class="filtro-group">
                  <label class="form-label text-secondary fw-semibold small mb-1">Nombre</label>
                  <div
                    class="input-group input-group-sm rounded-3 overflow-hidden shadow-xs border"
                  >
                    <span class="input-group-text bg-light border-0"
                      ><i class="bi bi-person smaller text-primary"></i
                    ></span>
                    <input
                      type="text"
                      v-model="filtroNombreLocal"
                      placeholder="Buscar por Nombre"
                      class="form-control border-0 bg-white"
                    />
                  </div>
                </div>

                <!-- Filtro por Cargo -->
                <div class="filtro-group">
                  <label class="form-label text-secondary fw-semibold small mb-1">Cargo</label>
                  <div class="input-group input-group-sm rounded-3 shadow-xs border bg-white">
                    <span class="input-group-text bg-light border-0"
                      ><i class="bi bi-briefcase smaller text-primary"></i
                    ></span>
                    <v-select
                      v-model="filtroCargoLocal"
                      :options="filteredCargoOptions"
                      placeholder="Todos los cargos"
                      class="custom-v-select flex-grow-1"
                      :clearable="false"
                      :searchable="false"
                    />
                  </div>
                </div>
              </div>

              <div class="table-responsive rounded-3 border shadow-xs">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-primary bg-gradient text-white">
                    <tr>
                      <th
                        scope="col"
                        class="py-2 px-3 tracking-wider x-small fw-bold text-uppercase"
                      >
                        RUT
                      </th>
                      <th
                        scope="col"
                        class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase"
                      >
                        Nombre
                      </th>
                      <th
                        scope="col"
                        class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase"
                      >
                        Cargo
                      </th>
                      <th
                        scope="col"
                        class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase"
                      >
                        Servicio
                      </th>
                      <th
                        scope="col"
                        class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase"
                      >
                        Contrato
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
                      v-for="(usuario, index) in paginatedUsuarios"
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
                        {{ usuario.nombre }} {{ usuario.apellido }}
                      </td>
                      <td class="px-2 py-2">
                        <span
                          class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill x-small fw-bold"
                        >
                          {{ usuario.tipo_cargo }}
                        </span>
                      </td>
                      <td class="px-2 py-2">
                        <span class="x-small text-secondary">{{ usuario.servicio || '-' }}</span>
                      </td>
                      <td class="px-2 py-2">
                        <span
                          class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 rounded-pill x-small"
                        >
                          {{ usuario.tipo_contrato || 'N/A' }}
                        </span>
                      </td>
                      <td class="px-3 py-2 text-center">
                        <span
                          class="badge px-2 py-1 rounded-pill x-small fw-bold shadow-xs"
                          :class="
                            usuario.habilitado
                              ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                              : 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                          "
                        >
                          {{ usuario.habilitado ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                    </tr>

                    <tr v-if="paginatedUsuarios.length === 0">
                      <td colspan="6" class="text-center text-muted py-5">
                        <i class="bi bi-search me-2"></i>No se encontraron funcionarios de PLANTA
                        que coincidan.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Paginación Footer -->
              <div class="d-flex align-items-center justify-content-between mt-4 p-3 rounded-3">
                <div class="text-secondary small fw-medium">
                  {{ usuariosFiltrados.length }} funcionarios encontrados
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
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { User } from '@/types/models'

const props = defineProps<{
  visible: boolean
  usuarios: User[]
  listaDeCargos: string[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'usuario-seleccionado', usuario: User): void
}>()

// --- Estado local de filtros
const filtroRutLocal = ref('')
const filtroNombreLocal = ref('')
const filtroCargoLocal = ref<string | null>(null)

const usuarioSeleccionado = ref<User | null>(null)
let lastClickTime = 0

// --- Paginación
const currentPage = ref(1)
const itemsPerPage = 20

// Reiniciar página cuando cambia algún filtro o visibilidad
watch([filtroRutLocal, filtroNombreLocal, filtroCargoLocal, () => props.visible], () => {
  currentPage.value = 1
})

// --- Computed for Options
const filteredCargoOptions = computed(() => {
  const filtered = props.listaDeCargos.filter(
    (cargo) => !['ADMIN-TI', 'RECURSOS HUMANOS'].includes(cargo)
  )
  return ['Todos', ...filtered]
})

// --- Filtrar usuarios (PLANTA ONLY)
const usuariosFiltrados = computed(() => {
  // 1. Filtrar Roles Admin
  let lista = props.usuarios.filter((u) => !['ADMIN-TI', 'RECURSOS HUMANOS'].includes(u.tipo_cargo))

  // 2. Filtrar SOLO PLANTA
  lista = lista.filter((u) => u.tipo_contrato === 'PLANTA')

  // Filtro RUT
  if (filtroRutLocal.value) {
    lista = lista.filter((u) => u.rut.toLowerCase().includes(filtroRutLocal.value.toLowerCase()))
  }

  // Filtro Nombre
  if (filtroNombreLocal.value) {
    const term = filtroNombreLocal.value.toLowerCase()
    lista = lista.filter((u) => {
      const fullName = `${u.nombre} ${u.apellido}`.toLowerCase()
      return fullName.includes(term)
    })
  }

  // Filtro Cargo
  if (filtroCargoLocal.value && filtroCargoLocal.value !== 'Todos') {
    const cargoBusqueda = String(filtroCargoLocal.value).toLowerCase()
    lista = lista.filter((u) => u.tipo_cargo?.toLowerCase().includes(cargoBusqueda))
  }

  // Ordenar alfabéticamente
  return lista.sort((a, b) => a.nombre.localeCompare(b.nombre))
})

// --- Paginación
const totalPages = computed(() => Math.ceil(usuariosFiltrados.value.length / itemsPerPage))
const paginatedUsuarios = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return usuariosFiltrados.value.slice(start, end)
})

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

// --- Click
function handleClick(usuario: User) {
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
  line-height: 27px;
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
