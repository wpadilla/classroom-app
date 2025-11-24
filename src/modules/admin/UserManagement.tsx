// Complete User Management Module for Admins

import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
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
  TabContent,
  TabPane,
  Spinner,
  ButtonGroup,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import { toast } from 'react-toastify';
import { UserService } from '../../services/user/user.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { IUser, UserRole, IClassroom } from '../../models';

const UserManagement: React.FC = () => {
  // State
  const [users, setUsers] = useState<IUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<IUser[]>([]);
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<UserRole | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([]);

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, activeTab, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersList, classroomsList] = await Promise.all([
        UserService.getAllUsers(),
        ClassroomService.getAllClassrooms()
      ]);
      setUsers(usersList);
      setClassrooms(classroomsList);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by role/tab
    if (activeTab !== 'all') {
      if (activeTab === 'teacher') {
        filtered = filtered.filter(u => u.isTeacher);
      } else {
        filtered = filtered.filter(u => u.role === activeTab);
      }
    }

    // Filter by search
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
    console.log("formData",formData);
    console.log("editingUser", editingUser);
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
          taughtClassrooms: []
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
    setSelectedClassrooms(user.enrolledClassrooms || []);
    setEnrollModal(true);
  };

  const handleSaveEnrollment = async () => {
    if (!selectedUser) return;

    try {
      // Get current enrollments
      const currentEnrollments = selectedUser.enrolledClassrooms || [];

      // Find classrooms to add and remove
      const toAdd = selectedClassrooms.filter(id => !currentEnrollments.includes(id));
      const toRemove = currentEnrollments.filter(id => !selectedClassrooms.includes(id));

      // Process enrollments
      for (const classroomId of toAdd) {
        await ClassroomService.addStudentToClassroom(classroomId, selectedUser.id);
      }

      for (const classroomId of toRemove) {
        await ClassroomService.removeStudentFromClassroom(classroomId, selectedUser.id);
      }

      toast.success('Inscripciones actualizadas exitosamente');
      setEnrollModal(false);
      await loadData();
    } catch (error) {
      console.error('Error updating enrollments:', error);
      toast.error('Error al actualizar inscripciones');
    }
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
            <Button color="primary" onClick={() => handleOpenModal()}>
              <i className="bi bi-person-plus me-2"></i>
              Nuevo Usuario
            </Button>
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

      {/* Search Bar */}
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroupText>
              <i className="bi bi-search"></i>
            </InputGroupText>
            <Input
              placeholder="Buscar por nombre, teléfono o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      {/* Tabs */}
      <Nav tabs className="mb-3">
        <NavItem>
          <NavLink
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
            style={{ cursor: 'pointer' }}
          >
            Todos ({stats.total})
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'student' ? 'active' : ''}
            onClick={() => setActiveTab('student')}
            style={{ cursor: 'pointer' }}
          >
            Estudiantes ({stats.students})
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'teacher' ? 'active' : ''}
            onClick={() => setActiveTab('teacher')}
            style={{ cursor: 'pointer' }}
          >
            Profesores ({stats.teachers})
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'admin' ? 'active' : ''}
            onClick={() => setActiveTab('admin')}
            style={{ cursor: 'pointer' }}
          >
            Administradores ({stats.admins})
          </NavLink>
        </NavItem>
      </Nav>

      {/* Users Table */}
      <Card>
        <CardBody>
          {filteredUsers.length === 0 ? (
            <Alert color="info">
              <i className="bi bi-info-circle me-2"></i>
              No se encontraron usuarios
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Clases</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>
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
                    </td>
                    <td>
                      {user.firstName} {user.lastName}
                    </td>
                    <td>{user.phone}</td>
                    <td>{user.email || '-'}</td>
                    <td>
                      {user.role === 'admin' && (
                        <Badge color="warning">Admin</Badge>
                      )}
                      {user.isTeacher && (
                        <Badge color="info" className="me-1">Profesor</Badge>
                      )}
                      {user.role === 'student' && !user.isTeacher && (
                        <Badge color="primary">Estudiante</Badge>
                      )}
                    </td>
                    <td>
                      <Badge color={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td>
                      {user.role === 'student' && (
                        <Badge color="secondary">
                          {user.enrolledClassrooms?.length || 0} inscritas
                        </Badge>
                      )}
                      {user.isTeacher && (
                        <Badge color="secondary">
                          {user.teachingClassrooms?.length || 0} enseñando
                        </Badge>
                      )}
                    </td>
                    <td>
                      <UncontrolledDropdown>
                        <DropdownToggle color="link" className="text-dark p-0">
                          <i className="bi bi-three-dots-vertical"></i>
                        </DropdownToggle>
                        <DropdownMenu end>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

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

      {/* Enrollment Modal */}
      <Modal isOpen={enrollModal} toggle={() => setEnrollModal(false)} size="lg">
        <ModalHeader toggle={() => setEnrollModal(false)}>
          Gestionar Inscripciones - {selectedUser?.firstName} {selectedUser?.lastName}
        </ModalHeader>
        <ModalBody>
          <Alert color="info">
            <i className="bi bi-info-circle me-2"></i>
            Seleccione las clases en las que desea inscribir al estudiante
          </Alert>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {classrooms.map(classroom => (
              <FormGroup check key={classroom.id}>
                <Input
                  type="checkbox"
                  id={`classroom-${classroom.id}`}
                  checked={selectedClassrooms.includes(classroom.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClassrooms([...selectedClassrooms, classroom.id]);
                    } else {
                      setSelectedClassrooms(selectedClassrooms.filter(id => id !== classroom.id));
                    }
                  }}
                />
                <Label check for={`classroom-${classroom.id}`}>
                  <strong>{classroom.subject}</strong> - {classroom.name}
                  {!classroom.isActive && (
                    <Badge color="warning" className="ms-2">Inactiva</Badge>
                  )}
                </Label>
              </FormGroup>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setEnrollModal(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSaveEnrollment}>
            Guardar Inscripciones
          </Button>
        </ModalFooter>
      </Modal>

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
    </Container>
  );
};

export default UserManagement;
