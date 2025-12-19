<template>
  <div class="table-responsive rounded-3 border overflow-hidden shadow-sm">
    <table class="table table-hover align-middle mb-0">
      <thead class="bg-primary bg-gradient text-white">
        <tr>
          <th scope="col" class="py-2 px-4 x-small fw-bold text-uppercase tracking-wider">
            Código
          </th>
          <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
            Funcionario Saliente
          </th>
          <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
            Reemplazante (Entrante)
          </th>
          <th
            scope="col"
            class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider text-center"
          >
            Turno
          </th>
          <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
            Período
          </th>
          <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
            Servicio
          </th>
          <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
            Creado por
          </th>
          <th
            scope="col"
            class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider text-center"
          >
            Status
          </th>
          <th
            scope="col"
            class="py-2 px-4 x-small fw-bold text-uppercase tracking-wider text-center"
          >
            Acciones
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="reemplazo in reemplazos" :key="reemplazo._id" class="border-bottom hover-row">
          <td class="px-4 py-2">
            <span class="badge bg-light text-dark fw-bold border x-small">{{
              reemplazo.id_negocio
            }}</span>
          </td>
          <td class="px-3 py-2">
            <div class="d-flex align-items-center">
              <div
                class="avatar-placeholder me-2 rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fw-bold x-small border border-primary border-opacity-10"
                style="width: 28px; height: 28px"
              >
                {{ getInitials(reemplazo.nombre_saliente + ' ' + reemplazo.apellido_saliente) }}
              </div>
              <div class="d-flex flex-column">
                <span class="fw-bold text-dark x-small"
                  >{{ reemplazo.nombre_saliente }} {{ reemplazo.apellido_saliente }}</span
                >
                <span class="text-muted x-small"
                  ><i class="bi bi-person-badge me-1"></i>{{ reemplazo.rut_saliente }}</span
                >
              </div>
            </div>
          </td>
          <td class="px-3 py-2">
            <div class="d-flex align-items-center">
              <div
                class="avatar-placeholder me-2 rounded-3 bg-success bg-opacity-10 d-flex align-items-center justify-content-center text-success fw-bold x-small border border-success border-opacity-10"
                style="width: 28px; height: 28px"
              >
                {{ getInitials(reemplazo.nombre_entrante + ' ' + reemplazo.apellido_entrante) }}
              </div>
              <div class="d-flex flex-column">
                <span class="fw-bold text-dark x-small"
                  >{{ reemplazo.nombre_entrante }} {{ reemplazo.apellido_entrante }}</span
                >
                <span class="text-muted x-small"
                  ><i class="bi bi-person-badge me-1"></i>{{ reemplazo.rut_entrante }}</span
                >
              </div>
            </div>
          </td>
          <td class="px-3 py-2 text-center">
            <span class="x-small text-secondary">{{ reemplazo.tipo_turno }}</span>
          </td>
          <td class="px-3 py-2">
            <div class="d-flex flex-column x-small text-secondary">
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
          <td class="px-3 py-2">
            <span
              class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1 rounded-pill x-small"
            >
              {{ reemplazo.servicio }}
            </span>
          </td>
          <td class="px-3 py-2">
            <span class="x-small text-muted fw-medium">{{ getCreatorName(reemplazo) }}</span>
          </td>
          <td class="px-3 py-2 text-center">
            <span
              class="badge px-3 py-1 rounded-pill x-small fw-bold shadow-xs"
              :class="[reemplazo.status === 'PENDIENTE' ? 'bg-warning text-dark' : 'bg-success']"
            >
              {{ reemplazo.status }}
            </span>
          </td>

          <td class="px-4 text-center">
            <div class="d-flex gap-1 justify-content-center">
              <button
                @click="$emit('modificar', reemplazo)"
                class="btn btn-light btn-sm border shadow-xs"
                title="Editar"
              >
                <i class="bi bi-pencil-square text-primary"></i>
              </button>
              <button
                @click="$emit('exportar', reemplazo)"
                class="btn btn-light btn-sm border shadow-xs"
                title="Exportar"
              >
                <i class="bi bi-file-earmark-pdf text-danger"></i>
              </button>
              <button
                v-if="turnoEnCurso(reemplazo)"
                @click="confirmarFinalizar(reemplazo._id)"
                class="btn btn-light btn-sm border shadow-xs"
                title="Finalizar"
              >
                <i class="bi bi-check-circle-fill text-success"></i>
              </button>
              <button
                v-else
                @click="confirmarAnular(reemplazo._id)"
                class="btn btn-light btn-sm border shadow-xs"
                title="Anular"
              >
                <i class="bi bi-x-circle-fill text-danger"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal de confirmación -->
    <ConfirmationModal
      :visible="showConfirmacion"
      :mensaje="
        accion === 'finalizar'
          ? '¿Deseas FINALIZAR este registro?'
          : '¿Deseas ANULAR este registro?'
      "
      @confirmar="confirmarAccion"
      @cancelar="cancelarAccion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ConfirmationModal from '../common/ConfirmationModal.vue'
import type { RegisterDataReemplazo, User } from '@/types/models'

defineProps({
  reemplazos: {
    type: Array as () => RegisterDataReemplazo[],
    required: true
  }
})

function turnoEnCurso(reemplazo: RegisterDataReemplazo) {
  return reemplazo.status === 'EN CURSO'
}

const emit = defineEmits<{
  (e: 'modificar', registro: RegisterDataReemplazo): void
  (e: 'exportar', registro: RegisterDataReemplazo): void
  (e: 'finalizar', id: string): void
  (e: 'anular', id: string): void
}>()

const showConfirmacion = ref(false)
const idRegistro = ref<string | null>(null)
const accion = ref<'finalizar' | 'anular' | null>(null)

const getCreatorName = (reemplazo: RegisterDataReemplazo): string => {
  const creator = reemplazo.creado_por

  if (typeof creator !== 'string' && creator && 'nombre' in creator && 'apellido' in creator) {
    const user = creator as User
    return `${user.nombre} ${user.apellido}`
  }
  return String(creator) || 'Usuario no asignado'
}

function confirmarFinalizar(id: string) {
  idRegistro.value = id
  accion.value = 'finalizar'
  showConfirmacion.value = true
}

function confirmarAnular(id: string) {
  idRegistro.value = id
  accion.value = 'anular'
  showConfirmacion.value = true
}

function confirmarAccion() {
  if (!idRegistro.value || !accion.value) return

  if (accion.value === 'finalizar') {
    emit('finalizar', idRegistro.value)
  } else {
    emit('anular', idRegistro.value)
  }

  showConfirmacion.value = false
  idRegistro.value = null
  accion.value = null
}

function cancelarAccion() {
  showConfirmacion.value = false
  idRegistro.value = null
}

function getInitials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const formatearFecha = (fecha: string) => {
  if (!fecha) return ''
  return fecha.split('-').reverse().join('-')
}
</script>

<style scoped>
.hover-row:hover {
  background-color: #f8fafc !important;
}

.avatar-placeholder {
  flex-shrink: 0;
}

.smaller {
  font-size: 0.75rem;
}

.x-small {
  font-size: 0.71rem;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

th {
  border: none !important;
}

.table td,
.table th {
  border-color: #f1f5f9;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
</style>
