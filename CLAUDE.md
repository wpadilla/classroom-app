# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Academia de Ministros Oasis de Amor" — a classroom management PWA for a Bible institute. The app manages students, teachers, classrooms, programs, evaluations, and WhatsApp messaging. The UI is in **Spanish** — all user-facing strings, toast messages, and validation errors must be in Spanish.

## Commands

- `npm start` — Start dev server with emulators enabled (port 3000)
- `npm run start:prod` — Start dev server pointing to production Firebase
- `npm run build` — Production build (uses `.env.production`, real Firebase)
- `npm run emulators` — Start Firebase Emulator Suite (persists data in `emulator-data/`)
- `npm run emulators:fresh` — Start emulators without persisted data
- `npm run dev` — Start emulators + dev server concurrently
- `npm test` — Run tests (Jest via react-scripts, interactive watch mode)
- `npm test -- --watchAll=false` — Run tests non-interactively
- `npm test -- --testPathPattern=<path>` — Run a single test file
- `npx serve -s build -p 3000` — Serve production build locally

### Environments

| Environment | Config File       | Emulators | Command              |
|-------------|-------------------|-----------|----------------------|
| Development | `.env.development`| Yes       | `npm start`          |
| Production  | `.env.production` | No        | `npm run build`      |

Firebase config lives in env vars (`REACT_APP_FIREBASE_*`). The emulator connection is controlled by `REACT_APP_USE_EMULATORS`. Emulator UI available at `http://localhost:4000` when running.

## Architecture

### Tech Stack
- **React 18** + **TypeScript** (Create React App, strict mode)
- **Firebase Firestore** as the sole database (no backend server)
- **Bootstrap 5** + **Reactstrap** for UI components
- **Zod** + **react-hook-form** for form validation
- **PWA** with service worker (Workbox) and IndexedDB offline persistence

### Routing & Auth
Routes are role-based (`admin`, `teacher`, `student`) defined in `src/App.tsx`. Each role prefix (`/admin/*`, `/teacher/*`, `/student/*`) is wrapped in `<ProtectedRoute allowedRoles={[...]}>`. Auth uses a custom session system stored in localStorage (no Firebase Auth) — see `src/services/auth/auth.service.ts`. The `useAuth()` hook from `src/contexts/AuthContext.tsx` provides user state app-wide.

### Module Organization (`src/modules/`)
Feature modules grouped by role:
- `admin/` — Dashboard, UserManagement, ClassroomList, ProgramManagement, WhatsApp managers, BulkMessaging
- `teacher/` — TeacherDashboard, TeacherStudents
- `student/` — StudentDashboard, StudentClassroom, StudentProfile
- `shared/` — ClassroomManagement, UserProfile, StudentEnrollment (used across roles)
- `auth/` — Login, Register (multi-step with sections: PersonalInfo, ChurchInfo, AcademicInfo)
- `evaluation/` — EvaluationManager (lazy-loaded)

### Service Layer (`src/services/`)
Static class-based services, all built on `FirebaseService` (`src/services/firebase/firebase.service.ts`) which provides generic Firestore CRUD with automatic Timestamp-to-Date conversion. Domain services:
- `auth/auth.service.ts` — Session management, permissions by role
- `classroom/classroom.service.ts` — CRUD + finalization + restart
- `user/user.service.ts`, `program/program.service.ts`, `evaluation/evaluation.service.ts`
- `whatsapp/whatsapp.service.ts` — WhatsApp integration via external API
- `offline/` — `OfflineStorageService` (localStorage queue) + `SyncService` (auto-syncs on reconnect)

Firestore collections are defined in `COLLECTIONS` constant in `firebase.service.ts`: users, programs, classrooms, evaluations, sessions, attendance, participation, classroom_runs, finalization_snapshots.

### Data Models (`src/models/`)
TypeScript interfaces with barrel export via `src/models/index.ts`. Key models: `IUser` (unified for all roles with `UserRole` discriminator), `IClassroom`, `IProgram`, `IEnrollment`, `IStudentEvaluation`. Each model file provides `*Create` and `*Update` helper types.

### Validation (`src/schemas/`)
Zod schemas for form validation. `registration.schema.ts` handles the full registration form with Dominican-specific document validation (cedula format). Constants in `src/constants/registration.constants.ts`.

### Contexts
- `AuthContext` — User auth state, login/logout/register, role checks
- `OfflineContext` — Online/offline status, pending operation count, manual sync trigger

### Offline Support
Firebase IndexedDB persistence is enabled in `src/utils/firebase.ts`. For write operations while offline, `OfflineStorageService` queues operations to localStorage. `SyncService` replays them when connectivity returns. The `OfflineProvider` wraps the entire app in `src/index.tsx`.

### PDF Generation (`src/components/pdf/`)
Uses `@react-pdf/renderer` with a component library: core (PDFDocument, PDFPage, PDFTemplate), layout (PDFHeader, PDFSection, PDFColumns), data (PDFTable, PDFGrid), visual (PDFChart, PDFStatCard). Templates exist for payments and excursion reports.

### Custom Hooks (`src/hooks/`)
- `useUsers` — User CRUD operations
- `useBulkOperations` — Bulk student management
- `useProgramProgress` — Program completion tracking
