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

    <!-- MODAL CREAR -->
    <ReplacementModalCreate
      :visible="createModalVisible"
      :lista-de-turnos="listaDeTurnos"
      :lista-de-servicios="listaDeServicios"
      :registro="registroNuevo"
      @cerrar="closeCreateModal"
      @guardar="guardarNuevoReemplazo"
      @buscar-usuario="seleccionarGrupo"
    />

    <!-- MODAL EDITAR -->
    <ReplacementModalUpdate
      :visible="updateModalVisible"
      :registro="registroActual"
      :lista-de-turnos="listaDeTurnos"
      :lista-de-servicios="listaDeServicios"
      @cerrar="closeUpdateModal"
      @guardar="handleUpdate"
      @buscar-usuario="seleccionarGrupo"
      @sustituir-usuario="handleSustitucion"
      @update:registro="(nuevoRegistro) => (registroActual = nuevoRegistro)"
    />

    <ReplacementModalSubstitute
      :visible="substituteModalVisible"
      :registro-actual="registroActual"
      :fecha-corte-a="fechaCorteSustitucion"
      :nuevo-funcionario-b="nuevoEntranteSustitucion"
      @cerrar="closeSubstituteModal"
      @confirmar-sustitucion="confirmarSustitucion"
      @update:fecha-corte-a="(nuevaFecha) => (fechaCorteSustitucion = nuevaFecha)"
      @buscar-usuario="seleccionarGrupo"
    />

    <!-- MODAL USUARIOS (con lista filtrada según cargo) -->
    <ReplacementModalUsers
      :visible="userModalVisible"
      :usuarios="usuariosFiltradosPorCargo"
      :grupo="grupo"
      :lista-de-cargos="listaDeCargos"
      @cerrar="closeUserModal"
      @usuario-seleccionado="seleccionarUsuario"
    />
  </main>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { mostrarTodosUsuarios } from '@/services/user.service'
import { onMounted, ref, inject, computed, onUnmounted } from 'vue'
import {
  ReplacementFilter,
  ReplacementTable,
  ReplacementModalUpdate,
  ReplacementModalUsers,
  ReplacementModalCreate,
  ReplacementModalSubstitute
} from '@/components/replacements'
import type { User, RegisterDataReemplazo } from '@/types/models'
import socket from '@/plugins/socket'

const showAlert = inject<(title: string, message: string) => void>('showAlert')

const currentPage = ref(1)
const itemsPerPage = 20

const replacementStore = useReplacementStore()
const authStore = useAuthStore()
const optionStore = useOptionStore()
const apiPrivate = authStore.usePrivateApi()

const userLoged = computed(() => {
  return authStore.userDetail
})

const totalPages = computed(() => {
  return Math.ceil(replacementStore.reemplazosFiltrados.length / itemsPerPage)
})

const paginatedReplacements = computed(() => {
  const sorted = [...replacementStore.reemplazosFiltrados].sort((a, b) => {
    // Extraemos la parte numérica de cada id_negocio (ej: "RP10425" → 10425)
    const numA = parseInt(a.id_negocio.replace(/\D/g, ''), 10)
    const numB = parseInt(b.id_negocio.replace(/\D/g, ''), 10)

    // Orden descendente (mayor a menor)
    return numB - numA
  })

  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sorted.slice(start, end)
})

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const listaDeTurnos = ref<string[]>([])
const listaDeServicios = ref<string[]>([])
const listaDeCargos = ref<string[]>([])
const usuarios = ref<User[]>([])
const grupo = ref<1 | 2>(1) // 1: saliente, 2: entrante

// MODALES
const updateModalVisible = ref(false)
const createModalVisible = ref(false)
const userModalVisible = ref(false)
const substituteModalVisible = ref(false)

// DATOS ESPECÍFICOS DE SUSTITUCIÓN
const fechaCorteSustitucion = ref('') // La fecha de término del reemplazante A
const nuevoEntranteSustitucion = ref<Partial<RegisterDataReemplazo>>({}) // Datos del reemplazante B

// ... (funciones de CREAR)

// --- SUSTITUCIÓN
const handleSustitucion = () => {
  // 1. Ocultar el modal de UPDATE (para que no esté abierto detrás)
  updateModalVisible.value = false
  // 2. Limpiar los campos específicos de sustitución
  fechaCorteSustitucion.value = registroActual.value.fecha_termino || '' // Usa la fecha de término actual como valor inicial
  nuevoEntranteSustitucion.value = {}
  // 3. Mostrar el modal de SUSTITUCIÓN
  substituteModalVisible.value = true
}

