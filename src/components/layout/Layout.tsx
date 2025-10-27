// Main Layout Component with Role-Based Navigation

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Navbar,
  NavbarBrand,
  NavbarToggler,
  Collapse,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Container,
  Badge
} from 'reactstrap';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGuard from '../guards/PermissionGuard';
import { ToastContainer } from 'react-toastify';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Don't show navigation on login/register pages
  const hideNavigation = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      {!hideNavigation && isAuthenticated && (
        <Navbar color="dark" dark expand="md" className="shadow-sm">
          <Container>
            <NavbarBrand tag={Link} to="/" className="fw-bold">
              <i className="bi bi-mortarboard-fill me-2"></i>
              Instituto Cristiano
            </NavbarBrand>
            <NavbarToggler onClick={toggle} />
            <Collapse isOpen={isOpen} navbar>
              <Nav className="me-auto" navbar>
                {/* Admin Navigation */}
                <PermissionGuard allowedRoles={['admin']}>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      to="/admin/dashboard"
                      active={isActive('/admin/dashboard')}
                    >
                      <i className="bi bi-speedometer2 me-1"></i>
                      Panel Admin
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      to="/admin/users"
                      active={isActive('/admin/users')}
                    >
                      <i className="bi bi-people me-1"></i>
                      Usuarios
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      to="/admin/programs"
                      active={isActive('/admin/programs')}
                    >
                      <i className="bi bi-collection me-1"></i>
                      Programas
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      to="/admin/classrooms"
                      active={isActive('/admin/classrooms')}
                    >
                      <i className="bi bi-door-open me-1"></i>
                      Clases
                    </NavLink>
                  </NavItem>
                </PermissionGuard>

                {/* Teacher Navigation */}
                <PermissionGuard allowedRoles={['teacher']}>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      to="/teacher/dashboard"
                      active={isActive('/teacher/dashboard')}
                    >
                      <i className="bi bi-house me-1"></i>
                      Mi Panel
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      to="/teacher/students"
                      active={isActive('/teacher/students')}
                    >
                      <i className="bi bi-person-lines-fill me-1"></i>
                      Estudiantes
                    </NavLink>
                  </NavItem>
                </PermissionGuard>

                {/* Student Navigation */}
                <PermissionGuard allowedRoles={['student']}>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      to="/student/dashboard"
                      active={isActive('/student/dashboard')}
                    >
                      <i className="bi bi-house me-1"></i>
                      Mi Panel
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      to="/student/profile"
                      active={isActive('/student/profile')}
                    >
                      <i className="bi bi-person-circle me-1"></i>
                      Mi Perfil
                    </NavLink>
                  </NavItem>
                </PermissionGuard>
              </Nav>

              <Nav navbar>
                {user && (
                  <UncontrolledDropdown nav inNavbar>
                    <DropdownToggle nav caret className="d-flex align-items-center">
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt="Profile"
                          className="rounded-circle me-2"
                          style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                        />
                      ) : (
                        <i className="bi bi-person-circle me-2 fs-5"></i>
                      )}
                      <span className="d-none d-md-inline">
                        {user.firstName} {user.lastName}
                      </span>
                      <Badge color="primary" pill className="ms-2">
                        {user.role === 'admin' ? 'Admin' : 
                         user.role === 'teacher' ? 'Profesor' : 'Estudiante'}
                      </Badge>
                    </DropdownToggle>
                    <DropdownMenu end>
                      <DropdownItem header>
                        {user.email || user.phone}
                      </DropdownItem>
                      <DropdownItem divider />
                      <DropdownItem tag={Link} to="/student/profile">
                        <i className="bi bi-person me-2"></i>
                        Mi Perfil
                      </DropdownItem>
                      <DropdownItem tag={Link} to="/settings">
                        <i className="bi bi-gear me-2"></i>
                        Configuración
                      </DropdownItem>
                      <DropdownItem divider />
                      <DropdownItem onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Cerrar Sesión
                      </DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                )}
              </Nav>
            </Collapse>
          </Container>
        </Navbar>
      )}

      <main className={hideNavigation ? '' : 'mt-3'}>
        {children}
      </main>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default Layout;
