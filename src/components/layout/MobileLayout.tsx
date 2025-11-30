// Mobile-First Layout Component with Bottom Navigation

import React, { useState } from 'react';
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  Container,
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
  Button,
  ListGroup,
  ListGroupItem,
  Badge
} from 'reactstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';
import { ToastContainer } from 'react-toastify';
import OfflineSyncBadge from '../common/OfflineSyncBadge';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isOffline, pendingOperations } = useOffline();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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
        { path: '/admin/profile', icon: 'bi-person-fill', label: 'Perfil' },
        { path: '/admin/users', icon: 'bi-people-fill', label: 'Usuarios' },
        { path: '/admin/programs', icon: 'bi-collection-fill', label: 'Programas' },
        { path: '/admin/classrooms', icon: 'bi-door-open-fill', label: 'Clases' }
      );
    } else if (user.role === 'teacher' || user.isTeacher) {
      items.push(
        { path: '/teacher/dashboard', icon: 'bi-house-fill', label: 'Inicio' },
        { path: '/teacher/profile', icon: 'bi-person-fill', label: 'Perfil' },
        { path: '/teacher/students', icon: 'bi-people-fill', label: 'Estudiantes' },
        { path: '/teacher/classrooms', icon: 'bi-door-open-fill', label: 'Clases' }
      );
    } else if (user.role === 'student') {
      items.push(
        { path: '/student/dashboard', icon: 'bi-house-fill', label: 'Inicio' },
        { path: '/student/profile', icon: 'bi-person-fill', label: 'Perfil' },
        { path: '/student/grades', icon: 'bi-clipboard-data-fill', label: 'Notas' },
        { path: '/student/schedule', icon: 'bi-calendar-week-fill', label: 'Horario' }
      );
    }

    return items;
  };

  const navItems = getNavigationItems();

  // Don't show navigation on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <>
        {children}
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
      </>
    );
  }

  return (
    <>
      {/* Top Navigation Bar - Mobile Optimized */}
      <Navbar color="primary" dark fixed="top" className="shadow-sm">
        <Container fluid className="px-3">
          <NavbarBrand tag={Link} to="/" className="fw-bold">
            <i className="bi bi-mortarboard-fill me-2"></i>
            <span className="d-none d-sm-inline">Academia de Ministros Oasis de Amor</span>
            <span className="d-inline d-sm-none">AMOA</span>
          </NavbarBrand>

          <div className="d-flex align-items-center gap-2">
            {user && (
              <>
                {/* Offline indicator */}
                {isOffline && (
                  <Badge color="warning" className="d-none d-sm-inline">
                    <i className="bi bi-wifi-off me-1"></i>
                    Offline
                  </Badge>
                )}
                {/* Pending operations indicator */}
                {pendingOperations > 0 && (
                  <Badge color="danger" pill className="d-none d-sm-inline">
                    {pendingOperations}
                  </Badge>
                )}
                <Badge color="light" className="text-primary me-2 d-none d-sm-inline">
                  {user.firstName}
                </Badge>
                <Button
                  color="primary"
                  size="sm"
                  onClick={toggleMenu}
                  className="border-0 position-relative"
                >
                  <i className="bi bi-list fs-5"></i>
                  {pendingOperations > 0 && (
                    <Badge 
                      color="danger" 
                      pill 
                      className="position-absolute top-0 start-100 translate-middle"
                      style={{ fontSize: '0.6rem' }}
                    >
                      {pendingOperations}
                    </Badge>
                  )}
                </Button>
              </>
            )}
          </div>
        </Container>
      </Navbar>

      {/* Main Content with padding for fixed navbar and bottom nav */}
      <main style={{
        paddingTop: '60px',
        paddingBottom: '70px',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <Container fluid className="px-3 py-3">
          {children}
        </Container>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {user && navItems.length > 0 && (
        <Nav
          className="fixed-bottom bg-white border-top d-flex d-sm-none shadow-lg"
          style={{ height: '60px' }}
        >
          {navItems.slice(0, 4).map(item => (
            <NavItem key={item.path} className="flex-fill text-center">
              <NavLink
                tag={Link}
                to={item.path}
                className={`text-decoration-none py-2 ${
                  location.pathname === item.path ? 'text-primary' : 'text-secondary'
                }`}
              >
                <i className={`bi ${item.icon} d-block fs-5`}></i>
                <small style={{ fontSize: '0.7rem' }}>{item.label}</small>
              </NavLink>
            </NavItem>
          ))}
        </Nav>
      )}

      {/* Side Menu - Offcanvas */}
      <Offcanvas
        isOpen={menuOpen}
        toggle={toggleMenu}
        direction="end"
        className="offcanvas-end"
      >
        <OffcanvasHeader toggle={toggleMenu}>
          <div>
            <h5 className="mb-0">{user?.firstName} {user?.lastName}</h5>
            <small className="text-muted">
              {user?.role === 'admin' && 'Administrador'}
              {user?.isTeacher && 'Profesor'}
              {user?.role === 'student' && !user?.isTeacher && 'Estudiante'}
            </small>
          </div>
        </OffcanvasHeader>
        <OffcanvasBody>
          {/* User Profile Section */}
          <div className="text-center mb-4">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt="Profile"
                className="rounded-circle mb-3"
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '80px', height: '80px' }}
              >
                <i className="bi bi-person-fill text-white fs-1"></i>
              </div>
            )}
            <p className="mb-1">{user?.email || user?.phone}</p>
            
            {/* Connection Status */}
            {isOffline && (
              <Badge color="warning" className="mt-2">
                <i className="bi bi-wifi-off me-1"></i>
                Sin conexión
              </Badge>
            )}
          </div>

          {/* Offline Sync Badge */}
          {pendingOperations > 0 && (
            <div className="mb-3 p-3 bg-light rounded">
              <OfflineSyncBadge showButton={!isOffline} />
            </div>
          )}

          {/* Navigation Links */}
          <ListGroup flush>
            <ListGroupItem className="px-0">
              <small className="text-muted text-uppercase">Navegación</small>
            </ListGroupItem>
            {navItems.map(item => (
              <ListGroupItem
                key={item.path}
                tag={Link}
                to={item.path}
                action
                className={`border-0 ${
                  location.pathname === item.path ? 'bg-light text-primary' : ''
                }`}
                onClick={toggleMenu}
              >
                <i className={`bi ${item.icon} me-3`}></i>
                {item.label}
              </ListGroupItem>
            ))}
          </ListGroup>

          <hr />

          {/* Additional Options */}
          <ListGroup flush>
            <ListGroupItem className="px-0">
              <small className="text-muted text-uppercase">Opciones</small>
            </ListGroupItem>
            <ListGroupItem
              tag={Link}
              to="/settings"
              action
              className="border-0"
              onClick={toggleMenu}
            >
              <i className="bi bi-gear me-3"></i>
              Configuración
            </ListGroupItem>
            <ListGroupItem
              tag={Link}
              to="/help"
              action
              className="border-0"
              onClick={toggleMenu}
            >
              <i className="bi bi-question-circle me-3"></i>
              Ayuda
            </ListGroupItem>
            <ListGroupItem
              action
              className="border-0 text-danger"
              onClick={handleLogout}
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-box-arrow-right me-3"></i>
              Cerrar Sesión
            </ListGroupItem>
          </ListGroup>
        </OffcanvasBody>
      </Offcanvas>

      {/* Toast Container */}
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
    </>
  );
};

export default MobileLayout;
