<template>
  <div class="d-flex flex-column gap-3 pb-4 px-2 mt-2">
    <!-- Empty State -->
    <div v-if="roles.length === 0" class="text-center py-5">
      <div class="d-flex flex-column align-items-center justify-content-center text-slate-400">
        <div class="empty-icon-box mb-3"><i class="bi bi-shield-lock display-6"></i></div>
        <span class="text-sm fw-medium">No hay roles registrados en el sistema</span>
      </div>
    </div>

    <!-- Stacked Card List -->
    <div
      v-for="role in roles"
      :key="role._id"
      class="vanguard-list-card"
    >
      <div class="card-accent-line bg-indigo-500"></div>
      
      <div class="card-grid-layout p-4 w-100">
        <!-- 1. Identificación -->
        <div class="d-flex flex-column justify-content-center">
          <span class="text-xs text-slate-400 font-monospace mb-1"><i class="bi bi-hash me-1"></i>{{ role.code || 'S/N' }}</span>
          <h6 class="m-0 text-slate-900 fw-bold fs-6">{{ formatTitleCase(role.name) }}</h6>
          <span class="text-xs text-slate-500 mt-1 d-flex align-items-center gap-1" style="max-width: 250px; line-height: 1.3">
            {{ role.description }}
          </span>
        </div>

        <!-- 2. Nivel & Permisos -->
        <div class="d-flex flex-column justify-content-center gap-2 border-start ps-4">
          <div class="d-flex align-items-center gap-3">
            <div class="bento-avatar bg-slate-50 text-slate-500 border">
              <i class="bi bi-bar-chart-fill"></i>
            </div>
            <div class="lh-1">
              <span class="text-sm fw-bold d-block mb-1" :class="(role.level || 0) === 100 ? 'text-danger' : 'text-slate-700'">
                Nivel {{ role.level || 10 }}
              </span>
              <span class="text-xxs text-slate-500 text-uppercase letter-spacing-1">Jerarquía</span>
            </div>
          </div>
          
          <div class="d-flex align-items-center gap-3">
            <div class="bento-avatar bg-slate-50 text-slate-500 border">
              <i class="bi bi-key-fill"></i>
            </div>
            <div class="lh-1">
              <span class="text-sm fw-bold text-slate-700 d-block mb-1">
                {{ role.permissions?.length || 0 }} Permisos
              </span>
              <span class="text-xxs text-slate-500 text-uppercase letter-spacing-1">Asignados</span>
            </div>
          </div>
        </div>

        <!-- 3. Acciones & Estado -->
        <div class="d-flex flex-column align-items-end justify-content-center gap-3 ms-auto">
          <span class="status-bento-badge" :class="role.hasSystemAccess ? 'badge-active-indigo' : 'badge-inactive'">
            <span class="pulse-dot-indigo" v-if="role.hasSystemAccess"></span>
            {{ role.hasSystemAccess ? 'Acceso al Sistema' : 'Sin Acceso' }}
          </span>
          
          <div class="d-flex gap-2">
            <button
              v-if="authStore.hasPermission('role.update')"
              class="bento-action-btn bg-white"
              @click="$emit('edit', role)"
              title="Editar"
            >
              <i class="bi bi-pencil-square text-slate-600"></i>
            </button>
            <button
              v-if="authStore.hasPermission('role.delete')"
              class="bento-action-btn bg-white text-danger-hover"
              @click="$emit('delete', role)"
              title="Eliminar"
            >
              <i class="bi bi-trash3 text-slate-400"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Role } from '@/stores/role.store'
import { useAuthStore } from '@/stores/auth.store'
import { formatTitleCase } from '@/utils/text-formatters'

defineProps<{
  roles: Role[]
}>()

defineEmits(['edit', 'delete'])
const authStore = useAuthStore()
</script>

<style scoped>
/* Copied and adapted from ServiceTable styles for consistency */

/* Colors mapped to standard slate palette */
.text-slate-900 { color: #0f172a; }
.text-slate-800 { color: #1e293b; }
.text-slate-700 { color: #334155; }
.text-slate-600 { color: #475569; }
.text-slate-500 { color: #64748b; }
.text-slate-400 { color: #94a3b8; }
.bg-slate-50 { background-color: #f8fafc; }
.bg-slate-100 { background-color: #f1f5f9; }
.bg-slate-300 { background-color: #cbd5e1; }
.bg-indigo-500 { background-color: #6366f1; }
.bg-indigo-50 { background-color: #eef2ff; }
.text-indigo-600 { color: #4f46e5; }

.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.text-xxs { font-size: 0.65rem; }
.letter-spacing-1 { letter-spacing: 0.05em; }

/* Stacked Card Layout */
.vanguard-list-card {
  position: relative;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
}

.vanguard-list-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.grayscale-card {
  filter: grayscale(100%);
}

.card-accent-line {
  width: 4px;
  flex-shrink: 0;
}

.card-grid-layout {
  display: grid;
  grid-template-columns: 2fr 1.5fr 200px;
  gap: 1.5rem;
  align-items: stretch;
}

/* Typography & Avatars */
.bento-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  border: 1px solid rgba(0,0,0,0.05);
}

/* Status Badge */
.status-bento-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge-active-indigo {
  background-color: #eef2ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
}

.badge-inactive {
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.pulse-dot-indigo {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #6366f1;
  box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
  animation: pulse-indigo 2s infinite;
}

@keyframes pulse-indigo {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}

/* Actions */
.bento-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

.bento-action-btn:hover {
  background-color: #f8fafc !important;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.bento-action-btn.text-danger-hover:hover i {
  color: #ef4444 !important;
}

.empty-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}
</style>
