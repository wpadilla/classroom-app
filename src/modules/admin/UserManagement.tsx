// Complete User Management Module for Admins

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
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
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import { toast } from 'react-toastify';
import { UserService } from '../../services/user/user.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { ProgramService } from '../../services/program/program.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { IUser, UserRole, IClassroom, IProgram, IStudentEvaluation } from '../../models';
import BulkOperationsToolbar from './components/BulkOperationsToolbar';
import UserDetailModal from './components/UserDetailModal';
import StudentImporter from './components/StudentImporter';
import { UserProfilePdfDownloadButton } from '../../components/pdf/components/UserProfilePdfDownloadButton';
import StudentEnrollmentManagerModal from '../../components/enrollment/StudentEnrollmentManagerModal';
import DataTable, { Column } from '../../components/common/DataTable';
import UserFiltersModal from './components/UserFiltersModal';
import {
  UserFilters,
  buildEvaluationsByStudent,
  countActiveUserFilters,
  defaultUserFilters,
  filterAndSortUsers,
  getUserAcademicMetrics,
} from './utils/userFilters';
import { saveAs } from 'file-saver';
import { useAuth } from '../../contexts/AuthContext';
import './UserManagement.css';

interface OperationProgressState {
  active: boolean;
  label?: string;
  progress?: number;
}

const IDLE_PROGRESS: OperationProgressState = { active: false };

const TopProgressBar: React.FC<OperationProgressState> = ({ active, label, progress }) => {
  if (!active) return null;

  const hasMeasuredProgress = typeof progress === 'number';
  const normalizedProgress = hasMeasuredProgress
    ? Math.min(100, Math.max(2, progress))
    : undefined;

  return (
    <div
      className="user-management-progress"
      role="progressbar"
      aria-label={label || 'Procesando acción'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedProgress}
    >
      <span
        className={hasMeasuredProgress ? 'user-management-progress__bar' : 'user-management-progress__bar is-indeterminate'}
        style={hasMeasuredProgress ? { width: `${normalizedProgress}%` } : undefined}
      />
    </div>
  );
};

