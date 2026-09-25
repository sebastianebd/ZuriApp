<template>
  <div
    v-if="modelValue && shift"
    class="sheet-backdrop"
    @click.self="close"
  >
    <div class="sheet-panel" data-test="shift-day-detail-sheet">
      <div class="sheet-handle"></div>

      <!-- Header with sigla + date -->
      <div class="sheet-header">
        <div class="sheet-header-left">
          <span
            class="sigla-badge"
            :class="getSiglaClass(shift.sigla)"
          >
            {{ shift.sigla }}
          </span>
          <div>
            <h2 class="sheet-title" data-test="detail-date">
              {{ formatDate(shift.date) }}
            </h2>
            <span class="sheet-subtitle">{{ getShiftName(shift.sigla) }}</span>
          </div>
        </div>

        <button type="button" class="sheet-close" aria-label="Close" @click="close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Detail card -->
      <div class="detail-card">
        <div class="detail-field detail-field--full">
          <span class="field-label">Servicio asignado</span>
          <strong class="field-value" data-test="detail-service">
            {{ shift.serviceName }}
          </strong>
        </div>

        <div class="detail-grid">
          <div class="detail-field">
            <span class="field-label">Horario de turno</span>
            <strong class="field-value" data-test="detail-hours">
              {{ shift.entryTime && shift.exitTime ? `${shift.entryTime} - ${shift.exitTime}` : 'Jornada libre' }}
            </strong>
          </div>
          <div class="detail-field">
            <span class="field-label">Estado confirmación</span>
            <strong
              class="field-value"
              :class="getConfirmationClass(shift.confirmationStatus)"
              data-test="detail-confirmation"
            >
              {{ getConfirmationText(shift.confirmationStatus) }}
            </strong>
          </div>
        </div>
      </div>

      <!-- Replacement Banner -->
      <div
        v-if="shift.isReplacement"
        class="replacement-banner"
        data-test="replacement-contract-banner"
      >
        <div class="banner-left">
          <span class="banner-tag">🤝 Reemplazo</span>
          <span class="banner-code">
            Contrato {{ shift.replacementBusinessCode || 'REP-OFICIAL' }}
          </span>
        </div>

        <button
          type="button"
          class="banner-btn"
          data-test="view-contract-link"
          @click="handleViewContract"
        >
          Ver contrato →
        </button>
      </div>

      <button type="button" class="btn-cancel" @click="close">
        Cerrar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PortalShiftItem } from '@/types/portal.types'

const props = defineProps<{
  modelValue: boolean
  shift: PortalShiftItem | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'view-contract', replacementId: string): void
}>()

function close() {
  emit('update:modelValue', false)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

function getSiglaClass(sigla: string) {
  switch (sigla) {
    case 'L':
      return 'sigla--largo'
    case 'N':
      return 'sigla--noche'
    case 'X':
      return 'sigla--libre'
    default:
      return 'sigla--default'
  }
}

function getShiftName(sigla: string) {
  switch (sigla) {
    case 'L':
      return 'Turno Largo (08:00 - 20:00)'
    case 'N':
      return 'Turno Noche (20:00 - 08:00)'
    case 'X':
      return 'Día Libre'
    default:
      return 'Jornada Hospitalaria'
  }
}

function getConfirmationText(status: string | undefined) {
  if (status === 'confirmed') return 'Asistencia confirmada'
  if (status === 'unavailable') return 'Indisponibilidad'
  return 'Pendiente'
}

function getConfirmationClass(status: string | undefined) {
  if (status === 'confirmed') return 'field-value--success'
  if (status === 'unavailable') return 'field-value--danger'
  return ''
}

function handleViewContract() {
  if (props.shift?.replacementId) {
    emit('view-contract', props.shift.replacementId)
    close()
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/portal-theme' as t;

.sheet-backdrop {
  position: fixed;
  inset: 0;
  background-color: t.$zuri-backdrop;
  z-index: 1050;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.sheet-panel {
  background: t.$zuri-surface-raised;
  width: 100%;
  max-width: t.$portal-max-width;
  border-radius: t.$radius-sheet t.$radius-sheet 0 0;
  padding: t.$space-5 t.$space-4 calc(#{t.$space-5} + #{t.$safe-area-bottom});
  box-shadow: t.$shadow-xl;
  animation: sheetUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: t.$zuri-border;
  border-radius: 2px;
  margin: -#{t.$space-2} auto t.$space-4 auto;
}

// --- Header ---
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: t.$space-4;
}

.sheet-header-left {
  display: flex;
  align-items: center;
  gap: t.$space-3;
}

.sigla-badge {
  width: 38px;
  height: 38px;
  border-radius: t.$radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: t.$font-weight-bold;
  font-size: t.$font-size-base;
  flex-shrink: 0;

  &.sigla--largo {
    background: t.$sigla-largo-bg;
    color: t.$sigla-largo-text;
  }

  &.sigla--noche {
    background: t.$sigla-noche-bg;
    color: t.$sigla-noche-text;
  }

  &.sigla--libre {
    background: t.$sigla-libre-bg;
    color: t.$sigla-libre-text;
  }

  &.sigla--default {
    background: t.$zuri-divider;
    color: t.$zuri-text-muted;
  }
}

.sheet-title {
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  margin: 0;
}

.sheet-subtitle {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
}

.sheet-close {
  width: 32px;
  height: 32px;
  border: none;
  background: t.$zuri-surface;
  border-radius: t.$radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: t.$zuri-text-muted;
  cursor: pointer;
  transition: all t.$transition-base;

  &:hover {
    background: t.$zuri-danger-subtle;
    color: t.$zuri-danger;
  }
}

// --- Detail Card ---
.detail-card {
  background: t.$zuri-surface;
  border-radius: t.$radius-md;
  padding: t.$space-4;
  margin-bottom: t.$space-4;
}

.detail-field--full {
  margin-bottom: t.$space-3;
  padding-bottom: t.$space-3;
  border-bottom: 1px solid t.$zuri-divider;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: t.$space-3;
}

.field-label {
  display: block;
  font-size: t.$font-size-xs;
  color: t.$zuri-text-subtle;
  letter-spacing: t.$letter-spacing-wide;
  margin-bottom: 2px;
}

.field-value {
  display: block;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-heading;

  &--success {
    color: t.$zuri-success;
  }

  &--danger {
    color: t.$zuri-danger;
  }
}

// --- Replacement Banner ---
.replacement-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: t.$space-3 t.$space-4;
  background: t.$zuri-warning-subtle;
  border: 1px solid t.$zuri-warning;
  border-radius: t.$radius-md;
  margin-bottom: t.$space-4;
}

.banner-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.banner-tag {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  color: darken(t.$zuri-warning, 15%);
}

.banner-code {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-body;
}

.banner-btn {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
  background: transparent;
  border: 1px solid t.$zuri-text-heading;
  padding: t.$space-1 t.$space-3;
  border-radius: t.$radius-sm;
  cursor: pointer;
  transition: all t.$transition-base;
  white-space: nowrap;

  &:hover {
    background: t.$zuri-text-heading;
    color: #ffffff;
  }
}

// --- Bottom Action ---
.btn-cancel {
  width: 100%;
  padding: t.$space-3;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-muted;
  background: transparent;
  border: 1px solid t.$zuri-border;
  border-radius: t.$radius-md;
  cursor: pointer;
  transition: all t.$transition-base;

  &:hover {
    background: t.$zuri-surface;
  }
}

@keyframes sheetUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
</style>
