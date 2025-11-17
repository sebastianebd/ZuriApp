// src/composables/useDataPicker.ts

import { ref, computed } from 'vue';

interface DataPickerProps {
    fechasBloqueadas: string[] | null | undefined;
}

/**
 * Hook para gestionar la configuración, el estado inicial (date) y el estado de V-Calendar.
 */
export function useDatePicker(props: DataPickerProps) {
    
    // 1. ESTADO INICIAL REQUERIDO POR EL USUARIO
    // Se define y exporta para que cada componente tenga su propia instancia inicializada.
    const date = ref(new Date()); 

    // 2. Fechas Deshabilitadas Procesadas
    const isDisabled = computed(() => {
        if (!props.fechasBloqueadas) return [];
        return props.fechasBloqueadas.map((f) => {
            // Se usa T12:00:00 para evitar el desfase por Timezone
            return new Date(`${f}T12:00:00`); 
        });
    });

    // 3. Configuración del Popover
    const popoverConfig = ref({
        visibility: 'focus' as const,
        placement: 'right' as const,
        hideDelay: 50,
    });

    // 4. Atributos de Estilo
    const dateAttributes = computed(() => {
        return [
            {
                key: 'disabled-dates',
                highlight: {
                    color: 'red',
                    fillMode: 'light'
                },
                dates: isDisabled.value,
                exclude: {
                    weekdays: []
                }
            }
        ];
    });

    return {
        date, // ¡Exportamos el ref de la fecha!
        popoverConfig,
        dateAttributes,
        isDisabled 
    };
}