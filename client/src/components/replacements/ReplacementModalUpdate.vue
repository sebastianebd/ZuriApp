<template>
  <div class="modal fade show d-block" v-if="visible" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <!-- HEADER -->
        <div class="modal-header bg-primary text-white rounded-top">
          <h5 class="modal-title fst-italic fw-bold">MODIFICA REGISTRO</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="$emit('cerrar')"
            aria-label="Close"
          ></button>
        </div>

        <!-- BODY -->
        <div class="modal-body bg-light">
          <div class="row">
            <!-- Grupo 1: Usuario Saliente -->
            <div class="col-md-6 mb-3">
              <div class="border rounded-3 p-3 bg-white shadow-sm h-100">
                <div class="d-flex align-items-center mb-3">
                  <h6 class="text-primary flex-grow-1 fw-semibold mb-3">Funcionario Saliente</h6>
                </div>

                <div class="form-floating mb-2">
                  <input
                    type="text"
                    id="rutSaliente"
                    :value="registro.rut_saliente"
                    class="form-control"
                    disabled
                  />
                  <label for="rutSaliente">RUT</label>
                </div>

                <div class="form-floating mb-2">
                  <input
                    type="text"
                    id="nombreSaliente"
                    :value="registro.nombre_saliente"
                    class="form-control"
                    disabled
                  />
                  <label for="nombreSaliente">Nombre</label>
                </div>

                <div class="form-floating mb-2">
                  <input
                    type="text"
                    id="apellidoSaliente"
                    :value="registro.apellido_saliente"
                    class="form-control"
                    disabled
                  />
                  <label for="apellidoSaliente">Apellido</label>
                </div>
              </div>
            </div>

            <!-- Grupo 2: Usuario Entrante -->
            <div class="col-md-6 mb-3">
              <div class="border rounded-3 p-3 bg-white shadow-sm h-100">
                <div class="d-flex align-items-center mb-3">
                  <h6 class="text-primary flex-grow-1 fw-semibold mb-3">Funcionario Entrante</h6>

                  <!-- ✅ Botón dinámico -->
                  <button
                    v-if="turnoEnCurso"
                    @click.prevent="$emit('sustituir-usuario')"
                    class="btn btn-danger btn-sm fw-semibold"
                  >
                    <i class="bi bi-arrow-repeat"></i> Sustituir
                  </button>
                  <button
                    v-else
                    @click.prevent="$emit('buscar-usuario', 2)"
                    class="btn btn-warning btn-sm fw-semibold"
                  >
                    <i class="bi bi-search"></i> Buscar
                  </button>
                </div>

                <div class="form-floating mb-2">
                  <input
                    type="text"
                    id="rutEntrante"
                    :value="registro.rut_entrante"
                    class="form-control"
                    disabled
                  />
                  <label for="rutEntrante">RUT</label>
                </div>

                <div class="form-floating mb-2">
                  <input
                    type="text"
                    id="nombreEntrante"
                    :value="registro.nombre_entrante"
                    class="form-control"
                    disabled
                  />
                  <label for="nombreEntrante">Nombre</label>
                </div>

                <div class="form-floating mb-2">
                  <input
                    type="text"
                    id="apellidoEntrante"
                    :value="registro.apellido_entrante"
                    class="form-control"
                    disabled
                  />
                  <label for="apellidoEntrante">Apellido</label>
                </div>
              </div>
            </div>
          </div>

          <!-- Grupo 3: Configuración de Turno -->
          <div class="border rounded-3 p-3 bg-white shadow-sm mb-3">
            <h6 class="text-primary fw-semibold mb-3">Configuración del Turno</h6>

            <div class="form-floating mb-3">
              <select
                id="tipoTurno"
                :value="registro.tipo_turno"
                @change="
                  $emit('update:registro', {
                    ...registro,
                    tipo_turno: ($event.target as HTMLSelectElement).value
                  })
                "
                class="form-select"
                :disabled="turnoEnCurso"
              >
                <option value="" disabled>Seleccione un turno</option>
                <option v-for="turno in listaDeTurnos" :key="turno" :value="turno">
                  {{ turno }}
                </option>
              </select>
              <label for="tipoTurno">Tipo de Turno</label>
            </div>

            <div class="form-floating mb-3">
              <input
                type="date"
                id="fechaInicio"
                :value="registro.fecha_inicio"
                @input="
                  $emit('update:registro', {
                    ...registro,
                    fecha_inicio: ($event.target as HTMLInputElement).value
                  })
                "
                class="form-control"
                :disabled="turnoEnCurso"
              />
              <label for="fechaInicio">Fecha de Inicio</label>
            </div>

            <div class="form-floating mb-3">
              <input
                type="date"
                id="fechaTermino"
                :value="registro.fecha_termino"
                @input="
                  $emit('update:registro', {
                    ...registro,
                    fecha_termino: ($event.target as HTMLInputElement).value
                  })
                "
                class="form-control"
                :disabled="turnoEnCurso"
              />
              <label for="fechaTermino">Fecha de Término</label>
            </div>

            <div class="form-floating mb-2">
              <select
                id="servicio"
                :value="registro.servicio"
                @change="
                  $emit('update:registro', {
                    ...registro,
                    servicio: ($event.target as HTMLSelectElement).value
                  })
                "
                class="form-select"
                :disabled="turnoEnCurso"
              >
                <option value="" disabled>Seleccione un servicio</option>
                <option v-for="servicio in listaDeServicios" :key="servicio" :value="servicio">
                  {{ servicio }}
                </option>
              </select>
              <label for="servicio">Servicio</label>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer d-flex justify-content-center border-0 pb-4">
          <button
            type="button"
            class="btn btn-secondary px-4 fw-semibold me-2"
            @click="$emit('cerrar')"
          >
            Cancelar
          </button>
          <button type="button" class="btn btn-primary px-4 fw-semibold" @click="abrirConfirmacion">
            Guardar
          </button>
        </div>

        <!-- Modal de confirmación -->
        <ConfirmationModal
          :visible="showConfirmacion"
          mensaje="¿Deseas guardar los cambios realizados?"
          @confirmar="confirmarGuardar"
          @cancelar="cancelarConfirmacion"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RegisterDataReemplazo } from '@/types/models'
