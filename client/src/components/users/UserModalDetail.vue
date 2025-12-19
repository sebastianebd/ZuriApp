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
                <div class="input-group input-group-sm rounded-3 overflow-hidden shadow-xs border">
                  <span class="input-group-text bg-light border-0"
                    ><i class="bi bi-calendar-event smaller text-primary"></i
                  ></span>
                  <input
                    type="date"
                    class="form-control border-0 bg-white"
                    v-model="filtroFechaInicio"
                  />
                </div>
              </div>

              <div class="col-md-2">
                <label class="form-label text-secondary fw-semibold small mb-1"
                  >Fecha Término</label
                >
                <div class="input-group input-group-sm rounded-3 overflow-hidden shadow-xs border">
                  <span class="input-group-text bg-light border-0"
                    ><i class="bi bi-calendar-check smaller text-primary"></i
                  ></span>
                  <input
                    type="date"
                    class="form-control border-0 bg-white"
                    v-model="filtroFechaTermino"
                  />
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label text-secondary fw-semibold small mb-1">Servicio</label>
                <div class="input-group input-group-sm rounded-3 shadow-xs border bg-white">
                  <span class="input-group-text bg-light border-0"
                    ><i class="bi bi-hospital smaller text-primary"></i
                  ></span>
                  <v-select
                    v-model="filtroServicio"
                    :options="listaServicios"
                    placeholder="Todos"
                    class="custom-v-select flex-grow-1"
                    :clearable="false"
                    :searchable="true"
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

              <div class="col-md-2 d-flex align-items-end justify-content-center pb-1">
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="mostrarAnulados"
                    v-model="mostrarAnulados"
                  />
                  <label
                    class="form-check-label small text-secondary fw-medium"
                    for="mostrarAnulados"
                  >
                    Ver Anulados
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
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-primary bg-gradient text-white">
                  <tr>
                    <th
                      scope="col"
                      class="smaller fw-bold text-uppercase tracking-wider py-3 px-3 text-center"
                    >
                      Código
                    </th>
                    <th scope="col" class="smaller fw-bold text-uppercase tracking-wider py-3 px-3">
                      Servicio
                    </th>
                    <th scope="col" class="smaller fw-bold text-uppercase tracking-wider py-3 px-3">
                      Tipo Turno
                    </th>
                    <th
                      scope="col"
                      class="smaller fw-bold text-uppercase tracking-wider py-3 px-3 text-center"
                    >
                      Fecha Inicio
                    </th>
                    <th
                      scope="col"
                      class="smaller fw-bold text-uppercase tracking-wider py-3 px-3 text-center"
                    >
                      Fecha Término
                    </th>
                    <th scope="col" class="smaller fw-bold text-uppercase tracking-wider py-3 px-3">
                      Entrante
                    </th>
                    <th scope="col" class="smaller fw-bold text-uppercase tracking-wider py-3 px-3">
                      Saliente
                    </th>
                    <th
                      scope="col"
                      class="smaller fw-bold text-uppercase tracking-wider py-3 px-3 text-center"
                    >
                      Activo
                    </th>
                    <th
                      scope="col"
                      class="smaller fw-bold text-uppercase tracking-wider py-3 px-3 text-center"
                    >
                      Anulado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(rep, index) in reemplazosFiltrados" :key="index">
                    <td class="small text-secondary text-center px-3">{{ rep.id_negocio }}</td>
                    <td class="small px-3">
                      <span
                        class="badge bg-light text-primary border border-primary border-opacity-25"
                        >{{ rep.servicio }}</span
                      >
                    </td>
                    <td class="small px-3">{{ rep.tipo_turno }}</td>
                    <td class="small text-center px-3">{{ formatearFecha(rep.fecha_inicio) }}</td>
                    <td class="small text-center px-3">{{ formatearFecha(rep.fecha_termino) }}</td>
                    <td class="small px-3">
                      <div class="fw-bold text-success">
                        {{ rep.nombre_entrante }} {{ rep.apellido_entrante }}
                      </div>
                    </td>
                    <td class="small px-3">
                      <div class="fw-bold text-primary">
                        {{ rep.nombre_saliente }} {{ rep.apellido_saliente }}
                      </div>
                    </td>
                    <td class="small text-center px-3">
                      <span
                        class="badge rounded-pill"
                        :class="
                          rep.activo
                            ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                            : 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25'
                        "
                      >
                        {{ rep.activo ? 'Sí' : 'No' }}
                      </span>
                    </td>
                    <td class="small text-center px-3">
                      <span
                        class="badge rounded-pill"
                        :class="
                          rep.anulado
                            ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                            : 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                        "
                      >
                        {{ rep.anulado ? 'Sí' : 'No' }}
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

const props = defineProps<{
  visible: boolean
  usuario: any
  reemplazos: any[]
  listaServicios: string[]
}>()

defineEmits(['cerrar'])

// 🔽 Filtros reactivos
const filtroFechaInicio = ref('')
const filtroFechaTermino = ref('')
const filtroServicio = ref('')
const filtroRol = ref('TODOS')
const mostrarAnulados = ref(false)

// 💡 Computed: aplica filtros en cascada
const reemplazosFiltrados = computed(() => {
  return props.reemplazos.filter((rep) => {
    // Filtrar por fechas
    if (filtroFechaInicio.value && rep.fecha_inicio < filtroFechaInicio.value) return false
    if (filtroFechaTermino.value && rep.fecha_termino > filtroFechaTermino.value) return false

    // Filtrar por servicio
    if (filtroServicio.value) {
      const sBusqueda = String(filtroServicio.value).toLowerCase()
      if (!rep.servicio?.toLowerCase().includes(sBusqueda)) return false
    }

    // Filtrar por rol (entrante / saliente)
    if (filtroRol.value && filtroRol.value !== 'TODOS') {
      const rBusqueda = String(filtroRol.value).toUpperCase()
      if (rBusqueda === 'ENTRANTE' && rep.id_entrante !== props.usuario._id) return false
      if (rBusqueda === 'SALIENTE' && rep.id_saliente !== props.usuario._id) return false
    }
    // Filtrar por anulados
    if (!mostrarAnulados.value && rep.anulado) return false

    return true
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
