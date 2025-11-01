<!-- 2fef0734-170a-4519-9820-02ddf2ecc024 e77a86ca-6e99-4948-9e41-271430eccd00 -->
# Classroom Management App Transformation Plan

## Phase 1: Data Architecture Restructuring

### 1.1 Create New Data Models and Interfaces

- Create `src/models/` directory with separated model files:
                                                                - `user.model.ts`: Unified user entity (students/teachers/admin) with roles
                                                                - `program.model.ts`: New program hierarchy level
                                                                - `classroom.model.ts`: Updated classroom with WhatsApp group integration
                                                                - `evaluation.model.ts`: New flexible evaluation system
                                                                - `whatsapp.model.ts`: WhatsApp group and messaging models
                                                                - `auth.model.ts`: Authentication and session models

### 1.2 Firebase Collections Structure

- Create new collections:
                                                                - `users`: Unified collection for all users (students, teachers, admins)
                                                                - `programs`: Program management
                                                                - `classrooms`: Updated with program reference and WhatsApp group
                                                                - `evaluations`: Separate evaluation records
                                                                - `sessions`: User authentication sessions

### 1.3 User Model Structure

```typescript
interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  password: string; // Plain text initially
  profilePhoto?: string;
  role: UserRole; // 'student' | 'teacher' | 'admin'
  isTeacher: boolean; // Can be both student and teacher
  createdAt: Date;
  updatedAt: Date;
  
  // Student/Teacher specific data
  enrolledClassrooms?: string[]; // As student
  teachingClassrooms?: string[]; // As teacher
  completedClassrooms?: ClassroomHistory[];
  currentEvaluations?: Evaluation[];
}
```

## Phase 2: Authentication & Role-Based Access Control

### 2.1 Authentication System

- Create `src/modules/auth/` directory:
                                                                - `Login.tsx`: Universal login (phone/email + password)
                                                                - `AuthContext.tsx`: Authentication state management
                                                                - `ProtectedRoute.tsx`: Role-based route protection
                                                                - `AuthService.ts`: Authentication logic

### 2.2 Role-Based Access Control (RBAC)

- Implement permission system:
                                                                - **Admin**: Full CRUD on all entities
                                                                - **Teacher**: Read/Update own classrooms and student profiles
                                                                - **Student**: Read own profile and enrolled classrooms
- Create `PermissionGuard` component for UI elements
- Add role checking in all service methods

## Phase 3: Unified User Management System

### 3.1 User Profile System

- Create `src/modules/users/` directory:
                                                                - `UserOnboarding.tsx`: Registration flow with photo upload
                                                                - `UserProfile.tsx`: Universal profile view (adapts to role)
                                                                - `UserList.tsx`: Admin view for all users
                                                                - `UserService.ts`: CRUD operations for users
                                                                - `RoleManager.tsx`: Admin component to change user roles

### 3.2 Teacher Management

- Create teacher-specific components:
                                                                - `TeacherDashboard.tsx`: View assigned classrooms
                                                                - `TeacherClassroom.tsx`: Manage classroom (attendance, participation)
                                                                - `TeacherStudentView.tsx`: View student profiles

### 3.3 Student Features

- Create student-specific components:
                                                                - `StudentDashboard.tsx`: View enrolled classrooms
                                                                - `StudentProgress.tsx`: View grades and history
                                                                - `StudentClassroom.tsx`: View classroom details

### 3.4 Admin Panel

- Create `src/modules/admin/` directory:
                                                                - `AdminDashboard.tsx`: Overview of system
                                                                - `UserManagement.tsx`: Manage all users and roles
                                                                - `ProgramManagement.tsx`: CRUD for programs
                                                                - `ClassroomManagement.tsx`: CRUD for classrooms
                                                                - `TeacherAssignment.tsx`: Assign/remove teachers from classrooms
                                                                - `StudentEnrollment.tsx`: Enroll/remove students from classrooms

## Phase 4: WhatsApp Integration

### 4.1 WhatsApp Service Layer

- Create `src/services/whatsapp/` directory:
                                                                - `WhatsappService.ts`: Core WhatsApp API integration
                                                                - `WhatsappGroupService.ts`: Group management operations
                                                                - `WhatsappMessageService.ts`: Messaging functionality

### 4.2 Classroom WhatsApp Features

- Add WhatsApp dropdown to each classroom (admin/teacher only):
                                                                - Create group option
                                                                - Sync group participants
                                                                - Send group message
- Add bulk messaging with checkbox selection
- Store WhatsApp group data in classroom object

## Phase 5: Program Hierarchy Implementation

### 5.1 Program Management

- Create `src/modules/programs/` directory:
                                                                - `ProgramList.tsx`: List all programs (filtered by role)
                                                                - `ProgramForm.tsx`: Create/edit programs (admin only)
                                                                - `ProgramService.ts`: Program CRUD operations

### 5.2 Classroom-Program Association

- Update classroom model to include `programId`
- Add `isActive` flag for classroom status
- Create program selection in classroom creation
- Allow teachers to be assigned to multiple classrooms

## Phase 6: New Evaluation System

### 6.1 Evaluation Components

- Create `src/modules/evaluation/` directory:
                                                                - `EvaluationConfig.tsx`: Configure evaluation criteria (teacher/admin)
                                                                - `StudentEvaluation.tsx`: Evaluate individual students
                                                                - `AttendanceTracker.tsx`: Module-by-module attendance
                                                                - `ParticipationTracker.tsx`: Participation points system
                                                                - `EvaluationSummary.tsx`: View final grades

