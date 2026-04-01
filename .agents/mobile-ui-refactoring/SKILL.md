---
name: mobile-ui-refactoring
description: "Guía maestra que condensa principios de UI/UX, Diseño Frontend y Mejores Prácticas de React para refactorizar vistas legacy (desktop-first) a interfaces 100% Mobile-First en el proyecto Academia de Ministros Oasis de Amor."
version: 1.0.0
author: Antigravity AI & Sean
tags: [UI/UX, Frontend, React, Mobile-First, Tailwind, Framer Motion, Refactoring]
---

# Mobile UI/UX Refactoring Guide

Esta "Skill" es un documento vivo que condensa las enseñanzas operativas de tres disciplinas maestras (`ui-ux-expert`, `frontend-designer`, `react-best-practices`) y las adapta específicamente a las convenciones y necesidades técnicas del proyecto **AMOA (Academia de Ministros Oasis de Amor)**. 

Úsala como referencia obligatoria **siempre que debas refactorizar pantallas antiguas basadas en tablas, pestañas (tabs) y cards gigantes de Reactstrap**, convirtiéndolas en experiencias modernas, dinámicas y orientadas al usuario móvil.

## 1. Principios Core de UI/UX (Condensado de ui-ux-expert)

Al diseñar para el móvil, el espacio, la legibilidad y la ergonomía del pulgar lo son todo.

*   **100% Mobile-First:** El viewport objetivo primario es `375px`. Las interfaces no deben tener scroll horizontal accidental.
*   **Zona del Pulgar (Thumb Zone):** Las acciones primarias, menús, botones de confirmación y navegación contextual (ej: `BottomDrawer`) deben nacer desde la mitad inferior de la pantalla.
*   **Jerarquía F-Pattern & Scannability:** En interfaces móviles la lectura es vertical. Coloca la información crítica en encabezados en la parte superior (Hero Headers) y desglosada claramente hacia abajo.
*   **Adiós a Tablas y Tabs Anidados:** 
    *   **Tablas:** Ocupan demasiado espacio horizontal. Reemplázalas por Listas en forma de Tarjetas (Cards) o líneas de tiempo estéticas (Timelines) si manejan fechas o series.
    *   **Tabs (Reactstrap):** Reemplázalos estructuralmente con "Sections Layouts". Es preferible hacer scroll hacia abajo revelando acordeones (`SectionHeader`) que confundir al usuario navegando entre múltiples pestañas ocultas.

## 2. Estética y Motion (Condensado de frontend-designer)

El "Wow Factor" es innegociable. No entregues pantallas de "SaaS Genérico".

*   **Colores y Degradados:** Evita colores planos aburridos. Usa paletas vibrantes de Tailwind en fondos primarios (ej: `bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-800`).
*   **Micro-animaciones (Framer Motion):** 
    *   Todo cambio de estado o lista cargada debe renderizar usando la suite `<motion.div>` con `initial={{ opacity: 0, y: 10 }}` y `animate={{ opacity: 1, y: 0 }}`.
    *   En listas, usar retrasos dinámicos en cascada (`transition={{ delay: index * 0.05 }}`) para generar la ilusión mágica de despliegue.
*   **Densidad de Datos Inteligente (StatStrips):** Los "cards gigantes estadísticos" desperdician espacio vertical. Condensa la información numérica clave en pequeñas grillas de 3 o 4 columnas con fondos suavizados (ej. `bg-emerald-50 text-emerald-600`) y fuentes pequeñas, pero muy negritas `text-lg font-bold`.
*   **Atención al Detalle:** Emplea "Scrollbars invisibles" usando la clase utilitaria de CSS `.scrollbar-hide` cuando apiles tarjetas horizontales (carruseles de clases, chips de programas).
*   **Iconografía:** Continuar usando Bootstrap Icons (`bi`), pero envueltos en contenedores grises redondos y estéticos (`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center`).

## 3. Arquitectura y Rendimiento (Condensado de react-best-practices)

Una interfaz hermosa de nada sirve si paraliza el navegador del dispositivo:

