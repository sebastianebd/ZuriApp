<template>
  <div class="contract-card">
    <!-- Header -->
    <div class="cc-header">
      <div class="cc-code-group">
        <span class="cc-code" data-test="contract-code">
          <i class="bi bi-file-earmark-text-fill"></i>
          {{ contract.businessCode }}
        </span>
        <button
          type="button"
          class="cc-copy"
          title="Copiar código de reemplazo"
          data-test="copy-code-btn"
          @click="handleCopyCode"
        >
          <i class="bi bi-clipboard"></i>
        </button>
        <span
          v-if="showCopyFeedback"
          class="cc-copied"
          data-test="copy-feedback"
        >
          Copiado
        </span>
      </div>

      <span
        class="cc-status"
        :class="getStatusClass(contract.status)"
        data-test="contract-status"
      >
        {{ contract.status }}
      </span>
    </div>

    <!-- Service & Dates -->
    <h3 class="cc-service" data-test="contract-service">
      {{ contract.serviceName }}
    </h3>

    <div class="cc-dates" data-test="contract-dates">
      <i class="bi bi-calendar-range"></i>
      {{ formatDate(contract.startDate) }} al {{ formatDate(contract.endDate) }}
      ({{ contract.totalDays }} días)
    </div>

    <!-- Stats grid -->
    <div class="cc-stats">
      <div class="cc-stat">
        <span class="cc-stat-label">Jornadas comprometidas</span>
        <strong class="cc-stat-value" data-test="contract-shifts-count">
          {{ contract.shiftsCommittedCount }} turnos
        </strong>
      </div>
      <div class="cc-stat">
        <span class="cc-stat-label">Origen</span>
        <strong class="cc-stat-value">{{ contract.origin }}</strong>
      </div>
    </div>

    <!-- Download action -->
    <button
      type="button"
      class="cc-download"
      :disabled="isDownloading"
      data-test="download-voucher-btn"
      @click="handleDownloadVoucher"
    >
      <span
        v-if="isDownloading"
        class="spinner-border spinner-border-sm me-2"
      ></span>
      <i v-else class="bi bi-file-earmark-arrow-down me-2"></i>
      Descargar comprobante (PDF)
    </button>
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

function getStatusClass(status: string) {
  switch (status) {
    case 'Activo':
      return 'cc-status--active'
    case 'Finalizado':
      return 'cc-status--done'
    case 'Corte Anticipado':
      return 'cc-status--early'
    default:
      return 'cc-status--default'
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
@use '@/assets/styles/portal-theme' as t;

.contract-card {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  padding: t.$space-4;
  box-shadow: t.$shadow-sm;
  border-left: 3px solid t.$zuri-accent;
  transition: box-shadow t.$transition-base;

  &:hover {
    box-shadow: t.$shadow-md;
  }
}

.cc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: t.$space-3;
}

.cc-code-group {
  display: flex;
  align-items: center;
  gap: t.$space-2;
}

.cc-code {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  font-family: t.$font-family-mono;
  color: t.$zuri-brand;
  background: t.$zuri-accent-subtle;
  padding: 2px t.$space-2;
  border-radius: t.$radius-xs;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.cc-copy {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: t.$zuri-text-subtle;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: t.$radius-xs;
  font-size: 0.8rem;
  transition: all t.$transition-fast;

  &:hover {
    background: t.$zuri-surface;
    color: t.$zuri-brand;
  }
}

.cc-copied {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-success;
}

.cc-status {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  padding: 2px t.$space-2;
  border-radius: t.$radius-xs;

  &--active {
    background: t.$zuri-success-subtle;
    color: t.$zuri-success;
  }

  &--done {
    background: t.$zuri-divider;
    color: t.$zuri-text-muted;
  }

  &--early {
    background: t.$zuri-warning-subtle;
    color: darken(t.$zuri-warning, 15%);
  }

  &--default {
    background: t.$zuri-surface;
    color: t.$zuri-text-muted;
  }
}

.cc-service {
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
  margin: 0 0 t.$space-1;
}

.cc-dates {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: t.$space-3;
}

.cc-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: t.$space-3;
  padding: t.$space-3 0;
  border-top: 1px solid t.$zuri-divider;
  border-bottom: 1px solid t.$zuri-divider;
  margin-bottom: t.$space-3;
}

.cc-stat-label {
  display: block;
  font-size: t.$font-size-xs;
  color: t.$zuri-text-subtle;
  letter-spacing: t.$letter-spacing-wide;
  margin-bottom: 2px;
}

.cc-stat-value {
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-heading;
  font-variant-numeric: tabular-nums;
}

.cc-download {
  width: 100%;
  padding: t.$space-3;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-brand;
  background: transparent;
  border: 1.5px solid t.$zuri-brand;
  border-radius: t.$radius-md;
  cursor: pointer;
  transition: all t.$transition-base;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: t.$zuri-brand;
    color: #ffffff;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
