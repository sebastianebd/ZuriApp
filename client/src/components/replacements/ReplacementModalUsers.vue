<template>
  <div
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    v-if="visible"
  >
    <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <!-- Header -->
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">SELECCIONAR USUARIO</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="$emit('cerrar')"
            aria-label="Close"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body bg-light">
          <div class="mb-3">
            <input
              type="text"
              v-model="filtroRutLocal"
              placeholder="Buscar por RUT"
              class="form-control form-control-sm border-primary shadow-sm"
            />
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle shadow-sm rounded">
              <thead class="table-primary text-center">
                <tr>
                  <th scope="col" class="small">RUT</th>
                  <th scope="col" class="small">Nombre</th>
                  <th scope="col" class="small">Apellido</th>
                  <th scope="col" class="small">Dirección</th>
                  <th scope="col" class="small">Teléfono</th>
                  <th scope="col" class="small">Email</th>
                  <th scope="col" class="small">Ciudad</th>
                  <th scope="col" class="small">Habilitado</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(usuario, index) in usuariosFiltrados"
                  :key="index"
                  @click="handleClick(usuario)"
                  :class="{
                    'table-hover-row': true,
                    'selected-row': usuarioSeleccionado?.rut === usuario.rut,
                  }"
                >
                  <td class="small">{{ usuario.rut }}</td>
                  <td class="small">{{ usuario.nombre }}</td>
                  <td class="small">{{ usuario.apellido }}</td>
                  <td class="small">{{ usuario.direccion }}</td>
                  <td class="small">{{ usuario.telefono }}</td>
                  <td class="small">{{ usuario.email }}</td>
                  <td class="small">{{ usuario.ciudad }}</td>
                  <td class="small">{{ usuario.habilitado ? 'Sí' : 'No' }}</td>
                </tr>

                <tr v-if="usuariosFiltrados.length === 0">
                  <td colspan="8" class="text-center text-muted py-3">
                    No se encontraron usuarios que coincidan con el filtro.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer bg-light">
          <button
            type="button"
            class="btn btn-secondary px-4"
            @click="$emit('cerrar')"
          >
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

const props = defineProps<{
  visible: boolean
  usuarios: User[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'usuario-seleccionado', usuario: User): void
}>()

const filtroRutLocal = ref('')
const usuarioSeleccionado = ref<User | null>(null)
let lastClickTime = 0

const usuariosFiltrados = computed(() => {
  if (filtroRutLocal.value) {
    return props.usuarios.filter((u) =>
      u.rut.toLowerCase().startsWith(filtroRutLocal.value.toLowerCase())
    )
  }
  return props.usuarios
})

function handleClick(usuario: User) {
  const now = Date.now()
  const doubleClick = now - lastClickTime < 300 // si el segundo click ocurre dentro de 300ms

  if (doubleClick && usuarioSeleccionado.value?.rut === usuario.rut) {
    emit('usuario-seleccionado', usuario)
  } else {
    usuarioSeleccionado.value = usuario
  }

  lastClickTime = now
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

/* Hover sobre la fila */
.table-hover-row:hover {
  background-color: #e3f2fd !important;
  transition: background-color 0.2s ease-in-out;
}

/* Fila seleccionada */
.selected-row {
  background-color: #bbdefb !important;
  font-weight: 500;
}

/* Mejor aspecto para tabla */
.table {
  border-radius: 8px;
  overflow: hidden;
}

thead th {
  font-weight: 600;
  text-transform: uppercase;
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
</style>
