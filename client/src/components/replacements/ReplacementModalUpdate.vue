<template>
  <div class="modal" :class="{ show: visible }" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-md" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Modificar Registro</h5>
          <button type="button" class="close" @click="$emit('cerrar')" aria-label="Close">
            <span aria-hidden="true" class="h1">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="row">

            <!-- Grupo 1: Usuario Saliente -->
            <div class="col-md-6">
              <div class="border p-2 mb-2">
                <div class="d-flex align-items-center mb-3">
                  <label for="rutSaliente" class="form-label form-label-sm flex-grow-1">Rut Saliente</label>
                  <button
                    @click.prevent="$emit('buscar-usuario', 1)"
                    class="btn btn-warning btn-sm ms-2 custom-small-button"
                  >
                    <i class="material-icons">search</i>
                  </button>
                </div>
                <div class="mb-3">
                  <input
                    type="text"
                    id="rutSaliente"
                    :value="registro.rut_saliente"
                    @input="$emit('update:registro', { ...registro, rut_saliente: ($event.target as HTMLInputElement).value })"
                    class="form-control form-control-sm"
                    disabled
                  />
                </div>
                <div class="mb-3">
                  <label for="nombreSaliente" class="form-label form-label-sm">Nombre Saliente</label>
                  <input
                    type="text"
                    id="nombreSaliente"
                    :value="registro.nombre_saliente"
                    @input="$emit('update:registro', { ...registro, nombre_saliente: ($event.target as HTMLInputElement).value })"
                    class="form-control form-control-sm"
                    disabled
                  />
                </div>
                <div class="mb-3">
                  <label for="apellidoSaliente" class="form-label form-label-sm">Apellido Saliente</label>
                  <input
                    type="text"
                    id="apellidoSaliente"
                    :value="registro.apellido_saliente"
                    @input="$emit('update:registro', { ...registro, apellido_saliente: ($event.target as HTMLInputElement).value })"
                    class="form-control form-control-sm"
                    disabled
                  />
                </div>
              </div>
            </div>


            <!-- Grupo 2: Usuario Entrante -->    
            <div class="col-md-6">
              <div class="border p-2 mb-2">
                <div class="d-flex align-items-center mb-3">
                  <label for="rutEntrante" class="form-label form-label-sm flex-grow-1">Rut Entrante</label>
                  <button
                    @click.prevent="$emit('buscar-usuario', 2)" class="btn btn-warning btn-sm ms-2 custom-small-button"
                  >
                    <i class="material-icons">search</i>
                  </button>
                </div>
                <div class="mb-3">
                  <input
                    type="text"
                    id="rutEntrante"
                    :value="registro.rut_entrante"
                    @input="$emit('update:registro', { ...registro, rut_entrante: ($event.target as HTMLInputElement).value })"
                    class="form-control form-control-sm"
                    disabled
                  />
                </div>
                <div class="mb-3">
                  <label for="nombreEntrante" class="form-label form-label-sm">Nombre Entrante</label>
                  <input
                    type="text"
                    id="nombreEntrante"
                    :value="registro.nombre_entrante"
                    @input="$emit('update:registro', { ...registro, nombre_entrante: ($event.target as HTMLInputElement).value })"
                    class="form-control form-control-sm"
                    disabled
                  />
                </div>
                <div class="mb-3">
                  <label for="apellidoEntrante" class="form-label form-label-sm">Apellido Entrante</label>
                  <input
                    type="text"
                    id="apellidoEntrante"
                    :value="registro.apellido_entrante"
                    @input="$emit('update:registro', { ...registro, apellido_entrante: ($event.target as HTMLInputElement).value })"
                    class="form-control form-control-sm"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Grupo 3: Datos del turno -->
          <div class="row">
            <div class="col-md-12">
              <div class="border p-2 mb-2">
                <div class="mb-2">
                  <label for="tipoTurno" class="form-label form-label-sm">Tipo Turno</label>
                  <select
                    :value="registro.tipo_turno"
                    @change="$emit('update:registro', { ...registro, tipo_turno: ($event.target as HTMLSelectElement).value })"
                    class="form-control form-control-sm"
                  >
                    <option v-for="turno in listaDeTurnos" :key="turno" :value="turno">
                      {{ turno }}
                    </option>
                  </select>
                </div>

                <div class="mb-2">
                  <label for="fechaInicio" class="form-label form-label-sm">Fecha Inicio</label>
                  <input
                    type="date"
                    :value="registro.fecha_inicio"
                    @input="$emit('update:registro', { ...registro, fecha_inicio: ($event.target as HTMLInputElement).value })"
                    class="form-control form-control-sm"
                  />
                </div>

                <div class="mb-2">
                  <label for="fechaTermino" class="form-label form-label-sm">Fecha Termino</label>
                  <input
                    type="date"
                    :value="registro.fecha_termino"
                    @input="$emit('update:registro', { ...registro, fecha_termino: ($event.target as HTMLInputElement).value })"
                    class="form-control form-control-sm"
                  />
                </div>

                <div class="mb-2">
                  <label for="servicio" class="form-label form-label-sm">Servicio</label>
                  <select
                    :value="registro.servicio"
                    @change="$emit('update:registro', { ...registro, servicio: ($event.target as HTMLSelectElement).value })"
                    class="form-control form-control-sm"
                  >
                    <option
                      v-for="servicio in listaDeServicios"
                      :key="servicio"
                      :value="servicio"
                    >
                      {{ servicio }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          </div>
        <div class="d-flex justify-content-center mb-3">
          <div>
            <button type="button" class="btn btn-secondary me-3" @click="$emit('cerrar')">
              Cancelar
            </button>
          </div>
          <div>
            <button type="button" class="btn btn-primary" @click="$emit('guardar')">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RegisterDataReemplazo } from '@/types/models'

// El tipo se mantiene igual, asegurando que las fechas y el resto de campos pueden ser strings
interface ReemplazoModalData extends Partial<RegisterDataReemplazo> {
  fecha_inicio?: string
  fecha_termino?: string
}

defineProps<{
  visible: boolean
  registro: ReemplazoModalData
  listaDeTurnos: string[]
  listaDeServicios: string[]
}>()

defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar'): void
  (e: 'buscar-usuario', grupo: 1 | 2): void
  // Permite al componente padre usar v-model:registro
  (e: 'update:registro', nuevoRegistro: ReemplazoModalData): void 
}>()
</script>