<template>
  <div class="user-management-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-people-fill text-primary me-2"></i>Gestión de Usuarios
        </h4>
        <p class="text-secondary mb-0">
          Administra el personal y sus permisos ({{ usuariosFiltrados.length }} usuarios
          registrados)
        </p>
      </div>
      <button class="btn btn-primary fw-bold shadow-sm px-4" @click="openCreateModal">
        <i class="bi bi-person-plus-fill me-2"></i>Crear Usuario
      </button>
    </div>

    <!-- Main Content Card -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="">
          <UserFilter
            :lista-tipo-cargo="listaTipoCargo"
            :lista-habilitado="listaHabilitado"
            :filtro-rut="filtroRut"
            :filtro-nombre="filtroNombre"
            :tipo-cargo="tipoCargo"
            :filtro-habilitado="filtroHabilitado"
            @update:filtroRut="(v) => (filtroRut = v)"
            @update:filtroNombre="(v) => (filtroNombre = v)"
            @update:tipoCargo="(v) => (tipoCargo = v)"
            @update:filtroHabilitado="(v) => (filtroHabilitado = v)"
          />
        </div>

        <!-- User Table Section -->
        <div class="table-container">
          <div v-if="usuariosFiltrados.length === 0" class="empty-state text-center py-5">
            <div class="empty-icon-container mb-3 mx-auto">
              <i class="bi bi-people fs-1 text-muted opacity-50"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">No se encontraron usuarios</h5>
            <p class="text-muted">No hay registros que coincidan con los criterios de búsqueda</p>
          </div>

          <template v-else>
            <UserTable
              :usuarios="paginatedUsuarios"
              :login-user="userLoged"
              @editar="openUpdateModal"
              @eliminar="handleDelete"
              @detalle="openHistorialModal"
            />

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

    <!-- Modales -->
    <UserModalUpdate
      :visible="updateModalVisible"
      :usuario="usuarioActual"
      :lista-tipo-cargo="listaTipoCargo"
      :lista-habilitado="listaHabilitado"
      @cerrar="closeUpdateModal"
      @guardar="handleUpdate"
    />

    <UserModalCreate
      :visible="createModalVisible"
      :lista-tipo-cargo="listaTipoCargo"
      :lista-habilitado="listaHabilitado"
      :lista-servicios="listaServicios"
      @cerrar="closeCreateModal"
      @guardar="handleCreate"
    />

    <UserModalDetail
      :visible="historialModalVisible"
      :usuario="usuarioSeleccionado"
      :lista-servicios="listaServicios"
      :reemplazos="historialUsuario"
      @cerrar="closeHistorialModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useUserStore } from '@/stores/user.store'
import { useOptionStore } from '@/stores/option.store'
import {
  UserFilter,
  UserTable,
  UserModalUpdate,
  UserModalCreate,
  UserModalDetail
} from '@/components/users'
import type { User } from '@/types/models'
import { useAuthStore } from '@/stores/auth.store'
import { useReplacementStore } from '@/stores/replacement.store'

const showAlert = inject<(title: string, message: string) => void>('showAlert')

// --- STORES
const userStore = useUserStore()
const optionStore = useOptionStore()
const authStore = useAuthStore()
const replacementStore = useReplacementStore()

// --- REFS
const usuarios = ref<any[]>([])
const filtroRut = ref('')
const filtroNombre = ref('')
const tipoCargo = ref('')
const filtroHabilitado = ref('')
const listaTipoCargo = ref<string[]>([])
const listaHabilitado = ref<string[]>([])
const listaServicios = ref<string[]>([])
const updateModalVisible = ref(false)
const createModalVisible = ref(false)
const historialModalVisible = ref(false)
const usuarioSeleccionado = ref<any>(null)
const usuarioActual = ref<any>({})
const historialUsuario = ref<any[]>([])

// --- PAGINACIÓN
const currentPage = ref(1)
const itemsPerPage = 10

const totalPages = computed(() => {
  return Math.ceil(usuariosFiltrados.value.length / itemsPerPage)
})

const userLoged = computed(() => {
  return authStore.user
})

// --- Abrir modal de historial ---
async function openHistorialModal(usuario: any) {
  usuarioSeleccionado.value = usuario
  historialModalVisible.value = true
  try {
    historialUsuario.value = await replacementStore.mostrarHistorialUsuario(usuario._id)
  } catch (error) {
    console.error('Error cargando historial:', error)
    showAlert?.('Error', 'No se pudo cargar el historial del usuario.')
  }
}

function closeHistorialModal() {
  historialModalVisible.value = false
  usuarioSeleccionado.value = null
  historialUsuario.value = []
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// --- CARGA INICIAL
onMounted(async () => {
  usuarios.value = await userStore.mostrarTodos()
  const opciones = await optionStore.mostrarOpciones()
  listaTipoCargo.value = opciones.tipoCargo
  listaHabilitado.value = opciones.habilitado
  listaServicios.value = opciones.servicios
})

// --- FILTRO + ORDEN
const usuariosFiltrados = computed(() => {
  const filtrados = usuarios.value.filter((u) => {
    const coincideRut = !filtroRut.value || u.rut.startsWith(filtroRut.value)
    const coincideCargo = !tipoCargo.value || u.tipo_cargo === tipoCargo.value
    const coincideHabilitado = !filtroHabilitado.value || u.habilitado === filtroHabilitado.value
    const nombreCompleto = ((u.nombre || '') + ' ' + (u.apellido || '')).toLowerCase()
    const busquedaNombre = (filtroNombre.value || '').toLowerCase()
    const coincideNombre = !busquedaNombre || nombreCompleto.includes(busquedaNombre)
    return coincideRut && coincideCargo && coincideHabilitado && coincideNombre
  })
  return filtrados.sort((a, b) => {
    const nombreA = (a.nombre || '').toLowerCase()
    const nombreB = (b.nombre || '').toLowerCase()
    return nombreA.localeCompare(nombreB)
  })
})

const paginatedUsuarios = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return usuariosFiltrados.value.slice(start, end)
})

// --- MODALES
function openUpdateModal(usuario: User) {
  usuarioActual.value = { ...usuario }
  updateModalVisible.value = true
}

function closeUpdateModal() {
  updateModalVisible.value = false
  usuarioActual.value = {}
}

function openCreateModal() {
  createModalVisible.value = true
}

function closeCreateModal() {
  createModalVisible.value = false
}

// CRUD HANDLERS
async function handleUpdate(usuario: User) {
  await userStore.actualizarUsuario(usuario._id, usuario)
  usuarios.value = await userStore.mostrarTodos()
  closeUpdateModal()
  showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
}

async function handleDelete(id: string) {
  await userStore.eliminarUsuario(id)
  usuarios.value = usuarios.value.filter((u) => u._id !== id)
  showAlert?.('Eliminado', 'El usuario se ha eliminado correctamente.')
}

async function handleCreate(nuevoUsuario: User) {
  const usuarioCreado = await userStore.crearUsuario(nuevoUsuario)
  usuarios.value.push(usuarioCreado)
  closeCreateModal()
  showAlert?.('Guardado', 'El usuario se ha creado correctamente.')
}
</script>

<style scoped>
.user-management-view {
  background-color: #f8fafc;
}

.filter-section {
  background-color: #f1f5f9 !important;
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

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
</style>
