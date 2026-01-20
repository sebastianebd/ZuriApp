<template>
  <div
    class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top"
    v-if="totalPages > 1"
  >
    <span class="text-muted small"> Mostrando página {{ currentPage }} de {{ totalPages }} </span>
    <nav aria-label="Page navigation">
      <ul class="pagination pagination-sm mb-0 gap-1">
        <!-- Prev Button -->
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button
            class="page-link rounded-2 border-0 bg-light text-dark shadow-xs"
            @click="emitPage(currentPage - 1)"
            :disabled="currentPage === 1"
          >
            <i class="bi bi-chevron-left small"></i>
          </button>
        </li>

        <!-- Start Pages -->
        <li
          class="page-item"
          v-for="page in visiblePages"
          :key="page === '...' ? Math.random() : page"
          :class="{ active: currentPage === page, disabled: page === '...' }"
        >
          <span v-if="page === '...'" class="page-link border-0 text-muted">...</span>
          <button
            v-else
            class="page-link rounded-2 border-0 mx-1 shadow-xs"
            @click="emitPage(page as number)"
          >
            {{ page }}
          </button>
        </li>

        <!-- Next Button -->
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button
            class="page-link rounded-2 border-0 bg-light text-dark shadow-xs"
            @click="emitPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
          >
            <i class="bi bi-chevron-right small"></i>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits(['changePage'])

const emitPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('changePage', page)
  }
}

// Logic to truncate pages: 1 2 ... 5 6 7 ... 20
const visiblePages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  const delta = 2 // Pages to show around current
  const range: (number | string)[] = []

  // If total pages is small, show all
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      range.push(i)
    }
    return range
  }

  // Always show first
  range.push(1)

  // Calculate start and end of inner window
  let start = Math.max(2, current - delta)
  let end = Math.min(total - 1, current + delta)

  // Adjust if close to ends
  if (current <= delta + 2) {
    end = 5 // Show roughly 5 items if at start
  }
  if (current >= total - delta - 1) {
    start = total - 4
  }

  // Add ellipsis before
  if (start > 2) {
    range.push('...')
  }

  // Add inner range
  for (let i = start; i <= end; i++) {
    range.push(i)
  }

  // Add ellipsis after
  if (end < total - 1) {
    range.push('...')
  }

  // Always show last
  range.push(total)

  return range
})
</script>

<style scoped>
.page-link {
  padding: 0.5rem 0.8rem;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
  cursor: pointer;
}

.page-item.active .page-link {
  background-color: #3b82f6 !important;
  color: white !important;
}

.page-link:hover:not(.active):not(:disabled) {
  background-color: #e2e8f0 !important;
}
.page-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
