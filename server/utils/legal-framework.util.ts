/**
 * server/utils/legal-framework.util.ts
 *
 * Utilidad de derivación del marco legal aplicable al personal hospitalario.
 * Basado en ADR-01 (ZuriApp v2):
 * Combina contractType y estamento en tiempo de ejecución sin modificar el modelo Staff.
 */

export type Estamento =
  | 'MEDICO'
  | 'PROFESIONAL'
  | 'TECNICO'
  | 'ADMINISTRATIVO'
  | 'AUXILIAR';

export type ContractType = 'PLANTA' | 'CONTRATA' | 'HONORARIO';

export type LegalFramework = 'LEY_18834' | 'LEY_19664' | 'CODIGO_TRABAJO';

/**
 * Deriva el marco legal aplicable combinando contractType y estamento.
 *
 * Reglas de precedencia:
 * 1. HONORARIO: Prevalece sobre el estamento clínico (Código del Trabajo).
 * 2. PLANTA / CONTRATA + MEDICO: Ley N° 19.664 / Ley N° 15.076 (Estatuto Médico).
 * 3. PLANTA / CONTRATA + otros estamentos: Ley N° 18.834 (Estatuto Administrativo).
 *
 * @param contractType Tipo de contrato del funcionario ('PLANTA' | 'CONTRATA' | 'HONORARIO')
 * @param estamento Clasificación de estamento del cargo ('MEDICO' | 'PROFESIONAL' | 'TECNICO' | 'ADMINISTRATIVO' | 'AUXILIAR')
 * @returns Marco legal aplicable ('LEY_18834' | 'LEY_19664' | 'CODIGO_TRABAJO')
 */
export function getLegalFramework(
  contractType: ContractType,
  estamento: Estamento | string
): LegalFramework {
  if (contractType === 'HONORARIO') {
    return 'CODIGO_TRABAJO';
  }

  if (estamento === 'MEDICO') {
    return 'LEY_19664';
  }

  return 'LEY_18834';
}