*   **Evita las Cascadas de Promesas (Waterfalls):** Cuando cargues la vista, junta en un `Promise.all()` todas las peticiones asíncronas independientes requeridas por esa vista (Ej: Datos del salon, Estadísticas y Evaluaciones).
*   **Componentes Pesados como Drawers:** Modales de Bootstrap para formularios móviles ensucian el z-index. Usa siempre nuestro custom `<BottomDrawer>` con arrastre natural (drag-to-dismiss) hacia abajo.
*   **Destructuración de Estado (Lógica vs UI):** Separa las rutinas pesadas de análisis en los Servicios (ej: `evaluation.service.ts`). La Vista (`.tsx`) solo se encarga de pintar.
*   **Validaciones Nativas:** Prevenir errores en memoria es mejor que alertarlos con Toasts. Solo enciende sub-componentes pesados cuando los datos estén listos, usando `<AnimatePresence>` para montajes/desmontajes suaves y Skeleton Loadings simples antes.

---

## 🏗️ Implementación Técnica Práctica

### Elementos Estructurales Permitidos

1.  **Layout Padre:** Iniciar siempre las vistas hijas móviles con márgenes negativos si el `MobileLayout` inyecta padding extra en el contendor general (`<div className="px-1 pb-6 -mx-3 -my-3">`).
2.  **Hero Header:** El primer tercio debe cautivar y resumir la misión del usuario en esa página. (Avatar, nombre, estado, y 2 ó 3 stats de impacto directo).
3.  **SectionHeader (`src/components/student/SectionHeader.tsx`):** Envuelve el desglose del contenido. Permite mostrar contadores (`badge={4}`), agrupar módulos por contexto e inicia cerrado (`defaultOpen={false}`) si es información secundaria.
4.  **GradeRing (`src/components/student/GradeRing.tsx`):** Único componente aprobado para calificaciones globales. Gráfico SVG en forma de Donut. No instalar librerías como Chart.js solo para un porcentaje.
5.  **BottomDrawer (`src/components/mobile/BottomDrawer.tsx`):** Menú para formularios complejos (Ej: "Editar Perfil"), listados de compañeros, filtros masivos secundarios y vistas de detalle por clic.

### Proceso de Refactorización a Seguir (Checklist)

1.  [ ] **Deconstrucción:** Analizar el componente Reactstrap existente. Identificar qué datos (APIs) realmente necesita y en qué orden.
2.  [ ] **Wireframing Mental:** Mapear los datos de Tabs/Tablas a Secciones/StatStrips/ListItems.
3.  [ ] **State & Hooks:** Agrupar `useEffect` y usar `Promise.all()`. Crear variables derivadas con un memo o manejándolas inteligentemente a nivel render.
4.  [ ] **UI Setup:** Crear el "Hero" o cintillo maestro.
5.  [ ] **Construcción de Bloques:** Replicar las funcionalidades secundarias agrupadas en `SectionHeader` con Listas animadas de Tailwind.
6.  [ ] **Remoción de Legacy:** Borrar `Table`, `Nav`, `TabContent`, `CardBase` dependiente del framework anterior.
7.  [ ] **Testeos en Pantalla "Pequeña":** Asegurar que ningún nombre largo en la base de datos reviente la cuadrícula (Usar utilidades como `truncate`, `min-w-0` y `flex-1`).

## Notas Adicionales del Proyecto AMOA

*   Todos los lenguajes, *toasts*, placeholders, etiquetas de errores de validación de `zod` e interfaces visuales siempre se refactorean y se validan en **Español Dominicano**.
*   **Compartibilidad (Credenciales/Notas):** Cuando se rediseñen perfiles o notas, tratar siempre de considerar la opción nativa de "Compartir en Redes/Descargar" (Usando utilidades provistas ya ensayadas como `htm-to-image` + "Web Share API"), adjuntando internamente como elemento oculto las marcas de agua requeridas (Logo y Nombre de la Institución).

---
*Para ver un ejemplo magistral de la aplicación de estos tres mundos combinados, refiérase a `UserProfile.tsx` o `StudentDashboard.tsx`.*
