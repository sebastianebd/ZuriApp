<template>
  <div class="modal fade show d-block" v-if="visible" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-md modal-dialog-centered" role="document">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <div class="modal-header bg-danger text-white rounded-top">
          <h5 class=" fst-italic fw-bold">SUSTITUCIÓN DE REEMPLAZANTE</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="$emit('cerrar')"
            aria-label="Close"
          ></button>
        </div>

        <div class="modal-body bg-light">
          <h5 class="text-danger mb-3"><i class="bi bi-exclamation-triangle-fill me-2"></i> Confirmación de Corte</h5>
          
          <div class="alert alert-warning border-0 p-3 mb-4 rounded-3 shadow-sm" role="alert">
            Esta acción **cierra** el segmento actual y **crea uno nuevo**. Ambos registros conservarán el Código del evento original.
          </div>

          <div class="border rounded-3 p-3 bg-white shadow-sm mb-4">
            <h6 class="text-secondary fw-semibold mb-3">Segmento Actual a Finalizar</h6>
            <p class="mb-1">
                <i class="bi bi-person-fill me-1 text-primary"></i> 
                Funcionario: **{{ registroActual.nombre_entrante }} {{ registroActual.apellido_entrante }}**
            </p>
            <p class="mb-1">
                <i class="bi bi-calendar-check me-1 text-primary"></i> 
                Inicio Original: **{{ registroActual.fecha_inicio }}**
            </p>

            <hr class="my-3">

            <div class="form-floating mb-3">
              <input
                type="date"
                id="fechaCorteA"
                :value="fechaCorteA"
                @input="$emit('update:fechaCorteA', ($event.target as HTMLInputElement).value)"
                class="form-control is-invalid" 
              />
              <label for="fechaCorteA">Último Día Trabajado (Funcionario A) <span class="text-danger">*</span></label>
              <div class="form-text text-danger">Esta será la nueva fecha de término del registro actual.</div>
            </div>
          </div>
          
          <div class="border rounded-3 p-3 bg-white shadow-sm">
            <h6 class="text-secondary fw-semibold mb-3">Nuevo Funcionario Entrante</h6>

            <div class="d-flex align-items-center mb-3">
                <div class="flex-grow-1">
                    <p class="mb-0">
                        <i class="bi bi-calendar-plus me-1 text-success"></i> 
                        Inicio del Nuevo Reemplazo: **{{ fechaInicioB || 'Día siguiente a la Fecha de Corte' }}**
                    </p>
                </div>
                <button
                    @click.prevent="$emit('buscar-usuario', 2)"
                    class="btn btn-success btn-sm fw-semibold"
                >
                    <i class="bi bi-person-add me-1"></i> Asignar
                </button>
            </div>
            
            <div class="form-floating mb-2">
              <input
                type="text"
                id="rutEntranteB"
                :value="nuevoFuncionarioB.rut_entrante || 'N/A'"
                class="form-control"
                disabled
              />
              <label for="rutEntranteB">RUT Nuevo Funcionario</label>
            </div>
            
            <div class="form-floating">
              <input
                type="text"
                id="nombreEntranteB"
                :value="`${nuevoFuncionarioB.nombre_entrante || ''} ${nuevoFuncionarioB.apellido_entrante || ''}` || 'Pendiente de selección'"
                class="form-control"
                disabled
              />
              <label for="nombreEntranteB">Nombre Completo</label>
            </div>
          </div>
        </div>

        <div class="modal-footer d-flex justify-content-center border-0 pb-4">
          <button
            type="button"
            class="btn btn-secondary px-4 fw-semibold me-2"
            @click="$emit('cerrar')"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn btn-danger px-4 fw-semibold" 
            @click="$emit('confirmar-sustitucion')"
            :disabled="!isFormValid"
          >
            Confirmar Sustitución y Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RegisterDataReemplazo } from '@/types/models'
import { computed } from 'vue'

interface ReemplazoModalData extends Partial<RegisterDataReemplazo> {
    fecha_inicio?: string
    fecha_termino?: string
}

// Define las propiedades que este modal necesita
const props = defineProps<{
    visible: boolean
    // El registro actual (Segmento A) que se va a cortar.
    registroActual: ReemplazoModalData 
    // La fecha que el usuario está ingresando para el corte de A.
    fechaCorteA: string 
    // Los datos del funcionario B que se seleccionaron en el modal de búsqueda (para mostrar).
    nuevoFuncionarioB: Partial<ReemplazoModalData> 
}>()

// Define los eventos que este modal emite
defineEmits<{
    (e: 'cerrar'): void
    // Evento para abrir el modal de búsqueda de usuarios
    (e: 'buscar-usuario', grupo: 1 | 2): void 
    // Evento para actualizar la fecha de corte ingresada por el usuario
    (e: 'update:fechaCorteA', nuevaFecha: string): void 
    // Evento de acción final: inicia la transacción atómica
    (e: 'confirmar-sustitucion'): void 
}>()

// ✅ Lógica computada para la fecha de inicio del Reemplazante B
// (Se recomienda hacer esta validación en el backend, pero la mostramos aquí)
const fechaInicioB = computed(() => {
    if (!props.fechaCorteA) return ''
    
    // Calcula el día siguiente a la fecha de corte
    const corte = new Date(props.fechaCorteA)
    corte.setDate(corte.getDate() + 1)
    
    // Formatea a AAAA-MM-DD
    return corte.toISOString().split('T')[0]
})

// ✅ Lógica de validación simple del formulario
const isFormValid = computed(() => {
    // 1. Debe existir la fecha de corte.
    const hasFechaCorte = !!props.fechaCorteA
    // 2. Debe haberse seleccionado un RUT para el funcionario B.
    const hasFuncionarioB = !!props.nuevoFuncionarioB.rut_entrante
    
    return hasFechaCorte && hasFuncionarioB
})
</script>

<style scoped>
/* Mantener los mismos estilos que el modal principal */
.modal {
    background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
    border-radius: 12px;
    overflow: hidden;
    animation: fadeInModal 0.25s ease;
}

/* ... (otros estilos) */

.modal-header {
    background-color: var(--bs-danger) !important;
}

.alert-warning {
    color: #664d03;
    background-color: #fff3cd;
    border-color: #ffecb5;
}
</style>