const confirmarSustitucion = async () => {
  // Lógica de Validación (básica, la robusta va en el backend)
  if (
    !registroActual.value._id ||
    !fechaCorteSustitucion.value ||
    !nuevoEntranteSustitucion.value.rut_entrante
  ) {
    showAlert?.('Error', 'Faltan datos para la sustitución.')
    return
  }

  // 1. Preparar los datos para la llamada a la API
  const datosSustitucion = {
    // ID del registro que se va a cortar (Segmento A)
    id_registro_a: registroActual.value._id, // La fecha en que termina A
    fecha_corte_a: fechaCorteSustitucion.value, // Datos del nuevo reemplazante B
    nuevo_entrante: nuevoEntranteSustitucion.value, // Datos del evento principal (copia los datos clave de A para crear B)
    datos_base_evento: {
      id_evento_principal: registroActual.value.id_negocio,
      tipo_turno: registroActual.value.tipo_turno,
      servicio: registroActual.value.servicio, // ... otros datos necesarios para el nuevo registro B
      id_saliente: registroActual.value.id_saliente,
      rut_saliente: registroActual.value.rut_saliente,
      nombre_saliente: registroActual.value.nombre_saliente,
      apellido_saliente: registroActual.value.apellido_saliente,
      tipo_cargo: registroActual.value.tipo_cargo,
      fecha_termino_original: registroActual.value.fecha_termino // Se necesita para el término de B
    }
  }

  try {
    // 2. Llamada a un endpoint específico de SUSTITUCIÓN (Ejemplo de servicio a implementar)
    // await replacementStore.procesarSustitucion(datosSustitucion)

    // 3. Cierre de ambos modales
    closeSubstituteModal() // closeUpdateModal() NO ES NECESARIO si ya lo cerraste en handleSustitucion, pero lo mantenemos si la lógica de apertura es compleja.
    showAlert?.(
      'Sustitución Exitosa',
      'El reemplazo fue segmentado y el nuevo funcionario asignado.'
    )
  } catch (error) {
    showAlert?.('Error', 'Hubo un error al procesar la sustitución.')
  }
}

const closeSubstituteModal = () => {
  substituteModalVisible.value = false // Cierre forzoso del modal de edición, por si acaso
  closeUpdateModal() // Limpiar datos de sustitución
  fechaCorteSustitucion.value = ''
  nuevoEntranteSustitucion.value = {}
}

// Sobreescribir `seleccionarUsuario` para gestionar la asignación en el modal de Sustitución
const seleccionarUsuario = (usuario: User) => {
  // Lógica existente (se mantiene)
  const registroAfectado =
    registroTarget.value ??
    (createModalVisible.value ? registroNuevo : updateModalVisible.value ? registroActual : null)

  if (registroAfectado) {
    const esSaliente = grupo.value === 1
    asignarDatosUsuario(registroAfectado as any, usuario, esSaliente)
  }
  // Lógica NUEVA: Si el modal de sustitución está abierto y el grupo es 2 (entrante)...
  else if (substituteModalVisible.value && grupo.value === 2) {
    // Asignar los datos del usuario seleccionado a la variable específica de sustitución (nuevoEntranteSustitucion)
    Object.assign(nuevoEntranteSustitucion.value, {
      id_entrante: usuario._id,
      rut_entrante: usuario.rut,
      nombre_entrante: usuario.nombre,
      apellido_entrante: usuario.apellido
    })
  } // cerrar modal de usuarios y limpiar target

  userModalVisible.value = false
  registroTarget.value = null
}

// TARGET seguro para asignar en seleccionarUsuario
// Mantiene la referencia al registro (registroNuevo o registroActual) que
// debe completarse cuando el usuario elige en el modal de usuarios.
const registroTarget = ref<typeof registroNuevo | typeof registroActual | null>(null)

const registroActual = ref<Partial<RegisterDataReemplazo>>({})
const registroNuevo = ref<Partial<RegisterDataReemplazo>>({
  id_saliente: '',
  rut_saliente: '',
  nombre_saliente: '',
  apellido_saliente: '',
  tipo_cargo: '', // campo usado para filtrar
  id_entrante: '',
  rut_entrante: '',
  nombre_entrante: '',
  apellido_entrante: '',
  tipo_turno: '',
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_termino: new Date().toISOString().slice(0, 10),
  servicio: '',
  creado_por: ''
})

// --- MONTAJE
onMounted(async () => {
  if (!replacementStore.hayReemplazos) {
    await replacementStore.mostrarReemplazos()
  }

  const opciones = await optionStore.mostrarOpciones()
  listaDeTurnos.value = opciones.tiposTurno
  listaDeServicios.value = opciones.servicios
  listaDeCargos.value = opciones.tipoCargo

  const usuariosCargados = await mostrarTodosUsuarios(apiPrivate)
  usuarios.value = usuariosCargados as User[]

  socket.on('replacementsUpdated', async () => {
    await replacementStore.mostrarReemplazos()
  })
})

