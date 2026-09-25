<template>
  <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content shadow-lg border-0">
        <div class="modal-header border-bottom">
          <div>
            <h5 class="modal-title fw-bold mb-0">
              <i class="bi bi-sliders text-primary me-2"></i>
              Ajuste de Dotación y Metas
            </h5>
            <small class="text-muted">Servicio: {{ serviceName }}</small>
          </div>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>

        <div class="modal-body p-4">
          <!-- Umbrales de Semáforo -->
          <div class="mb-4 p-3 bg-light rounded">
            <h6 class="fw-bold mb-3 d-flex align-items-center gap-2">
              <i class="bi bi-speedometer2 text-primary"></i>
              Umbrales de Alerta de Cobertura
            </h6>
            <div class="row g-3">
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-success">
                  <i class="bi bi-check-circle-fill me-1"></i> Meta Óptima (Verde) (%)
                </label>
                <input
                  v-model.number="formThresholds.verde"
                  type="number"
                  min="1"
                  max="100"
                  class="form-control"
                  placeholder="95"
                />
                <div class="form-text small">Porcentaje a partir del cual el servicio opera en estado óptimo.</div>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-warning">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i> Alerta Mínima (Amarillo) (%)
                </label>
                <input
                  v-model.number="formThresholds.amarillo"
                  type="number"
                  min="1"
                  max="100"
                  class="form-control"
                  placeholder="85"
                />
                <div class="form-text small">Bajo este porcentaje la cobertura se clasifica como déficit crítico.</div>
              </div>
            </div>
          </div>

          <!-- Puestos y Dotación Mínima -->
          <div>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="fw-bold mb-0 d-flex align-items-center gap-2">
                <i class="bi bi-person-badge text-primary"></i>
                Puestos Mínimos Requeridos por Cargo
              </h6>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                @click="addRow"
              >
                <i class="bi bi-plus-lg me-1"></i> Agregar Cargo
              </button>
            </div>

            <div v-if="staffingRows.length === 0" class="text-center py-4 text-muted border rounded">
              <i class="bi bi-inbox fs-3 mb-2"></i>
              <p class="small mb-0">No hay cargos configurados. Haga clic en "Agregar Cargo" para comenzar.</p>
            </div>

            <div v-else class="table-responsive">
              <table class="table table-bordered align-middle mb-0">
                <thead class="table-light small">
                  <tr>
                    <th>Cargo / Estamento</th>
                    <th style="width: 140px;" class="text-center">Mín. Día</th>
                    <th style="width: 140px;" class="text-center">Mín. Noche</th>
                    <th style="width: 60px;" class="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in staffingRows" :key="idx">
                    <td>
                      <select v-model="row.positionId" class="form-select form-select-sm" required>
                        <option value="" disabled>Seleccione un cargo...</option>
                        <option
                          v-for="pos in positionStore.positions"
                          :key="pos._id"
                          :value="pos._id"
                        >
                          {{ pos.name }} ({{ pos.position_code || 'General' }})
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        v-model.number="row.minimo_dia"
                        type="number"
                        min="0"
                        class="form-control form-control-sm text-center"
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <input
                        v-model.number="row.minimo_noche"
                        type="number"
                        min="0"
                        class="form-control form-control-sm text-center"
                        placeholder="0"
                      />
                    </td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn btn-sm btn-link text-danger p-0"
                        title="Eliminar cargo"
                        @click="removeRow(idx)"
                      >
                        <i class="bi bi-trash fs-6"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="modal-footer border-top bg-light">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="loading"
            @click="handleSave"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { usePositionStore } from '../../stores/position.store'
import type { UpdateServiceStaffingPayload } from '../../types/dashboard.types'

const props = defineProps<{
  show: boolean
  serviceId?: string
  serviceName?: string
  currentStaffing?: Array<{
    positionId: string
    positionName?: string
    minDay: number
    minNight: number
  }>
  currentThresholds?: {
    green: number
    yellow: number
  }
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: UpdateServiceStaffingPayload): void
}>()

const positionStore = usePositionStore()

interface StaffingRow {
  positionId: string
  minimo_dia: number
  minimo_noche: number
}

const staffingRows = ref<StaffingRow[]>([])
const formThresholds = ref<{ verde: number; amarillo: number }>({
  verde: 95,
  amarillo: 85,
})

const initializeForm = () => {
  if (props.currentThresholds) {
    formThresholds.value = {
      verde: props.currentThresholds.green ?? 95,
      amarillo: props.currentThresholds.yellow ?? 85,
    }
  }

  if (props.currentStaffing && props.currentStaffing.length > 0) {
    staffingRows.value = props.currentStaffing.map((item) => ({
      positionId: item.positionId,
      minimo_dia: item.minDay,
      minimo_noche: item.minNight,
    }))
  } else {
    staffingRows.value = []
  }
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      initializeForm()
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await positionStore.fetchPositions()
})

const addRow = () => {
  staffingRows.value.push({
    positionId: '',
    minimo_dia: 0,
    minimo_noche: 0,
  })
}

const removeRow = (index: number) => {
  staffingRows.value.splice(index, 1)
}

const handleSave = () => {
  const payload: UpdateServiceStaffingPayload = {
    dotacion_minima: staffingRows.value
      .filter((row) => Boolean(row.positionId))
      .map((row) => ({
        positionId: row.positionId,
        minimo_dia: Number(row.minimo_dia) || 0,
        minimo_noche: Number(row.minimo_noche) || 0,
      })),
    umbrales_cobertura: {
      verde: Number(formThresholds.value.verde) || 95,
      amarillo: Number(formThresholds.value.amarillo) || 85,
    },
  }

  emit('save', payload)
}
</script>
