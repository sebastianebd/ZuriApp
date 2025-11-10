<template>
  <main>
    <div class="">
      <button class="btn btn-primary btn-sm" @click="openCreateModal">Crear Usuario</button>
    </div>
    <div class="card mt-2">
      <div class="card-body p-0">
        <h5 class="card-title pt-3 ps-3">Usuarios ({{ usuariosFiltrados.length }})</h5>
      </div>

      <UserFilter
        :lista-tipo-cargo="listaTipoCargo"
        :filtro-rut="filtroRut"
        :tipo-cargo="tipoCargo"
        @update:filtroRut="(v) => (filtroRut = v)"
        @update:tipoCargo="(v) => (tipoCargo = v)"
      />

      <!-- Tabla con usuarios paginados y ordenados -->
      <UserTable
        :usuarios="paginatedUsuarios"
        :login-user="userLoged"
        @editar="openUpdateModal"
        @eliminar="handleDelete"
        @detalle="openHistorialModal"
      />

      <!-- Paginación -->
      <div class="d-flex justify-content-center align-items-center my-3" v-if="totalPages > 1">
        <button
          v-if="currentPage > 1"
          class="btn btn-outline-primary btn-sm mx-1"
          @click="changePage(currentPage - 1)"
        >
          ◀ Anterior
        </button>

        <span class="mx-2">Página {{ currentPage }} de {{ totalPages }}</span>

        <button
          v-if="currentPage < totalPages"
          class="btn btn-outline-primary btn-sm mx-1"
          @click="changePage(currentPage + 1)"
        >
          Siguiente ▶
        </button>
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
      :reemplazos="historialUsuario"
      @cerrar="closeHistorialModal"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useUserStore } from '@/stores/user.store'
import { useOptionStore } from '@/stores/option.store'
import { UserFilter, UserTable, UserModalUpdate, UserModalCreate, UserModalDetail } from '@/components/users'
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
const tipoCargo = ref('')
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
const itemsPerPage = 20

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
    // Llamas al store para traer los reemplazos del usuario
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
    return coincideRut && coincideCargo
  })

  // Ordenar alfabéticamente por nombre (A → Z)
  return filtrados.sort((a, b) => {
    const nombreA = (a.nombre || '').toLowerCase()
    const nombreB = (b.nombre || '').toLowerCase()
    return nombreA.localeCompare(nombreB)
  })
})

// --- PAGINAR USUARIOS
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
