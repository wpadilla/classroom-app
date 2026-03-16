---
description: UI/UX design patterns for section-based screens, secondary sidebar, mobile tabs, and component styling
---

# UI/UX Standards — Patrones de Diseño y Componentes

Reglas de diseño visual y estructura de pantallas para TravelM. Basado en los patrones establecidos en el flujo de edición/creación de eventos, ExcursionDetails, y la navegación con secondary sidebar.

> [!IMPORTANT]
> Este archivo complementa `ai-agent-instructions/ui-ux-standards.md` (spacing base, tipografía, iconos). Este documento se enfoca en **patrones estructurales** de pantallas, CRUD, drawers y navegación.

---

## 1. Estructura CRUD Estándar

### 1.1 Flujo de Pantallas

Cada módulo CRUD tiene exactamente **2 pantallas**:

```
Pantalla de Listado (List)          Pantalla de Edición/Creación (Handler)
┌─────────────────────────┐         ┌──────────────────────────────────────┐
│  Header + Filtros       │         │  Secondary Sidebar    │  Contenido  │
│  ─────────────────────  │  ───▶   │  ┌──────────────┐    │             │
│  Tabla / Grid / Cards   │         │  │ Nav sections  │    │  Secciones  │
│  con acciones por fila  │         │  │               │    │  (solo      │
│                         │         │  │ ─────────────-│    │  lectura +  │
│  [+ Crear Nuevo]        │         │  │ [Guardar] btn │    │  "Gestionar"│
└─────────────────────────┘         │  └──────────────┘    │  botones)   │
                                    └──────────────────────────────────────┘
```

### 1.2 Pantalla de Handler (Edición/Creación)

La información se **muestra en modo lectura**. Para mutar datos, el usuario presiona un botón **"Gestionar"** (o "Editar", "Agregar") que abre un **Drawer lateral**:

```
┌─────────────────────────────────────────────────────────┐
│                    Contenido principal                   │
│                                                         │
│  ┌─── Sección: Información General ──────────────────┐ │
│  │  Título: Mi Excursión                              │ │
│  │  Descripción: Lorem ipsum...                       │ │
│  │  País: República Dominicana                        │ │
│  │                         [📝 Gestionar]             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─── Sección: Destinos ─────────────────────────────┐ │
│  │  ❌ No hay destinos agregados.                     │ │
│  │  Agrega destinos para definir el itinerario.       │ │
│  │                         [+ Agregar Destino]        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Regla de Guardado

- El botón **"Guardar"** siempre está en el **footer del Secondary Sidebar** (desktop) o en un **footer fijo** (mobile)
- Se guarda toda la entidad principal, no secciones individuales

---

## 2. Drawers — Reglas de Anidamiento

### 2.1 Regla de Una Entidad por Drawer

> [!CAUTION]
> Un drawer NUNCA puede contener formularios de más de una entidad. Si necesitas editar una entidad relacionada, abre un **nuevo drawer apilado**.

### 2.2 Drawer Apilado (Nested Drawers)

Cuando un drawer necesita editar una sub-entidad, se abre un **nuevo drawer más estrecho** encima del anterior:

```
Contenido principal     Drawer principal (lg)     Drawer secundario (md)
┌────────────────┐     ┌────────────────┐        ┌──────────────┐
│                │     │                │        │              │
│                │     │  Editar        │        │  Editar      │
│  Pantalla      │     │  Destino       │        │  Proveedor   │
│                │     │                │        │  del destino │
│                │     │  Proveedor:    │        │              │
│                │     │  Hotel ABC     │        │  [campos]    │
│                │     │  [✏ Editar]────│────▶   │              │
│                │     │                │        │              │
│                │     │  [Guardar]     │        │  [Guardar]   │
└────────────────┘     └────────────────┘        └──────────────┘
```

### 2.3 Anchos de Drawer

| Nivel | Ancho | Clase/Tamaño | Uso |
|---|---|---|---|
| Principal | `lg` (~600px) | `size="lg"` | Entidad principal (destino, cliente, etc.) |
| Secundario | `md` (~450px) | `size="md"` | Sub-entidad (proveedor, servicio, etc.) |
| Terciario | `sm` (~350px) | `size="sm"` | Sub-sub-entidad (rara vez necesario) |

### 2.4 Drawer Footer

```tsx
// Footer estándar de un drawer
<div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200">
  <Button variant="text" color="red" onClick={onCancel}>
    Cancelar
  </Button>
  <Button color="blue" onClick={onSave}>
    Guardar
  </Button>
