import { computed, ref, type Ref } from 'vue';

interface Pageable {
    id_negocio: string;
}

export function usePagination<T extends Pageable>(items: Ref<T[]>, itemsPerPage = 16) {
    const currentPage = ref(1);

    const totalPages = computed(() => {
        return Math.ceil(items.value.length / itemsPerPage);
    });

    const paginatedItems = computed(() => {
        const sorted = [...items.value].sort((a, b) => {
            const numA = parseInt(a.id_negocio.replace(/\D/g, ''), 10);
            const numB = parseInt(b.id_negocio.replace(/\D/g, ''), 10);
            return numB - numA;
        });

        const start = (currentPage.value - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return sorted.slice(start, end);
    });

    function changePage(page: number) {
        if (page >= 1 && page <= totalPages.value) {
            currentPage.value = page;
        }
    }

    return {
        currentPage,
        itemsPerPage,
        totalPages,
        paginatedItems,
        changePage,
    };
}