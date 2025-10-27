// Complete Student Classroom View with all features

import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Progress,
  Alert,
  Spinner,
  ListGroup,
  ListGroupItem,
  Table,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from 'reactstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { UserService } from '../../services/user/user.service';
import { IClassroom, IStudentEvaluation, IUser, IModule } from '../../models';
import { toast } from 'react-toastify';

const StudentClassroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [classroom, setClassroom] = useState<IClassroom | null>(null);
  const [evaluation, setEvaluation] = useState<IStudentEvaluation | null>(null);
  const [teacher, setTeacher] = useState<IUser | null>(null);
  const [classmates, setClassmates] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id && user) {
      loadClassroomData();
    }
  }, [id, user]);

  const loadClassroomData = async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      
      // Load classroom
      const classroomData = await ClassroomService.getClassroomById(id);
      if (!classroomData) {
        toast.error('Clase no encontrada');
        navigate('/student/dashboard');
        return;
      }
      
      // Check if student is enrolled
      if (!classroomData.studentIds?.includes(user.id)) {
        toast.error('No estás inscrito en esta clase');
        navigate('/student/dashboard');
        return;
      }
      
      setClassroom(classroomData);
      
      // Load teacher
      if (classroomData.teacherId) {
        const teacherData = await UserService.getUserById(classroomData.teacherId);
        setTeacher(teacherData);
      }
      
      // Load evaluation
      const evaluationData = await EvaluationService.getStudentClassroomEvaluation(user.id, id);
      setEvaluation(evaluationData);
      
      // Load classmates
      if (classroomData.studentIds && classroomData.studentIds.length > 0) {
        const classmatePromises = classroomData.studentIds
          .filter(studentId => studentId !== user.id)
          .map(studentId => UserService.getUserById(studentId));
        const classmateResults = await Promise.all(classmatePromises);
        setClassmates(classmateResults.filter(c => c !== null) as IUser[]);
      }
    } catch (error) {
      console.error('Error loading classroom data:', error);
      toast.error('Error al cargar los datos de la clase');
    } finally {
      setLoading(false);
    }
  };

  const getModuleStatus = (module: IModule): 'completed' | 'current' | 'upcoming' => {
    if (module.isCompleted) return 'completed';
    if (classroom?.currentModule?.weekNumber === module.weekNumber) return 'current';
    return 'upcoming';
  };

  const getModuleColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'success';
      case 'current': return 'primary';
      default: return 'secondary';
    }
  };

  const getAttendanceRate = (): number => {
    if (!evaluation?.attendanceRecords || evaluation.attendanceRecords.length === 0) {
      return 0;
    }
    const present = evaluation.attendanceRecords.filter(r => r.isPresent).length;
    return (present / evaluation.attendanceRecords.length) * 100;
  };

  const getParticipationPoints = (): number => {
    if (!evaluation?.participationRecords) return 0;
    return evaluation.participationRecords.reduce((sum, r) => sum + r.points, 0);
  };

  const getOverallProgress = (): number => {
    if (!classroom) return 0;
    const completedModules = classroom.modules.filter(m => m.isCompleted).length;
    return (completedModules / classroom.modules.length) * 100;
  };

  const getGradeBreakdown = () => {
    if (!evaluation || !classroom?.evaluationCriteria) {
      return [];
    }
    
    const criteria = classroom.evaluationCriteria;
    const scores = evaluation.scores;
    
    return [
      {
        name: 'Cuestionarios',
        points: criteria.questionnaires,
        earned: scores.questionnaires,
        percentage: criteria.questionnaires > 0 
          ? (scores.questionnaires / criteria.questionnaires) * 100 
          : 0
      },
      {
        name: 'Asistencia',
        points: criteria.attendance,
        earned: scores.attendance,
        percentage: criteria.attendance > 0 
          ? (scores.attendance / criteria.attendance) * 100 
          : 0
      },
      {
        name: 'Participación',
        points: criteria.participation,
        earned: scores.participation,
        percentage: criteria.participation > 0 
          ? (scores.participation / criteria.participation) * 100 
          : 0
      },
      {
        name: 'Examen Final',
        points: criteria.finalExam,
        earned: scores.finalExam,
        percentage: criteria.finalExam > 0 
          ? (scores.finalExam / criteria.finalExam) * 100 
          : 0
      },
      ...criteria.custom.map(c => ({
        name: c.name,
        points: c.points,
        earned: scores.customScores.find(cs => cs.criterionId === c.id)?.score || 0,
        percentage: c.points > 0 
          ? ((scores.customScores.find(cs => cs.criterionId === c.id)?.score || 0) / c.points) * 100 
          : 0
      }))
    ];
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando clase...</p>
      </Container>
    );
  }

  if (!classroom) {
    return (
      <Container className="py-4">
        <Alert color="danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Clase no encontrada
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Button
            color="link"
            className="p-0 mb-3 text-decoration-none"
            onClick={() => navigate('/student/dashboard')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver al Panel
          </Button>
          
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2>{classroom.subject}</h2>
              <p className="text-muted mb-1">{classroom.name}</p>
              {teacher && (
                <p className="text-muted mb-0">
                  <i className="bi bi-person-badge me-2"></i>
                  Profesor: {teacher.firstName} {teacher.lastName}
                </p>
              )}
            </div>
            <div className="text-end">
              {classroom.isActive ? (
                <Badge color="success" className="mb-2">Activa</Badge>
              ) : (
                <Badge color="secondary" className="mb-2">Inactiva</Badge>
              )}
              {classroom.whatsappGroup && (
                <div>
                  <Badge color="success">
                    <i className="bi bi-whatsapp me-1"></i>
                    Grupo WhatsApp
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <h4 className="mb-0">
                <Badge color={evaluation?.percentage && evaluation.percentage >= 70 ? 'success' : 'warning'}>
                  {evaluation?.percentage?.toFixed(1) || 0}%
                </Badge>
              </h4>
              <small className="text-muted">Calificación Actual</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <h4 className="mb-0">
                <Badge color={getAttendanceRate() >= 80 ? 'success' : 'warning'}>
                  {getAttendanceRate().toFixed(0)}%
                </Badge>
              </h4>
              <small className="text-muted">Asistencia</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <h4 className="mb-0">
                <Badge color="info">
                  {getParticipationPoints()} pts
                </Badge>
              </h4>
              <small className="text-muted">Participación</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <h4 className="mb-0">
                <Badge color="primary">
                  {classroom.currentModule?.weekNumber || 1}/{classroom.modules.length}
                </Badge>
              </h4>
              <small className="text-muted">Módulo Actual</small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Navigation Tabs */}
      <Nav tabs className="mb-3">
        <NavItem>
          <NavLink
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-house me-2"></i>
            General
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'modules' ? 'active' : ''}
            onClick={() => setActiveTab('modules')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-list-task me-2"></i>
            Módulos
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'grades' ? 'active' : ''}
            onClick={() => setActiveTab('grades')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-clipboard-data me-2"></i>
            Calificaciones
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'classmates' ? 'active' : ''}
            onClick={() => setActiveTab('classmates')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-people me-2"></i>
            Compañeros
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={activeTab}>
        {/* Overview Tab */}
        <TabPane tabId="overview">
          <Row>
            <Col md={8}>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <h5 className="mb-0">Información de la Clase</h5>
                </CardHeader>
                <CardBody>
                  {classroom.description && (
                    <div className="mb-3">
                      <strong>Descripción:</strong>
                      <p className="mt-1">{classroom.description}</p>
                    </div>
                  )}
                  
                  <Row>
                    <Col md={6}>
                      <ListGroup flush>
                        <ListGroupItem className="px-0">
                          <i className="bi bi-calendar me-2"></i>
                          <strong>Horario:</strong> {classroom.schedule?.dayOfWeek} {classroom.schedule?.time}
                        </ListGroupItem>
                        <ListGroupItem className="px-0">
                          <i className="bi bi-clock me-2"></i>
                          <strong>Duración:</strong> {classroom.schedule?.duration} minutos
                        </ListGroupItem>
                        {classroom.location && (
                          <ListGroupItem className="px-0">
                            <i className="bi bi-geo-alt me-2"></i>
                            <strong>Ubicación:</strong> {classroom.location}
                          </ListGroupItem>
                        )}
                      </ListGroup>
                    </Col>
                    <Col md={6}>
                      <ListGroup flush>
                        <ListGroupItem className="px-0">
                          <i className="bi bi-people me-2"></i>
                          <strong>Estudiantes:</strong> {classroom.studentIds?.length || 0}
                        </ListGroupItem>
                        <ListGroupItem className="px-0">
                          <i className="bi bi-book me-2"></i>
                          <strong>Módulos:</strong> {classroom.modules.length}
                        </ListGroupItem>
                        <ListGroupItem className="px-0">
                          <i className="bi bi-trophy me-2"></i>
                          <strong>Progreso:</strong>
                          <Progress
                            value={getOverallProgress()}
                            color={getOverallProgress() >= 75 ? 'success' : 'warning'}
                            className="mt-1"
                          >
                            {getOverallProgress().toFixed(0)}%
                          </Progress>
                        </ListGroupItem>
                      </ListGroup>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-primary text-white">
                  <h6 className="mb-0">Módulo Actual</h6>
                </CardHeader>
                <CardBody>
                  {classroom.currentModule ? (
                    <>
                      <h5>Semana {classroom.currentModule.weekNumber}</h5>
                      <p className="text-muted">{classroom.currentModule.topics?.join(', ')}</p>
                      {classroom.currentModule.description && (
                        <p className="small">{classroom.currentModule.description}</p>
                      )}
                      <hr />
                      <div className="d-flex justify-content-between">
                        <small>
                          <i className="bi bi-calendar-check me-1"></i>
                          Fecha: {new Date(classroom.currentModule.date).toLocaleDateString()}
                        </small>
                      </div>
                    </>
                  ) : (
                    <Alert color="info">
                      No hay módulo activo actualmente
                    </Alert>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Modules Tab */}
        <TabPane tabId="modules">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <h5 className="mb-0">Módulos del Curso</h5>
            </CardHeader>
            <CardBody>
              <ListGroup>
                {classroom.modules.map(module => {
                  const status = getModuleStatus(module);
                  const attendanceRecord = evaluation?.attendanceRecords?.find(
                    r => r.moduleId === module.weekNumber.toString()
                  );
                  const participationRecord = evaluation?.participationRecords?.find(
                    r => r.moduleId === module.weekNumber.toString()
                  );
                  
                  return (
                    <ListGroupItem key={module.weekNumber} className="mb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <Badge color={getModuleColor(status)} className="me-2">
                              Semana {module.weekNumber}
                            </Badge>
                            {status === 'current' && (
                              <Badge color="warning">
                                <i className="bi bi-play-circle me-1"></i>
                                En Curso
                              </Badge>
                            )}
                          </div>
                          <h6 className="mb-1">{module.topics?.join(', ')}</h6>
                          {module.description && (
                            <p className="text-muted small mb-2">{module.description}</p>
                          )}
                          <small className="text-muted">
                            <i className="bi bi-calendar me-1"></i>
                            {new Date(module.date).toLocaleDateString()}
                          </small>
                        </div>
                        
                        <div className="text-end">
                          {status === 'completed' && (
                            <>
                              <div className="mb-1">
                                {attendanceRecord?.isPresent ? (
                                  <Badge color="success">
                                    <i className="bi bi-check-circle me-1"></i>
                                    Presente
                                  </Badge>
                                ) : (
                                  <Badge color="danger">
                                    <i className="bi bi-x-circle me-1"></i>
                                    Ausente
                                  </Badge>
                                )}
                              </div>
                              {participationRecord && participationRecord.points > 0 && (
                                <Badge color="info">
                                  <i className="bi bi-hand-thumbs-up me-1"></i>
                                  {participationRecord.points} pts
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </ListGroupItem>
                  );
                })}
              </ListGroup>
            </CardBody>
          </Card>
        </TabPane>

        {/* Grades Tab */}
        <TabPane tabId="grades">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <h5 className="mb-0">Desglose de Calificaciones</h5>
            </CardHeader>
            <CardBody>
              {evaluation ? (
                <>
                  <div className="text-center mb-4">
                    <h2 className="mb-1">
                      <Badge color={evaluation.percentage && evaluation.percentage >= 70 ? 'success' : 'warning'}>
                        {evaluation.percentage?.toFixed(1) || 0}%
                      </Badge>
                    </h2>
                    <p className="text-muted">Calificación Total</p>
                  </div>
                  
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Criterio</th>
                        <th className="text-center">Puntos Posibles</th>
                        <th className="text-center">Puntos Obtenidos</th>
                        <th className="text-center">Porcentaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getGradeBreakdown().map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td className="text-center">{item.points}</td>
                          <td className="text-center">{item.earned.toFixed(1)}</td>
                          <td className="text-center">
                            <Progress
                              value={item.percentage}
                              color={item.percentage >= 70 ? 'success' : 'warning'}
                              style={{ height: '10px' }}
                            />
                            <small>{item.percentage.toFixed(0)}%</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th>Total</th>
                        <th className="text-center">100</th>
                        <th className="text-center">{evaluation.totalScore?.toFixed(1) || 0}</th>
                        <th className="text-center">
                          <Badge color={evaluation.percentage && evaluation.percentage >= 70 ? 'success' : 'warning'}>
                            {evaluation.percentage?.toFixed(1) || 0}%
                          </Badge>
                        </th>
                      </tr>
                    </tfoot>
                  </Table>
                  
                  {evaluation.status !== 'evaluated' && (
                    <Alert color="info" className="mt-3">
                      <i className="bi bi-info-circle me-2"></i>
                      Esta calificación está en progreso y puede cambiar
                    </Alert>
                  )}
                </>
              ) : (
                <Alert color="info">
                  <i className="bi bi-info-circle me-2"></i>
                  Aún no hay calificaciones disponibles
                </Alert>
              )}
            </CardBody>
          </Card>
        </TabPane>

        {/* Classmates Tab */}
        <TabPane tabId="classmates">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Compañeros de Clase</h5>
                <Badge color="primary">
                  {classmates.length + 1} estudiantes
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              <ListGroup>
                {/* Current User */}
                <ListGroupItem>
                  <div className="d-flex align-items-center">
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt="Profile"
                        className="rounded-circle me-3"
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center me-3"
                        style={{ width: '40px', height: '40px' }}
                      >
                        <i className="bi bi-person-fill text-white"></i>
                      </div>
                    )}
                    <div>
                      <strong>{user?.firstName} {user?.lastName}</strong>
                      <Badge color="primary" className="ms-2">Tú</Badge>
                      <br />
                      <small className="text-muted">{user?.email || user?.phone}</small>
                    </div>
                  </div>
                </ListGroupItem>
                
                {/* Classmates */}
                {classmates.map(classmate => (
                  <ListGroupItem key={classmate.id}>
                    <div className="d-flex align-items-center">
                      {classmate.profilePhoto ? (
                        <img
                          src={classmate.profilePhoto}
                          alt={classmate.firstName}
                          className="rounded-circle me-3"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <i className="bi bi-person-fill text-white"></i>
                        </div>
                      )}
                      <div>
                        <strong>{classmate.firstName} {classmate.lastName}</strong>
                        <br />
                        <small className="text-muted">{classmate.email || classmate.phone}</small>
                      </div>
                    </div>
                  </ListGroupItem>
                ))}
                
                {classmates.length === 0 && (
                  <ListGroupItem>
                    <Alert color="info" className="mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Eres el único estudiante en esta clase actualmente
                    </Alert>
                  </ListGroupItem>
                )}
              </ListGroup>
            </CardBody>
          </Card>
        </TabPane>
      </TabContent>
    </Container>
  );
};

export default StudentClassroom;