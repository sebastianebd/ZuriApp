<template>
  <div
    class="shift-cell w-100 d-flex align-items-center justify-content-center position-relative"
    :class="cellClasses"
    :style="getShiftStyle(shift)"
    @mouseenter="$emit('mouseenter', $event, item, date)"
    @mouseleave="$emit('mouseleave')"
    @click="$emit('click', item, date)"
  >
    <span
      class="shift-sigla fw-bold"
      :class="{ 'text-muted fw-normal opacity-50 empty-sigla': !shift?.sigla }"
    >
      {{ shift?.sigla || '–' }}
    </span>

    <!-- Mini indicador de reemplazo -->
    <span
      v-if="shift?.replacementCode"
      class="replacement-badge"
      title="Reemplazo asignado"
    >
      R
    </span>

    <!-- Mini indicador de excepción -->
    <span
      v-if="historyMode && hasException(item._id, date)"
      class="exception-indicator-dot"
      title="Excepción registrada"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GridRow, ShiftResult } from '@/composables/current-shifts/useShiftsGrid'

const props = defineProps<{
  item: GridRow
  date: Date
  getShiftClass: (shift: ShiftResult | null) => string
  getShiftStyle: (shift: ShiftResult | null) => any
  readonly: boolean
  historyMode: boolean
  hasUpdatePermission: boolean
  isEditableDate: (date: Date) => boolean
  isRecentlyModified: (id: string, date: Date) => boolean
  hasException: (id: string, date: Date) => boolean
}>()

defineEmits<{
  (e: 'mouseenter', event: MouseEvent, item: GridRow, date: Date): void
  (e: 'mouseleave'): void
  (e: 'click', item: GridRow, date: Date): void
}>()

const shift = computed<ShiftResult | null>(() => {
  return props.item.getShift(props.date)
})

const cellClasses = computed(() => {
  const currentShift = shift.value
  return [
    props.getShiftClass(currentShift),
    {
      'replacement-shift': !!currentShift?.replacementCode,
      'clickable-shift': !props.readonly && currentShift && props.isEditableDate(props.date) && props.hasUpdatePermission,
      'recently-modified': props.isRecentlyModified(props.item._id, props.date),
      'exception-modified': props.historyMode && props.hasException(props.item._id, props.date)
    }
  ]
})
</script>

<style scoped>
.shift-cell {
  height: 34px;
  border-radius: 7px;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  font-size: 0.8125rem;
  cursor: default;
  border: 1px solid transparent;
  user-select: none;
}

.shift-custom-color {
  border-color: rgba(0, 0, 0, 0.07);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.empty-sigla {
  color: #cbd5e1;
  font-size: 0.875rem;
}

.shift-sigla {
  letter-spacing: 0.02em;
}

/* Clickable hover physics */
.clickable-shift {
  cursor: pointer;
}

.clickable-shift:hover {
  transform: translateY(-1px) scale(1.06);
  box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 5;
  filter: brightness(0.97);
}

.clickable-shift:active {
  transform: scale(0.96);
}

/* Replacement shift styling */
.replacement-shift {
  border: 1.5px dashed #0284c7 !important;
  box-shadow: inset 0 0 0 1px rgba(2, 132, 199, 0.15);
}

.replacement-badge {
  position: absolute;
  bottom: 1px;
  right: 2px;
  font-size: 0.55rem;
  font-weight: 800;
  line-height: 1;
  color: #0369a1;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 3px;
  padding: 1px 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Exception indicator dot */
.exception-indicator-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background-color: #f59e0b;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #ffffff;
}

/* Recently modified pulse animation */
.recently-modified {
  animation: pulseRing 1.5s infinite;
}

@keyframes pulseRing {
  0% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(37, 99, 235, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
  }
}
</style>
