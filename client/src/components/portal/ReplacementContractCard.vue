<template>
  <div class="card border-0 shadow-sm rounded-4 mb-3 contract-card">
    <div class="card-body p-3">
      <!-- Header de la tarjeta -->
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-primary-subtle text-primary border border-primary px-2 py-1 rounded-pill">
            <i class="bi bi-file-earmark-text-fill me-1"></i>
            <span data-test="contract-code">{{ contract.businessCode }}</span>
          </span>
          <button
            type="button"
            class="btn btn-sm btn-light p-1 rounded-circle copy-btn"
            title="Copiar código de reemplazo"
            data-test="copy-code-btn"
            @click="handleCopyCode"
          >
            <i class="bi bi-clipboard"></i>
          </button>
          <span
            v-if="showCopyFeedback"
            class="badge bg-success-subtle text-success small"
            data-test="copy-feedback"
          >
            ¡Copiado!
          </span>
        </div>

        <span
          class="badge rounded-pill px-2 py-1"
          :class="getStatusBadgeClass(contract.status)"
          data-test="contract-status"
        >
          {{ contract.status }}
        </span>
      </div>

      <!-- Servicio y Vigencia -->
      <h6 class="fw-bold text-dark mb-1" data-test="contract-service">
        {{ contract.serviceName }}
      </h6>

      <div class="text-muted small mb-2" data-test="contract-dates">
        <i class="bi bi-calendar-range me-1"></i>
        {{ formatDate(contract.startDate) }} al {{ formatDate(contract.endDate) }}
        ({{ contract.totalDays }} días)
      </div>

      <!-- Detalles y Estadísticas -->
      <div class="row g-2 py-2 border-top border-bottom text-muted small my-2">
        <div class="col-6">
          <span class="d-block text-secondary">Jornadas Comprometidas</span>
          <strong class="text-dark" data-test="contract-shifts-count">
            {{ contract.shiftsCommittedCount }} turnos
          </strong>
        </div>
        <div class="col-6">
          <span class="d-block text-secondary">Origen</span>
          <strong class="text-dark">{{ contract.origin }}</strong>
        </div>
      </div>

      <!-- Acción: Descargar Comprobante PDF -->
      <div class="d-grid mt-3">
        <button
          type="button"
          class="btn btn-outline-primary btn-sm py-2 fw-semibold"
          :disabled="isDownloading"
          data-test="download-voucher-btn"
          @click="handleDownloadVoucher"
        >
          <span
            v-if="isDownloading"
            class="spinner-border spinner-border-sm me-2"
          ></span>
          <i v-else class="bi bi-file-earmark-pdf-fill text-danger me-2"></i>
          Descargar Comprobante (PDF)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePortalStore } from '@/stores/portal.store'
import type { PortalReplacementContract } from '@/types/portal.types'

const props = defineProps<{
  contract: PortalReplacementContract
}>()

const portalStore = usePortalStore()
const isDownloading = ref(false)
const showCopyFeedback = ref(false)

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'Activo':
      return 'bg-success-subtle text-success border border-success'
    case 'Finalizado':
      return 'bg-secondary-subtle text-secondary border border-secondary'
    case 'Corte Anticipado':
      return 'bg-warning-subtle text-warning-emphasis border border-warning'
    default:
      return 'bg-light text-dark'
  }
}

async function handleCopyCode() {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.contract.businessCode)
      showCopyFeedback.value = true
      setTimeout(() => {
        showCopyFeedback.value = false
      }, 2000)
    }
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error)
  }
}

async function handleDownloadVoucher() {
  isDownloading.value = true
  try {
    await portalStore.downloadReplacementVoucherPdf(props.contract.id)
  } catch (error) {
    console.error('Error descargando comprobante PDF:', error)
  } finally {
    isDownloading.value = false
  }
}
</script>

<style scoped lang="scss">
.contract-card {
  background: #ffffff;
  border-left: 4px solid #0d6efd !important;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .copy-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
