# ZuriApp PWA — Auditoría de Diseño y Plan de Rediseño Premium
> **Fecha:** 2026-09-25
> **Objetivo:** Eliminar patrones genéricos AI-slop y aplicar diseño premium hospitalario
> **Método:** /redesign-existing-projects + /imagegen-frontend-mobile (visual direction only)
> **Regla:** Solo estilos (SCSS/template classes). Cero cambios en lógica/funcionalidad.

---

## 1. Diagnóstico — Patrones AI-Slop Detectados

### 1.1 Paleta de Color
| Problema | Archivos Afectados |
|---|---|
| Bootstrap `#0d6efd` azul genérico en absolutamente todo (headers, badges, botones, bordes, avatares, nav activa) | TODOS |
| `border-left: 4px solid #0d6efd` repetido en 5 componentes distintos — fingerprint de plantilla AI | OfferCard, ReplacementContractCard, PortalNotifications, PortalOpenOffers |
| Mezcla de grays inconsistentes (`#6c757d`, `#f8f9fa`, `#e9ecef`, `#f1f3f5`, `#fafbfc`) sin tinte unitario | TODOS |
| Gradiente genérico `linear-gradient(180deg, #f0f4f8, #e2e8f0)` — huella típica de AI | PortalLogin |
| Acento `bg-danger` rojo Bootstrap puro sin sofisticación | ShiftConfirmSheet, badges |

### 1.2 Tipografía
| Problema | Archivos |
|---|---|
| Sin fuente personalizada — usa el fallback del sistema via Bootstrap defaults | global |
| Solo Regular (400) y Bold (700) — falta jerarquía intermedia | TODOS |
| `font-size: 0.72rem` hardcodeado en inline styles — demasiado pequeño | PortalLayout, PortalNotifications |
| No hay letter-spacing diferenciado para labels ni headings | TODOS |
| Números sin `tabular-nums` en KPIs y métricas (horas, turnos) | PortalHome |

### 1.3 Layout & Superficies
| Problema | Archivos |
|---|---|
| Card genérica repetitiva (`.card border-0 shadow-sm rounded-4`) — el patrón AI #1 más obvio | TODOS (>15 instancias) |
| `shadow-sm` en todo — sin jerarquía de elevación | TODOS |
| Sin textura ni profundidad — fondos perfectamente planos | TODOS |
| Logo como `bi-hospital-fill` icon genérico dentro de un círculo azul claro | PortalLogin, PortalLayout |
| Bottom nav con `color: #6c757d` plano sin indicador visual de pestaña activa beyond color change | PortalLayout |
| 3 KPI cards en row de `col-4` perfectamente iguales — patrón trifold genérico | PortalHome |

### 1.4 Interactividad
| Problema | Archivos |
|---|---|
| Sin hover states en cards (solo `:hover` en `.offer-card` y `.contract-card`, pero no en agenda, calendario, notificaciones) | PortalHome, PortalNotifications |
| Sin efecto pressed/active coherente en botones | TODOS |
| Transiciones solo en fade de vista (`0.15s`) — demasiado rápidas | PortalLayout |
| Bottom sheet sin animación de backdrop fade | ShiftConfirmSheet, ShiftDayDetailSheet |

### 1.5 Componentes
| Problema | Archivos |
|---|---|
| Badges Bootstrap genéricos (pill, filled, subtle) en cascada — demasiados badges por card | OfferCard, ApplicationStatusBadge |
| Segmented Control simulado con botones pill — no se siente nativo | PortalShifts, PortalOpenOffers |
| Avatar Placeholder con gradiente `#0d6efd → #0b5ed7` — cliché Bootstrap | ProfileDrawer |
| Bottom Bar sin safe-area-inset-bottom para iPhone con home indicator | PortalLayout |

---

## 2. Design Bible — ZuriApp Hospital Premium

### Platform Mode
**Cross-platform premium neutral** (PWA mobile-first, Chrome/Safari iOS+Android)

### Theme Paradigm
**Calm productivity minimal** con toque de **premium monochrome**

### Typography Character
**Refined grotesk** — `Inter Variable` con ajustes de peso óptico (disponible via Google Fonts, ya es default de Bootstrap 5 si se importa explícitamente)

### Palette Logic
**Cool mineral palette + clean highlight accent**
- Primary Brand: `#1B4965` (azul petróleo profundo hospitalario — confianza, autoridad, clínica)
- Accent: `#62B6CB` (cian suave — acciones primarias, estados activos)
- Success: `#2D6A4F` (verde bosque — confirmaciones, turnos confirmados)
- Warning: `#E9A820` (ámbar — alertas, countdowns, reemplazos)
- Danger: `#C1292E` (rojo institucional — indisponibilidades, errores)
- Surface: `#FAFBFC` (blanco frío levemente gris)
- Card: `#FFFFFF`
- Muted Text: `#64748B` (slate-500)
- Heading: `#0F172A` (slate-900)
- Body Text: `#334155` (slate-700)
- Border: `#E2E8F0` (slate-200)
- Divider: `#F1F5F9` (slate-100)

### Signature Component Set
1. Large hero metric card (Próximo Turno)
2. Compact stat strip (KPI row)
3. Settings group cells (Perfil)
4. Bottom action sheet (Indisponibilidad, Detalle)

### Decorative Asset Set
- Minimal line icon cluster
- Soft waveform line (separadores sutiles)

### Shadow Language
- Elevation 0 (flat): ninguna
- Elevation 1 (card): `0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.06)`
- Elevation 2 (modal/sheet): `0 4px 24px rgba(15, 23, 42, 0.12)`
- Elevation 3 (floating): `0 12px 40px rgba(15, 23, 42, 0.15)`

### Corner Radius Logic
- Cards: `16px`
- Buttons: `12px` (no pill para primarios), pill solo para filtros pequeños
- Inputs: `12px`
- Bottom sheet: `24px 24px 0 0`
- Badges: `8px` (redondeados pero no full-pill)
- Bottom nav: `0` (edge to edge)
- Calendar cells: `10px`

---

## 3. Orden de Implementación

> Principio: Máximo impacto visual, mínimo riesgo de rotura.

1. **SCSS Variables globales PWA** — archivo `_portal-theme.scss`
2. **PortalLogin** — primera impresión, pantalla de marca
3. **PortalLayout** — header + bottom nav (esqueleto de toda la app)
4. **PortalHome** — pantalla principal diaria
5. **PortalShifts** — calendario y contratos
6. **PortalOpenOffers + OfferCard** — bolsa de reemplazos
7. **PortalNotifications** — bandeja de avisos
8. **ProfileDrawer** — drawer de perfil
9. **Bottom Sheets** (ShiftConfirmSheet, ShiftDayDetailSheet)
10. **Micro-componentes** (ReplacementContractCard, ApplicationStatusBadge, PwaInstallBanner)
