<template>
  <div class="modal fade show d-block" tabindex="-1" role="dialog" v-if="visible">
    <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <!-- Header -->
        <div class="modal-header bg-primary text-white">
          <h5 class="fw-italic">Historial de Reemplazos de {{ usuario?.nombre }} {{ usuario?.apellido }}</h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('cerrar')" aria-label="Close"></button>
        </div>

        <!-- Body -->
        <div class="modal-body bg-light">
          <div v-if="reemplazos.length === 0" class="text-center text-muted py-3">
            No se encontraron reemplazos para este usuario.
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle shadow-sm rounded">
              <thead class="table-primary text-white">
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
                <tr v-for="(rep, index) in reemplazos" :key="index">
                  <td class="small text-secondary">{{ rep.id_negocio }}</td>
                  <td class="small">{{ rep.servicio }}</td>
                  <td class="small">{{ rep.tipo_turno }}</td>
                  <td class="small">{{ formatearFecha(rep.fecha_inicio) }}</td>
                  <td class="small">{{ formatearFecha(rep.fecha_termino) }}</td>
                  <td class="small text-success fw-semibold">{{ rep.nombre_entrante }} {{ rep.apellido_entrante }}</td>
                  <td class="small text-primary fw-semibold">{{ rep.nombre_saliente }} {{ rep.apellido_saliente }}</td>
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
defineProps<{
  visible: boolean
  usuario: any
  reemplazos: any[]
}>()

defineEmits(['cerrar'])

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