### 6.2 Evaluation Features

- Implement flexible point system (total 100 points):
                                                                - Questionnaires (Book completion)
                                                                - Attendance (automatic calculation)
                                                                - Participation (incremental per module)
                                                                - Final exam/practice
                                                                - Custom criteria (teacher-defined)
- Create evaluation summary view
- Allow only teachers/admins to modify evaluations

## Phase 7: PWA & Offline Functionality

### 7.1 PWA Setup

- Add `public/manifest.json` with app metadata
- Create service worker for offline caching
- Add install prompt component
- Configure workbox for asset caching

### 7.2 Offline Data Management

- Implement IndexedDB for local storage:
                                                                - Store classroom data locally (for teachers)
                                                                - Queue offline changes
                                                                - Sync when online
- Create sync service for data reconciliation
- Add online/offline status indicator
- Prioritize teacher offline features (attendance, participation)

## Phase 8: UI/UX Updates

### 8.1 Navigation Structure

- Create role-based routing:
  ```
  Public Routes:
  - `/login` - Universal login
  - `/register` - User registration
  
  Student Routes:
  - `/student/dashboard` - Student dashboard
  - `/student/profile` - Student profile
  - `/student/classroom/:id` - Classroom details
  
  Teacher Routes:
  - `/teacher/dashboard` - Teacher dashboard
  - `/teacher/classroom/:id` - Manage classroom
  - `/teacher/students` - View students
  
  Admin Routes:
  - `/admin/dashboard` - Admin dashboard
  - `/admin/users` - User management
  - `/admin/programs` - Program management
  - `/admin/classrooms` - Classroom management
  - `/admin/reports` - System reports
  ```


### 8.2 Component Updates

- Create role-based navigation menu
- Update all UI text to Spanish
- Create responsive design for mobile
- Add loading states and error handling
- Implement proper form validation
- Add role indicators in UI

## Phase 9: Google Cloud Storage Integration

### 9.1 Profile Photo Upload

- Implement profile photo upload using existing GCloud utilities
- Add environment variable: `VITE_APP_API=https://grupo-betuel-api.click/api`
- Create photo upload component with camera/file options
- Add photo compression before upload

## Phase 10: Migration & Deployment

### 10.1 Data Migration

- Create migration script for existing data:
                                                                - Convert existing students and teachers to unified users
                                                                - Assign appropriate roles
                                                                - Create default program for existing classrooms
                                                                - Convert evaluation format
                                                                - Maintain classroom history

### 10.2 Testing & Deployment

- Test role-based access control
- Test WhatsApp integrations
- Verify offline functionality for teachers
- Test PWA installation on devices
- Deploy and monitor

## Implementation Order

1. **Week 1**: Data models and unified user system
2. **Week 1-2**: Authentication and RBAC implementation
3. **Week 2-3**: User management and role-specific dashboards
4. **Week 3-4**: WhatsApp integration and admin panel
5. **Week 4-5**: Program hierarchy and evaluation system
6. **Week 5-6**: PWA and offline functionality (focus on teacher features)
7. **Week 6-7**: UI updates and Google Cloud integration
8. **Week 7-8**: Migration, testing and deployment

## Key Technical Decisions

- Unified user model with role-based differentiation
- Simple password storage (plain text) initially as requested
- Firebase for data persistence (remove real-time listeners)
- IndexedDB with Dexie.js for offline storage
- React Context for authentication and state management
- Role-based route protection with React Router
- TypeScript interfaces for type safety
- Service layer pattern for business logic

## Security Considerations

- Implement role checking on both frontend and backend
- Use Firebase Security Rules to enforce permissions
- Validate all user inputs
- Implement session timeout
- Add audit logging for admin actions

## IMPORTANT!

This application will be used mainly in mobile, so all the UI/UX must be mobile-first.

## File Structure

```
src/
├── models/
│   ├── user.model.ts
│   ├── program.model.ts
│   ├── classroom.model.ts
│   ├── evaluation.model.ts
│   ├── whatsapp.model.ts
│   └── auth.model.ts
├── services/
│   ├── whatsapp/
│   ├── firebase/
│   ├── offline/
│   ├── gcloud/
│   └── auth/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── admin/
│   ├── teacher/
│   ├── student/
│   ├── programs/
│   ├── classrooms/
│   └── evaluation/
├── components/
│   ├── common/
│   ├── layout/
│   └── guards/
├── contexts/
│   ├── AuthContext.tsx
│   └── OfflineContext.tsx
└── utils/
    ├── auth.utils.ts
    ├── permissions.utils.ts
    └── sync.utils.ts
```

This comprehensive plan addresses all three user roles with appropriate permissions and maintains a unified user system for scalability.

### To-dos

- [ ] Create new TypeScript interfaces and data models for all entities
- [ ] Set up new Firebase collections and update configuration
- [ ] Implement student management with authentication and profiles
- [ ] Integrate WhatsApp API for group management and messaging
- [ ] Add program management layer above classrooms
- [x] Implement new flexible evaluation system with custom criteria
- [ ] Add PWA capabilities and offline functionality
- [x] Update UI components to Spanish and add new views
- [ ] Create data migration scripts and test deployment