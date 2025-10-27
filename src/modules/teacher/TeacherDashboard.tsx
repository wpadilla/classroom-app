// Complete Teacher Dashboard with all features

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
  Table,
  Progress,
  Alert,
  Spinner,
  ListGroup,
  ListGroupItem
} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { IClassroom, IUser, IStudentEvaluation } from '../../models';
import { toast } from 'react-toastify';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [students, setStudents] = useState<IUser[]>([]);
  const [evaluations, setEvaluations] = useState<IStudentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    activeClassrooms: 0,
    totalStudents: 0,
    pendingEvaluations: 0,
    averageAttendance: 0,
    todayClasses: [] as IClassroom[]
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
      
      // Get teacher's classrooms (or all for admin)
      const isAdmin = user.role === 'admin';
      const teacherClassrooms = await ClassroomService.getClassroomsByTeacher(user.id, isAdmin);
      setClassrooms(teacherClassrooms);
      
      // Get all students from teacher's classrooms
      const allStudentIds = new Set<string>();
      teacherClassrooms.forEach(classroom => {
        classroom.studentIds?.forEach(id => allStudentIds.add(id));
      });
      
      // Load student data
      const studentPromises = Array.from(allStudentIds).map(id => 
        UserService.getUserById(id)
      );
      const studentResults = await Promise.all(studentPromises);
      const validStudents = studentResults.filter(s => s !== null) as IUser[];
      setStudents(validStudents);
      
      // Load evaluations
      const evaluationPromises = teacherClassrooms.map(classroom =>
        EvaluationService.getClassroomEvaluations(classroom.id)
      );
      const evaluationResults = await Promise.all(evaluationPromises);
      const allEvaluations = evaluationResults.flat();
      setEvaluations(allEvaluations);
      
      // Calculate statistics
      calculateStatistics(teacherClassrooms, validStudents, allEvaluations);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar el panel');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (
    classrooms: IClassroom[], 
    students: IUser[], 
    evaluations: IStudentEvaluation[]
  ) => {
    const activeClassrooms = classrooms.filter(c => c.isActive);
    
    // Get today's classes
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayClasses = classrooms.filter(c => 
      c.schedule?.dayOfWeek === today && c.isActive
    );
    
    // Calculate average attendance
    let totalAttendance = 0;
    let attendanceCount = 0;
    evaluations.forEach(evaluation => {
      if (evaluation.attendanceRecords && evaluation.attendanceRecords.length > 0) {
        const presentCount = evaluation.attendanceRecords.filter(r => r.isPresent).length;
        totalAttendance += (presentCount / evaluation.attendanceRecords.length) * 100;
        attendanceCount++;
      }
    });
    
    const averageAttendance = attendanceCount > 0 ? totalAttendance / attendanceCount : 0;
    
    // Count pending evaluations
    const pendingEvaluations = evaluations.filter(e => 
      e.status === 'in-progress' || !e.status
    ).length;
    
    setStats({
      totalClassrooms: classrooms.length,
      activeClassrooms: activeClassrooms.length,
      totalStudents: students.length,
      pendingEvaluations,
      averageAttendance,
      todayClasses
    });
  };

  const getClassroomProgress = (classroom: IClassroom) => {
    const completedModules = classroom.modules.filter(m => m.isCompleted).length;
    return (completedModules / classroom.modules.length) * 100;
  };

  const getClassroomStudentCount = (classroom: IClassroom) => {
    return classroom.studentIds?.length || 0;
  };

  const getNextClass = () => {
    const now = new Date();
    const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return stats.todayClasses.find(classroom => {
      if (classroom.schedule?.time) {
        return classroom.schedule.time > currentTime;
      }
      return false;
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando panel...</p>
      </Container>
    );
  }

  const nextClass = getNextClass();

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2>Panel del Profesor</h2>
          <p className="text-muted">
            Bienvenido, {user?.firstName} {user?.lastName}
          </p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-primary mb-2">
                <i className="bi bi-door-open"></i>
              </div>
              <h3 className="mb-0">{stats.totalClassrooms}</h3>
              <p className="text-muted mb-0">Clases Totales</p>
              <Badge color="success" className="mt-2">
                {stats.activeClassrooms} activas
              </Badge>
            </CardBody>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-info mb-2">
                <i className="bi bi-people"></i>
              </div>
              <h3 className="mb-0">{stats.totalStudents}</h3>
              <p className="text-muted mb-0">Estudiantes</p>
            </CardBody>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-success mb-2">
                <i className="bi bi-calendar-check"></i>
              </div>
              <h3 className="mb-0">{stats.averageAttendance.toFixed(1)}%</h3>
              <p className="text-muted mb-0">Asistencia Promedio</p>
            </CardBody>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-warning mb-2">
                <i className="bi bi-clipboard-check"></i>
              </div>
              <h3 className="mb-0">{stats.pendingEvaluations}</h3>
              <p className="text-muted mb-0">Evaluaciones Pendientes</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Today's Schedule */}
      {stats.todayClasses.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-day me-2"></i>
                  Horario de Hoy
                </h5>
              </CardHeader>
              <CardBody>
                {nextClass && (
                  <Alert color="info" className="mb-3">
                    <i className="bi bi-clock me-2"></i>
                    Próxima clase: <strong>{nextClass.subject}</strong> a las {nextClass.schedule?.time}
                  </Alert>
                )}
                <ListGroup>
                  {stats.todayClasses.map(classroom => (
                    <ListGroupItem key={classroom.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{classroom.subject}</strong> - {classroom.name}
                        <br />
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {classroom.schedule?.time} ({classroom.schedule?.duration} min)
                          {classroom.location && (
                            <>
                              {' • '}
                              <i className="bi bi-geo-alt me-1"></i>
                              {classroom.location}
                            </>
                          )}
                        </small>
                      </div>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => navigate(`/teacher/classroom/${classroom.id}`)}
                      >
                        Gestionar
                      </Button>
                    </ListGroupItem>
                  ))}
                </ListGroup>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        {/* My Classrooms */}
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-door-open me-2"></i>
                  Mis Clases
                </h5>
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => navigate('/teacher/classrooms')}
                >
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {classrooms.length === 0 ? (
                <Alert color="info">
                  No tienes clases asignadas actualmente
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Materia</th>
                      <th>Grupo</th>
                      <th>Estudiantes</th>
                      <th>Progreso</th>
                      <th>WhatsApp</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classrooms.slice(0, 5).map(classroom => (
                      <tr key={classroom.id}>
                        <td>
                          <strong>{classroom.subject}</strong>
                        </td>
                        <td>{classroom.name}</td>
                        <td>
                          <Badge color="primary">
                            {getClassroomStudentCount(classroom)}
                          </Badge>
                        </td>
                        <td>
                          <Progress
                            value={getClassroomProgress(classroom)}
                            color={getClassroomProgress(classroom) >= 75 ? 'success' : 
                                   getClassroomProgress(classroom) >= 50 ? 'warning' : 'danger'}
                            style={{ height: '10px' }}
                          />
                          <small className="text-muted">
                            {getClassroomProgress(classroom).toFixed(0)}%
                          </small>
                        </td>
                        <td className="text-center">
                          {classroom.whatsappGroup ? (
                            <Badge color="success">
                              <i className="bi bi-check-circle-fill"></i>
                            </Badge>
                          ) : (
                            <Badge color="secondary">
                              <i className="bi bi-x-circle"></i>
                            </Badge>
                          )}
                        </td>
                        <td>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={() => navigate(`/teacher/classroom/${classroom.id}`)}
                          >
                            <i className="bi bi-gear me-1"></i>
                            Gestionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col md={4}>
          <Card className="border-0 shadow-sm mb-3">
            <CardHeader>
              <h5 className="mb-0">
                <i className="bi bi-lightning-fill me-2"></i>
                Acciones Rápidas
              </h5>
            </CardHeader>
            <CardBody>
              <div className="d-grid gap-2">
                <Button
                  color="outline-primary"
                  onClick={() => navigate('/teacher/students')}
                >
                  <i className="bi bi-people me-2"></i>
                  Ver Todos los Estudiantes
                </Button>
                <Button
                  color="outline-success"
                  onClick={() => navigate('/teacher/attendance')}
                >
                  <i className="bi bi-calendar-check me-2"></i>
                  Tomar Asistencia
                </Button>
                <Button
                  color="outline-warning"
                  onClick={() => navigate('/teacher/evaluations')}
                >
                  <i className="bi bi-clipboard-data me-2"></i>
                  Evaluar Estudiantes
                </Button>
                <Button
                  color="outline-info"
                  onClick={() => navigate('/teacher/reports')}
                >
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Generar Reportes
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Actividad Reciente
              </h5>
            </CardHeader>
            <CardBody>
              <ListGroup flush>
                {evaluations.slice(0, 5).map((evaluation, index) => {
                  const student = students.find(s => s.id === evaluation.studentId);
                  return (
                    <ListGroupItem key={index} className="px-0">
                      <small className="text-muted">
                        {student ? `${student.firstName} ${student.lastName}` : 'Estudiante'} - 
                        {evaluation.status === 'evaluated' ? ' Evaluado' : ' En progreso'}
                      </small>
                    </ListGroupItem>
                  );
                })}
                {evaluations.length === 0 && (
                  <ListGroupItem className="px-0">
                    <small className="text-muted">No hay actividad reciente</small>
                  </ListGroupItem>
                )}
              </ListGroup>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TeacherDashboard;