// Main App Component with Role-Based Routing

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/guards/ProtectedRoute';

// Auth Components
import Login from './modules/auth/Login';
import Register from './modules/auth/Register';

// Admin Components
import AdminDashboard from './modules/admin/AdminDashboard';
import UserManagement from './modules/admin/UserManagement';
import ProgramManagement from './modules/admin/ProgramManagement';
import ClassroomList from './modules/admin/ClassroomList';

// Teacher Components
import TeacherDashboard from './modules/teacher/TeacherDashboard';
import TeacherStudents from './modules/teacher/TeacherStudents';

// Shared Components
import ClassroomManagement from './modules/shared/ClassroomManagement';

// Student Components (to be created)
import StudentDashboard from './modules/student/StudentDashboard';
import StudentProfile from './modules/student/StudentProfile';
import StudentClassroom from './modules/student/StudentClassroom';

// Layout Components
import MobileLayout from './components/layout/MobileLayout';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './styles/mobile.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MobileLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Root redirect based on authentication */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="programs" element={<ProgramManagement />} />
                  <Route path="classrooms" element={<ClassroomList />} />
                  <Route path="classroom/:id" element={<ClassroomManagement />} />
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
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="classroom/:id" element={<StudentClassroom />} />
                  <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </MobileLayout>
    </AuthProvider>
  );
};

export default App;