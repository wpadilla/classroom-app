import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { STUDENT_ONBOARDING_ROUTE } from '../../constants/onboarding.constants';
import { needsStudentOnboarding } from '../../utils/onboarding';

const StudentOnboardingBanner: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!needsStudentOnboarding(user) || location.pathname === STUDENT_ONBOARDING_ROUTE) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="bg-indigo-600 shadow-md relative z-40"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-indigo-200 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
              Integración pendiente
            </p>
            <h6 className="text-white text-sm font-medium m-0 truncate">
              Completa tu onboarding para terminar tu inscripción.
            </h6>
          </div>

          <Link
            to={STUDENT_ONBOARDING_ROUTE}
            className="shrink-0 inline-flex items-center justify-center px-4 py-1.5 border border-transparent text-xs font-semibold rounded-md text-indigo-700 bg-white hover:bg-indigo-50 transition-colors pointer-events-auto shadow-sm no-underline active:scale-95"
          >
            Hacer onboarding
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentOnboardingBanner;
