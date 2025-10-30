<template>
  <div
    class="modal"
    :class="{ show: visible }"
    tabindex="-1"
    role="dialog"
  >
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Seleccione Usuario</h5>
          <button type="button" class="close" @click="$emit('cerrar')" aria-label="Close">
            <span aria-hidden="true" class="h1">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <input type="text" v-model="filtroRutLocal" placeholder="Buscar por RUT" class="form-control form-control-sm" />
          </div>
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead class="thead-light">
                <tr>
                  <th scope="col" class="small">Rut</th>
                  <th scope="col" class="small">Nombre</th>
                  <th scope="col" class="small">Apellido</th>
                  <th scope="col" class="small">Direccion</th>
                  <th scope="col" class="small">Telefono</th>
                  <th scope="col" class="small">Email</th>
                  <th scope="col" class="small">Ciudad</th>
                  <th scope="col" class="small">Habilitado</th>
                </tr>
              </thead>
              <tbody class="customtable">
                <tr
                  v-for="(usuario, index) in usuariosFiltrados"
                  :key="index"
                  @click="seleccionarYEmitir(usuario)"
                  style="cursor: pointer;" >
                  <td class="small">{{ usuario.rut }}</td>
                  <td class="small">{{ usuario.nombre }}</td>
                  <td class="small">{{ usuario.apellido }}</td>
                  <td class="small">{{ usuario.direccion }}</td>
                  <td class="small">{{ usuario.telefono }}</td>
                  <td class="small">{{ usuario.email }}</td>
                  <td class="small">{{ usuario.ciudad }}</td>
                  <td class="small">{{ usuario.habilitado }}</td>
                </tr>
                <tr v-if="usuariosFiltrados.length === 0">
                    <td colspan="8" class="text-center text-muted">No se encontraron usuarios que coincidan con el filtro.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('cerrar')">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { User } from '@/types/models'

// 1. Props
const props = defineProps<{
  visible: boolean;
  usuarios: User[]; 
}>();

// 2. Emits
const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'usuario-seleccionado', usuario: User): void; 
}>();

const filtroRutLocal = ref('');

const usuariosFiltrados = computed(() => {
  if (filtroRutLocal.value) {
    // Filtramos la lista de usuarios que viene por props
    return props.usuarios.filter((usuario) => 
      usuario.rut.toLowerCase().startsWith(filtroRutLocal.value.toLowerCase())
    );
  }
  return props.usuarios;
});

// 4. Lógica de Selección
const seleccionarYEmitir = (usuario: User) => {
  // Emitimos el evento con el usuario seleccionado
  emit('usuario-seleccionado', usuario);
  // El padre será el encargado de cerrar el modal y asignar los datos.
};
</script>