</div>
```

---

## 3. Contenido Descriptivo — Reglas UX

### 3.1 Principio Fundamental

> [!IMPORTANT]
> **Todo campo, botón, label y sección debe ser autodescriptivo.** El usuario debe entender qué hacer desde el primer vistazo, sin necesidad de documentación externa.

### 3.2 Labels y Campos

| Situación | ✅ Correcto | ❌ Incorrecto |
|---|---|---|
| Campo vacío | `"Ej: Playa Bávaro, Punta Cana"` | `"Ingrese valor"` |
| Campo obligatorio | `"Título del evento *"` | `"Título"` (sin indicar requerido) |
| Campo opcional | `"Notas adicionales (opcional)"` | `"Notas"` |
| Selector vacío | `"Selecciona un país"` | `"Seleccionar..."` |
| Búsqueda | `"Buscar cliente por nombre o teléfono"` | `"Buscar"` |

### 3.3 Botones de Acción

| Contexto | ✅ Correcto | ❌ Incorrecto |
|---|---|---|
| Agregar item | `"+ Agregar Destino"` | `"Agregar"` o `"+"` solo |
| Editar existente | `"📝 Editar Información"` | `"Editar"` genérico |
| Gestionar sección | `"Gestionar Finanzas"` | `"Abrir"` |
| Guardar | `"Guardar Cambios"` | `"OK"` |
| Eliminar | `"Eliminar Destino"` | `"Borrar"` |
| Crear nuevo | `"Crear Nuevo Evento"` | `"Nuevo"` |

### 3.4 Estados Vacíos (Empty States)

Cada sección debe tener un mensaje descriptivo cuando no hay datos:

```tsx
// ✅ CORRECTO — descriptivo, con acción sugerida
<div className="flex flex-col items-center gap-2 py-6 text-center">
  <FaMapMarkerAlt className="h-8 w-8 text-gray-300" />
  <Typography variant="small" className="text-gray-500 font-medium">
    No hay destinos agregados
  </Typography>
  <Typography variant="small" className="text-gray-400 text-xs">
    Agrega destinos para definir el itinerario del evento.
  </Typography>
  <Button size="sm" variant="outlined" color="blue" className="mt-2">
    + Agregar Destino
  </Button>
</div>

// ❌ INCORRECTO — genérico, sin contexto
<p>No hay datos</p>
```

### 3.5 Indicadores de Estado

| Estado | Indicador visual | Ejemplo |
|---|---|---|
| Requerido faltante | Punto `bg-orange-300` + texto de ayuda | `"Este campo es obligatorio"` |
| Sección completa | Punto `bg-green-400` | Check verde en sidebar |
| Sección incompleta | Punto `bg-orange-300` | Punto naranja en sidebar |
| Campo opcional vacío | Texto gris italic | `"No especificado (opcional)"` |
| Error de validación | Borde rojo + texto rojo debajo | `"El título debe tener al menos 3 caracteres"` |

---

## 4. Screen Layout Pattern

### 4.1 Dual-Layout Architecture (Desktop + Mobile)

Toda pantalla con secciones usa dos layouts:

| Plataforma | Navegación | Contenido |
|---|---|---|
| **Desktop** | `SidebarNav` inyectado en `SecondarySidebarContext` | Ancho completo a la izquierda del sidebar |
| **Mobile** | Tab bar horizontal scrollable (sticky top) | Ancho completo debajo de tabs |

```tsx
// Desktop: inyectar SidebarNav en secondary sidebar
useEffect(() => {
  if (!isMobile) {
    setContent(<SidebarNav items={sections} activeId={active} onItemClick={setActive} />);
  } else {
    clearContent();
  }
  return () => clearContent();
}, [isMobile, active, sections]);
```

### 4.2 Content Container

```tsx
<div className="flex-1 overflow-y-auto">
  <div className="max-w-[1200px] mx-auto w-full">
    {activeSection.render()}
  </div>
