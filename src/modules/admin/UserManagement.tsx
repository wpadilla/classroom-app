// Complete User Management Module for Admins

import React, { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  InputGroup,
  InputGroupText,
  Alert,
  Nav,
  NavItem,
  NavLink,
  Spinner,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import { toast } from 'react-toastify';
import { UserService } from '../../services/user/user.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { ProgramService } from '../../services/program/program.service';
import { IUser, UserRole, IClassroom, IProgram } from '../../models';
import BulkOperationsToolbar from './components/BulkOperationsToolbar';
import UserDetailModal from './components/UserDetailModal';
import StudentImporter from './components/StudentImporter';
import { UserProfilePdfDownloadButton } from '../../components/pdf/components/UserProfilePdfDownloadButton';
import StudentEnrollmentManagerModal from '../../components/enrollment/StudentEnrollmentManagerModal';
import DataTable, { Column } from '../../components/common/DataTable';
import UserFiltersModal, { UserFilters, defaultUserFilters } from './components/UserFiltersModal';
import { UserListPdfDocument } from '../../components/pdf/UserListPdfDocument';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const UserManagement: React.FC = () => {
  // State
  const [users, setUsers] = useState<IUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<IUser[]>([]);
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<UserFilters>(defaultUserFilters);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<IUser | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'student' as UserRole,
    isTeacher: false,
    isActive: true
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersList, classroomsList, programsList] = await Promise.all([
        UserService.getAllUsers(),
        ClassroomService.getAllClassrooms(),
        ProgramService.getAllPrograms()
      ]);
      setUsers(usersList);
      setClassrooms(classroomsList);
      setPrograms(programsList);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // General Filters
    if (filters.role !== 'all') {
      if (filters.role === 'teacher') {
        filtered = filtered.filter(u => u.isTeacher);
      } else {
        filtered = filtered.filter(u => u.role === filters.role);
      }
    }

    if (filters.isActive !== 'all') {
      filtered = filtered.filter(u => u.isActive === (filters.isActive === 'true'));
    }

    if (filters.enrollmentType !== 'all') {
      filtered = filtered.filter(u => u.enrollmentType === filters.enrollmentType);
    }

    if (filters.historyStatus !== 'all') {
      if (filters.historyStatus === 'no-history') {
        filtered = filtered.filter(u => 
          (!u.completedClassrooms || u.completedClassrooms.length === 0) &&
          (!u.enrolledClassrooms || u.enrolledClassrooms.length === 0)
        );
      } else if (filters.historyStatus === 'has-history') {
        filtered = filtered.filter(u => 
          (u.completedClassrooms && u.completedClassrooms.length > 0) ||
          (u.enrolledClassrooms && u.enrolledClassrooms.length > 0)
        );
      }
    }

    if (filters.activeEnrollments !== 'all') {
      if (filters.activeEnrollments === 'zero') {
        filtered = filtered.filter(u => !u.enrolledClassrooms || u.enrolledClassrooms.length === 0);
      } else if (filters.activeEnrollments === 'one-or-more') {
        filtered = filtered.filter(u => u.enrolledClassrooms && u.enrolledClassrooms.length > 0);
      }
    }

    // Program filter
    if (filters.programId !== '') {
      const programClassroomIds = classrooms
        .filter(c => c.programId === filters.programId)
        .map(c => c.id);
      filtered = filtered.filter(u => 
        (u.enrolledClassrooms || []).some(cId => programClassroomIds.includes(cId))
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => {
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const phone = u.phone.toLowerCase();
        const email = (u.email || '').toLowerCase();
        return fullName.includes(query) || phone.includes(query) || email.includes(query);
      });
    }

    setFilteredUsers(filtered);
  }, [filters, classrooms, searchQuery, users]);

  const handleExportCSV = () => {
    try {
      setExporting(true);
      const dataToExport = filteredUsers.map(u => ({
        ID: u.id,
        Nombres: u.firstName,
        Apellidos: u.lastName,
        Teléfono: u.phone,
        Correo: u.email || 'N/A',
        Rol: u.isTeacher ? 'Profesor' : (u.role === 'admin' ? 'Admin' : 'Estudiante'),
        Estado: u.isActive ? 'Activo' : 'Inactivo',
        Tipo_Ingreso: u.enrollmentType || 'N/A',
        Inscripciones_Activas: u.enrolledClassrooms?.length || 0,
        Clases_Dadas: u.teachingClassrooms?.length || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
      
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'usuarios_amoa.xlsx');
      toast.success('Excel exportado correctamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al exportar a Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      toast.info('Generando PDF, por favor espere...', { autoClose: 2000 });
      
      const blob = await pdf(<UserListPdfDocument users={filteredUsers} />).toBlob();
      saveAs(blob, 'reporte_usuarios_amoa.pdf');
      
      toast.success('PDF exportado correctamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<IUser>[] = [
    {
      header: 'Foto',
      width: '60px',
      render: (_, user) => (
        <div style={{ cursor: 'pointer' }} onClick={() => handleOpenDetailModal(user)}>
          {user.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.firstName}
              className="rounded-circle"
              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px' }}
            >
              <i className="bi bi-person-fill text-white"></i>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Nombre',
      accessor: 'firstName',
      render: (_, user) => (
        <div style={{ cursor: 'pointer' }} onClick={() => handleOpenDetailModal(user)}>
          <span className="text-primary fw-semibold">{user.firstName} {user.lastName}</span>
        </div>
      )
    },
    { header: 'Teléfono', accessor: 'phone' },
    { header: 'Correo', accessor: 'email', mobileHidden: true, render: (v) => v || '-' },
    {
      header: 'Rol',
      render: (_, user) => (
        <div>
          {user.role === 'admin' && <Badge color="warning" className="me-1">Admin</Badge>}
          {user.isTeacher && <Badge color="info" className="me-1">Profesor</Badge>}
          {user.role === 'student' && !user.isTeacher && <Badge color="primary">Estudiante</Badge>}
        </div>
      )
    },
    {
      header: 'Estado',
      render: (_, user) => (
        <Badge color={user.isActive ? 'success' : 'danger'}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      header: 'Clases',
      mobileHidden: true,
      render: (_, user) => (
        <div>
          {user.role === 'student' && (
            <Badge color="secondary" className="me-1">
              {user.enrolledClassrooms?.length || 0} inscritas
            </Badge>
          )}
          {user.isTeacher && (
            <Badge color="secondary">
              {user.teachingClassrooms?.length || 0} enseñando
            </Badge>
          )}
        </div>
      )
    }
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.role !== 'all') count++;
    if (filters.isActive !== 'all') count++;
    if (filters.enrollmentType !== 'all') count++;
    if (filters.historyStatus !== 'all') count++;
    if (filters.activeEnrollments !== 'all') count++;
    if (filters.programId !== '') count++;
    return count;
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  // Selection handlers
  const handleToggleSelection = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredUsers.map(u => u.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Open user detail modal
  const handleOpenDetailModal = (user: IUser) => {
    setDetailUser(user);
    setDetailModalOpen(true);
  };

  const handleOpenModal = (user?: IUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || '',
        phone: user.phone,
        password: '',
        role: user.role,
        isTeacher: user.isTeacher,
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'student',
        isTeacher: false,
        isActive: true
      });
    }
    setUserModal(true);
  };

  const handleSaveUser = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }


    try {
      if (editingUser) {
        // Update existing user
        const updates: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone,
          role: formData.role,
          isTeacher: formData.isTeacher,
          isActive: formData.isActive
        };

        if (formData.password) {
          updates.password = formData.password;
        }

        await UserService.updateUser(editingUser.id, updates);
        toast.success('Usuario actualizado exitosamente');
      } else {
        // Create new user
        await UserService.createUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          isTeacher: formData.isTeacher,
          isActive: formData.isActive,
          enrolledClassrooms: [],
          completedClassrooms: [],
          teachingClassrooms: [],
          taughtClassrooms: [],
          once: formData.role === 'student' ? { onboarding: false } : undefined,
        });
        toast.success('Usuario creado exitosamente');
      }

      setUserModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Error al guardar usuario');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await UserService.deleteUser(userToDelete.id);
      toast.success('Usuario eliminado exitosamente');
      setDeleteModal(false);
      setUserToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  const handleToggleUserStatus = async (user: IUser) => {
    try {
      await UserService.updateUser(user.id, { isActive: !user.isActive });
      toast.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'} exitosamente`);
      await loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Error al cambiar el estado del usuario');
    }
  };

  const handleToggleTeacherStatus = async (user: IUser) => {
    try {
      await UserService.toggleTeacherStatus(user.id);
      toast.success(`Estado de profesor ${user.isTeacher ? 'removido' : 'asignado'}`);
      await loadData();
    } catch (error) {
      console.error('Error toggling teacher status:', error);
      toast.error('Error al cambiar el estado de profesor');
    }
  };

  const handleOpenEnrollModal = (user: IUser) => {
    setSelectedUser(user);
    setEnrollModal(true);
  };

  const handleCloseEnrollModal = () => {
    setEnrollModal(false);
    setSelectedUser(null);
  };

  const getUserStats = () => {
    return {
      total: users.length,
      students: users.filter(u => u.role === 'student' && !u.isTeacher).length,
      teachers: users.filter(u => u.isTeacher).length,
      admins: users.filter(u => u.role === 'admin').length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    };
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando usuarios...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Gestión de Usuarios</h2>
            <div className="d-flex flex-wrap gap-2 justify-content-end">
              <UncontrolledDropdown>
                <DropdownToggle color="light" caret disabled={exporting}>
                  {exporting ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-download me-2"></i>}
                  Exportar
                </DropdownToggle>
                <DropdownMenu end>
                  <DropdownItem onClick={handleExportCSV}>
                    <i className="bi bi-file-earmark-excel text-success me-2"></i> Documento CSV / Excel
                  </DropdownItem>
                  <DropdownItem onClick={handleExportPDF}>
                    <i className="bi bi-file-earmark-pdf text-danger me-2"></i> Documento PDF
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
              <Button 
                color="info" 
                className="text-white"
                onClick={() => setShowImporter(true)}
              >
                <i className="bi bi-upload me-2"></i>
                Importar Excel
              </Button>
              <Button color="primary" onClick={() => handleOpenModal()}>
                <i className="bi bi-person-plus me-2"></i>
                Nuevo Usuario
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Statistics */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0">{stats.total}</h3>
              <small className="text-muted">Total</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0 text-primary">{stats.students}</h3>
              <small className="text-muted">Estudiantes</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0 text-info">{stats.teachers}</h3>
              <small className="text-muted">Profesores</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0 text-warning">{stats.admins}</h3>
              <small className="text-muted">Admins</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0 text-success">{stats.active}</h3>
              <small className="text-muted">Activos</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0 text-danger">{stats.inactive}</h3>
              <small className="text-muted">Inactivos</small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={8}>
          <InputGroup>
            <InputGroupText className="bg-white">
              <i className="bi bi-search text-muted"></i>
            </InputGroupText>
            <Input
              placeholder="Buscar por nombre, teléfono o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-start-0"
            />
          </InputGroup>
        </Col>
        <Col md={4} className="mt-3 mt-md-0 d-flex justify-content-end">
          <Button 
            color="light" 
            className="w-100 d-flex justify-content-center align-items-center position-relative border"
            onClick={() => setFiltersModalOpen(true)}
          >
            <i className="bi bi-funnel me-2"></i>
            Filtros Avanzados
            {getActiveFilterCount() > 0 && (
              <Badge color="primary" pill className="position-absolute" style={{ top: '-8px', right: '-8px' }}>
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </Col>
      </Row>

      {/* Filters Modal */}
      <UserFiltersModal 
        isOpen={filtersModalOpen} 
        onClose={() => setFiltersModalOpen(false)} 
        filters={filters} 
        onFiltersChange={setFilters} 
        programs={programs} 
      />

      {/* Bulk Operations Toolbar */}
      <BulkOperationsToolbar
        users={filteredUsers}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onToggleSelection={handleToggleSelection}
        onRefresh={loadData}
      />

      {/* Users DataTable */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        keyExtractor={(u: IUser) => u.id}
        searchable={false} /* Search is handled externaly above */
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        pagination={true}
        defaultPageSize={10}
        emptyState={
          <Alert color="info" className="mb-0">
            <i className="bi bi-info-circle me-2"></i>
            No se encontraron usuarios que coincidan con los filtros.
          </Alert>
        }
        actions={(user: IUser) => (
          <div className="text-center">
            <UncontrolledDropdown>
              <DropdownToggle color="link" className="text-dark p-0">
                <i className="bi bi-three-dots-vertical"></i>
              </DropdownToggle>
              <DropdownMenu end>
                <DropdownItem onClick={() => handleOpenDetailModal(user)}>
                  <i className="bi bi-eye me-2"></i>
                  Ver Detalles
                </DropdownItem>

                <DropdownItem onClick={() => handleOpenModal(user)}>
                  <i className="bi bi-pencil me-2"></i>
                  Editar
                </DropdownItem>

                {user.role === 'student' && (
                  <DropdownItem onClick={() => handleOpenEnrollModal(user)}>
                    <i className="bi bi-book me-2"></i>
                    Gestionar Clases
                  </DropdownItem>
                )}

                <DropdownItem onClick={() => handleToggleTeacherStatus(user)}>
                  <i className="bi bi-mortarboard me-2"></i>
                  {user.isTeacher ? 'Quitar Profesor' : 'Hacer Profesor'}
                </DropdownItem>

                <DropdownItem onClick={() => handleToggleUserStatus(user)}>
                  <i className={`bi bi-${user.isActive ? 'x-circle' : 'check-circle'} me-2`}></i>
                  {user.isActive ? 'Desactivar' : 'Activar'}
                </DropdownItem>

                <DropdownItem>
                  <UserProfilePdfDownloadButton user={user}>
                    <span><i className="bi bi-file-earmark-pdf me-2"></i>Descargar PDF</span>
                  </UserProfilePdfDownloadButton>
                </DropdownItem>

                <DropdownItem divider />

                <DropdownItem
                  className="text-danger"
                  onClick={() => {
                    setUserToDelete(user);
                    setDeleteModal(true);
                  }}
                >
                  <i className="bi bi-trash me-2"></i>
                  Eliminar
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </div>
        )}
      />

      {/* User Modal */}
      <Modal isOpen={userModal} toggle={() => setUserModal(false)} size="lg">
        <ModalHeader toggle={() => setUserModal(false)}>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="firstName">Nombre *</Label>
                  <Input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="lastName">Apellido *</Label>
                  <Input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="phone">Teléfono *</Label>
                  <Input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="email">Correo Electrónico</Label>
                  <Input
                    type="email"
                    id="email"
                    autocomplete="new-password"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="password">
                    Contraseña {!editingUser && '*'}
                  </Label>
                  <Input
                    type="password"
                    id="password"
                    autocomplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Dejar vacío para mantener actual' : 'Mínimo 6 caracteres'}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="role">Rol Principal *</Label>
                  <Input
                    type="select"
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    <option value="student">Estudiante</option>
                    <option value="teacher">Profesor</option>
                    <option value="admin">Administrador</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="d-block">Opciones</Label>
                  <div className="mt-2">
                    <FormGroup check inline>
                      <Input
                        type="checkbox"
                        id="isTeacher"
                        checked={formData.isTeacher}
                        onChange={(e) => setFormData({ ...formData, isTeacher: e.target.checked })}
                      />
                      <Label check for="isTeacher">
                        Es Profesor
                      </Label>
                    </FormGroup>
                    <FormGroup check inline>
                      <Input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <Label check for="isActive">
                        Activo
                      </Label>
                    </FormGroup>
                  </div>
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setUserModal(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSaveUser}>
            {editingUser ? 'Actualizar' : 'Crear'} Usuario
          </Button>
        </ModalFooter>
      </Modal>

      <StudentEnrollmentManagerModal
        isOpen={enrollModal}
        onClose={handleCloseEnrollModal}
        students={
          selectedUser
            ? [{
                id: selectedUser.id,
                fullName: `${selectedUser.firstName} ${selectedUser.lastName}`.trim(),
                phone: selectedUser.phone,
                email: selectedUser.email,
                enrolledClassrooms: selectedUser.enrolledClassrooms || [],
              }]
            : []
        }
        classrooms={classrooms}
        programNamesById={Object.fromEntries(programs.map((program) => [program.id, program.name]))}
        mode="sync"
        title={selectedUser ? `Gestionar Inscripciones - ${selectedUser.firstName} ${selectedUser.lastName}` : undefined}
        onSaved={loadData}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)}>
        <ModalHeader toggle={() => setDeleteModal(false)}>
          Confirmar Eliminación
        </ModalHeader>
        <ModalBody>
          <Alert color="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            ¿Está seguro que desea eliminar al usuario <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
            Esta acción no se puede deshacer.
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModal(false)}>
            Cancelar
          </Button>
          <Button color="danger" onClick={handleDeleteUser}>
            Eliminar Usuario
          </Button>
        </ModalFooter>
      </Modal>

      {/* User Detail Modal */}
      <UserDetailModal
        key={detailUser?.id || 'detail-modal'}
        isOpen={detailModalOpen}
        toggle={() => setDetailModalOpen(false)}
        user={detailUser}
        onSave={(updatedUser) => {
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        }}
      />
      
      <StudentImporter
        isOpen={showImporter}
        toggle={() => setShowImporter(false)}
        onImportComplete={loadData}
      />
    </Container>
  );
};

export default UserManagement;
