<template>
  <main>
    <div class="tabla-reemplazos-container  mt-2">
      <div class="pt-3 pb-5">
        <h5 class="card-title m-b-0 text-secondary">Historial Reemplazos</h5>
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
              v-for="(reemplazo, index) in user"
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
    </div>
  </main>
</template>

<script setup lang="ts">
import { mostrarHistorialReeemplazos } from '../../services/replacement.service'
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import type { RegisterDataReemplazo, User } from '@/types/models'

const authStore = useAuthStore()
const useApi = authStore.usePrivateApi()

const user = ref<any[]>([])

onMounted(async () => {
  user.value = await mostrarHistorialReeemplazos(useApi)
})

const formatearFecha = (fecha: string) => {
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
</script>

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
