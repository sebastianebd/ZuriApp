<template>
  <div class="modern-table-container">
    <table class="table modern-table mb-0">
      <thead>
        <tr>
          <th scope="col" class="ps-4">RUT</th>
          <th scope="col">Usuario</th>
          <th scope="col">Contacto</th>
          <th scope="col">Ubicación</th>
          <th scope="col">Rol</th>
          <th scope="col" class="text-center">Estado</th>
          <th scope="col" class="text-end pe-4">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(usuario, index) in usuarios"
          :key="usuario._id"
          class="data-row"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- RUT (Code Style) -->
          <td class="ps-4 first-cell">
            <div class="d-flex align-items-center" style="height: 100%">
              <button
                class="code-badge font-monospace border-0 d-flex align-items-center gap-2"
                @click.stop="copyCode(usuario.rut)"
                title="Copiar RUT"
              >
                <span :class="{ 'text-success': copiedId === usuario.rut }">
                  {{ usuario.rut }}
                </span>
                <i
                  class="bi"
                  :class="
                    copiedId === usuario.rut
                      ? 'bi-check-lg text-success'
                      : 'bi-clipboard opacity-50'
                  "
                  style="font-size: 0.7rem"
                ></i>
              </button>
            </div>
          </td>

          <!-- Usuario -->
          <td>
            <div class="user-node">
              <div class="avatar-modern bg-gradient-primary text-white shadow-sm">
                {{ getInitials(usuario.nombre + ' ' + usuario.apellido) }}
              </div>
              <div class="user-info ms-3">
                <div class="fw-bold text-dark text-truncate">
                  {{ formatShortName(usuario.nombre, usuario.apellido) }}
                </div>
                <div class="rut-text">#{{ usuario._id.slice(-6) }}</div>
              </div>
            </div>
          </td>

          <!-- Contacto -->
          <td>
            <div class="d-flex flex-column justify-content-center h-100 text-secondary x-small">
              <div class="d-flex align-items-center mb-1">
                <i class="bi bi-envelope me-2 text-primary opacity-50"></i> {{ usuario.email }}
              </div>
              <div class="d-flex align-items-center">
                <i class="bi bi-telephone me-2 text-success opacity-50"></i> {{ usuario.telefono }}
              </div>
            </div>
          </td>

          <!-- Ubicación -->
          <td>
            <div class="d-flex flex-column justify-content-center h-100">
              <span class="fw-medium text-dark x-small mb-1">{{
                usuario.ciudad || 'Sin ciudad'
              }}</span>
              <span class="text-muted x-small text-truncate" style="max-width: 150px">{{
                usuario.direccion || 'Sin dirección'
              }}</span>
            </div>
          </td>

          <!-- Rol -->
          <td>
            <span class="badge-modern-role">
              {{ usuario.tipo_cargo }}
            </span>
          </td>

          <!-- Estado -->
          <td class="text-center">
            <div class="h-100 d-flex align-items-center justify-content-center">
              <span
                class="status-glass"
                :class="usuario.habilitado === 'HABILITADO' ? 'glass-success' : 'glass-danger'"
              >
                {{ usuario.habilitado }}
              </span>
            </div>
          </td>

          <!-- Acciones -->
          <td class="pe-4 text-end last-cell">
            <div class="actions-wrapper h-100 d-flex align-items-center justify-content-end gap-2">
              <button @click="$emit('editar', usuario)" class="btn-glass btn-edit" title="Editar">
                <i class="bi bi-pencil-fill"></i>
              </button>

              <button
                @click="$emit('detalle', usuario)"
                class="btn-glass btn-history"
                title="Ver Historial"
              >
                <i class="bi bi-clock-history"></i>
              </button>

              <div class="vr mx-1 opacity-25" v-if="loginUser.tipo_cargo === 'ADMIN-TI'"></div>

              <button
                v-if="loginUser.tipo_cargo === 'ADMIN-TI'"
                @click="confirmarEliminacion(usuario)"
                class="btn-glass btn-delete"
                title="Eliminar"
              >
                <i class="bi bi-trash3-fill"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <ConfirmationModal
      v-if="mostrarModal"
      :visible="mostrarModal"
      :mensaje="mensajeModal"
      @confirmar="eliminarUsuarioConfirmado"
      @cancelar="cerrarModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

defineProps<{
  usuarios: any[]
  loginUser: any
}>()

const emit = defineEmits(['editar', 'eliminar', 'detalle'])

const mostrarModal = ref(false)
const usuarioAEliminar = ref<any>(null)
const mensajeModal = ref('¿Deseas eliminar este usuario?')
const copiedId = ref<string | null>(null)

function confirmarEliminacion(usuario: any) {
  usuarioAEliminar.value = usuario
  mensajeModal.value = `¿Seguro que deseas eliminar a ${usuario.nombre} ${usuario.apellido}?`
  mostrarModal.value = true
}

function eliminarUsuarioConfirmado() {
  if (usuarioAEliminar.value) emit('eliminar', usuarioAEliminar.value._id)
  cerrarModal()
}

function cerrarModal() {
  mostrarModal.value = false
  usuarioAEliminar.value = null
}

function getInitials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatShortName(nombre: string, apellido: string) {
  if (!nombre) return ''
  const n = nombre.split(' ')[0]
  const a = apellido ? apellido.split(' ')[0].charAt(0) + '.' : ''
  return `${n} ${a}`.toUpperCase()
}

async function copyCode(code: string) {
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    copiedId.value = code
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}
</script>

<style scoped>
/* --- Animation Keyframes --- */
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Container & Table Reset --- */
.modern-table-container {
  padding: 0 4px 10px 4px; /* Space for shadows + bottom padding, NO MAX-HEIGHT */
}

.modern-table {
  border-collapse: separate;
  border-spacing: 0 8px; /* Vertical gap between rows */
  width: 100%;
}

.modern-table thead th {
  border: none;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #94a3b8; /* slate-400 */
  padding-bottom: 8px;
  background: transparent;
}

/* --- Row Styling --- */
.data-row {
  animation: slideUpFade 0.5s ease-out forwards;
  opacity: 0; /* Init hidden for animation */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.data-row td {
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.02);
  padding: 1rem 0.5rem;
  vertical-align: middle;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.data-row td.first-cell {
  border-left: 1px solid rgba(0, 0, 0, 0.02);
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

.data-row td.last-cell {
  border-right: 1px solid rgba(0, 0, 0, 0.02);
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}

.data-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  z-index: 10;
  position: relative;
}

/* --- Typography & Components --- */
.code-badge {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.code-badge:hover {
  background: #e2e8f0;
  color: #334155;
}

.user-node {
  display: flex;
  align-items: center;
}

.avatar-modern {
  width: 38px;
  height: 38px;
  border-radius: 10px; /* Squircle */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #bfdbfe 0%, #3b82f6 100%);
  color: white;
}

.user-info {
  line-height: 1.2;
}

.rut-text {
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: monospace;
}

.x-small {
  font-size: 0.72rem;
}

.badge-modern-role {
  display: inline-flex;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e293b;
  background-color: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

/* Glass Status Pills */
.status-glass {
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.glass-success {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
}
.glass-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Glass Buttons */
.btn-glass {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.9rem;
  color: #cbd5e1; /* Hidden-ish by default */
}

.data-row:hover .btn-glass {
  color: #64748b; /* Visible on row hover */
  background: #f8fafc;
}

.btn-glass:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-edit:hover {
  background: #eff6ff;
  color: #3b82f6;
}
.btn-history:hover {
  background: #f0f9ff;
  color: #0ea5e9;
}
.btn-delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
</style>
