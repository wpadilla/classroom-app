// Complete Student Dashboard with all features

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
  Table
} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { ProgramService } from '../../services/program/program.service';
import { UserService } from '../../services/user/user.service';
import { IClassroom, IStudentEvaluation, IProgram, IUser } from '../../models';
import { toast } from 'react-toastify';
import PWAInstallPrompt from '../../components/common/PWAInstallPrompt';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<IUser | null>(null);
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<IClassroom[]>([]);
  const [evaluations, setEvaluations] = useState<IStudentEvaluation[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextClass, setNextClass] = useState<IClassroom | null>(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    completedClasses: 0,
    averageGrade: 0,
    attendanceRate: 0,
    totalParticipation: 0,
    pendingAssignments: 0
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load full user profile
      const userProfile = await UserService.getUserById(user.id);
      if (!userProfile) return;

      setProfile(userProfile);

      // Load enrolled classrooms
      if (userProfile.enrolledClassrooms && userProfile.enrolledClassrooms.length > 0) {
        const classrooms = await Promise.all(
          userProfile.enrolledClassrooms.map(id => ClassroomService.getClassroomById(id))
        );
        const validClassrooms = classrooms.filter(c => c !== null) as IClassroom[];
        setEnrolledClassrooms(validClassrooms);

        // Load programs for these classrooms
        const programIds = new Set(validClassrooms.map(c => c.programId));
        const programPromises = Array.from(programIds).map(id => ProgramService.getProgramById(id));
        const programResults = await Promise.all(programPromises);
        setPrograms(programResults.filter(p => p !== null) as IProgram[]);

        // Load evaluations
        const evaluationPromises = validClassrooms.map(classroom =>
          EvaluationService.getStudentClassroomEvaluation(user.id, classroom.id)
        );
        const evaluationResults = await Promise.all(evaluationPromises);
        const validEvaluations = evaluationResults.filter(e => e !== null) as IStudentEvaluation[];
        setEvaluations(validEvaluations);

        // Calculate statistics
        calculateStatistics(validClassrooms, validEvaluations, userProfile);

        // Find next class
        findNextClass(validClassrooms);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar el panel');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (
    classrooms: IClassroom[],
    evaluations: IStudentEvaluation[],
    profile: IUser
  ) => {
    // Calculate average grade
    const evaluatedOnes = evaluations.filter(e => e.status === 'evaluated');
    const averageGrade = evaluatedOnes.length > 0
      ? evaluatedOnes.reduce((sum, e) => sum + (e.percentage || 0), 0) / evaluatedOnes.length
      : 0;

    // Calculate attendance rate
    let totalPresent = 0;
    let totalRecords = 0;
    evaluations.forEach(evaluation => {
      if (evaluation.attendanceRecords) {
        totalPresent += evaluation.attendanceRecords.filter(r => r.isPresent).length;
        totalRecords += evaluation.attendanceRecords.length;
      }
    });
    const attendanceRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

    // Calculate total participation
    const totalParticipation = evaluations.reduce((sum, evaluation) => {
      if (evaluation.participationRecords) {
        return sum + evaluation.participationRecords.reduce((pSum, r) => pSum + r.points, 0);
      }
      return sum;
    }, 0);

    // Count pending assignments (evaluations not completed)
    const pendingAssignments = evaluations.filter(e =>
      e.status !== 'evaluated' && e.scores.questionnaires === 0
    ).length;

    // Count completed classes
    const completedClasses = profile.completedClassrooms?.length || 0;

    setStats({
      totalClasses: classrooms.length,
      completedClasses,
      averageGrade,
      attendanceRate,
      totalParticipation,
      pendingAssignments
    });
  };

  const findNextClass = (classrooms: IClassroom[]) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find today's classes
    const todayClasses = classrooms.filter(c =>
      c.schedule?.dayOfWeek === currentDay && c.isActive
    );

    // Find next class
    const next = todayClasses.find(c => {
      if (c.schedule?.time) {
        return c.schedule.time > currentTime;
      }
      return false;
    });

    setNextClass(next || null);
  };

  const getClassroomProgress = (classroom: IClassroom): number => {
    const completedModules = classroom.modules.filter(m => m.isCompleted).length;
    return (completedModules / classroom.modules.length) * 100;
  };

  const getClassroomGrade = (classroomId: string): number => {
    const evaluation = evaluations.find(e => e.classroomId === classroomId);
    return evaluation?.percentage || 0;
  };

  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return 'success';
    if (grade >= 80) return 'info';
    if (grade >= 70) return 'warning';
    return 'danger';
  };

  const getProgramName = (programId: string): string => {
    const program = programs.find(p => p.id === programId);
    return program?.name || 'Sin programa';
  };

  const getUpcomingDeadlines = () => {
    // Get classrooms with upcoming evaluations
    return enrolledClassrooms.filter(classroom => {
      const lastModule = classroom.modules[classroom.modules.length - 1];
      return !lastModule.isCompleted;
    }).slice(0, 3);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando panel...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Welcome Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>¡Hola, {user?.firstName}!</h2>
              <p className="text-muted mb-0">
                Este es tu panel de estudiante. Aquí puedes ver tu progreso académico.
              </p>
            </div>
            <Button
              color="primary"
              onClick={() => navigate('/student/profile')}
            >
              <i className="bi bi-person-circle me-2"></i>
              Mi Perfil
            </Button>
          </div>
        </Col>
      </Row>

      {/* Next Class Alert */}
      {nextClass && (
        <Row className="mb-4">
          <Col>
            <Alert color="info" className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-clock me-2"></i>
                <strong>Próxima clase:</strong> {nextClass.subject} - {nextClass.name}
                {' '}a las {nextClass.schedule?.time}
                {nextClass.location && ` en ${nextClass.location}`}
              </div>
              <Button
                color="info"
                size="sm"
                onClick={() => navigate(`/student/classroom/${nextClass.id}`)}
              >
                Ver Detalles
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-6 text-primary mb-2">
                <i className="bi bi-book"></i>
              </div>
              <h4 className="mb-0">{stats.totalClasses}</h4>
              <small className="text-muted">Clases Actuales</small>
            </CardBody>
          </Card>
        </Col>

        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-6 text-success mb-2">
                <i className="bi bi-check-circle"></i>
              </div>
              <h4 className="mb-0">{stats.completedClasses}</h4>
              <small className="text-muted">Completadas</small>
            </CardBody>
          </Card>
        </Col>

        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-6 text-info mb-2">
                <i className="bi bi-graph-up"></i>
              </div>
              <h4 className="mb-0">{stats.averageGrade.toFixed(1)}%</h4>
              <small className="text-muted">Promedio</small>
            </CardBody>
          </Card>
        </Col>

        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-6 text-warning mb-2">
                <i className="bi bi-calendar-check"></i>
              </div>
              <h4 className="mb-0">{stats.attendanceRate.toFixed(0)}%</h4>
              <small className="text-muted">Asistencia</small>
            </CardBody>
          </Card>
        </Col>

        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-6 text-purple mb-2">
                <i className="bi bi-hand-thumbs-up"></i>
              </div>
              <h4 className="mb-0">{stats.totalParticipation}</h4>
              <small className="text-muted">Participación</small>
            </CardBody>
          </Card>
        </Col>

        <Col md={2}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-6 text-danger mb-2">
                <i className="bi bi-exclamation-circle"></i>
              </div>
              <h4 className="mb-0">{stats.pendingAssignments}</h4>
              <small className="text-muted">Pendientes</small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Current Classes */}
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <h5 className="mb-0">
                <i className="bi bi-book me-2"></i>
                Mis Clases Actuales
              </h5>
            </CardHeader>
            <CardBody>
              {enrolledClassrooms.length === 0 ? (
                <Alert color="info">
                  No estás inscrito en ninguna clase actualmente
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Programa</th>
                        <th>Materia</th>
                        <th>Profesor</th>
                        <th>Progreso</th>
                        <th>Calificación</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledClassrooms.map(classroom => {
                        const progress = getClassroomProgress(classroom);
                        const grade = getClassroomGrade(classroom.id);

                        return (
                          <tr key={classroom.id}>
                            <td>
                              <Badge color="secondary">
                                {getProgramName(classroom.programId)}
                              </Badge>
                            </td>
                            <td>
                              <strong>{classroom.subject}</strong>
                              <br />
                              <small className="text-muted">{classroom.name}</small>
                            </td>
                            <td>
                              {classroom.teacherId}
                            </td>
                            <td>
                              <Progress
                                value={progress}
                                color={progress >= 75 ? 'success' :
                                       progress >= 50 ? 'warning' : 'danger'}
                                style={{ height: '10px' }}
                              />
                              <small>{progress.toFixed(0)}%</small>
                            </td>
                            <td>
                              <Badge color={getGradeColor(grade)}>
                                {grade.toFixed(1)}%
                              </Badge>
                            </td>
                            <td>
                              <Button
                                color="primary"
                                size="sm"
                                onClick={() => navigate(`/student/classroom/${classroom.id}`)}
                              >
                                Ver
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col md={4}>
          {/* Upcoming Deadlines */}
          <Card className="border-0 shadow-sm mb-3">
            <CardHeader className="bg-warning text-dark">
              <h6 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Próximas Evaluaciones
              </h6>
            </CardHeader>
            <CardBody>
              <ListGroup flush>
                {getUpcomingDeadlines().map(classroom => (
                  <ListGroupItem key={classroom.id} className="px-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{classroom.subject}</strong>
                        <br />
                        <small className="text-muted">
                          Módulo {classroom.currentModule?.weekNumber || classroom.modules.length}
                        </small>
                      </div>
                      <Badge color="warning">Pendiente</Badge>
                    </div>
                  </ListGroupItem>
                ))}
                {getUpcomingDeadlines().length === 0 && (
                  <ListGroupItem className="px-0">
                    <small className="text-muted">No hay evaluaciones pendientes</small>
                  </ListGroupItem>
                )}
              </ListGroup>
            </CardBody>
          </Card>

          {/* Recent Grades */}
          <Card className="border-0 shadow-sm mb-3">
            <CardHeader className="bg-success text-white">
              <h6 className="mb-0">
                <i className="bi bi-trophy me-2"></i>
                Calificaciones Recientes
              </h6>
            </CardHeader>
            <CardBody>
              <ListGroup flush>
                {evaluations
                  .filter(e => e.status === 'evaluated')
                  .slice(0, 5)
                  .map(evaluation => {
                    const classroom = enrolledClassrooms.find(c => c.id === evaluation.classroomId);
                    return (
                      <ListGroupItem key={evaluation.id} className="px-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <small>{classroom?.subject || 'Clase'}</small>
                          <Badge color={getGradeColor(evaluation.percentage || 0)}>
                            {evaluation.percentage?.toFixed(1)}%
                          </Badge>
                        </div>
                      </ListGroupItem>
                    );
                  })}
                {evaluations.filter(e => e.status === 'evaluated').length === 0 && (
                  <ListGroupItem className="px-0">
                    <small className="text-muted">No hay calificaciones aún</small>
                  </ListGroupItem>
                )}
              </ListGroup>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <h6 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                Acciones Rápidas
              </h6>
            </CardHeader>
            <CardBody>
              <div className="d-grid gap-2">
                <Button
                  color="outline-primary"
                  onClick={() => navigate('/student/profile')}
                >
                  <i className="bi bi-person me-2"></i>
                  Ver Mi Perfil
                </Button>
                <Button
                  color="outline-info"
                  onClick={() => navigate('/student/grades')}
                >
                  <i className="bi bi-clipboard-data me-2"></i>
                  Ver Todas las Calificaciones
                </Button>
                <Button
                  color="outline-success"
                  onClick={() => navigate('/student/schedule')}
                >
                  <i className="bi bi-calendar-week me-2"></i>
                  Ver Horario Completo
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <PWAInstallPrompt />
    </Container>
  );
};

export default StudentDashboard;
