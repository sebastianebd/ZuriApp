<template>
  <main>
    <div class="row mb-3">
      <div class="col-auto">
        <button @click="openCreateModal" class="btn btn-primary btn-sm">
          <span class="text">Crear Reemplazo</span>
        </button>
      </div>
      <div class="col-auto">
        <button @click="replacementStore.limpiarFiltros()" class="btn btn-secondary btn-sm">
          Limpiar Filtros
        </button>
      </div>
    </div>

    <div class="card mt-2">
      <div class="card-body p-0">
        <h5 class="card-title m-b-0 p-3">
          Reemplazos Activos ({{ replacementStore.reemplazosFiltrados.length }} registros)
        </h5>
      </div>

      <div class="">
        <ReplacementFilter :lista-servicios="listaDeServicios" />

        <ReplacementTable
          :reemplazos="paginatedReplacements"
          @eliminar="handleDelete"
          @modificar="openUpdateModal"
        />

        <div class="d-flex justify-content-center align-items-center my-3" v-if="totalPages > 1">
          <button
            class="btn btn-outline-primary btn-sm mx-1"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            ◀ Anterior
          </button>

          <span class="mx-2">Página {{ currentPage }} de {{ totalPages }}</span>

          <button
            class="btn btn-outline-primary btn-sm mx-1"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            Siguiente ▶
          </button>
        </div>
      </div>

      <div
        v-if="!replacementStore.cargando && replacementStore.reemplazosFiltrados.length === 0"
        class="p-3 text-center text-muted"
      >
        No se encontraron reemplazos con los filtros actuales.
      </div>
      <div v-if="replacementStore.cargando" class="p-3 text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
    </div>

    <ReplacementModalCreate
      :visible="createModalVisible"
      :lista-de-turnos="listaDeTurnos"
      :lista-de-servicios="listaDeServicios"
      :registro="registroNuevo"
      @cerrar="closeCreateModal"
      @guardar="guardarNuevoReemplazo"
      @buscar-usuario="seleccionarGrupo"
    />

    <ReplacementModalUpdate
      :visible="updateModalVisible"
      :registro="registroActual"
      :lista-de-turnos="listaDeTurnos"
      :lista-de-servicios="listaDeServicios"
      @cerrar="closeUpdateModal"
      @guardar="handleUpdate"
      @buscar-usuario="seleccionarGrupo"
      @update:registro="(nuevoRegistro) => (registroActual = nuevoRegistro)"
    />

    <ReplacementModalUsers
      :visible="userModalVisible"
      :usuarios="usuarios"
      @cerrar="closeUserModal"
      @usuario-seleccionado="seleccionarUsuario"
    />
  </main>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { mostrarUsersCargoTens } from '@/services/user.service'
import { onMounted, ref, inject, computed } from 'vue'
import {
  ReplacementFilter,
  ReplacementTable,
  ReplacementModalUpdate,
  ReplacementModalUsers,
  ReplacementModalCreate
} from '@/components/replacements'
import type { User, RegisterDataReemplazo } from '@/types/models'

const showAlert = inject<(title: string, message: string) => void>('showAlert')

const currentPage = ref(1)
const itemsPerPage = 20

const totalPages = computed(() => {
  return Math.ceil(replacementStore.reemplazosFiltrados.length / itemsPerPage)
})

const paginatedReplacements = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return replacementStore.reemplazosFiltrados.slice(start, end)
})

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// --- STORES
const authStore = useAuthStore()
const optionStore = useOptionStore()
const replacementStore = useReplacementStore()
const apiPrivate = authStore.usePrivateApi()

// --- DATOS BASE
const listaDeTurnos = ref<string[]>([])
const listaDeServicios = ref<string[]>([])
const usuarios = ref<User[]>([])
const grupo = ref<1 | 2>(1) // 1: saliente, 2: entrante

// --- MODALES (estado)
const updateModalVisible = ref(false) // modal de edición
const createModalVisible = ref(false) // modal de creación
const userModalVisible = ref(false) // modal de usuarios

