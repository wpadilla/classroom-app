// Main App Component with Role-Based Routing

import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/guards/ProtectedRoute';
import StudentOnboardingGuard from './components/guards/StudentOnboardingGuard';

// Auth Components
import Login from './modules/auth/Login';
import { AuthService } from './services/auth/auth.service';

// Admin Components
import AdminDashboard from './modules/admin/AdminDashboard';
import UserManagement from './modules/admin/UserManagement';
import ProgramManagement from './modules/admin/ProgramManagement';
import ClassroomList from './modules/admin/ClassroomList';
import WhatsAppManager from './modules/admin/WhatsAppManager';
import WhatsAppGroupManager from './modules/admin/WhatsAppGroupManager';
import BulkMessaging from './modules/admin/BulkMessaging';
import Statistics from './modules/admin/Statistics';

// Teacher Components
import TeacherDashboard from './modules/teacher/TeacherDashboard';
import TeacherStudents from './modules/teacher/TeacherStudents';

// Shared Components
import ClassroomManagement from './modules/shared/ClassroomManagement';
import UserProfile from './modules/shared/UserProfile';

// Student Components (to be created)
import StudentDashboard from './modules/student/StudentDashboard';
import StudentClassroom from './modules/student/StudentClassroom';
import StudentGrades from './modules/student/StudentGrades';
import StudentSchedule from './modules/student/StudentSchedule';
import StudentOnboarding from './modules/student/StudentOnboarding';

// Layout Components
import MobileLayout from './components/layout/MobileLayout';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './styles/mobile.css';

const PhoneQuickLoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, isAuthenticated, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessingQuickLogin, setIsProcessingQuickLogin] = React.useState(false);

  const cleanedSearch = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    params.delete('phone');
    const serializedParams = params.toString();
    return serializedParams ? `?${serializedParams}` : '';
  }, [location.search]);

  React.useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const phone = params.get('phone')?.trim();

    if (!phone) {
      return;
    }

    let isCancelled = false;

    const attemptQuickLogin = async () => {
      setIsProcessingQuickLogin(true);

      try {
        const response = await AuthService.login({
          identifier: phone,
          password: phone,
        });

        if (isCancelled) {
          return;
        }

        if (response.success) {
          await refreshUser();

          navigate(
            {
              pathname: '/',
              search: cleanedSearch,
            },
            { replace: true }
          );
          return;
        }

        navigate('/login', {
          replace: true,
          state: {
            from: {
              pathname: location.pathname,
              search: cleanedSearch,
            },
          },
        });
      } finally {
        if (!isCancelled) {
          setIsProcessingQuickLogin(false);
        }
      }
    };

    void attemptQuickLogin();

    return () => {
      isCancelled = true;
    };
  }, [cleanedSearch, isAuthenticated, loading, location.pathname, location.search, navigate, refreshUser]);

  if (loading || isProcessingQuickLogin) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <MobileLayout>
    <PhoneQuickLoginGate>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login mode="login" />} />
        <Route path="/register" element={<Login mode="create" />} />
        
        {/* Root redirect based on authentication */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="programs" element={<ProgramManagement />} />
                <Route path="classrooms" element={<ClassroomList />} />
                <Route path="classroom/:id" element={<ClassroomManagement />} />
                {/* WhatsApp Routes - Admin Only */}
                <Route path="statistics" element={<Statistics />} />
                <Route path="whatsapp" element={<WhatsAppManager />} />
                <Route path="whatsapp/groups" element={<WhatsAppGroupManager />} />
                <Route path="whatsapp/bulk-messaging" element={<BulkMessaging />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        
        {/* Teacher Routes */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Routes>
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="classroom/:id" element={<ClassroomManagement />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="evaluation/:classroomId" element={
                  <React.Suspense fallback={<div className="text-center py-5">Cargando...</div>}>
                    {React.createElement(React.lazy(() => import('./modules/evaluation/EvaluationManager')))}
                  </React.Suspense>
                } />
                <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        
        {/* Student Routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
              <StudentOnboardingGuard>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="classroom/:id" element={<StudentClassroom />} />
                  <Route path="grades" element={<StudentGrades />} />
                  <Route path="schedule" element={<StudentSchedule />} />
                  <Route path="onboarding" element={<StudentOnboarding />} />
                  <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
                </Routes>
              </StudentOnboardingGuard>
            </ProtectedRoute>
          }
        />
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </PhoneQuickLoginGate>
  </MobileLayout>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
