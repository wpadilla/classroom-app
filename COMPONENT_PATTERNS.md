# Component Patterns Guide

**Biblioteca de componentes reutilizables para Academia de Ministros Oasis de Amor**

Este documento describe los patrones, componentes y convenciones establecidas durante la renovación de UI/UX mobile de ClassroomManagement y EvaluationManager.

---

## 📚 Table of Contents

1. [Design System](#design-system)
2. [Hooks](#hooks)
3. [Mobile Components](#mobile-components)
4. [Common Components](#common-components)
5. [Dialog Components](#dialog-components)
6. [State Management Patterns](#state-management-patterns)
7. [Form Validation Patterns](#form-validation-patterns)
8. [Responsive Patterns](#responsive-patterns)
9. [Animation Guidelines](#animation-guidelines)
10. [Spanish UX Copy Guide](#spanish-ux-copy-guide)

---

## 🎨 Design System

### Design Tokens
Location: `src/styles/design-tokens.ts`

**Educational Warmth Palette:**
- Primary: Deep Blue `#1e3a8a` (authority, trust)
- Secondary: Amber `#f59e0b` (warmth, energy)
- Success: `#10b981`
- Danger: `#ef4444`
- Warning: `#f59e0b`

**Typography:**
- Headings: Space Grotesk (geometric, modern)
- Body: IBM Plex Sans (readable, professional)

**Grid System:**
- Base unit: 8px
- Spacing scale: 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16

**Breakpoints:**
```typescript
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet portrait
lg: '1024px'  // Tablet landscape / Small desktop
xl: '1280px'  // Desktop
```

**Animation:**
- Physics: Spring (stiffness: 300, damping: 30)
- Stagger delay: 0.03s per item
- Duration: 0.2s (fast), 0.3s (normal), 0.5s (slow)

---

## 🪝 Hooks

### useMediaQuery
**Location:** `src/hooks/useMediaQuery.ts`

Responsive breakpoint detection using `window.matchMedia` API.

**Basic Usage:**
```tsx
import { useMediaQuery } from '../../hooks';

const Component = () => {
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  
  return <div>{isLargeScreen ? 'Desktop' : 'Mobile'}</div>;
};
```

**Preset Hooks:**
```tsx
const isMobile = useIsMobile();           // < 768px
const isDesktop = useIsDesktop();         // >= 1024px
const isTablet = useIsTablet();           // 768px - 1023px
const isTabletOrLarger = useIsTabletOrLarger();  // >= 768px
const isTouchDevice = useIsTouchDevice(); // Pointer: coarse
```

**Implementation Notes:**
- Uses `globalThis.matchMedia` for SSR safety
- Event listeners cleaned up on unmount
- Initial state `false` to avoid hydration mismatch

---

### useSelection
**Location:** `src/hooks/useSelection.ts`

Generic Set-based selection state management with O(1) operations.

**Basic Usage:**
```tsx
import { useSelection } from '../../hooks';

const Component = () => {
  const selection = useSelection();
  
  return (
    <>
      <button onClick={() => selection.toggleOne('id-1')}>
        Toggle Item 1
      </button>
      <button onClick={() => selection.toggleAll(['id-1', 'id-2', 'id-3'])}>
        Select All
      </button>
      <p>Selected: {selection.selectedCount}</p>
      <button onClick={selection.clear}>Clear</button>
    </>
  );
};
```

**API:**
- `selectedIds: Set<string>` - Current selection
- `toggleOne(id: string)` - Toggle single item
- `toggleAll(allIds: string[])` - Toggle all items
- `clear()` - Clear selection
- `isSelected(id: string)` - Check if selected
- `isAllSelected(allIds: string[])` - Check if all selected
- `selectedCount: number` - Count of selected items

**Pattern: Initial Selection**
```tsx
const selection = useSelectionWithInitial(['id-1', 'id-2']);
```

---

## 📱 Mobile Components

Location: `src/components/mobile/`

### SearchInput
Debounced search input with clear button.

**Usage:**
```tsx
import { SearchInput } from '../../components/mobile';

<SearchInput
  placeholder="Buscar estudiante..."
  onSearch={setQuery}
  debounceMs={300}  // Optional, default: 150ms
/>
```

**Features:**
- 150ms debounce by default
- Clear button (X icon)
- Loading state support
- Animated focus ring

---

### Switch
iOS-style toggle switch with labels.

**Usage:**
```tsx
import { Switch } from '../../components/mobile';

<Switch
  checked={isPresent}
  onChange={setIsPresent}
  onLabel="Presente"
  offLabel="Ausente"
  onColor="bg-success"
  offColor="bg-danger"
/>
```

**Props:**
- `checked: boolean` - Current state
- `onChange: (checked: boolean) => void` - Handler
- `onLabel?: string` - Label when ON (default: "Sí")
- `offLabel?: string` - Label when OFF (default: "No")
- `onColor?: string` - Tailwind class for ON state
- `offColor?: string` - Tailwind class for OFF state
- `disabled?: boolean`

---

### ActionButton
Prominent action button with icon and responsive sizing.

**Usage:**
```tsx
import { ActionButton } from '../../components/mobile';

<ActionButton
  icon="bi-plus-circle"
  label="Agregar Estudiante"
  onClick={handleAdd}
  variant="primary"
  fullWidth={isMobile}
/>
```

---

### StudentCard
Card component for displaying student information.

**Usage:**
```tsx
import { StudentCard } from '../../components/mobile';

<StudentCard
  student={student}
  subtitle="Clase A - Matutino"
  badge={<Badge color="success">Activo</Badge>}
  actions={
    <>
      <Button size="sm" outline>Ver</Button>
      <Button size="sm" color="primary">Editar</Button>
    </>
  }
/>
```

---

### EmptyState
Empty state placeholder with icon, heading, description, and optional action.

**Usage:**
```tsx
import { EmptyState } from '../../components/mobile';

<EmptyState
  icon="bi-people"
  heading="Sin estudiantes inscritos"
  description="Inscribe estudiantes en la pestaña 'Estudiantes' para comenzar."
  action={
    <Button color="primary" onClick={handleEnroll}>
      Inscribir Estudiantes
    </Button>
  }
/>
```

**Best Practices:**
- Use Bootstrap Icons (`bi-*`)
- Keep heading short (3-5 words)
- Description should explain next action
- Action button optional

---

### LoadingState
Skeleton loading state with customizable rows.

**Usage:**
```tsx
import { LoadingState } from '../../components/mobile';

<LoadingState rows={5} />
```

---

### BottomDrawer
iOS-style bottom sheet for mobile dialogs.

**Usage:**
```tsx
import { BottomDrawer } from '../../components/mobile';

<BottomDrawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Opciones"
  height="auto"  // or "full"
  hideCloseButton={false}
>
  <div className="p-3">
    <p>Content here...</p>
  </div>
</BottomDrawer>
```

**Features:**
- Drag-to-dismiss (velocity threshold: 500, offset: 150px)
- Spring animation (stiffness: 300, damping: 30)
- Focus trap
- Escape key handler
- Body scroll lock
- Safe area insets

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `title?: string`
- `children: ReactNode`
- `height?: 'auto' | 'full'` - Default: 'auto'
- `hideCloseButton?: boolean`
- `className?: string`

---

## 🧩 Common Components

Location: `src/components/common/`

### Dialog
Responsive dialog wrapper - Modal on desktop (≥768px), BottomDrawer on mobile.

**Usage:**
```tsx
import { Dialog } from '../../components/common/Dialog';

<Dialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmar Acción"
  size="md"
  footer={
    <div className="d-flex gap-2">
      <Button color="secondary" onClick={onClose}>Cancelar</Button>
      <Button color="primary" onClick={onConfirm}>Confirmar</Button>
    </div>
  }
>
  <p>¿Estás seguro de realizar esta acción?</p>
</Dialog>
```

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `title: string`
- `children: ReactNode`
- `footer?: ReactNode`
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Desktop only
- `fullScreen?: boolean` - Desktop only
- `centered?: boolean` - Desktop only

**Responsive Behavior:**
- **Desktop (≥768px):** Reactstrap Modal with size options
- **Mobile (<768px):** BottomDrawer with drag-to-dismiss

---

### DataTable
Full-featured reusable data table with search, selection, expansion, and bulk actions.

**Basic Usage:**
```tsx
import { DataTable } from '../../components/common';
import { IUser } from '../../models';

<DataTable<IUser>
  data={students}
  columns={[
    {
      header: '#',
      accessor: (_, index) => index + 1,
      width: '50px',
      className: 'text-center',
    },
    {
      header: 'Nombre',
      accessor: 'firstName',
      render: (student) => (
        <strong>{student.firstName} {student.lastName}</strong>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      mobileHidden: true,  // Hide on mobile
    },
  ]}
  keyExtractor={(student) => student.id}
  searchable
  searchFields={['firstName', 'lastName', 'email']}
  emptyState={
    <EmptyState
      icon="bi-inbox"
      heading="Sin resultados"
      description="No se encontraron estudiantes."
    />
  }
/>
```

**With Selection:**
```tsx
const selection = useSelection();

<DataTable<IUser>
  data={students}
  columns={columns}
  keyExtractor={(s) => s.id}
  selectable
  selectedIds={selection.selectedIds}
  onSelectionChange={(ids) => ids.forEach(id => selection.toggleOne(id))}
  bulkActions={
    selection.selectedCount > 0 ? (
      <div className="d-flex gap-2">
        <span>{selection.selectedCount} seleccionados</span>
        <Button size="sm" onClick={handleBulkAction}>Acción</Button>
        <Button size="sm" outline onClick={selection.clear}>Cancelar</Button>
      </div>
    ) : undefined
  }
/>
```

**With Expandable Rows:**
```tsx
<DataTable<IUser>
  data={students}
  columns={columns}
  keyExtractor={(s) => s.id}
  expandable
  renderExpandedRow={(student) => (
    <div className="p-3">
      <h6>Detalles de {student.firstName}</h6>
      <p>Teléfono: {student.phone}</p>
      <p>Dirección: {student.address}</p>
    </div>
  )}
/>
```

**Column Configuration:**
```typescript
interface Column<T> {
  header: string;                           // Column header text
  accessor: keyof T | ((row: T, index?: number) => any);  // Data accessor
  render?: (row: T) => ReactNode;           // Custom renderer
  width?: string;                           // Column width (CSS)
  className?: string;                       // Additional classes
  mobileHidden?: boolean;                   // Hide on mobile
  align?: 'left' | 'center' | 'right';      // Text alignment
}
```

**Features:**
- Built-in SearchInput (150ms debounce)
- Multi-select with indeterminate checkboxes
- Expandable rows (Dialog on mobile, inline on desktop)
- Bulk actions bar (sticky bottom on mobile)
- Loading skeleton
- Empty state support
- Framer Motion stagger animation (0.03s delay per row)
- Responsive column hiding

**Props:**
- `data: T[]` - Array of data
- `columns: Column<T>[]` - Column definitions
- `keyExtractor: (row: T) => string` - Unique key function
- `searchable?: boolean` - Enable search
- `searchFields?: (keyof T)[]` - Fields to search
- `selectable?: boolean` - Enable selection
- `selectedIds?: Set<string>` - Controlled selection
- `onSelectionChange?: (ids: Set<string>) => void`
- `expandable?: boolean` - Enable row expansion
- `renderExpandedRow?: (row: T) => ReactNode`
- `actions?: ReactNode` - Top-right actions
- `bulkActions?: ReactNode` - Bulk action bar
- `emptyState?: ReactNode` - Empty state component
- `loading?: boolean` - Show loading skeleton
- `onRowClick?: (row: T) => void` - Row click handler

---

## 💬 Dialog Components

Location: `src/modules/shared/components/`

### BulkAttendanceDialog
Dialog for marking attendance for multiple students at once.

**Usage:**
```tsx
import { BulkAttendanceDialog } from './components/BulkAttendanceDialog';

<BulkAttendanceDialog
  isOpen={bulkAttendanceOpen}
  onClose={() => setBulkAttendanceOpen(false)}
  selectedStudents={students.filter(s => selection.isSelected(s.id))}
  currentModuleName="Módulo 1: Introducción"
  onConfirm={async (isPresent) => {
    // Process each student
    for (const student of selectedStudents) {
      await markAttendance(student.id, isPresent);
    }
  }}
/>
```

**Features:**
- Switch for Present/Absent selection
- Selected student count badge
- Scrollable student list (max-height: 300px)
- Info/Warning alerts based on selection
- Async operation handling

---

### ScoreInputDialog
Dialog for manual score entry with validation and "Max Score" quick action.

**Usage:**
```tsx
import { ScoreInputDialog } from './components/ScoreInputDialog';

<ScoreInputDialog
  isOpen={scoreDialogOpen}
  onClose={() => setScoreDialogOpen(false)}
  studentName="Juan Pérez"
  currentScore={5}
  maxScore={20}
  fieldLabel="Puntos de Participación"
  onSave={async (newScore) => {
    const delta = newScore - currentScore;
    await updateScore(studentId, delta);
  }}
  helpText="Ingrese la puntuación total deseada"
/>
```

**Features:**
- Large number input (64px height)
- "Puntuación Máxima" button
- Validation (clamp between minScore and maxScore)
- Shows current vs new score diff
- Info text with valid range

**Props:**
- `studentName: string`
- `currentScore: number`
- `maxScore: number`
- `fieldLabel: string`
- `minScore?: number` - Default: 0
- `step?: number` - Default: 0.5
- `onSave: (newScore: number) => Promise<void>`
- `helpText?: string`

---

### BulkParticipationDialog
Dialog for assigning participation points to multiple students.

**Usage:**
```tsx
import { BulkParticipationDialog } from './components/BulkParticipationDialog';

<BulkParticipationDialog
  isOpen={bulkParticipationOpen}
  onClose={() => setBulkParticipationOpen(false)}
  selectedStudents={selectedStudents}
  maxScore={20}
  currentModuleName="Módulo 1"
  onConfirm={async (pointsToAdd) => {
    // Process each student
    for (const student of selectedStudents) {
      await addPoints(student.id, pointsToAdd);
    }
  }}
/>
```

**Features:**
- Positive and negative point input
- "Máximo" button (fills max score)
- "Restar Todo" button (fills -maxScore)
- Preview of points to be added/subtracted
- Warning alert for negative points
- Scrollable student list

---

## 🔄 State Management Patterns

### Map vs Array for Lookups

**Use Map for O(1) lookups:**
```tsx
// ✅ Good - O(1) lookup
const [evaluations, setEvaluations] = useState<Map<string, IEvaluation>>(new Map());

const evaluation = evaluations.get(studentId);

// Update
const newEvaluations = new Map(evaluations);
newEvaluations.set(studentId, updatedEvaluation);
setEvaluations(newEvaluations);
```

**Use Array for ordered lists:**
```tsx
// ✅ Good - Ordered list
const [students, setStudents] = useState<IUser[]>([]);

const sortedStudents = students.sort((a, b) => 
  a.lastName.localeCompare(b.lastName)
);
```

### Optimistic Updates Pattern

```tsx
const handleUpdate = async (id: string, newValue: any) => {
  // 1. Get current state
  const currentValue = state.get(id);
  
  // 2. Update UI immediately
  const newState = new Map(state);
  newState.set(id, newValue);
  setState(newState);
  
  try {
    // 3. Persist to backend
    await service.update(id, newValue);
  } catch (error) {
    // 4. Revert on error
    console.error('Update failed:', error);
    toast.error('Error al actualizar');
    const revertedState = new Map(state);
    revertedState.set(id, currentValue);
    setState(revertedState);
  }
};
```

### Selection State Pattern

```tsx
// ✅ Use Set for selection
const selection = useSelection();

// Bulk operation with selection
const handleBulkOperation = async () => {
  const selectedItems = data.filter(item => 
    selection.isSelected(item.id)
  );
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const item of selectedItems) {
    try {
      await processItem(item);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`Error processing ${item.id}:`, error);
    }
  }
  
  if (successCount > 0) {
    toast.success(`Procesados ${successCount} elemento${successCount !== 1 ? 's' : ''}`);
  }
  
  if (errorCount > 0) {
    toast.error(`Error en ${errorCount} elemento${errorCount !== 1 ? 's' : ''}`);
  }
  
  selection.clear();
};
```

---

## ✅ Form Validation Patterns

### Zod for Schema Validation

**Location:** `src/schemas/`

**Example:**
```typescript
import { z } from 'zod';

export const studentSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\d{10}$/, 'Teléfono debe tener 10 dígitos'),
  cedula: z.string().regex(/^\d{11}$/, 'Cédula debe tener 11 dígitos'),
});

export type StudentFormData = z.infer<typeof studentSchema>;
```

### react-hook-form Integration

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const Component = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });
  
  const onSubmit = (data: StudentFormData) => {
    console.log(data);
  };
  
  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <FormGroup>
        <Label>Nombre</Label>
        <Input {...register('firstName')} invalid={!!errors.firstName} />
        {errors.firstName && (
          <div className="invalid-feedback d-block">
            {errors.firstName.message}
          </div>
        )}
      </FormGroup>
      <Button type="submit">Guardar</Button>
    </Form>
  );
};
```

### Input Validation Helpers

```tsx
// Number input with range validation
const validateNumber = (value: string, min: number, max: number): 
  { valid: boolean; message?: string } => {
  const num = Number.parseFloat(value);
  
  if (Number.isNaN(num)) {
    return { valid: false, message: 'Ingrese un número válido' };
  }
  
  if (num < min) {
    return { valid: false, message: `El mínimo es ${min}` };
  }
  
  if (num > max) {
    return { valid: false, message: `El máximo es ${max}` };
  }
  
  return { valid: true };
};

// Usage
const [inputValue, setInputValue] = useState('');
const [error, setError] = useState<string | null>(null);

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setInputValue(value);
  
  if (value.trim()) {
    const validation = validateNumber(value, 0, 100);
    setError(validation.valid ? null : validation.message || null);
  }
};
```

---

## 📱 Responsive Patterns

### Mobile-First CSS

```tsx
// ✅ Mobile-first approach
<div className="
  flex flex-col gap-2     {/* Mobile */}
  md:flex-row md:gap-4    {/* Tablet+ */}
  lg:gap-6                {/* Desktop+ */}
">
  ...
</div>
```

### Conditional Rendering by Breakpoint

```tsx
const isMobile = useIsMobile();

return (
  <>
    {/* Mobile: Bottom Sheet */}
    {isMobile && (
      <BottomDrawer isOpen={isOpen} onClose={onClose}>
        <Content />
      </BottomDrawer>
    )}
    
    {/* Desktop: Modal */}
    {!isMobile && (
      <Modal isOpen={isOpen} toggle={onClose}>
        <Content />
      </Modal>
    )}
  </>
);
```

**Or use Dialog component:**
```tsx
// ✅ Automatically responsive
<Dialog isOpen={isOpen} onClose={onClose}>
  <Content />
</Dialog>
```

### Horizontal Scroll for Cards (Mobile)

```tsx
<div className="d-flex gap-3 overflow-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
  {items.map(item => (
    <Card 
      key={item.id} 
      className="flex-shrink-0" 
      style={{ minWidth: '200px' }}
    >
      <CardBody>
        <h6>{item.title}</h6>
        <p>{item.value}</p>
      </CardBody>
    </Card>
  ))}
</div>
```

### Responsive Table Columns

```tsx
const columns: Column<IUser>[] = [
  {
    header: 'Nombre',
    accessor: 'firstName',
  },
  {
    header: 'Email',
    accessor: 'email',
    mobileHidden: true,  // Hide on mobile
  },
  {
    header: 'Teléfono',
    accessor: 'phone',
    mobileHidden: true,
  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (user) => <ActionButtons user={user} />,
  },
];
```

---

## 🎬 Animation Guidelines

### Framer Motion Stagger

```tsx
import { motion } from 'framer-motion';

// Staggered list items
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      delay: index * 0.03,  // 30ms stagger
      type: 'spring',
      stiffness: 300,
      damping: 30
    }}
  >
    {item.content}
  </motion.div>
))}
```

### Number Change Animation

```tsx
import { motion } from 'framer-motion';

