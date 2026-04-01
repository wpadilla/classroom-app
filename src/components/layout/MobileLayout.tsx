// Mobile-First Layout Component with Bottom Navigation
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';

import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';
import AppUpdateBanner from '../common/AppUpdateBanner';
import OfflineSyncBadge from '../common/OfflineSyncBadge';
import PWAInstallButton from '../common/PWAInstallButton';
import StudentOnboardingBanner from '../common/StudentOnboardingBanner';
import { STUDENT_ONBOARDING_ROUTE } from '../../constants/onboarding.constants';
import { needsStudentOnboarding } from '../../utils/onboarding';
import { BottomDrawer } from '../mobile/BottomDrawer';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isOffline, pendingOperations } = useOffline();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const showOnboardingBanner =
    needsStudentOnboarding(user) && location.pathname !== STUDENT_ONBOARDING_ROUTE;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Define navigation items based on role
  const getNavigationItems = () => {
    if (!user) return [];

    const items = [];

    if (user.role === 'admin') {
      items.push(
        { path: '/admin/dashboard', icon: 'bi-house-fill', label: 'Inicio' },
        { path: '/admin/classrooms', icon: 'bi-door-open-fill', label: 'Clases' },
        { path: '/admin/users', icon: 'bi-people-fill', label: 'Usuarios' },
        { path: '/admin/profile', icon: 'bi-person-fill', label: 'Perfil' }
      );
    } else if (user.role === 'teacher' || user.isTeacher) {
      items.push(
        { path: '/teacher/dashboard', icon: 'bi-house-fill', label: 'Inicio' },
        { path: '/teacher/classrooms', icon: 'bi-door-open-fill', label: 'Clases' },
        { path: '/teacher/students', icon: 'bi-people-fill', label: 'Estudiantes' },
        { path: '/teacher/profile', icon: 'bi-person-fill', label: 'Perfil' }
      );
    } else if (user.role === 'student') {
      items.push(
        { path: '/student/dashboard', icon: 'bi-house-fill', label: 'Inicio' },
        { path: '/student/grades', icon: 'bi-clipboard-data-fill', label: 'Notas' },
        { path: '/student/schedule', icon: 'bi-calendar-week-fill', label: 'Horario' },
        { path: '/student/profile', icon: 'bi-person-fill', label: 'Perfil' }
      );
    }

    return items;
  };

  const navItems = getNavigationItems();

  // Don't show navigation on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="px-3 pt-3">
          <AppUpdateBanner />
        </div>
        <div className="flex-1">
          {children}
        </div>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
          theme="light"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-safe">
      {/* Top Navigation Bar - Glassmorphic */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm safe-top">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-decoration-none border-0 active:opacity-70 transition-opacity">
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden p-1">
              <img src="/logo.png" alt="AMOA Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight truncate w-40 sm:w-auto">
                <span className="hidden sm:inline">Academia de Ministros Oasis de Amor</span>
                <span className="inline sm:hidden">AMOA</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Status indicators */}
            <div className="hidden sm:flex items-center gap-2">
              {isOffline && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <i className="bi bi-wifi-off" /> Offline
                </span>
              )}
              {pendingOperations > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  {pendingOperations} pend.
                </span>
              )}
            </div>

            <PWAInstallButton compact />

            {/* User menu button */}
            {user && (
              <button
                onClick={toggleMenu}
                className="relative w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center active:bg-gray-200 transition-colors shrink-0"
              >
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-gray-600 font-bold text-xs">{user.firstName.charAt(0)}</span>
                )}
                
                {pendingOperations > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                    {pendingOperations}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Global Banners */}
      <div className="flex-none">
        {showOnboardingBanner && <StudentOnboardingBanner />}
        <div className="px-3 pt-3 empty:hidden">
          <AppUpdateBanner />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 mb-[70px]">
        {children}
      </main>

      {/* Bottom Navigation (Thumb Zone) */}
      {user && navItems.length > 0 && (
        <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)] pb-safe z-40 sm:hidden">
          <div className="h-16 flex items-center justify-around px-2">
            {navItems.slice(0, 4).map(item => {
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center justify-center w-full h-full text-decoration-none active:scale-95 transition-transform"
                >
                  <div className={`relative flex items-center justify-center w-10 h-8 rounded-full mb-1 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-indicator"
                        className="absolute inset-0 bg-blue-50 rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      />
                    )}
                    <i className={`bi ${item.icon} text-xl relative z-10 ${isActive ? 'scale-110 drop-shadow-sm' : ''} transition-transform`} />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Side Menu Drawer -> Bottom Drawer */}
      <BottomDrawer
        isOpen={menuOpen}
        onClose={toggleMenu}
        title="Menú Principal"
      >
        <div className="p-4 space-y-5">
          {/* User Profile Summary */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 text-2xl font-bold">
                {user?.firstName?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate mb-0.5">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-xs text-gray-500 truncate mb-1">
                {user?.email || user?.phone}
              </p>
              <div className="flex gap-2">
                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                  {user?.role === 'admin' ? 'Administrador' : user?.role === 'teacher' ? 'Profesor' : 'Estudiante'}
                </span>
                {isOffline && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-semibold uppercase flex items-center gap-1">
                    <i className="bi bi-wifi-off" /> Offline
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sync Stats */}
          {pendingOperations > 0 && (
            <div className="bg-white border border-red-100 rounded-xl p-3">
              <OfflineSyncBadge showButton={!isOffline} />
            </div>
          )}

          {/* Extended Admin Navigation */}
          {user?.role === 'admin' && (
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Administración Escolar
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                <Link to="/admin/programs" onClick={toggleMenu} className="flex items-center gap-3 p-3 text-gray-700 active:bg-gray-50 text-decoration-none">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><i className="bi bi-collection-fill" /></div>
                  <span className="font-medium text-sm">Programas</span>
                </Link>
                <Link to="/admin/statistics" onClick={toggleMenu} className="flex items-center gap-3 p-3 text-gray-700 active:bg-gray-50 text-decoration-none">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><i className="bi bi-graph-up-arrow" /></div>
                  <span className="font-medium text-sm">Estadísticas</span>
                </Link>
              </div>
            </div>
          )}

          {/* Extra Options */}
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Opciones
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
              <Link to="/settings" onClick={toggleMenu} className="flex items-center gap-3 p-3 text-gray-700 active:bg-gray-50 text-decoration-none">
                <i className="bi bi-gear text-lg text-gray-400 w-6 text-center" />
                <span className="font-medium text-sm">Configuración</span>
              </Link>
              <Link to="/help" onClick={toggleMenu} className="flex items-center gap-3 p-3 text-gray-700 active:bg-gray-50 text-decoration-none">
                <i className="bi bi-question-circle text-lg text-gray-400 w-6 text-center" />
                <span className="font-medium text-sm">Ayuda</span>
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-600 active:bg-red-50 bg-white border-0 text-left">
                <i className="bi bi-box-arrow-right text-lg w-6 text-center" />
                <span className="font-medium text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </BottomDrawer>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="light"
      />
    </div>
  );
};

export default MobileLayout;
