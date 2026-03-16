---
description: Coding standards, modularization rules, and file size limits for scalable React/TypeScript development
---

# Coding Standards & Modularization Rules

These rules ensure the codebase stays **scalable, readable, and maintainable** as the project grows. Every new file and refactor must follow them.

---

## 1. File Size Limits

| File type | Max lines | Action when exceeded |
|---|---|---|
| **Component (`.tsx`)** | **250** | Extract sub-components or sections |
| **Custom Hook (`.ts`)** | **300** | Split into smaller focused hooks |
| **Utility / Helper (`.ts`)** | **150** | Group by domain, split if mixed |
| **Constants (`.ts/.tsx`)** | **100** | One constant file per domain |
| **Model / Interface (`.ts`)** | **80** | One model per file preferred |

> [!CAUTION]
> Files exceeding **400 lines** are considered tech debt. They must be refactored before adding new features to them.

---

## 2. Component Architecture

### 2.1 Separation of Concerns (mandatory pattern)

Every complex screen must follow this decomposition:

```
screens/
  ScreenName.tsx          ← Orchestrator (~100-250 lines max)
    hooks/
      useScreenName.ts    ← All business logic (state, CRUD, effects)
    components/
      Sections/           ← Presentational sub-sections
        SectionA.tsx
        SectionB.tsx
        index.ts          ← Barrel export
    constants/
      screenSections.tsx  ← Section config (factory functions)
```

### 2.2 Orchestrator Pattern

The main screen file must ONLY:
- Call the custom hook
- Define section configuration
- Render layout + delegate to sub-components
- Handle sidebar injection and mobile/desktop switching

```tsx
// ✅ CORRECT — clean orchestrator
export const MyScreen = () => {
  const handler = useMyScreenHandler();
  const sections = useMemo(() => [...], [deps]);

  return (
    <Layout>
      {isMobile ? <MobileTabs /> : null}
      <ActiveSection />
      <Dialogs />
    </Layout>
  );
};

// ❌ WRONG — logic inside component
export const MyScreen = () => {
  const [data, setData] = useState(null);
  const onSave = async () => { /* 50 lines of CRUD */ };
  // ... 800 more lines of handlers
  return <div>...</div>;
};
```

### 2.3 Custom Hooks

- **One hook per screen** for complex pages
- Hook encapsulates: state, effects, CRUD, derived values, toggles
- Hook returns a flat object — no nesting
- Hooks can compose other hooks (e.g., `useOrganizationHandler`)

### 2.4 Section Components

- **Pure presentational** — receive everything via props
- Props must be **explicitly typed** with an interface
- No direct API calls — delegate via callbacks
- Keep each section under **250 lines**

---

## 3. File Organization

### 3.1 Directory Structure per Module

```
src/pages/dashboard/{module}/
  screens/          ← Page-level components (routed)
  components/       ← Module-specific components
    Sections/       ← Extracted page sections
    Steps/          ← Multi-step form steps
  hooks/            ← Module-specific hooks
  constants/        ← Module constants & config
```

### 3.2 Shared Code

```
src/
  components/       ← Reusable across the entire app (e.g., SidebarNav)
  hooks/            ← Global hooks (e.g., useIsMobile, useConfirmAction)
  constants/        ← Global constants
  models/           ← TypeScript interfaces/types (one per file preferred)
  utils/            ← Pure utility functions
  context/          ← React contexts
```

### 3.3 Barrel Exports

Use `index.ts` barrel files in component directories:

```ts
// components/Sections/index.ts
export { default as SummarySection } from "./SummarySection";
export { default as FinancesSection } from "./FinancesSection";
```

---

## 4. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `SummarySection.tsx` |
| Hooks | camelCase with `use` prefix | `useExcursionDetails.ts` |
| Constants files | camelCase + `.constant.ts` | `excursion.constant.ts` |
| Models | PascalCase with `I` prefix | `IEvent`, `IClient` |
| Utility functions | camelCase | `formatCurrency.ts` |
| Section config | camelCase + descriptive | `excursionSections.tsx` |
| Types-only files | PascalCase + `Model` suffix | `excursionModel.ts` |

---

## 5. TypeScript Rules

### 5.1 Strict Typing

- ❌ **Never** use `any` unless wrapping a third-party library with no types
- ✅ Define explicit prop interfaces for every component
- ✅ Use generics when building reusable utilities (e.g., `useConfirmAction<T, D>`)
- ✅ Prefer `interface` over `type` for object shapes (extensible)

### 5.2 Imports

- Use `@/` alias for absolute imports from `src/`
- Group imports in this order:
  1. External libraries (`react`, `lodash`, etc.)
  2. Alias imports (`@/components/`, `@/hooks/`, etc.)
  3. Relative imports (`../`, `./`)
- Avoid deep relative paths (more than 3 levels `../../../`). Use `@/` instead.

---

## 6. State Management

### 6.1 Local State

- Use `useState` for simple UI toggles and local component state
- Use **Zustand** for shared state that multiple components need (cross-component, cross-page)
- ❌ **Do NOT** use `useReducer` — use Zustand stores instead for complex state
- Zustand stores go in `src/store/` with descriptive names (e.g., `useExcursionStore.ts`)

```ts
// ✅ CORRECT — Zustand store
import { create } from 'zustand';

interface ExcursionStore {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export const useExcursionStore = create<ExcursionStore>((set) => ({
  filters: defaultFilters,
  setFilters: (filters) => set({ filters }),
}));
```

### 6.2 Effects

- Every `useEffect` must list **all** dependencies used inside the callback
- If a `useMemo` depends on object fields, list the specific fields — not the entire object
- Prefer `useCallback` for handlers passed as props to child components

```tsx
// ✅ CORRECT — specific dependencies
const isValid = useMemo(() => {
  return title.length > 0 && destinations.length > 0;
}, [title, destinations]);

// ❌ WRONG — overly broad dependency
const isValid = useMemo(() => {
  return excursion.title.length > 0;
}, [excursion]); // reruns on ANY excursion change
```

### 6.3 Optimistic Updates

- Pattern: update UI immediately → fire API call → handle error with rollback
- Use the `extra.isOptimistic` flag convention from `useConfirmAction`

---

## 7. Reusability Principles

### 7.1 Generic Components

Build components that are **data-driven via props**, not coupled to specific modules:

```tsx
// ✅ GOOD — generic, reusable
<SidebarNav
  items={sections}
  activeId={activeSection}
  onItemClick={setActiveSection}
/>

// ❌ BAD — hardcoded to excursions
<ExcursionSidebar />  // only works for excursions
```

### 7.2 Factory Functions for Config

Use factory functions to build section/step configurations:

```tsx
// ✅ GOOD
export function buildExcursionSections(deps: SectionDeps): SectionConfig[] {
  return [{ id: "info", label: "...", render: () => <Info {...deps} /> }];
}
```

### 7.3 The DRY Threshold

- If a pattern appears **3+ times**, extract it
- If a component prop list exceeds **10 props**, consider grouping related props or splitting the component

---

## 8. Code Quality Checklist

Before submitting any change, verify:

- [ ] No file exceeds 250 lines (components) / 300 lines (hooks)
- [ ] Business logic is in hooks, not in components
- [ ] All props have explicit TypeScript interfaces
- [ ] No `any` types (unless justified with a comment)
- [ ] `useEffect` / `useMemo` dependencies are correct and specific
- [ ] Reusable components are module-agnostic
- [ ] Imports use `@/` alias (no deep `../../../`)
- [ ] New constants are in the appropriate `.constant.ts` file
- [ ] Barrel `index.ts` files exist for component directories
