<template>
  <div class="card border shadow-xs h-100 top-staff-card">
    <div class="card-header bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon-mini text-primary">
          <i class="bi bi-people-fill fs-5"></i>
        </div>
        <h5 class="card-title fw-bold mb-0 text-dark">Top 5 Funcionarios Reemplazados</h5>
      </div>
      <span class="badge bg-light text-secondary border smaller">Personal Saliente</span>
    </div>

    <div class="card-body">
      <div v-if="staffList && staffList.length > 0" class="table-responsive">
        <table class="table table-hover align-middle mb-0 top-staff-table">
          <thead class="table-light smaller">
            <tr>
              <th style="width: 44px;" class="text-center">#</th>
              <th>Funcionario</th>
              <th>Cargo</th>
              <th class="text-center">Reemplazos</th>
              <th class="text-end pe-3">Turnos Cubiertos</th>
            </tr>
          </thead>
          <tbody class="small">
            <tr v-for="(staff, index) in staffList" :key="staff.staffId">
              <!-- Posición en Ranking -->
              <td class="text-center">
                <span
                  class="rank-badge fw-bold shadow-xs"
                  :class="getRankBadgeClass(index)"
                >
                  {{ index + 1 }}
                </span>
              </td>

              <!-- Funcionario + Avatar -->
              <td>
                <div class="d-flex align-items-center gap-2.5">
                  <div class="staff-mini-avatar">
                    {{ getInitials(staff.fullName) }}
                  </div>
                  <div>
                    <div class="fw-bold text-dark text-truncate" style="max-width: 180px;">
                      {{ staff.fullName }}
                    </div>
                    <div class="font-monospace text-secondary smaller">
                      {{ staff.rut }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Cargo -->
              <td>
                <span class="text-secondary small">{{ staff.positionName }}</span>
              </td>

              <!-- Cantidad de Reemplazos -->
              <td class="text-center">
                <span class="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1 font-monospace">
                  {{ staff.replacementCount }} {{ staff.replacementCount === 1 ? 'evento' : 'eventos' }}
                </span>
              </td>

              <!-- Turnos Cubiertos con Mini-Barra -->
              <td class="text-end pe-3">
                <div class="d-flex align-items-center justify-content-end gap-2">
                  <div class="mini-volume-track d-none d-md-block" style="width: 60px; height: 6px; background: #f1f5f9; border-radius: 3px;">
                    <div
                      class="h-100 bg-primary rounded-pill"
                      :style="{ width: `${getVolumePercentage(staff.totalShiftsReplaced)}%` }"
                    ></div>
                  </div>
                  <span class="fw-bold text-dark tabular-nums fs-6">
                    {{ staff.totalShiftsReplaced }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4">
        <i class="bi bi-shield-check fs-2 mb-2 text-success opacity-75"></i>
        <span class="small text-secondary">No se registran funcionarios salientes reemplazados en este período.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  staffList?: Array<{
    staffId: string
    fullName: string
    rut: string
    positionName: string
    replacementCount: number
    totalShiftsReplaced: number
  }>
}>()

function getRankBadgeClass(index: number): string {
  switch (index) {
    case 0:
      return 'rank-1'
    case 1:
      return 'rank-2'
    case 2:
      return 'rank-3'
    default:
      return 'rank-default'
  }
}

function getInitials(name: string): string {
  if (!name) return 'FN'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const maxShifts = computed(() => {
  if (!props.staffList || props.staffList.length === 0) return 1
  return Math.max(...props.staffList.map((s) => s.totalShiftsReplaced), 1)
})

function getVolumePercentage(shifts: number): number {
  return Math.round((shifts / maxShifts.value) * 100)
}
</script>

<style scoped lang="scss">
.top-staff-card {
  border-radius: 0.875rem;
  background: #ffffff;
  border-color: rgba(226, 232, 240, 0.9);
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.staff-mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  color: #1e293b;
  font-size: 0.725rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;

  &.rank-1 {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  }

  &.rank-2 {
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #e2e8f0;
  }

  &.rank-3 {
    background: #fafafa;
    color: #64748b;
    border: 1px solid #f1f5f9;
  }

  &.rank-default {
    background: transparent;
    color: #94a3b8;
  }
}

.top-staff-card {
  border-radius: 0.875rem;
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  overflow: hidden;
}

.card-header {
  background: transparent !important;
}

.shadow-xs {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.smaller {
  font-size: 0.725rem;
}
</style>