import { ref, computed } from 'vue'
import ConfirmationModal from '../common/ConfirmationModal.vue'

interface ReemplazoModalData extends Partial<RegisterDataReemplazo> {
  fecha_inicio?: string
  fecha_termino?: string
}

const props = defineProps<{
  visible: boolean
  registro: ReemplazoModalData
  listaDeTurnos: string[]
  listaDeServicios: string[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar'): void
  (e: 'buscar-usuario', grupo: 1 | 2): void
  (e: 'sustituir-usuario'): void
  (e: 'update:registro', nuevoRegistro: ReemplazoModalData): void
}>()

// 👇 controlamos el modal de confirmación
const showConfirmacion = ref(false)

// ✅ Computed: determina si el turno está en curso
const turnoEnCurso = computed(() => {
  if (!props.registro?.fecha_inicio) return false

  const hoy = new Date()
  const fechaInicio = new Date(props.registro.fecha_inicio)

  // Si la fecha de inicio es menor o igual a hoy → turno en curso
  return fechaInicio <= hoy
})

// Cuando el usuario presiona "Guardar"
function abrirConfirmacion() {
  showConfirmacion.value = true
}

// Si confirma guardar
function confirmarGuardar() {
  showConfirmacion.value = false
  emit('guardar')
}

// Si cancela (volver al modal original)
function cancelarConfirmacion() {
  showConfirmacion.value = false
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  border-radius: 12px;
  overflow: hidden;
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

button {
  transition: transform 0.12s ease-in-out, box-shadow 0.12s;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

h6 {
  font-weight: 600;
}
</style>