const UserManagement: React.FC = () => {
  const { user: authenticatedUser } = useAuth();
  // State
  const [users, setUsers] = useState<IUser[]>([]);
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [evaluations, setEvaluations] = useState<IStudentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<UserFilters>(defaultUserFilters);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionLabel, setActionLabel] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<OperationProgressState>(IDLE_PROGRESS);
  const [childProgress, setChildProgress] = useState<OperationProgressState>(IDLE_PROGRESS);
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
      const [usersList, classroomsList, programsList, evaluationsList] = await Promise.all([
        UserService.getAllUsers(),
        ClassroomService.getAllClassrooms(),
        ProgramService.getAllPrograms(),
        EvaluationService.getAllEvaluations(),
      ]);
      setUsers(usersList);
      setClassrooms(classroomsList);
      setPrograms(programsList);
      setEvaluations(evaluationsList);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBulkProgress = useCallback((progressState: OperationProgressState) => {
    setBulkProgress(progressState);
  }, []);

  const handleChildProgress = useCallback((progressState: OperationProgressState) => {
    setChildProgress(progressState);
  }, []);

  const evaluationsByStudent = useMemo(
    () => buildEvaluationsByStudent(evaluations),
    [evaluations]
  );

  const academicMetricsByUser = useMemo(
    () => new Map(
      users.map((user) => [
        user.id,
        getUserAcademicMetrics(user, evaluationsByStudent.get(user.id) || []),
      ])
    ),
    [evaluationsByStudent, users]
  );

  const filteredUsers = useMemo(
    () => filterAndSortUsers({ users, classrooms, evaluations, filters, searchQuery }),
    [classrooms, evaluations, filters, searchQuery, users]
  );

  const enrollmentTypes = useMemo(
    () => Array.from(users.reduce((types, user) => {
      const enrollmentType = user.enrollmentType?.trim();
      if (enrollmentType) types.add(enrollmentType);
      return types;
    }, new Set<string>())).sort((left, right) => left.localeCompare(right, 'es')),
    [users]
  );

  const enrollmentStudents = useMemo(
    () => selectedUser
      ? [{
          id: selectedUser.id,
          fullName: `${selectedUser.firstName} ${selectedUser.lastName}`.trim(),
          phone: selectedUser.phone,
          email: selectedUser.email,
          enrolledClassrooms: selectedUser.enrolledClassrooms || [],
        }]
      : [],
    [selectedUser]
  );

  const programNamesById = useMemo(
    () => Object.fromEntries(programs.map((program) => [program.id, program.name])),
    [programs]
  );

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setActionLabel('Preparando el archivo de usuarios');
      const XLSX = await import('xlsx');
      const dataToExport = filteredUsers.map(u => ({
        ...(() => {
          const metrics = academicMetricsByUser.get(u.id);
          return {
            Indice_General: metrics?.generalIndex !== null && metrics?.generalIndex !== undefined
              ? Number(metrics.generalIndex.toFixed(1))
              : 'N/A',
            Clases_Cursadas: u.completedClassrooms?.length || 0,
            Asistencia_General: metrics?.attendanceRate !== null && metrics?.attendanceRate !== undefined
              ? `${metrics.attendanceRate.toFixed(1)}%`
              : 'N/A',
          };
        })(),
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
      setActionLabel(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      setActionLabel('Generando el reporte PDF');
      toast.info('Generando PDF, por favor espere...', { autoClose: 2000 });

      const [{ pdf }, { UserListPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../../components/pdf/UserListPdfDocument'),
      ]);
      const blob = await pdf(<UserListPdfDocument users={filteredUsers} />).toBlob();
      saveAs(blob, 'reporte_usuarios_amoa.pdf');
      
      toast.success('PDF exportado correctamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al exportar PDF');
    } finally {
      setExporting(false);
      setActionLabel(null);
    }
  };

  const columns: Column<IUser>[] = [
    {
      header: 'Foto',
      width: '60px',
      mobileHidden: true,
      render: (_, user) => (
        <button
          type="button"
          className="btn btn-link p-0 border-0"
          onClick={() => handleOpenDetailModal(user)}
          aria-label={`Ver detalles de ${user.firstName} ${user.lastName}`}
        >
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
        </button>
      )
    },
    {
      header: 'Nombre',
      accessor: 'firstName',
      render: (_, user) => {
        const metrics = academicMetricsByUser.get(user.id);
        const roleLabel = user.role === 'admin'
          ? 'Admin'
          : user.isTeacher
            ? 'Profesor'
            : 'Estudiante';

        return (
          <button
            type="button"
            className="btn btn-link p-0 text-start text-decoration-none border-0 user-management-person"
            onClick={() => handleOpenDetailModal(user)}
          >
            <span className="user-management-person__name">{user.firstName} {user.lastName}</span>
            <span className="user-management-person__mobile-meta d-md-none">
              {roleLabel} · {user.phone || 'Sin teléfono'}
              {metrics?.generalIndex !== null && metrics?.generalIndex !== undefined
                ? ` · Índice ${metrics.generalIndex.toFixed(1)}%`
                : ''}
            </span>
          </button>
        );
      }
    },
    { header: 'Teléfono', accessor: 'phone', mobileHidden: true },
    { header: 'Correo', accessor: 'email', mobileHidden: true, render: (v) => v || '-' },
    {
      header: 'Rol',
      mobileHidden: true,
      render: (_, user) => (
        <div>
          {user.role === 'admin' && <Badge color="warning" className="me-1">Admin</Badge>}
          {user.isTeacher && <Badge color="info" className="me-1">Profesor</Badge>}
          {user.role === 'student' && !user.isTeacher && <Badge color="primary">Estudiante</Badge>}
        </div>
      )
    },
    {
      header: 'Índice',
      align: 'center',
      mobileHidden: true,
      render: (_, user) => {
        const metrics = academicMetricsByUser.get(user.id);
        if (metrics?.generalIndex === null || metrics?.generalIndex === undefined) {
          return <span className="text-muted">—</span>;
        }
        const color = metrics.generalIndex >= 90
          ? 'success'
          : metrics.generalIndex >= 80
            ? 'info'
            : metrics.generalIndex >= 70
              ? 'warning'
              : 'danger';
        return (
          <Badge color={color} pill title={`${metrics.gradedClassrooms} clase(s) con calificación`}>
            {metrics.generalIndex.toFixed(1)}%
          </Badge>
        );
      }
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

  const activeFilterCount = countActiveUserFilters(filters);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const visibleIds = new Set(filteredUsers.map((user) => user.id));
    setSelectedIds((current) => {
      const next = new Set(Array.from(current).filter((id) => visibleIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [filteredUsers]);

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
      setActionLabel(editingUser ? 'Actualizando usuario' : 'Creando usuario');
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
    } finally {
      setActionLabel(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    if (userToDelete.id === authenticatedUser?.id) {
      toast.error('No puedes eliminar la cuenta con la que tienes la sesión iniciada.');
      return;
    }

    const assignedClassrooms = classrooms.filter((classroom) => classroom.teacherId === userToDelete.id);
    if (assignedClassrooms.length > 0) {
      toast.error('Reasigna las clases de este profesor antes de eliminar su cuenta.');
      return;
    }

    const enrolledClassroomIds = new Set(userToDelete.enrolledClassrooms || []);
    const classroomMembershipIds = classrooms.reduce<string[]>((membershipIds, classroom) => {
      const classroomStudentIds = new Set(classroom.studentIds || []);
      if (classroomStudentIds.has(userToDelete.id) || enrolledClassroomIds.has(classroom.id)) {
        membershipIds.push(classroom.id);
      }
      return membershipIds;
    }, []);

    try {
      setActionLabel('Eliminando usuario y sus inscripciones');
      await UserService.deleteUser(userToDelete.id, classroomMembershipIds);
      toast.success('Usuario eliminado exitosamente');
      setDeleteModal(false);
      setUserToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    } finally {
      setActionLabel(null);
    }
  };

  const handleToggleUserStatus = async (user: IUser) => {
    try {
      setActionLabel(user.isActive ? 'Desactivando usuario' : 'Activando usuario');
      await UserService.updateUser(user.id, { isActive: !user.isActive });
      toast.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'} exitosamente`);
      await loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Error al cambiar el estado del usuario');
    } finally {
      setActionLabel(null);
    }
  };

  const handleToggleTeacherStatus = async (user: IUser) => {
    try {
      setActionLabel('Actualizando permisos de profesor');
      await UserService.toggleTeacherStatus(user.id);
      toast.success(`Estado de profesor ${user.isTeacher ? 'removido' : 'asignado'}`);
      await loadData();
    } catch (error) {
      console.error('Error toggling teacher status:', error);
      toast.error('Error al cambiar el estado de profesor');
    } finally {
      setActionLabel(null);
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

  const stats = useMemo(
    () => ({
      total: users.length,
      students: users.filter(u => u.role === 'student' && !u.isTeacher).length,
      teachers: users.filter(u => u.isTeacher).length,
      admins: users.filter(u => u.role === 'admin').length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    }),
    [users]
  );

  const visibleProgress = bulkProgress.active
    ? bulkProgress
    : childProgress.active
      ? childProgress
      : actionLabel
        ? { active: true, label: actionLabel }
        : loading
          ? { active: true, label: 'Actualizando usuarios' }
          : IDLE_PROGRESS;

  return (
    <div className="user-management-page">
      <TopProgressBar {...visibleProgress} />
      <Container fluid className="user-management-container py-3 py-lg-4">
        <section className="user-management-hero" aria-labelledby="user-management-title">
          <div className="user-management-hero__copy">
            <span className="user-management-eyebrow">
              <i className="bi bi-people" aria-hidden="true" />
              Administración académica
            </span>
            <h1 id="user-management-title">Usuarios</h1>
            <p>
              Gestiona perfiles, inscripciones, permisos y estado de cuenta desde un solo lugar.
            </p>
            {visibleProgress.active && (
              <span className="user-management-live-status" role="status" aria-live="polite">
                <span aria-hidden="true" />
                {visibleProgress.label || 'Procesando acción'}
                {typeof visibleProgress.progress === 'number' ? ` · ${visibleProgress.progress}%` : ''}
              </span>
            )}
          </div>

          <div className="user-management-hero__actions">
            <UncontrolledDropdown>
              <DropdownToggle
                color="light"
                caret
                className="user-management-action-button"
                disabled={exporting}
              >
                <i className="bi bi-download me-2" aria-hidden="true" />
                Exportar
              </DropdownToggle>
              <DropdownMenu end>
                <DropdownItem onClick={handleExportCSV}>
                  <i className="bi bi-file-earmark-excel text-success me-2" />
                  Documento CSV / Excel
                </DropdownItem>
                <DropdownItem onClick={handleExportPDF}>
                  <i className="bi bi-file-earmark-pdf text-danger me-2" />
                  Documento PDF
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
            <Button
              color="light"
              className="user-management-action-button"
              onClick={() => setShowImporter(true)}
            >
              <i className="bi bi-cloud-arrow-up me-2" aria-hidden="true" />
              Importar
            </Button>
            <Button color="primary" className="user-management-action-button" onClick={() => handleOpenModal()}>
              <i className="bi bi-person-plus me-2" aria-hidden="true" />
              Nuevo usuario
            </Button>
          </div>
        </section>

        <section className="user-management-stats" aria-label="Resumen de usuarios">
          {[
            { label: 'Total', value: stats.total, icon: 'people', tone: 'primary' },
            { label: 'Estudiantes', value: stats.students, icon: 'backpack', tone: 'blue' },
            { label: 'Profesores', value: stats.teachers, icon: 'mortarboard', tone: 'cyan' },
            { label: 'Administradores', value: stats.admins, icon: 'shield-check', tone: 'amber' },
            { label: 'Activos', value: stats.active, icon: 'person-check', tone: 'green' },
            { label: 'Inactivos', value: stats.inactive, icon: 'person-dash', tone: 'red' },
          ].map((item) => (
            <Card key={item.label} className={`user-management-stat user-management-stat--${item.tone}`}>
              <CardBody>
                <span className="user-management-stat__icon" aria-hidden="true">
                  <i className={`bi bi-${item.icon}`} />
                </span>
                <span className="user-management-stat__content">
                  <strong>{item.value}</strong>
                  <small>{item.label}</small>
                </span>
              </CardBody>
            </Card>
          ))}
        </section>

        <section className="user-management-workspace" aria-label="Directorio de usuarios">
          <div className="user-management-workspace__header">
            <div>
              <h2>Directorio</h2>
              <p>{filteredUsers.length} usuario{filteredUsers.length === 1 ? '' : 's'} visible{filteredUsers.length === 1 ? '' : 's'}</p>
            </div>
            <div className="user-management-search-tools">
              <InputGroup className="user-management-search">
                <InputGroupText>
                  <i className="bi bi-search" aria-hidden="true" />
                </InputGroupText>
                <Input
                  aria-label="Buscar usuarios"
                  placeholder="Buscar por nombre, teléfono o correo"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                {searchQuery && (
                  <Button
                    color="light"
                    aria-label="Limpiar búsqueda"
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </Button>
                )}
              </InputGroup>
              <Button
                color={activeFilterCount > 0 ? 'primary' : 'light'}
                className="user-management-filter-button"
                onClick={() => setFiltersModalOpen(true)}
              >
                <i className="bi bi-sliders me-2" aria-hidden="true" />
                Filtros
                {activeFilterCount > 0 && <Badge color="light" pill>{activeFilterCount}</Badge>}
              </Button>
            </div>
          </div>

          {(activeFilterCount > 0 || searchQuery) && (
            <div className="user-management-results-note">
              <span>
                <i className="bi bi-funnel" aria-hidden="true" />
                <strong>{filteredUsers.length}</strong> de {users.length} usuarios coinciden.
              </span>
              <Button
                color="link"
                size="sm"
                onClick={() => {
                  setFilters(defaultUserFilters);
                  setSearchQuery('');
                }}
              >
                Limpiar búsqueda y filtros
              </Button>
            </div>
          )}

      {/* Filters Modal */}
      <UserFiltersModal 
        isOpen={filtersModalOpen} 
        onClose={() => setFiltersModalOpen(false)} 
        filters={filters} 
        onFiltersChange={setFilters} 
        programs={programs} 
        classrooms={classrooms}
        users={users}
        enrollmentTypes={enrollmentTypes}
      />

      {/* Bulk Operations Toolbar */}
      <BulkOperationsToolbar
        users={filteredUsers}
        allClassrooms={classrooms}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onRefresh={loadData}
        protectedUserId={authenticatedUser?.id}
        onProgressChange={handleBulkProgress}
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
        className="user-management-table"
        emptyState={
          <Alert color={loading ? 'light' : 'info'} className="user-management-empty-state mb-0">
            <i className={`bi bi-${loading ? 'arrow-repeat' : 'info-circle'} me-2`} />
            {loading
              ? 'Preparando el directorio de usuarios…'
              : 'No se encontraron usuarios que coincidan con los filtros.'}
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

                <UserProfilePdfDownloadButton
                  user={user}
                  className="dropdown-item text-start w-100"
                  onProgressChange={handleChildProgress}
                >
                  <span><i className="bi bi-file-earmark-pdf me-2"></i>Descargar PDF</span>
                </UserProfilePdfDownloadButton>

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
        </section>

      {/* User Modal */}
      <Modal
        isOpen={userModal}
        toggle={() => setUserModal(false)}
        size="lg"
        centered
        scrollable
        className="user-management-modal"
      >
        <ModalHeader toggle={() => setUserModal(false)}>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row className="g-3">
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
                    autoComplete="new-password"
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
                    autoComplete="new-password"
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
          <Button color="light" onClick={() => setUserModal(false)} disabled={Boolean(actionLabel)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSaveUser} disabled={Boolean(actionLabel)}>
            {editingUser ? 'Actualizar' : 'Crear'} Usuario
          </Button>
        </ModalFooter>
      </Modal>

      <StudentEnrollmentManagerModal
        isOpen={enrollModal}
        onClose={handleCloseEnrollModal}
        students={enrollmentStudents}
        classrooms={classrooms}
        programNamesById={programNamesById}
        mode="sync"
        title={selectedUser ? `Gestionar Inscripciones - ${selectedUser.firstName} ${selectedUser.lastName}` : undefined}
        onSaved={loadData}
        onProgressChange={handleChildProgress}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered className="user-management-modal">
        <ModalHeader toggle={() => setDeleteModal(false)}>
          Confirmar Eliminación
        </ModalHeader>
        <ModalBody>
          <Alert color="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            ¿Está seguro que desea eliminar al usuario <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
            Esta acción no se puede deshacer.
          </Alert>
          {userToDelete?.id === authenticatedUser?.id && (
            <Alert color="warning" className="mb-0">
              No puedes eliminar la cuenta con la que tienes la sesión iniciada.
            </Alert>
          )}
          {userToDelete && classrooms.some((classroom) => classroom.teacherId === userToDelete.id) && (
            <Alert color="warning" className="mb-0">
              Este profesor tiene clases asignadas. Reasígnalas antes de eliminar su cuenta.
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            color="danger"
            onClick={handleDeleteUser}
            disabled={
              Boolean(actionLabel) ||
              userToDelete?.id === authenticatedUser?.id ||
              Boolean(userToDelete && classrooms.some((classroom) => classroom.teacherId === userToDelete.id))
            }
          >
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
        onProgressChange={handleChildProgress}
      />
      
      <StudentImporter
        isOpen={showImporter}
        toggle={() => setShowImporter(false)}
        onImportComplete={loadData}
        onProgressChange={handleChildProgress}
      />
      </Container>
    </div>
  );
};

export default UserManagement;