// --- ESTADOS DE REGISTROS
const registroActual = ref<Partial<RegisterDataReemplazo>>({})
const registroNuevo = ref<Partial<RegisterDataReemplazo>>({
  id_saliente: '',
  rut_saliente: '',
  nombre_saliente: '',
  apellido_saliente: '',
  id_entrante: '',
  rut_entrante: '',
  nombre_entrante: '',
  apellido_entrante: '',
  tipo_turno: '',
  // Usar new Date().toISOString().slice(0, 10) está bien para el valor inicial de Vue
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_termino: new Date().toISOString().slice(0, 10),
  servicio: ''
})

// --- MONTADO INICIAL
onMounted(async () => {
  if (!replacementStore.hayReemplazos) {
    await replacementStore.mostrarReemplazos()
  }

  const opciones = await optionStore.mostrarOpciones()
  listaDeTurnos.value = opciones.tiposTurno
  listaDeServicios.value = opciones.servicios

  const usuariosCargados = await mostrarUsersCargoTens(apiPrivate)
  usuarios.value = usuariosCargados as User[]
})

// --- CRUD: eliminar
const handleDelete = async (id: string) => {
  await replacementStore.eliminarReemplazo(id)
  showAlert?.('Eliminado', 'El registro se ha eliminado correctamente.')
}

// --- MODAL EDITAR
const openUpdateModal = (reemplazo: RegisterDataReemplazo) => {
  updateModalVisible.value = true
  // Se destructura el objeto para asegurar que solo se tomen las propiedades necesarias
  const { fecha_inicio, fecha_termino, ...resto } = reemplazo

  registroActual.value = {
    ...resto,
    // Asegurar el formato 'YYYY-MM-DD' para los inputs de tipo 'date'
    fecha_inicio: String(fecha_inicio).slice(0, 10),
    fecha_termino: String(fecha_termino).slice(0, 10)
  }
}
const closeUpdateModal = () => {
  updateModalVisible.value = false
  registroActual.value = {} // Limpiar el estado
}
const handleUpdate = async () => {
  if (registroActual.value._id) {
    // El 'registroActual' ya está actualizado por el evento 'update:registro' del modal
    await replacementStore.actualizarReemplazo(registroActual.value._id, registroActual.value)
  }
  closeUpdateModal()
  showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
}

// --- MODAL CREAR
const openCreateModal = () => {
  createModalVisible.value = true
  // Opcional: limpiar 'registroNuevo' si quieres asegurar que siempre inicie limpio al abrir.
  // Sin embargo, tu inicialización de registroNuevo ya es limpia.
}
const closeCreateModal = () => {
  createModalVisible.value = false
  // Opcional: restablecer 'registroNuevo' a su estado inicial.
}
const guardarNuevoReemplazo = async (nuevoReemplazo: RegisterDataReemplazo) => {
  await replacementStore.crearReemplazo(nuevoReemplazo)
  closeCreateModal()
  showAlert?.('Guardado', 'El registro se ha guardado correctamente.')
}

// --- MODAL USUARIOS
const closeUserModal = () => {
  userModalVisible.value = false
}

const seleccionarGrupo = (numeroGrupo: 1 | 2) => {
  grupo.value = numeroGrupo // Guardar qué campo se está llenando (saliente o entrante)
  userModalVisible.value = true
}

/**
 * @param registro
 * @param usuario
 * @param esSaliente
 */
const asignarDatosUsuario = (
  registro: typeof registroNuevo | typeof registroActual,
  usuario: User,
  esSaliente: boolean
) => {
  const prefijo = esSaliente ? 'saliente' : 'entrante'
  Object.assign(registro.value, {
    [`id_${prefijo}`]: usuario._id,
    [`rut_${prefijo}`]: usuario.rut,
    [`nombre_${prefijo}`]: usuario.nombre,
    [`apellido_${prefijo}`]: usuario.apellido
  })
}

const seleccionarUsuario = (usuario: User) => {
  let registroAfectado: typeof registroNuevo | typeof registroActual | null = null

  if (createModalVisible.value) {
    registroAfectado = registroNuevo
  } else if (updateModalVisible.value) {
    registroAfectado = registroActual
  }

  if (registroAfectado) {
    const esSaliente = grupo.value === 1
    asignarDatosUsuario(registroAfectado, usuario, esSaliente)
  }

  userModalVisible.value = false
}
</script>

<style>
.custom-small-button {
  padding: 0rem 0rem;
  font-size: 0rem;
}

.modal-header {
  margin-bottom: 0;
  padding-bottom: 0;
}
</style>
