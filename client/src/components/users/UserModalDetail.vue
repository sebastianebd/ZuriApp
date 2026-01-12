<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      v-if="visible"
      style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-dialog-centered" role="document" style="max-width: 80vw">
        <div class="modal-content shadow-lg border-0 rounded-4">
          <!-- Header -->
          <div class="modal-header border-0 bg-primary bg-gradient text-white p-4 rounded-top-4">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-clock-history me-2"></i>Historial de Reemplazos: {{ usuario?.nombre }}
              {{ usuario?.apellido }}
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
            <!-- 🔍 Filtros -->
            <div class="row g-3 mb-4">
              <div class="col-md-2">
                <label class="form-label text-secondary fw-semibold small mb-1">Fecha Inicio</label>
                <DatePicker
                  v-model="filtroFechaInicio"
                  :popover="{ visibility: 'focus' }"
                  :masks="{ input: 'DD/MM/YYYY' }"
                >
                  <template #default="{ inputValue, inputEvents }">
                    <div
                      class="input-group input-group-sm rounded-3 overflow-hidden shadow-xs border"
                    >
                      <span class="input-group-text bg-light border-0"
                        ><i class="bi bi-calendar-event smaller text-primary"></i
                      ></span>
                      <input
                        class="form-control border-0 bg-white"
                        :value="inputValue"
                        v-on="inputEvents"
                        placeholder="dd/mm/aaaa"
                      />
                    </div>
                  </template>
                </DatePicker>
              </div>

              <div class="col-md-2">
                <label class="form-label text-secondary fw-semibold small mb-1"
                  >Fecha Término</label
                >
                <DatePicker
                  v-model="filtroFechaTermino"
                  :popover="{ visibility: 'focus' }"
                  :masks="{ input: 'DD/MM/YYYY' }"
                >
                  <template #default="{ inputValue, inputEvents }">
                    <div
                      class="input-group input-group-sm rounded-3 overflow-hidden shadow-xs border"
                    >
                      <span class="input-group-text bg-light border-0"
                        ><i class="bi bi-calendar-check smaller text-primary"></i
                      ></span>
                      <input
                        class="form-control border-0 bg-white"
                        :value="inputValue"
                        v-on="inputEvents"
                        placeholder="dd/mm/aaaa"
                      />
                    </div>
                  </template>
                </DatePicker>
              </div>

              <div class="col-md-3">
                <label class="form-label text-secondary fw-semibold small mb-1">Servicio</label>
                <div class="input-group input-group-sm rounded-3 shadow-xs border bg-white">
                  <span class="input-group-text bg-light border-0"
                    ><i class="bi bi-hospital smaller text-primary"></i
                  ></span>
                  <v-select
                    v-model="filtroServicio"
                    :options="['TODOS', ...listaServicios]"
                    placeholder="Todos"
                    class="custom-v-select flex-grow-1"
                    :clearable="true"
                    :searchable="true"
                  />
                </div>
              </div>

              <div class="col-md-2">
                <label class="form-label text-secondary fw-semibold small mb-1">Tipo Turno</label>
                <div class="input-group input-group-sm rounded-3 shadow-xs border bg-white">
                  <span class="input-group-text bg-light border-0"
                    ><i class="bi bi-clock smaller text-primary"></i
                  ></span>
                  <v-select
                    v-model="filtroTipoTurno"
                    :options="['TODOS', ...listaTiposTurno]"
                    placeholder="Todos"
                    class="custom-v-select flex-grow-1"
                    :clearable="true"
                    :searchable="false"
                  />
                </div>
              </div>

              <div class="col-md-2">
                <label class="form-label text-secondary fw-semibold small mb-1">Rol</label>
                <div class="input-group input-group-sm rounded-3 shadow-xs border bg-white">
                  <span class="input-group-text bg-light border-0"
                    ><i class="bi bi-person-badge smaller text-primary"></i
                  ></span>
                  <v-select
                    v-model="filtroRol"
                    :options="['TODOS', 'ENTRANTE', 'SALIENTE']"
                    :clearable="false"
                    :searchable="false"
                    class="custom-v-select flex-grow-1"
                  />
                </div>
              </div>

              <div class="col-md-1 d-flex align-items-end justify-content-center pb-1">
                <div class="form-check form-switch ps-0">
                  <input
                    class="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="mostrarAnulados"
                    v-model="mostrarAnulados"
                  />
                  <label
                    class="form-check-label small text-secondary fw-medium"
                    for="mostrarAnulados"
                  >
                    Anulados
                  </label>
                </div>
              </div>
            </div>

            <!-- Tabla -->
            <div v-if="reemplazosFiltrados.length === 0" class="text-center text-muted py-5">
              <i class="bi bi-info-circle me-2"></i>No se encontraron reemplazos con los filtros
              aplicados.
            </div>

            <div v-else class="table-responsive rounded-3 border shadow-xs">
              <table class="table table-hover table-sm align-middle mb-0">
                <thead class="bg-primary bg-gradient text-white">
                  <tr>
                    <th
                      scope="col"
                      class="smaller fw-bold text-uppercase tracking-wider py-2 px-2 text-center"
                    >
                      Código
                    </th>
                    <th scope="col" class="smaller fw-bold text-uppercase tracking-wider py-2 px-2">
                      Servicio
                    </th>
                    <th scope="col" class="smaller fw-bold text-uppercase tracking-wider py-2 px-2">
                      Tipo Turno
                    </th>
                    <th
                      scope="col"
                      class="smaller fw-bold text-uppercase tracking-wider py-2 px-2 text-center"
                    >
                      Fecha Inicio
                    </th>
                    <th
                      scope="col"
                      class="smaller fw-bold text-uppercase tracking-wider py-2 px-2 text-center"
                    >
                      Fecha Término
                    </th>
                    <th scope="col" class="smaller fw-bold text-uppercase tracking-wider py-2 px-2">
                      Entrante
                    </th>
                    <th scope="col" class="smaller fw-bold text-uppercase tracking-wider py-2 px-2">
                      Saliente
                    </th>
                    <th
                      scope="col"
                      class="smaller fw-bold text-uppercase tracking-wider py-2 px-2 text-center"
                    >
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(rep, index) in reemplazosFiltrados" :key="index">
                    <td class="small text-secondary text-center px-2 py-1">{{ rep.id_negocio }}</td>
                    <td class="small px-2 py-1">
                      <span
                        class="badge bg-light text-primary border border-primary border-opacity-25"
                        >{{ rep.servicio }}</span
                      >
                    </td>
                    <td class="small px-2 py-1">{{ rep.tipo_turno }}</td>
                    <td class="small text-center px-2 py-1">
                      {{ formatearFecha(rep.fecha_inicio) }}
                    </td>
                    <td class="small text-center px-2 py-1">
                      {{ formatearFecha(rep.fecha_termino) }}
                    </td>
                    <td class="small px-2 py-1">
                      <div class="fw-medium text-success">
                        {{ rep.nombre_entrante }} {{ rep.apellido_entrante }}
                      </div>
                    </td>
                    <td class="small px-2 py-1">
                      <div class="fw-medium text-primary">
                        {{ rep.nombre_saliente }} {{ rep.apellido_saliente }}
                      </div>
                    </td>
                    <td class="small text-center px-2 py-1">
                      <span class="badge rounded-pill border" :class="getStatusClass(rep.status)">
                        {{ rep.status || 'SIN ESTADO' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer border-0 p-4 pt-0 d-flex justify-content-end">
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
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'

const props = defineProps<{
  visible: boolean
  usuario: any
  reemplazos: any[]
  listaServicios: string[]
  listaTiposTurno: string[]
}>()

defineEmits(['cerrar'])

// 🔽 Filtros reactivos
const filtroFechaInicio = ref<Date | null>(null)
const filtroFechaTermino = ref<Date | null>(null)
const filtroServicio = ref<string | null>(null)
const filtroTipoTurno = ref<string | null>(null)
const filtroRol = ref('TODOS')
const mostrarAnulados = ref(false)

// 💡 Computed: aplica filtros en cascada
const reemplazosFiltrados = computed(() => {
  const filtrados = props.reemplazos.filter((rep) => {
    // Filtrar por fechas
    const repFechaInicio = new Date(rep.fecha_inicio)
    const repFechaTermino = new Date(rep.fecha_termino)

    if (filtroFechaInicio.value && repFechaInicio < filtroFechaInicio.value) return false
    if (filtroFechaTermino.value && repFechaTermino > filtroFechaTermino.value) return false

    // Filtrar por servicio
    if (filtroServicio.value && filtroServicio.value !== 'TODOS') {
      const sBusqueda = String(filtroServicio.value).toLowerCase()
      if (!rep.servicio?.toLowerCase().includes(sBusqueda)) return false
    }

    // Filtrar por tipo turno
    if (filtroTipoTurno.value && filtroTipoTurno.value !== 'TODOS') {
      if (rep.tipo_turno !== filtroTipoTurno.value) return false
    }

    // Filtrar por rol (entrante / saliente)
    if (filtroRol.value && filtroRol.value !== 'TODOS') {
      const rBusqueda = String(filtroRol.value).toUpperCase()
      if (rBusqueda === 'ENTRANTE' && rep.id_entrante !== props.usuario._id) return false
      if (rBusqueda === 'SALIENTE' && rep.id_saliente !== props.usuario._id) return false
    }

    // Filtrar por anulados
    if (!mostrarAnulados.value && rep.status === 'ANULADO') return false
    // Also check legacy boolean if present
    if (!mostrarAnulados.value && rep.anulado) return false

    return true
  })

  // Ordenar descendente por código (id_negocio)
  // id_negocio suele tener formato "R-1065", así que podemos intentar parsear el número
  // o simplemente string compare (pero string compare con números variables fallará: R-10 vs R-2)
  return filtrados.sort((a, b) => {
    const codeA = String(a.id_negocio || '')
    const codeB = String(b.id_negocio || '')

    // Intentar extraer parte numérica
    const numA = parseInt(codeA.replace(/\D/g, ''), 10) || 0
    const numB = parseInt(codeB.replace(/\D/g, ''), 10) || 0

    if (numA !== numB) {
      return numB - numA // Descendente numérico
    }
    return codeB.localeCompare(codeA) // Fallback string descendente
  })
})

function formatearFecha(fecha: string) {
  if (!fecha) return '—'
  try {
    return new Date(fecha).toLocaleDateString('es-CL')
  } catch {
    return '—'
  }
}

function getStatusClass(status: string) {
  if (!status) return 'bg-secondary bg-opacity-10 text-secondary border-secondary border-opacity-25'

  const s = status.toUpperCase()
  switch (s) {
    case 'CONFIRMADO':
    case 'EN CURSO':
      return 'bg-success bg-opacity-10 text-success border-success border-opacity-25'
    case 'PENDIENTE':
      return 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-25'
    case 'ANULADO':
      return 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25'
    case 'FINALIZADO':
      return 'bg-primary bg-opacity-10 text-primary border-primary border-opacity-25'
    default:
      return 'bg-secondary bg-opacity-10 text-secondary border-secondary border-opacity-25'
  }
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

.smaller {
  font-size: 0.75rem;
}

/* Custom table font sizes */
.table td,
.table th {
  font-size: 0.8rem;
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
  overflow: hidden; /* Ensures child elements don't overlap rounded corners */
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

.table-responsive {
  max-height: 600px;
  overflow-y: auto;
}

button {
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}
</style>
