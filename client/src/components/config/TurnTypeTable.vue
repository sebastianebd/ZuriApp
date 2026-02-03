<template>
  <div class="modern-table-container">
    <table class="table modern-table mb-0">
      <thead>
        <tr>
          <th scope="col" class="ps-4" style="width: 10%">Código</th>
          <th scope="col" style="width: 25%">Turno</th>
          <th scope="col" style="width: 25%">Detalles</th>
          <th scope="col" style="width: 15%">Ciclo</th>
          <th scope="col" style="width: 10%">Estado</th>
          <th scope="col" class="text-end pe-4" style="width: 15%">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <!-- Empty State -->
        <tr v-if="turnTypes.length === 0">
          <td colspan="6" class="text-center py-5 text-muted small">
            No hay tipos de turno registrados
          </td>
        </tr>

        <tr
          v-for="(item, index) in turnTypes"
          :key="item._id"
          class="data-row"
          :class="{ 'row-inactive': !item.activo }"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- Código (New First Column) -->
          <td class="ps-4 first-cell">
            <span class="badge bg-light text-secondary border small font-monospace">
              {{ item.codigo || '---' }}
            </span>
          </td>

          <!-- Turno (Info Only) -->
          <td>
            <div class="d-flex flex-column">
              <span class="fw-bold text-dark">{{ formatTitleCase(item.nombre) }}</span>
              <div class="d-flex gap-2 align-items-center mt-1">
                <span
                  v-if="item.alias"
                  class="badge bg-info bg-opacity-10 text-info border border-info small"
                >
                  {{ item.alias }}
                </span>
              </div>
            </div>
          </td>

          <!-- Detalles -->
          <td>
            <div class="d-flex flex-column gap-1">
              <span class="text-dark small fw-medium" v-if="item.jornada">
                {{ item.jornada }}
              </span>
              <span class="text-muted x-small text-truncate" style="max-width: 200px">
                {{ item.descripcion || 'Sin descripción' }}
              </span>
            </div>
          </td>

          <!-- Ciclo -->
          <td>
            <span class="badge bg-light text-dark border fw-normal px-3 py-1">
              {{ item.cantidad_dias }} Días
            </span>
          </td>

          <!-- Estado -->
          <td>
            <div class="h-100 d-flex align-items-center justify-content-center">
              <span class="status-glass" :class="item.activo ? 'glass-success' : 'glass-inactive'">
                {{ item.activo ? 'ACTIVO' : 'INACTIVO' }}
              </span>
            </div>
          </td>

          <!-- Acciones -->
          <td class="pe-4 text-end last-cell">
            <div class="actions-wrapper h-100 d-flex align-items-center justify-content-end gap-2">
              <button class="btn-glass btn-edit" @click="$emit('edit', item)" title="Editar">
                <i class="bi bi-pencil-fill"></i>
              </button>
              <button class="btn-glass btn-delete" @click="$emit('delete', item)" title="Eliminar">
                <i class="bi bi-trash3-fill"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { TurnType } from '@/stores/turn-type.store'
import { formatTitleCase } from '@/utils/text-formatters'

defineProps<{
  turnTypes: TurnType[]
}>()

defineEmits(['edit', 'delete'])
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
  padding: 0 4px 10px 4px;
}

.modern-table {
  border-collapse: separate;
  border-spacing: 0 8px; /* Vertical gap */
  width: 100%;
}

.modern-table thead th {
  border: none;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #94a3b8;
  padding-bottom: 8px;
  background: transparent;
}

/* --- Row Styling --- */
.data-row {
  animation: slideUpFade 0.5s ease-out forwards;
  opacity: 0;
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

.row-inactive td {
  opacity: 0.6;
  background-color: #f8fafc;
}

.x-small {
  font-size: 0.75rem;
}

/* Glass Status */
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
.glass-inactive {
  background: rgba(100, 116, 139, 0.1); /* Slate */
  color: #475569;
  border: 1px solid rgba(100, 116, 139, 0.2);
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
  color: #cbd5e1;
}

.data-row:hover .btn-glass {
  color: #64748b;
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
.btn-delete:hover {
  background: #fef2f2;
  color: #ef4444;
}
</style>
