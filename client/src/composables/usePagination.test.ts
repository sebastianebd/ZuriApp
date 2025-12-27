import { describe, it, expect } from 'vitest'
import { usePagination } from './usePagination'
import { ref } from 'vue'

describe('usePagination', () => {
  it('should calculate total pages correctly', () => {
    const items = ref(Array.from({ length: 25 }, (_, i) => ({ id_negocio: `RP${i}` })))
    const { totalPages } = usePagination(items, 10)

    expect(totalPages.value).toBe(3) // 25 items / 10 per page = 2.5 -> ceil(2.5) = 3
  })

  it('should paginate items correctly', () => {
    // Logic inside uses id_negocio parsing for sorting: b - a (Descedning)
    // RP2 vs RP1 -> 2 - 1 = 1 (positive) -> b comes first?
    // sort(a,b) return b - a means DESCENDING order.

    const items = ref([{ id_negocio: 'RP10' }, { id_negocio: 'RP5' }, { id_negocio: 'RP20' }])

    const { paginatedItems } = usePagination(items, 10)

    // Should be sorted by number descending: 20, 10, 5
    expect(paginatedItems.value).toHaveLength(3)
    expect(paginatedItems.value[0].id_negocio).toBe('RP20')
    expect(paginatedItems.value[1].id_negocio).toBe('RP10')
    expect(paginatedItems.value[2].id_negocio).toBe('RP5')
  })

  it('should change pages', () => {
    const items = ref(Array.from({ length: 15 }, (_, i) => ({ id_negocio: `RP${i}` })))
    const { currentPage, changePage, paginatedItems } = usePagination(items, 10)

    // Page 1
    expect(currentPage.value).toBe(1)
    expect(paginatedItems.value).toHaveLength(10)

    // Go to Page 2
    changePage(2)
    expect(currentPage.value).toBe(2)
    expect(paginatedItems.value).toHaveLength(5)

    // Go to Invalid Page
    changePage(3) // Only 2 pages exist
    expect(currentPage.value).toBe(2) // Should remain on 2

    changePage(0)
    expect(currentPage.value).toBe(2) // Should remain on 2
  })
})
