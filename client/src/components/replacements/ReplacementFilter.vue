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
          v-model="store.filtroRutSaliente"
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
          v-model="store.filtroRutEntrante"
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
          v-model="store.fechaInicio"
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
          v-model="store.fechaFin"
          class="form-control mb-3 form-control-sm text-secondary"
          id="fechaFin"
        />
      </div>

      <div class="col-sm-2 me-3">
        <label for="filtroServicio" class="form-label col-form-label-sm fw-semibold text-secondary"
          >Servicio</label
        >
        <v-select
          id="filtroServicio"
          v-model="store.filtroServicio"
          :options="[
            { label: 'TODOS', value: '' },
            ...listaServicios.map((s) => ({ label: s, value: s }))
          ]"
          :reduce="(option: any) => option.value"
          label="label"
          :clearable="false"
          :searchable="true"
          placeholder="Seleccione un servicio"
          class="mb-3 text-secondary style-chooser"
        >
          <!-- Personalizamos la opción seleccionada -->
          <template #selected-option="{ label }">
            <span class="text-secondary">{{ label }}</span>
          </template>
        </v-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReplacementStore } from '@/stores/replacement.store'

// 💡 Props: El componente de filtros recibe las opciones para el select
defineProps({
  listaServicios: {
    type: Array as () => string[],
    required: true
  }
})

// 💡 Acceso Directo al Store:
// Los v-model apuntan directamente al estado del store, sin necesidad de emitir eventos.
const store = useReplacementStore()
</script>

<style scoped>
/* 🎨 Colores base de la tabla para filtros */
.bg-warning-light {
  background-color: #fff7e0 !important;
}
.bg-success-light {
  background-color: #e3f7ea !important;
}

/* 🖼️ Estilo de la tarjeta de filtros */
.filter-card {
  background-color: #ffffff; /* Fondo blanco */
  border-radius: 0.75rem; /* Bordes redondeados como la tabla */
  border: 1px solid #dee2e6; /* Borde suave */
  /* padding ya lo tienes en la estructura de Bootstrap */
}

/* 🖋️ Estilo de las etiquetas de formulario */
.form-label {
  color: #495057; /* Color de texto consistente con las celdas */
  margin-bottom: 0.25rem; /* Espacio reducido entre label e input */
}

/* 📥 Estilo de los inputs y selects */
.form-control,
.form-select {
  border-radius: 0.5rem; /* Bordes redondeados para inputs/selects */
  border-color: #ced4da; /* Borde estándar */
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.form-control:focus,
.form-select:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}
</style>
