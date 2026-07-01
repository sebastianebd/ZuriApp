<template>
  <div
    class="shift-cell w-100 h-100 d-flex align-items-center justify-content-center position-relative"
    :class="cellClasses"
    :style="getShiftStyle(shift)"
    @mouseenter="$emit('mouseenter', $event, item, date)"
    @mouseleave="$emit('mouseleave')"
    @click="$emit('click', item, date)"
  >
    <span
      class="fw-bold"
      :class="{ 'text-muted fw-normal opacity-50': !shift?.sigla }"
    >
      {{ shift?.sigla || '–' }}
    </span>
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