<motion.div
  key={totalPoints}  // Trigger animation on value change
  initial={{ scale: 1.2 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
>
  <Badge color="success">
    <strong>{totalPoints}</strong>
  </Badge>
</motion.div>
```

### Slide-in Animation

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Panel />
    </motion.div>
  )}
</AnimatePresence>
```

### Loading Skeleton

```tsx
<div className="animate-pulse">
  <div className="bg-gray-200 h-4 rounded mb-2"></div>
  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
</div>
```

---

## 🇪🇸 Spanish UX Copy Guide

### Common Phrases

**Actions:**
- Agregar / Añadir
- Crear
- Editar / Modificar
- Eliminar / Borrar
- Guardar
- Cancelar
- Confirmar
- Buscar
- Filtrar
- Descargar
- Subir / Cargar

**States:**
- Cargando...
- Guardando...
- Procesando...
- Sin resultados
- Sin datos disponibles
- Completado
- Pendiente
- En progreso
- Finalizado

**Feedback:**
- ✅ Operación exitosa
- ✅ Guardado correctamente
- ❌ Error al guardar
- ❌ Ocurrió un error
- ⚠️ Atención
- ℹ️ Información importante

**Questions:**
- ¿Estás seguro?
- ¿Deseas continuar?
- ¿Confirmar acción?

**Empty States:**
- Sin [items] disponibles
- No se encontraron resultados
- Aún no hay [items]

### Pluralization

```tsx
// ✅ Correct
const message = `${count} estudiante${count !== 1 ? 's' : ''}`;

// Examples:
// 0 estudiantes
// 1 estudiante
// 2 estudiantes
```

### Toast Messages

```tsx
// Success
toast.success('Estudiante agregado exitosamente');
toast.success(`${count} estudiantes inscritos`);

// Error
toast.error('Error al guardar el estudiante');
toast.error('No se pudo completar la operación');

// Warning
toast.warning('La clase está por comenzar');

// Info
toast.info('Recuerda guardar los cambios');
```

### Form Labels

```tsx
<FormGroup>
  <Label for="firstName">
    Nombre <span className="text-danger">*</span>
  </Label>
  <Input
    id="firstName"
    placeholder="Ingrese el nombre"
    {...register('firstName')}
  />
  <small className="text-muted">
    Campo obligatorio
  </small>
</FormGroup>
```

### Button Labels

**Mobile Best Practices:**
- Always show text labels (no icon-only buttons)
- Keep labels short (1-3 words)
- Use action verbs: "Guardar", "Eliminar", "Confirmar"

```tsx
// ❌ Bad - Icon only on mobile
<Button>
  <i className="bi bi-save"></i>
  <span className="d-none d-sm-inline">Guardar</span>
</Button>

// ✅ Good - Text always visible
<Button>
  <i className="bi bi-save me-1"></i>
  Guardar
</Button>
```

---

## 📦 Component Inventory

**Hooks:**
- `useMediaQuery` - Breakpoint detection
- `useSelection` - Selection state with Set
- `useDebounce` - Debounce hook (in SearchInput)

**Mobile Components:**
- `SearchInput` - Debounced search with clear
- `Switch` - iOS-style toggle
- `ActionButton` - Prominent CTA button
- `StudentCard` - Student info card
- `EmptyState` - Empty state placeholder
- `LoadingState` - Loading skeleton
- `BottomDrawer` - iOS bottom sheet

**Common Components:**
- `Dialog` - Responsive modal/drawer
- `DataTable<T>` - Full-featured table

**Dialog Components:**
- `BulkAttendanceDialog` - Bulk attendance marking
- `ScoreInputDialog` - Manual score entry
- `BulkParticipationDialog` - Bulk point assignment

**Total:** 15 reusable components + 2 custom hooks

---

## 🎯 Best Practices Summary

1. **Mobile-First:** Design for mobile, enhance for desktop
2. **Responsive Components:** Use Dialog instead of Modal/BottomDrawer separately
3. **Search Everything:** Add SearchInput to all data tables
4. **Empty States:** Always show EmptyState, never empty tables
5. **Loading States:** Use LoadingState for async operations
6. **Optimistic Updates:** Update UI immediately, revert on error
7. **Selection Pattern:** Use useSelection hook with Set
8. **Bulk Operations:** Show count, confirm dialog, process with error handling
9. **Spanish UX:** All user-facing strings in Spanish
10. **Animations:** Use spring physics, stagger lists
11. **Accessibility:** Focus trap in dialogs, keyboard navigation, ARIA labels
12. **TypeScript:** Generic types for reusable components
13. **Validation:** Zod schemas + react-hook-form

---

## 🔗 Related Documentation

- [CLAUDE.md](./CLAUDE.md) - Project overview and commands
- [CLASSROOM_ANALYTICS_SYSTEM.md](./CLASSROOM_ANALYTICS_SYSTEM.md) - Analytics features
- [CLASSROOM_FINALIZATION_SYSTEM.md](./CLASSROOM_FINALIZATION_SYSTEM.md) - Finalization flow
- [WHATSAPP_INTEGRATION_GUIDE.md](./WHATSAPP_INTEGRATION_GUIDE.md) - WhatsApp features

---

**Last Updated:** March 16, 2026  
**Version:** 1.0.0  
**Contributor:** Claude Code (claude.ai/code)
