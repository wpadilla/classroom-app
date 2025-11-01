// Universal User Profile Component - Works for Students, Teachers, and Admins

import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  Badge,
  Alert,
  Spinner,
  Progress,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from 'reactstrap';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/user/user.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { GCloudService } from '../../services/gcloud/gcloud.service';
import { IUser, IClassroom, IStudentEvaluation, IClassroomHistory, UserRole } from '../../models';
import { toast } from 'react-toastify';

const UserProfile: React.FC = () => {
  const { user, updatePassword, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [profile, setProfile] = useState<IUser | null>(null);
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<IClassroom[]>([]);
  const [teachingClassrooms, setTeachingClassrooms] = useState<IClassroom[]>([]);
  const [evaluations, setEvaluations] = useState<IStudentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Modal states
  const [passwordModal, setPasswordModal] = useState(false);
  const [photoModal, setPhotoModal] = useState(false);
  
  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load full user profile
      const userProfile = await UserService.getUserById(user.id);
      if (userProfile) {
        setProfile(userProfile);
        
        // Load enrolled classrooms (for students and teachers who are also students)
        if (userProfile.enrolledClassrooms && userProfile.enrolledClassrooms.length > 0) {
          const classrooms = await Promise.all(
            userProfile.enrolledClassrooms.map(id => ClassroomService.getClassroomById(id))
          );
          setEnrolledClassrooms(classrooms.filter(c => c !== null) as IClassroom[]);
        }
        
        // Load teaching classrooms (for teachers and admins)
        if (userProfile.teachingClassrooms && userProfile.teachingClassrooms.length > 0) {
          const classrooms = await Promise.all(
            userProfile.teachingClassrooms.map(id => ClassroomService.getClassroomById(id))
          );
          setTeachingClassrooms(classrooms.filter(c => c !== null) as IClassroom[]);
        }
        
        // Load evaluations
        const studentEvaluations = await EvaluationService.getStudentEvaluations(user.id);
        setEvaluations(studentEvaluations);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    const success = await updatePassword(newPassword);
    if (success) {
      setPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor seleccione una imagen válida');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }
    
    setSelectedPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setPhotoModal(true);
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto || !user) return;
    
    try {
      setUploadingPhoto(true);
      const photoUrl = await UserService.updateProfilePhoto(user.id, selectedPhoto);
      
      // Update local profile
      if (profile) {
        setProfile({ ...profile, profilePhoto: photoUrl });
      }
      
      // Refresh user context
      await refreshUser();
      
      toast.success('Foto de perfil actualizada');
      setPhotoModal(false);
      setSelectedPhoto(null);
      setPhotoPreview('');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const calculateOverallGrade = (): number => {
    if (evaluations.length === 0) return 0;
    
    const completedEvaluations = evaluations.filter(e => e.status === 'evaluated');
    if (completedEvaluations.length === 0) return 0;
    
    const totalPercentage = completedEvaluations.reduce((sum, e) => sum + e.percentage, 0);
    return totalPercentage / completedEvaluations.length;
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'danger';
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'teacher':
        return 'Profesor';
      case 'student':
        return 'Estudiante';
      default:
        return role;
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'teacher':
        return 'info';
      case 'student':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando perfil...</p>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="py-5">
        <Alert color="danger">No se pudo cargar el perfil</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Profile Header */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <CardBody>
              <Row className="align-items-center">
                <Col md={2} className="text-center mb-3 mb-md-0">
                  <div className="position-relative d-inline-block">
                    {profile.profilePhoto ? (
                      <img
                        src={profile.profilePhoto}
                        alt="Profile"
                        className="rounded-circle"
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center"
                        style={{ width: '120px', height: '120px' }}
                      >
                        <i className="bi bi-person-fill text-white" style={{ fontSize: '3rem' }}></i>
                      </div>
                    )}
                    <Button
                      color="primary"
                      size="sm"
                      className="position-absolute bottom-0 end-0 rounded-circle"
                      style={{ width: '32px', height: '32px', padding: 0 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="bi bi-camera-fill"></i>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </Col>
                <Col md={7}>
                  <h2 className="mb-1">{profile.firstName} {profile.lastName}</h2>
                  <p className="text-muted mb-2">
                    <i className="bi bi-telephone me-2"></i>
                    {profile.phone}
                  </p>
                  {profile.email && (
                    <p className="text-muted mb-2">
                      <i className="bi bi-envelope me-2"></i>
                      {profile.email}
                    </p>
                  )}
                  <div className="d-flex flex-wrap gap-2">
                    <Badge color={getRoleColor(profile.role)}>{getRoleLabel(profile.role)}</Badge>
                    {profile.isTeacher && profile.role !== 'teacher' && (
                      <Badge color="info">También Profesor</Badge>
                    )}
                    {profile.isActive ? (
                      <Badge color="success">Activo</Badge>
                    ) : (
                      <Badge color="danger">Inactivo</Badge>
                    )}
                  </div>
                </Col>
                <Col md={3} className="text-md-end mt-3 mt-md-0">
                  {/* Show grade stats only if user has student evaluations */}
                  {evaluations.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-muted mb-1">Promedio General</h5>
                      <h2 className="mb-0">
                        <Badge color={getGradeColor(calculateOverallGrade())}>
                          {calculateOverallGrade().toFixed(1)}%
                        </Badge>
                      </h2>
                    </div>
                  )}
                  <Button
                    color="outline-primary"
                    size="sm"
                    onClick={() => setPasswordModal(true)}
                  >
                    <i className="bi bi-key me-2"></i>
                    Cambiar Contraseña
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Nav tabs className="mb-3">
        <NavItem>
          <NavLink
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-person me-2"></i>
            Información Personal
          </NavLink>
        </NavItem>
        
        {/* Show teaching classes tab for teachers and admins */}
        {(profile.role === 'teacher' || profile.role === 'admin' || profile.isTeacher) && (
          <NavItem>
            <NavLink
              className={activeTab === 'teaching' ? 'active' : ''}
              onClick={() => setActiveTab('teaching')}
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-easel me-2"></i>
              Clases Impartidas
            </NavLink>
          </NavItem>
        )}
        
        {/* Show enrolled classes tab for students and teachers who are also students */}
        {(profile.role === 'student' || enrolledClassrooms.length > 0) && (
          <NavItem>
            <NavLink
              className={activeTab === 'enrolled' ? 'active' : ''}
              onClick={() => setActiveTab('enrolled')}
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-book me-2"></i>
              Clases Inscritas
            </NavLink>
          </NavItem>
        )}
        
        <NavItem>
          <NavLink
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-clock-history me-2"></i>
            Historial
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={activeTab}>
        {/* Profile Tab */}
        <TabPane tabId="profile">
          <Card>
            <CardHeader>
              <h5 className="mb-0">Información Personal</h5>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label className="text-muted">Nombre Completo</Label>
                    <p className="fw-bold">{profile.firstName} {profile.lastName}</p>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label className="text-muted">Rol</Label>
                    <p className="fw-bold">{getRoleLabel(profile.role)}</p>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label className="text-muted">Teléfono</Label>
                    <p className="fw-bold">{profile.phone}</p>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label className="text-muted">Correo Electrónico</Label>
                    <p className="fw-bold">{profile.email || 'No registrado'}</p>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label className="text-muted">Fecha de Registro</Label>
                    <p className="fw-bold">
                      {new Date(profile.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label className="text-muted">Estado</Label>
                    <p className="fw-bold">
                      {profile.isActive ? (
                        <Badge color="success">Activo</Badge>
                      ) : (
                        <Badge color="danger">Inactivo</Badge>
                      )}
                    </p>
                  </FormGroup>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </TabPane>

        {/* Teaching Classes Tab */}
        {(profile.role === 'teacher' || profile.role === 'admin' || profile.isTeacher) && (
          <TabPane tabId="teaching">
            <Row>
              {teachingClassrooms.length === 0 ? (
                <Col>
                  <Alert color="info">
                    <i className="bi bi-info-circle me-2"></i>
                    No tiene clases asignadas como profesor actualmente
                  </Alert>
                </Col>
              ) : (
                teachingClassrooms.map(classroom => (
                  <Col md={6} key={classroom.id} className="mb-3">
                    <Card className="h-100">
                      <CardHeader className="bg-info text-white">
                        <h6 className="mb-0">{classroom.subject}</h6>
                      </CardHeader>
                      <CardBody>
                        <p className="text-muted mb-2">
                          <i className="bi bi-people me-2"></i>
                          Estudiantes: {classroom.studentIds?.length || 0}
                        </p>
                        <p className="text-muted mb-2">
                          <i className="bi bi-calendar me-2"></i>
                          Módulo actual: {classroom.currentModule?.name || 'No definido'}
                        </p>
                        <p className="text-muted mb-2">
                          <i className="bi bi-book me-2"></i>
                          Total módulos: {classroom.modules?.length || 0}
                        </p>
                        <div className="mt-3">
                          <Badge color={classroom.isActive ? 'success' : 'secondary'}>
                            {classroom.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          </TabPane>
        )}

        {/* Enrolled Classes Tab */}
        {(profile.role === 'student' || enrolledClassrooms.length > 0) && (
          <TabPane tabId="enrolled">
            <Row>
              {enrolledClassrooms.length === 0 ? (
                <Col>
                  <Alert color="info">
                    <i className="bi bi-info-circle me-2"></i>
                    No está inscrito en ninguna clase actualmente
                  </Alert>
                </Col>
              ) : (
                enrolledClassrooms.map(classroom => {
                  const evaluation = evaluations.find(e => e.classroomId === classroom.id);
                  return (
                    <Col md={6} key={classroom.id} className="mb-3">
                      <Card className="h-100">
                        <CardHeader className="bg-primary text-white">
                          <h6 className="mb-0">{classroom.subject}</h6>
                        </CardHeader>
                        <CardBody>
                          <p className="text-muted mb-2">
                            <i className="bi bi-person-badge me-2"></i>
                            Profesor: {classroom.teacherId}
                          </p>
                          <p className="text-muted mb-2">
                            <i className="bi bi-calendar me-2"></i>
                            Módulo actual: {classroom.currentModule?.name || 'No definido'}
                          </p>
                          
                          {evaluation && (
                            <>
                              <hr />
                              <Row className="text-center">
                                <Col>
                                  <small className="text-muted d-block">Asistencia</small>
                                  <Badge color="info">
                                    {evaluation.attendanceRecords?.length || 0}/{classroom.modules.length}
                                  </Badge>
                                </Col>
                                <Col>
                                  <small className="text-muted d-block">Participación</small>
                                  <Badge color="info">
                                    {evaluation.participationRecords?.reduce((sum, r) => sum + r.points, 0) || 0} pts
                                  </Badge>
                                </Col>
                                <Col>
                                  <small className="text-muted d-block">Promedio</small>
                                  <Badge color={getGradeColor(evaluation.percentage || 0)}>
                                    {evaluation.percentage?.toFixed(1) || 0}%
                                  </Badge>
                                </Col>
                              </Row>
                            </>
                          )}
                        </CardBody>
                      </Card>
                    </Col>
                  );
                })
              )}
            </Row>
          </TabPane>
        )}

        {/* History Tab */}
        <TabPane tabId="history">
          {profile.completedClassrooms && profile.completedClassrooms.length > 0 ? (
            <Card>
              <CardBody>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Clase</th>
                      <th>Programa</th>
                      <th>Rol</th>
                      <th>Fecha Inicio</th>
                      <th>Fecha Fin</th>
                      <th className="text-center">Calificación</th>
                      <th className="text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.completedClassrooms.map((history: IClassroomHistory, index) => (
                      <tr key={index}>
                        <td>{history.classroomName}</td>
                        <td>{history.programName}</td>
                        <td>
                          <Badge color={history.role === 'teacher' ? 'info' : 'primary'}>
                            {history.role === 'teacher' ? 'Profesor' : 'Estudiante'}
                          </Badge>
                        </td>
                        <td>
                          {new Date(history.enrollmentDate).toLocaleDateString('es-ES')}
                        </td>
                        <td>
                          {new Date(history.completionDate).toLocaleDateString('es-ES')}
                        </td>
                        <td className="text-center">
                          {history.role === 'student' && history.finalGrade ? (
                            <Badge color={getGradeColor(history.finalGrade)}>
                              {history.finalGrade.toFixed(1)}%
                            </Badge>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td className="text-center">
                          <Badge color={
                            history.status === 'completed' ? 'success' :
                            history.status === 'dropped' ? 'warning' : 'danger'
                          }>
                            {history.status === 'completed' ? 'Completado' :
                             history.status === 'dropped' ? 'Abandonado' : 'Reprobado'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          ) : (
            <Alert color="info">
              <i className="bi bi-info-circle me-2"></i>
              No hay clases completadas en el historial
            </Alert>
          )}
        </TabPane>
      </TabContent>

      {/* Password Change Modal */}
      <Modal isOpen={passwordModal} toggle={() => setPasswordModal(false)}>
        <ModalHeader toggle={() => setPasswordModal(false)}>
          Cambiar Contraseña
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="newPassword">Nueva Contraseña</Label>
              <Input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </FormGroup>
            <FormGroup>
              <Label for="confirmPassword">Confirmar Contraseña</Label>
              <Input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setPasswordModal(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handlePasswordChange}>
            Cambiar Contraseña
          </Button>
        </ModalFooter>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal isOpen={photoModal} toggle={() => setPhotoModal(false)}>
        <ModalHeader toggle={() => setPhotoModal(false)}>
          Actualizar Foto de Perfil
        </ModalHeader>
        <ModalBody className="text-center">
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="img-fluid rounded"
              style={{ maxHeight: '300px' }}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setPhotoModal(false)}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onClick={handlePhotoUpload}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <>
                <Spinner size="sm" className="me-2" />
                Subiendo...
              </>
            ) : (
              'Actualizar Foto'
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default UserProfile;

