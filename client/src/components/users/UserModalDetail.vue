<template>
  <div class="modal fade show d-block" tabindex="-1" role="dialog" v-if="visible">
    <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <!-- Header -->
        <div class="modal-header bg-primary text-white">
          <h5 class="fw-italic">
            Historial de Reemplazos de {{ usuario?.nombre }} {{ usuario?.apellido }}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="$emit('cerrar')"
            aria-label="Close"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body bg-light">
          <!-- 🔍 Filtros -->
          <div class="row g-2 mb-3">
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted">Fecha Inicio</label>
              <input type="date" class="form-control form-control-sm" v-model="filtroFechaInicio" />
            </div>

            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted">Fecha Término</label>
              <input type="date" class="form-control form-control-sm" v-model="filtroFechaTermino" />
            </div>

            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted">Servicio</label>
              <input
                type="text"
                class="form-control form-control-sm"
                placeholder="Ej: Urgencias"
                v-model="filtroServicio"
              />
            </div>

            <div class="col-md-2">
              <label class="form-label small fw-semibold text-muted">Rol</label>
              <select class="form-select form-select-sm" v-model="filtroRol">
                <option value="TODOS">Todos</option>
                <option value="ENTRANTE">Entrante</option>
                <option value="SALIENTE">Saliente</option>
              </select>
            </div>

            <div class="col-md-1 d-flex align-items-end justify-content-center">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="mostrarAnulados"
                  v-model="mostrarAnulados"
                />
                <label class="form-check-label small text-muted" for="mostrarAnulados">
                  Anulados
                </label>
              </div>
            </div>
          </div>

          <!-- Tabla -->
          <div v-if="reemplazosFiltrados.length === 0" class="text-center text-muted py-3">
            No se encontraron reemplazos con los filtros aplicados.
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle shadow-sm rounded">
              <thead class="table-primary text-white text-center">
                <tr>
                  <th class="small">Código</th>
                  <th class="small">Servicio</th>
                  <th class="small">Tipo Turno</th>
                  <th class="small">Fecha Inicio</th>
                  <th class="small">Fecha Término</th>
                  <th class="small">Entrante</th>
                  <th class="small">Saliente</th>
                  <th class="small">Activo</th>
                  <th class="small">Anulado</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(rep, index) in reemplazosFiltrados" :key="index">
                  <td class="small text-secondary">{{ rep.id_negocio }}</td>
                  <td class="small">{{ rep.servicio }}</td>
                  <td class="small">{{ rep.tipo_turno }}</td>
                  <td class="small">{{ formatearFecha(rep.fecha_inicio) }}</td>
                  <td class="small">{{ formatearFecha(rep.fecha_termino) }}</td>
                  <td class="small text-success fw-semibold">
                    {{ rep.nombre_entrante }} {{ rep.apellido_entrante }}
                  </td>
                  <td class="small text-primary fw-semibold">
                    {{ rep.nombre_saliente }} {{ rep.apellido_saliente }}
                  </td>
                  <td class="small text-center">
                    <span :class="['badge rounded-pill', rep.activo ? 'bg-success' : 'bg-secondary']">
                      {{ rep.activo ? 'Sí' : 'No' }}
                    </span>
                  </td>
                  <td class="small text-center">
                    <span :class="['badge rounded-pill', rep.anulado ? 'bg-danger' : 'bg-success']">
                      {{ rep.anulado ? 'Sí' : 'No' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer bg-light">
          <button type="button" class="btn btn-secondary px-4" @click="$emit('cerrar')">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  visible: boolean
  usuario: any
  reemplazos: any[]
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
    if (
      filtroServicio.value &&
      !rep.servicio?.toLowerCase().includes(filtroServicio.value.toLowerCase())
    )
      return false

    // Filtrar por rol (entrante / saliente)
    if (filtroRol.value === 'ENTRANTE' && rep.id_entrante !== props.usuario._id) return false
    if (filtroRol.value === 'SALIENTE' && rep.id_saliente !== props.usuario._id) return false

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
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
.modal-content {
  border-radius: 12px;
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
.table-hover-row:hover {
  background-color: #e3f2fd !important;
}
.table {
  border-radius: 8px;
  overflow: hidden;
}
</style>
