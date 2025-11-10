<template>
  <div class="modal fade show d-block" tabindex="-1" role="dialog" v-if="visible">
    <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <!-- Header -->
        <div class="modal-header bg-primary text-white">
          <h5 class="fw-italic">SELECCIONAR USUARIO</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="$emit('cerrar')"
            aria-label="Close"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body bg-light">
          <div class="mb-3 d-flex justify-content-start gap-4">
            <!-- Filtro por RUT -->
            <div>
              <label for="">RUT: </label>
              <input
                type="text"
                v-model="filtroRutLocal"
                placeholder="Ingrese RUT"
                class="form-control form-control-sm border-primary shadow-sm filtro-input"
              />
            </div>

            <!-- Filtro por Nombre -->
            <div>
              <label for="">Nombre: </label>
              <input
                type="text"
                v-model="filtroNombreLocal"
                placeholder="Buscar por Nombre"
                class="form-control form-control-sm border-primary shadow-sm filtro-input"
              />
            </div>

            <!-- Filtro por Cargo (solo en paso 1) -->
            <div v-if="grupo===1">
              <label for="">Cargo:</label>
              <select
                v-model="filtroCargoLocal"
                class="form-select form-select-sm border-primary shadow-sm filtro-input" 
              >
                <option value="">Todos</option>
                <option
                  v-for="(Cargo, index) in props.listaDeCargos"
                  :key="index"
                  :value="Cargo"
                >
                  {{ Cargo }}
                </option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle shadow-sm rounded">
              <thead class="table-primary">
                <tr>
                  <th scope="col" class="small">RUT</th>
                  <th scope="col" class="small">Nombre</th>
                  <th scope="col" class="small">Apellido</th>
                  <th scope="col" class="small">Cargo</th>
                  <th scope="col" class="small">Dirección</th>
                  <th scope="col" class="small">Teléfono</th>
                  <th scope="col" class="small">Email</th>
                  <th scope="col" class="small">Ciudad</th>
                  <th scope="col" class="small">Habilitado</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(usuario, index) in paginatedUsuarios"
                  :key="index"
                  @click="handleClick(usuario)"
                  :class="{
                    'table-hover-row': true,
                    'selected-row': usuarioSeleccionado?.rut === usuario.rut
                  }"
                >
                  <td class="small">{{ usuario.rut }}</td>
                  <td class="small">{{ usuario.nombre }}</td>
                  <td class="small">{{ usuario.apellido }}</td>
                  <td class="small">{{ usuario.tipo_cargo }}</td>
                  <td class="small">{{ usuario.direccion }}</td>
                  <td class="small">{{ usuario.telefono }}</td>
                  <td class="small">{{ usuario.email }}</td>
                  <td class="small">{{ usuario.ciudad }}</td>
                  <td class="small">{{ usuario.habilitado ? 'Sí' : 'No' }}</td>
                </tr>

                <tr v-if="paginatedUsuarios.length === 0">
                  <td colspan="8" class="text-center text-muted py-3">
                    No se encontraron usuarios que coincidan con el filtro.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación Footer -->
          <div class="d-flex align-items-center justify-content-between mt-2">
            <!-- Botones de paginación (centrados) -->
            <div class="d-flex justify-content-center flex-grow-1" v-if="totalPages > 1">
              <button
                v-if="currentPage > 1"
                class="btn btn-outline-primary btn-sm mx-1"
                @click="changePage(currentPage - 1)"
              >
                ◀ Anterior
              </button>

              <span class="mx-2 small align-self-center">
                Página {{ currentPage }} de {{ totalPages }}
              </span>

              <button
                v-if="currentPage < totalPages"
                class="btn btn-outline-primary btn-sm mx-1"
                @click="changePage(currentPage + 1)"
              >
                Siguiente ▶
              </button>
            </div>

            <!-- Botón cerrar (a la derecha) -->
            <div class="ms-auto pt-3">
              <button type="button" class="btn btn-secondary px-4" @click="$emit('cerrar')">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { User } from '@/types/models'

const props = defineProps<{
  visible: boolean
  usuarios: User[]
  grupo: 1 | 2 // 👈 paso actual (1 = saliente, 2 = entrante)
  listaDeCargos: string[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'usuario-seleccionado', usuario: User): void
}>()

// --- Estado local de filtros
const filtroRutLocal = ref('')
const filtroNombreLocal = ref('')
const filtroCargoLocal = ref('') // 👈 nuevo

const usuarioSeleccionado = ref<User | null>(null)
let lastClickTime = 0

// --- Paginación
const currentPage = ref(1)
const itemsPerPage = 20

// Reiniciar página cuando cambia algún filtro o visibilidad
watch([filtroRutLocal, filtroNombreLocal, filtroCargoLocal, () => props.visible], () => {
  currentPage.value = 1
})

// --- Filtrar usuarios
const usuariosFiltrados = computed(() => {
  let lista = props.usuarios

  // Filtro RUT
  if (filtroRutLocal.value) {
    lista = lista.filter((u) => u.rut.toLowerCase().includes(filtroRutLocal.value.toLowerCase()))
  }

  // Filtro Nombre
  if (filtroNombreLocal.value) {
    lista = lista.filter((u) =>
      u.nombre.toLowerCase().includes(filtroNombreLocal.value.toLowerCase())
    )
  }

  if (filtroCargoLocal.value) {
  lista = lista.filter(
    (u) => u.tipo_cargo?.toLowerCase().includes(filtroCargoLocal.value.toLowerCase())
  )
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
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.table-hover-row:hover {
  background-color: #e3f2fd !important;
  transition: background-color 0.2s ease-in-out;
}

.selected-row {
  background-color: #bbdefb !important;
  font-weight: 500;
}

.table {
  border-radius: 8px;
  overflow: hidden;
}

thead th {
  font-weight: 600;
  text-transform: uppercase;
}

.modal-content {
  border-radius: 12px;
  overflow: hidden;
  animation: fadeInModal 0.25s ease;
}

@keyframes fadeInModal {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.table-responsive {
  min-height: 600px; /* altura que necesitas para 20 filas */
  max-height: 600px; /* evita que crezca más */
  overflow-y: auto; /* agrega scroll interno si hay más contenido */
}

.filtro-input {
  width: 220px;
}
</style>
