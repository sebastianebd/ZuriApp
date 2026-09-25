<template>
  <div class="card shadow-sm border-0 h-100">
    <div class="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-people text-primary fs-5"></i>
        <h5 class="card-title fw-bold mb-0">Top 5 Funcionarios Reemplazados</h5>
      </div>
      <span class="badge bg-light text-muted border small">Personal Saliente</span>
    </div>
    <div class="card-body">
      <div v-if="staffList && staffList.length > 0" class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light small">
            <tr>
              <th style="width: 40px;" class="text-center">#</th>
              <th>Funcionario</th>
              <th>Cargo</th>
              <th class="text-center">Reemplazos</th>
              <th class="text-end">Turnos Cubiertos</th>
            </tr>
          </thead>
          <tbody class="small">
            <tr v-for="(staff, index) in staffList" :key="staff.staffId">
              <td class="text-center">
                <span
                  class="badge rounded-circle d-inline-flex align-items-center justify-content-center"
                  :class="index === 0 ? 'bg-danger text-white' : index === 1 ? 'bg-warning text-dark' : 'bg-light text-dark border'"
                  style="width: 24px; height: 24px;"
                >
                  {{ index + 1 }}
                </span>
              </td>
              <td>
                <div class="fw-bold">{{ staff.fullName }}</div>
                <div class="text-muted small" style="font-size: 0.75rem;">{{ staff.rut }}</div>
              </td>
              <td class="text-muted">{{ staff.positionName }}</td>
              <td class="text-center">
                <span class="badge bg-primary-subtle text-primary px-2 py-1">
                  {{ staff.replacementCount }}
                </span>
              </td>
              <td class="text-end fw-bold text-dark">
                {{ staff.totalShiftsReplaced }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4">
        <i class="bi bi-check2-all fs-2 mb-2 text-success"></i>
        <span class="small">No se registran funcionarios salientes reemplazados en este período.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  staffList?: Array<{
    staffId: string
    fullName: string
    rut: string
    positionName: string
    replacementCount: number
    totalShiftsReplaced: number
  }>
}>()
</script>

<style scoped>
.bg-primary-subtle {
  background-color: #cfe2ff !important;
}
.text-primary {
  color: #084298 !important;
}
</style>