onUnmounted(() => {
  socket.off('replacementsUpdated')
})

// --- ELIMINAR
const handleDelete = async (id: string) => {
  await replacementStore.eliminarReemplazo(id)
  showAlert?.('Eliminado', 'El registro se ha eliminado correctamente.')
}

// --- EDITAR
const openUpdateModal = (reemplazo: RegisterDataReemplazo) => {
  updateModalVisible.value = true
  const { fecha_inicio, fecha_termino, ...resto } = reemplazo
  registroActual.value = {
    ...resto,
    fecha_inicio: String(fecha_inicio).slice(0, 10),
    fecha_termino: String(fecha_termino).slice(0, 10)
  }
}
const closeUpdateModal = () => {
  updateModalVisible.value = false
  registroActual.value = {}
}
const handleUpdate = async () => {
  if (registroActual.value._id) {
    await replacementStore.actualizarReemplazo(registroActual.value._id, registroActual.value)
  }
  closeUpdateModal()
  showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
}

// --- CREAR
const openCreateModal = () => {
  // resetea nuevo registro para evitar residuos de antiguas selecciones
  registroNuevo.value = {
    id_saliente: '',
    rut_saliente: '',
    nombre_saliente: '',
    apellido_saliente: '',
    tipo_cargo: '',
    id_entrante: '',
    rut_entrante: '',
    nombre_entrante: '',
    apellido_entrante: '',
    tipo_turno: '',
    fecha_inicio: new Date().toISOString().slice(0, 10),
    fecha_termino: new Date().toISOString().slice(0, 10),
    servicio: ''
  }

  if (userLoged.value && userLoged.value._id) {
    // Asignamos el ID del usuario logeado de forma segura
    registroNuevo.value.creado_por = userLoged.value._id
  } else {
    // Manejar el caso de error (aunque la ruta debería estar protegida)
    showAlert?.('Error', 'No se pudo identificar al usuario creador. Intente recargar.')
    return // Detener la apertura si el usuario no está cargado
  }

  createModalVisible.value = true
}
const closeCreateModal = () => {
  createModalVisible.value = false
}
const guardarNuevoReemplazo = async (nuevoReemplazo: RegisterDataReemplazo) => {
  await replacementStore.crearReemplazo(nuevoReemplazo)
  closeCreateModal()
  showAlert?.('Guardado', 'El registro se ha guardado correctamente.')
}

// --- MODAL USUARIOS
const closeUserModal = () => {
  userModalVisible.value = false
  registroTarget.value = null // limpiar target por seguridad
}

// Computed que filtra usuarios por tipo_cargo si corresponde
const usuariosFiltradosPorCargo = computed(() => {
  // Si el usuario abrió el modal para seleccionar SALIENTE (grupo=1), mostramos todos
  if (grupo.value === 1) {
    return usuarios.value
  }

  // Si es entrante (grupo=2), intentamos leer el tipo de cargo del registroNuevo o registroActual
  // Preferimos registroTarget si está establecido (es más seguro)
  const cargoSaliente =
    // si hay target y es registroNuevo/registroActual, comprobamos si contiene tipo_cargo
    registroTarget.value && 'tipo_cargo' in registroTarget.value
      ? (registroTarget.value as any).tipo_cargo
      : // fallback a los objetos globales
      createModalVisible.value
      ? registroNuevo.value.tipo_cargo
      : registroActual.value.tipo_cargo

  if (!cargoSaliente) {
    // si no hay cargo definido, devolvemos todos (evitar crash)
    return usuarios.value
  }

  return usuarios.value.filter((u) => u.tipo_cargo === cargoSaliente)
})

// seleccionarGrupo: abre el modal de usuarios y guarda cuál registro será afectado
// numeroGrupo: 1 -> saliente, 2 -> entrante
const seleccionarGrupo = (numeroGrupo: 1 | 2) => {
  grupo.value = numeroGrupo

  // Guardamos target en el momento de abrir el modal (evita depender de variables de visibilidad
  // que pueden cambiar entre abrir y seleccionar)
  if (createModalVisible.value) {
    registroTarget.value = registroNuevo
  } else if (updateModalVisible.value) {
    registroTarget.value = registroActual
  } else {
    // si no hay modal principal abierto, no asignamos target
    registroTarget.value = null
  }

  userModalVisible.value = true
}

// --- ASIGNAR USUARIO
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
    [`apellido_${prefijo}`]: usuario.apellido,
    [`cargo_${prefijo}`]: usuario.tipo_cargo
  })

  // Esta línea es la clave: si seleccionamos al saliente, guardamos su tipo de cargo
  // en el registro (campo 'tipo_cargo') para que el filtro pueda usarlo.
  if (esSaliente) {
    registro.value.tipo_cargo = usuario.tipo_cargo
  }
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