</div>
```

- Max content width: **1200px**
- Desktop padding: `pt-4`
- Mobile padding: `p-2 pb-24` (espacio extra para FABs/footers)

---

## 5. SidebarNav Component

### 5.1 Uso

`SidebarNav` es un componente **genérico, data-driven**. Se configura 100% via props:

```tsx
<SidebarNav
  title="Secciones"
  subtitle={excursion.title}
  subtitleIcon={<MapIcon className="h-4 w-4 text-blue-600" />}
  items={[
    { id: "info", label: "Información", icon: <FaInfo className="text-[13px]" /> },
    { id: "finance", label: "Finanzas", icon: <FaDollarSign className="text-[13px]" /> },
  ]}
  activeId={activeSection}
  validity={{ info: true, finance: false }}
  onItemClick={(id) => setActiveSection(id)}
  footer={{
    warning: <WarningBanner />,
    action: <SaveButton />,
  }}
/>
```

### 5.2 Visual Design

| Elemento | Estilo |
|---|---|
| Item activo | `bg-blue-600 text-white shadow-md shadow-blue-200` |
| Item inactivo | `text-gray-600 hover:bg-blue-gray-50 hover:text-gray-900` |
| Icon activo | `text-blue-100` |
| Icon inactivo | `text-gray-400 group-hover:text-gray-600` |
| Dot válido | `bg-green-400` (circle 1.5x1.5) |
| Dot inválido | `bg-orange-300` |
| Title | `text-[10px] uppercase tracking-wider text-gray-500 font-semibold` |
| Subtitle | `text-sm font-semibold text-gray-700` + icon en `bg-blue-100 p-1 rounded` |
| Item text | `text-[13px] font-medium` |

### 5.3 Reglas

- ❌ **Nunca** hardcodear contenido de sidebar dentro de `SidebarNav`
- ✅ Siempre pasar items como data via props
- ✅ Footer opcional — se usa para botones de acción (guardar, completar)
- ✅ Validity map opcional — se usa para flujos stepper/formularios

---

## 6. Mobile Tab Bar

### 6.1 Estructura

```tsx
<div className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-2 py-2 shrink-0 shadow-sm z-10 sticky top-0">
  {sections.map((section) => (
    <button
      key={section.id}
      onClick={() => setActiveSection(section.id)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium
        whitespace-nowrap transition-all duration-200 ${
        active === section.id
          ? "bg-blue-50 text-blue-700 shadow-sm"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className={active === section.id ? "text-blue-500" : "text-gray-400"}>
        {section.icon}
      </span>
      {section.label}
    </button>
  ))}
</div>
```

### 6.2 Visual

| Elemento | Estilo |
|---|---|
| Tab activo | `bg-blue-50 text-blue-700 shadow-sm rounded-lg` |
| Tab inactivo | `text-gray-500 hover:text-gray-700 hover:bg-gray-50` |
| Tab text | `text-[13px] font-medium whitespace-nowrap` |
| Tab padding | `px-3 py-2` |

---

## 7. Stepper (AppStepper)

### 7.1 Estructura

El `AppStepper` se usa para flujos de múltiples pasos con iconos:

```tsx
<AppStepper
  steps={steps}
  activeStep={currentStep}
  onClickStep={(pos) => setCurrentStep(pos)}
/>
```

### 7.2 Visual Design

| Elemento | Estilo |
|---|---|
| Step circle | `w-8 h-8` con icono centrado |
| Step label (activo) | `text-[10px] font-medium color="blue-gray"` |
| Step label (inactivo) | `text-[10px] font-medium color="gray"` |
| Container height | `h-[70px]` con overflow-x-auto |
| Padding | `py-2 px-8` |

### 7.3 Uso

- Usar cuando hay un flujo lineal con 3-8 pasos claramente definidos
- Para más de 8 pasos, usar `SidebarNav` en su lugar
- El stepper muestra el paso en el contenido debajo (`steps[activeStep].component`)

---

## 8. Colores del Sistema

### 8.1 Palette de Acciones

| Uso | Color | Variantes usadas |
|---|---|---|
| Primaria / Principal | `blue` | `color="blue"`, `bg-blue-600`, `text-blue-700` |
| Éxito / Confirmar | `green` | `color="green"`, `bg-green-400` |
| Peligro / Eliminar | `red` | `color="red"`, `text-red-500` |
| Advertencia | `orange` | `bg-orange-300`, `text-orange-500` |
| Neutral / Secundario | `blue-gray` | `color="blue-gray"`, `text-gray-600` |
| WhatsApp | `green` (gradient) | `variant="gradient" color="green"` |
| Configuraciones | `blue-gray` | `variant="outlined" color="blue-gray"` |
| Encuestas | `purple` | `variant="outlined" color="purple"` |

### 8.2 Info Chips

| Significado | Background | Text |
|---|---|---|
| Ubicación/Destino | `bg-blue-50` | `text-blue-700` |
| Clientes/Personas | `bg-green-50` | `text-green-700` |
| Actividades | `bg-orange-50` | `text-orange-700` |
| Dinero/Finanzas | `bg-emerald-50` | `text-emerald-700` |
| Estado/Warning | `bg-amber-50` | `text-amber-700` |

Formato estándar: `rounded-full px-3 py-1 text-xs font-medium`

### 8.3 Badges sobre Imágenes

```tsx
<div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
  <FaStar className="h-3.5 w-3.5 text-yellow-400" />
  <span className="text-xs font-semibold text-white">4.8</span>
</div>
```

---

## 9. Tamaños de Referencia

### 9.1 Contenedores

| Elemento | Desktop | Mobile |
|---|---|---|
| Max content width | `max-w-[1200px]` | `w-full` |
| Hero carousel | `h-[420px]` | `h-[260px]` |
| Stepper container | `h-[70px]` | `h-[70px]` |
| Tab panel (custom tabs) | `h-[600px]` | auto |

### 9.2 Cards

| Elemento | Estilo |
|---|---|
| Card exterior | `bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100` |
| Card header gradient | `variant="gradient" color="blue"` con `p-2 md:p-3` |
| Toolbar bg | `bg-gray-50 border-b border-gray-100 px-4 py-2.5` |
| Section divider | `border-t border-gray-100` |
| Section padding | Desktop `px-6 py-5` / Mobile `px-4 py-3` |

---

## 10. Organización Visual — Reglas

### 10.1 Jerarquía

1. **Header/Toolbar** — Siempre arriba, con acciones primarias
2. **Quick Info** (chips) — Resumen visual rápido debajo del header
3. **Contenido principal** — Datos detallados, formularios, tablas
4. **Sub-secciones** — Separadas con `border-t border-gray-100`
5. **Dialogs/Overlays** — Siempre al final del JSX

### 10.2 Agrupación

- Campos relacionados van juntos en la misma card/sección
- Cada sección tiene un **título claro** con icono representativo
- Separar secciones con espacio (`gap-6`) no con líneas gruesas
- Campos dentro de sección: `gap-3` entre campos, `gap-4` entre grupos

### 10.3 Alineación

- Botones de acción: **alineados a la derecha** (`justify-end`)
- Labels: **encima del campo** (no al lado, excepto en cards de resumen)
- Grupos de chips: **flex-wrap** para que reflow en mobile

---

## 11. Responsive Breakpoints

| Breakpoint | Detección | Layout |
|---|---|---|
| Mobile | `useIsMobile()` hook | Tab bar + full-width |
| Desktop | `!isMobile` | Sidebar + constrained content |

- No hay breakpoints de tablet — tablet usa layout mobile
- Usar `useIsMobile()` para switching, **no** media queries CSS-only
- Ajustes responsive: padding, tipografía, altura de carousel

---

## 12. Design Checklist

Antes de entregar cualquier cambio UI:

- [ ] Desktop sidebar via `SidebarNav` (data-driven, no hardcodeado)
- [ ] Mobile tabs scroll horizontal, sticky top
- [ ] Ambos layouts desktop y mobile probados
- [ ] Content usa `max-w-[1200px] mx-auto`
- [ ] Cards usan `rounded-2xl shadow-sm border border-gray-100`
- [ ] Info chips usan la paleta de colores estándar
- [ ] Botones de toolbar usan `size="sm"` + icons `h-3.5 w-3.5`
- [ ] `useIsMobile()` controla switching de layout
- [ ] Dialogs al final del JSX return
- [ ] Touch targets min 44x44px en mobile
- [ ] Drawers de entidades anidadas usan anchos decrecientes
- [ ] Todos los campos con labels descriptivos
- [ ] Empty states con icono + mensaje + acción sugerida
- [ ] Campos obligatorios marcados, opcionales indicados
- [ ] Botones de acción con texto descriptivo (no genérico)
