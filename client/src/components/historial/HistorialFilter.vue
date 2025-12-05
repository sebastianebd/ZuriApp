<template>
  <div class="filter-card shadow-sm mb-4">
    <div class="row pt-2 pb-3 ps-2 pe-2 d-flex justify-content-evenly">
      <div class="col-sm-2 me-3">
        <label
          for="filtroRutSaliente"
          class="form-label col-form-label-sm fw-semibold text-secondary"
          >Buscar por Rut (saliente):</label
        >
        <input
          type="text"
          :value="modelValue.rutSaliente"
          @input="updateFilter('rutSaliente', $event)"
          placeholder="Ingrese Rut"
          class="form-control mb-3 form-control-sm"
          id="filtroRutSaliente"
        />
      </div>

      <div class="col-sm-2 me-3">
        <label
          for="filtroRutEntrante"
          class="form-label col-form-label-sm fw-semibold text-secondary"
          >Buscar por Rut (entrante):</label
        >
        <input
          type="text"
          :value="modelValue.rutEntrante"
          @input="updateFilter('rutEntrante', $event)"
          placeholder="Ingrese Rut"
          class="form-control mb-3 form-control-sm border-success-light"
          id="filtroRutEntrante"
        />
      </div>

      <div class="col-sm-2 me-3">
        <label for="fechaInicio" class="form-label col-form-label-sm fw-semibold text-secondary"
          >Desde:</label
        >
        <input
          type="date"
          :value="modelValue.fechaInicio"
          @input="updateFilter('fechaInicio', $event)"
          class="form-control mb-3 form-control-sm text-secondary"
          id="fechaInicio"
        />
      </div>

      <div class="col-sm-2 me-3">
        <label for="fechaFin" class="form-label col-form-label-sm fw-semibold text-secondary"
          >Hasta:</label
        >
        <input
          type="date"
          :value="modelValue.fechaFin"
          @input="updateFilter('fechaFin', $event)"
          class="form-control mb-3 form-control-sm text-secondary"
          id="fechaFin"
        />
      </div>

      <div class="col-sm-2 me-3">
        <label for="filtroServicio" class="form-label col-form-label-sm fw-semibold text-secondary"
          >Servicio</label
        >
        <select
          :value="modelValue.servicio"
          @change="updateFilter('servicio', $event)"
          class="form-select form-select-sm mb-3 text-secondary"
          id="filtroServicio"
        >
          <option value="">Todos los servicios</option>
          <option v-for="servicio in listaServicios" :key="servicio" :value="servicio">
            {{ servicio }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Definimos la interfaz para el objeto de filtros
interface HistoryFiltros {
  rutSaliente: string
  rutEntrante: string
  fechaInicio: string
  fechaFin: string
  servicio: string
}

// 1. Props: Recibir el objeto de filtros (modelValue) y la lista de opciones.
const props = defineProps<{
  listaServicios: string[]
  modelValue: HistoryFiltros // Necesario para el v-model
}>()

// 2. Emits: Notificar al padre cuando los filtros cambian (update:modelValue).
const emit = defineEmits<{
  (e: 'update:modelValue', newFilters: HistoryFiltros): void
}>()

// 3. Función clave: Actualizar y Emitir
// Usamos una función para manejar el evento de manera segura y genérica.
const updateFilter = (key: keyof HistoryFiltros, event: Event) => {
  // Aserción de tipo para acceder a .value de manera segura y evitar el error 'possibly null'
  const target = event.target as HTMLInputElement | HTMLSelectElement
  const value = target?.value ?? '' // Obtener el valor o un string vacío si es nulo

  // Emitir el objeto completo de filtros con la propiedad cambiada
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value // Usamos la clave dinámica
  })
}
</script>

<style scoped>
/* REUTILIZAMOS EXACTAMENTE LOS MISMOS ESTILOS DEL COMPONENTE ORIGINAL */
.bg-warning-light {
background-color: #fff7e0 !important;
}
.bg-success-light {
background-color: #e3f7ea !important;
}

.filter-card {
background-color: #ffffff;
border-radius: 0.75rem;
border: 1px solid #dee2e6;
}

.form-label {
color: #495057;
margin-bottom: 0.25rem;
}

.form-control,
.form-select {
border-radius: 0.5rem;
border-color: #ced4da;
transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.form-control:focus,
.form-select:focus {
border-color: #80bdff;
box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}
</style>
