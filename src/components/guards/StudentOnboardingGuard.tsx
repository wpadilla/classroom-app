import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { STUDENT_ONBOARDING_ROUTE } from '../../constants/onboarding.constants';
import { needsStudentOnboarding } from '../../utils/onboarding';
import { UserRole } from '../../models';

interface StudentOnboardingGuardProps {
  children: React.ReactNode;
}

const roleDashboardMap: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
};

const StudentOnboardingGuard: React.FC<StudentOnboardingGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return <>{children}</>;
  }

  if (needsStudentOnboarding(user) && location.pathname !== STUDENT_ONBOARDING_ROUTE) {
    return <Navigate to={STUDENT_ONBOARDING_ROUTE} replace state={{ from: location }} />;
  }

  if (!needsStudentOnboarding(user) && location.pathname === STUDENT_ONBOARDING_ROUTE) {
    return <Navigate to={roleDashboardMap[user.role]} replace />;
  }

  return <>{children}</>;
};

export default StudentOnboardingGuard;
