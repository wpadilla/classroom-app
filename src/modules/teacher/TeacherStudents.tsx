// Complete Teacher Students View with all features

import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Table,
  Badge,
  Button,
  Input,
  InputGroup,
  InputGroupText,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Alert,
  Spinner,
  Progress,
  FormGroup,
  Label,
  ListGroup,
  ListGroupItem
} from 'reactstrap';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { WhatsappService } from '../../services/whatsapp/whatsapp.service';
import { IUser, IClassroom, IStudentEvaluation } from '../../models';
import { toast } from 'react-toastify';

const TeacherStudents: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [students, setStudents] = useState<IUser[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<IUser[]>([]);
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, IStudentEvaluation[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('list');
  
  // Modal states
  const [studentModal, setStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<IUser | null>(null);
  const [messageModal, setMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedStudentsForMessage, setSelectedStudentsForMessage] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, selectedClassroom]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get teacher's classrooms
      const teacherClassrooms = await ClassroomService.getClassroomsByTeacher(user.id);
      setClassrooms(teacherClassrooms);
      
      // Get unique students from all classrooms
      const studentMap = new Map<string, IUser>();
      const evaluationMap = new Map<string, IStudentEvaluation[]>();
      
      for (const classroom of teacherClassrooms) {
        if (classroom.studentIds && classroom.studentIds.length > 0) {
          // Load students
          const classroomStudents = await Promise.all(
            classroom.studentIds.map(id => UserService.getUserById(id))
          );
          
          classroomStudents.forEach(student => {
            if (student) {
              studentMap.set(student.id, student);
            }
          });
          
          // Load evaluations for this classroom
          const classroomEvaluations = await EvaluationService.getClassroomEvaluations(classroom.id);
          classroomEvaluations.forEach(evaluation => {
            const existing = evaluationMap.get(evaluation.studentId) || [];
            existing.push(evaluation);
            evaluationMap.set(evaluation.studentId, existing);
          });
        }
      }
      
      setStudents(Array.from(studentMap.values()));
      setEvaluations(evaluationMap);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];
    
    // Filter by classroom
    if (selectedClassroom !== 'all') {
      const classroom = classrooms.find(c => c.id === selectedClassroom);
      if (classroom && classroom.studentIds) {
        filtered = filtered.filter(s => classroom.studentIds?.includes(s.id));
      }
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const phone = s.phone.toLowerCase();
        const email = (s.email || '').toLowerCase();
        return fullName.includes(query) || phone.includes(query) || email.includes(query);
      });
    }
    
    setFilteredStudents(filtered);
  };

  const getStudentClassrooms = (studentId: string): IClassroom[] => {
    return classrooms.filter(c => c.studentIds?.includes(studentId));
  };

  const getStudentAverageGrade = (studentId: string): number => {
    const studentEvaluations = evaluations.get(studentId) || [];
    if (studentEvaluations.length === 0) return 0;
    
    const evaluatedOnes = studentEvaluations.filter(e => e.status === 'evaluated');
    if (evaluatedOnes.length === 0) return 0;
    
    const total = evaluatedOnes.reduce((sum, e) => sum + (e.percentage || 0), 0);
    return total / evaluatedOnes.length;
  };

  const getStudentAttendanceRate = (studentId: string): number => {
    const studentEvaluations = evaluations.get(studentId) || [];
    if (studentEvaluations.length === 0) return 0;
    
    let totalPresent = 0;
    let totalRecords = 0;
    
    studentEvaluations.forEach(evaluation => {
      if (evaluation.attendanceRecords) {
        totalPresent += evaluation.attendanceRecords.filter(r => r.isPresent).length;
        totalRecords += evaluation.attendanceRecords.length;
      }
    });
    
    return totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
  };

  const getStudentParticipation = (studentId: string): number => {
    const studentEvaluations = evaluations.get(studentId) || [];
    if (studentEvaluations.length === 0) return 0;
    
    let totalPoints = 0;
    studentEvaluations.forEach(evaluation => {
      if (evaluation.participationRecords) {
        totalPoints += evaluation.participationRecords.reduce((sum, r) => sum + r.points, 0);
      }
    });
    
    return totalPoints;
  };

  const handleViewStudent = (student: IUser) => {
    setSelectedStudent(student);
    setStudentModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || selectedStudentsForMessage.length === 0) {
      toast.error('Seleccione estudiantes y escriba un mensaje');
      return;
    }
    
    try {
      setSendingMessage(true);
      
      const phones = selectedStudentsForMessage.map(id => {
        const student = students.find(s => s.id === id);
        return student ? WhatsappService.formatPhoneNumber(student.phone) : '';
      }).filter(phone => phone);
      
      await WhatsappService.sendMessage(
        phones,
        {
          type: 'text',
          content: messageText
        }
      );
      
      toast.success(`Mensaje enviado a ${phones.length} estudiantes`);
      setMessageModal(false);
      setMessageText('');
      setSelectedStudentsForMessage([]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  const exportToExcel = () => {
    // Implementation for Excel export
    toast.info('Función de exportación en desarrollo');
  };

  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return 'success';
    if (grade >= 80) return 'info';
    if (grade >= 70) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando estudiantes...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Mis Estudiantes</h2>
            <div>
              <Button
                color="success"
                className="me-2"
                onClick={() => setMessageModal(true)}
                disabled={selectedStudentsForMessage.length === 0}
              >
                <i className="bi bi-whatsapp me-2"></i>
                Enviar Mensaje ({selectedStudentsForMessage.length})
              </Button>
              <Button color="primary" onClick={exportToExcel}>
                <i className="bi bi-file-earmark-excel me-2"></i>
                Exportar
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0">{students.length}</h3>
              <small className="text-muted">Total Estudiantes</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0">{classrooms.length}</h3>
              <small className="text-muted">Clases</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0">
                {students.filter(s => getStudentAttendanceRate(s.id) >= 80).length}
              </h3>
              <small className="text-muted">Buena Asistencia (≥80%)</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0">
                {students.filter(s => getStudentAverageGrade(s.id) >= 70).length}
              </h3>
              <small className="text-muted">Aprobando (≥70)</small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
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
        <Col md={3}>
          <Input
            type="select"
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
          >
            <option value="all">Todas las Clases</option>
            {classrooms.map(classroom => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.subject} - {classroom.name}
              </option>
            ))}
          </Input>
        </Col>
      </Row>

      {/* Tabs */}
      <Nav tabs className="mb-3">
        <NavItem>
          <NavLink
            className={activeTab === 'list' ? 'active' : ''}
            onClick={() => setActiveTab('list')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-list me-2"></i>
            Lista
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'performance' ? 'active' : ''}
            onClick={() => setActiveTab('performance')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-graph-up me-2"></i>
            Rendimiento
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'attendance' ? 'active' : ''}
            onClick={() => setActiveTab('attendance')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-calendar-check me-2"></i>
            Asistencia
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={activeTab}>
        {/* List View */}
        <TabPane tabId="list">
          <Card>
            <CardBody>
              {filteredStudents.length === 0 ? (
                <Alert color="info">
                  <i className="bi bi-info-circle me-2"></i>
                  No se encontraron estudiantes
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>
                        <Input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentsForMessage(filteredStudents.map(s => s.id));
                            } else {
                              setSelectedStudentsForMessage([]);
                            }
                          }}
                        />
                      </th>
                      <th>Foto</th>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Clases</th>
                      <th>Promedio</th>
                      <th>Asistencia</th>
                      <th>Participación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      const studentClassrooms = getStudentClassrooms(student.id);
                      const averageGrade = getStudentAverageGrade(student.id);
                      const attendanceRate = getStudentAttendanceRate(student.id);
                      const participation = getStudentParticipation(student.id);
                      
                      return (
                        <tr key={student.id}>
                          <td>
                            <Input
                              type="checkbox"
                              checked={selectedStudentsForMessage.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentsForMessage([...selectedStudentsForMessage, student.id]);
                                } else {
                                  setSelectedStudentsForMessage(
                                    selectedStudentsForMessage.filter(id => id !== student.id)
                                  );
                                }
                              }}
                            />
                          </td>
                          <td>
                            {student.profilePhoto ? (
                              <img
                                src={student.profilePhoto}
                                alt={student.firstName}
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
                            <strong>{student.firstName} {student.lastName}</strong>
                            {student.email && (
                              <>
                              <br />
                              <small className="text-muted">{student.email || 'N/A'}</small>
                              </>
                            )}
                          </td>
                          <td>{student.phone}</td>
                          <td>
                            <Badge color="primary">
                              {studentClassrooms.length}
                            </Badge>
                          </td>
                          <td>
                            <Badge color={getGradeColor(averageGrade)}>
                              {averageGrade.toFixed(1)}%
                            </Badge>
                          </td>
                          <td>
                            <Progress
                              value={attendanceRate}
                              color={attendanceRate >= 80 ? 'success' : 
                                     attendanceRate >= 60 ? 'warning' : 'danger'}
                              style={{ height: '10px' }}
                            />
                            <small>{attendanceRate.toFixed(0)}%</small>
                          </td>
                          <td>
                            <Badge color="info">
                              {participation} pts
                            </Badge>
                          </td>
                          <td>
                            <Button
                              color="primary"
                              size="sm"
                              onClick={() => handleViewStudent(student)}
                            >
                              <i className="bi bi-eye"></i>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </TabPane>

        {/* Performance View */}
        <TabPane tabId="performance">
          <Row>
            {filteredStudents.map(student => {
              const averageGrade = getStudentAverageGrade(student.id);
              const studentClassrooms = getStudentClassrooms(student.id);
              
              return (
                <Col md={4} key={student.id} className="mb-3">
                  <Card>
                    <CardBody>
                      <div className="d-flex align-items-center mb-3">
                        {student.profilePhoto ? (
                          <img
                            src={student.profilePhoto}
                            alt={student.firstName}
                            className="rounded-circle me-3"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center me-3"
                            style={{ width: '50px', height: '50px' }}
                          >
                            <i className="bi bi-person-fill text-white"></i>
                          </div>
                        )}
                        <div>
                          <h6 className="mb-0">{student.firstName} {student.lastName}</h6>
                          <small className="text-muted">
                            {studentClassrooms.length} clases
                          </small>
                        </div>
                      </div>
                      
                      <div className="text-center mb-3">
                        <h2 className="mb-0">
                          <Badge color={getGradeColor(averageGrade)}>
                            {averageGrade.toFixed(1)}%
                          </Badge>
                        </h2>
                        <small className="text-muted">Promedio General</small>
                      </div>
                      
                      <ListGroup flush>
                        {studentClassrooms.map(classroom => {
                          const classroomEval = evaluations.get(student.id)?.find(
                            e => e.classroomId === classroom.id
                          );
                          return (
                            <ListGroupItem key={classroom.id} className="px-0">
                              <div className="d-flex justify-content-between">
                                <small>{classroom.subject}</small>
                                <Badge color={classroomEval?.status === 'evaluated' ? 'success' : 'warning'}>
                                  {classroomEval?.percentage?.toFixed(0) || 0}%
                                </Badge>
                              </div>
                            </ListGroupItem>
                          );
                        })}
                      </ListGroup>
                    </CardBody>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </TabPane>

        {/* Attendance View */}
        <TabPane tabId="attendance">
          <Card>
            <CardBody>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Asistencia Total</th>
                    {classrooms.slice(0, 5).map(classroom => (
                      <th key={classroom.id} className="text-center">
                        {classroom.subject.substring(0, 10)}...
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => {
                    const attendanceRate = getStudentAttendanceRate(student.id);
                    
                    return (
                      <tr key={student.id}>
                        <td>
                          <strong>{student.firstName} {student.lastName}</strong>
                        </td>
                        <td>
                          <Progress
                            value={attendanceRate}
                            color={attendanceRate >= 80 ? 'success' : 
                                   attendanceRate >= 60 ? 'warning' : 'danger'}
                          >
                            {attendanceRate.toFixed(0)}%
                          </Progress>
                        </td>
                        {classrooms.slice(0, 5).map(classroom => {
                          const classroomEval = evaluations.get(student.id)?.find(
                            e => e.classroomId === classroom.id
                          );
                          const attendanceCount = classroomEval?.attendanceRecords?.filter(
                            r => r.isPresent
                          ).length || 0;
                          const totalRecords = classroomEval?.attendanceRecords?.length || 0;
                          
                          return (
                            <td key={classroom.id} className="text-center">
                              {totalRecords > 0 ? (
                                <Badge color={attendanceCount >= totalRecords * 0.8 ? 'success' : 'warning'}>
                                  {attendanceCount}/{totalRecords}
                                </Badge>
                              ) : (
                                <Badge color="secondary">N/A</Badge>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </TabPane>
      </TabContent>

      {/* Student Detail Modal */}
      <Modal isOpen={studentModal} toggle={() => setStudentModal(false)} size="lg">
        <ModalHeader toggle={() => setStudentModal(false)}>
          Detalles del Estudiante
        </ModalHeader>
        <ModalBody>
          {selectedStudent && (
            <>
              <Row>
                <Col md={4} className="text-center">
                  {selectedStudent.profilePhoto ? (
                    <img
                      src={selectedStudent.profilePhoto}
                      alt="Profile"
                      className="rounded-circle mb-3"
                      style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center mb-3"
                      style={{ width: '150px', height: '150px' }}
                    >
                      <i className="bi bi-person-fill text-white" style={{ fontSize: '4rem' }}></i>
                    </div>
                  )}
                  <h4>{selectedStudent.firstName} {selectedStudent.lastName}</h4>
                  <p className="text-muted">
                    <i className="bi bi-telephone me-2"></i>
                    {selectedStudent.phone}
                  </p>
                  {selectedStudent.email && (
                    <p className="text-muted">
                      <i className="bi bi-envelope me-2"></i>
                      {selectedStudent.email}
                    </p>
                  )}
                </Col>
                <Col md={8}>
                  <h5>Información Académica</h5>
                  <hr />
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Promedio General</Label>
                        <h4>
                          <Badge color={getGradeColor(getStudentAverageGrade(selectedStudent.id))}>
                            {getStudentAverageGrade(selectedStudent.id).toFixed(1)}%
                          </Badge>
                        </h4>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Asistencia</Label>
                        <Progress
                          value={getStudentAttendanceRate(selectedStudent.id)}
                          color={getStudentAttendanceRate(selectedStudent.id) >= 80 ? 'success' : 'warning'}
                        >
                          {getStudentAttendanceRate(selectedStudent.id).toFixed(0)}%
                        </Progress>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Participación Total</Label>
                        <h4>
                          <Badge color="info">
                            {getStudentParticipation(selectedStudent.id)} puntos
                          </Badge>
                        </h4>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Clases Inscritas</Label>
                        <h4>
                          <Badge color="primary">
                            {getStudentClassrooms(selectedStudent.id).length}
                          </Badge>
                        </h4>
                      </FormGroup>
                    </Col>
                  </Row>
                  
                  <h5 className="mt-3">Clases</h5>
                  <ListGroup>
                    {getStudentClassrooms(selectedStudent.id).map(classroom => (
                      <ListGroupItem key={classroom.id}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{classroom.subject}</strong> - {classroom.name}
                          </div>
                          <Badge color="primary">
                            Módulo {classroom.currentModule?.weekNumber || 1}
                          </Badge>
                        </div>
                      </ListGroupItem>
                    ))}
                  </ListGroup>
                </Col>
              </Row>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setStudentModal(false)}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Message Modal */}
      <Modal isOpen={messageModal} toggle={() => setMessageModal(false)}>
        <ModalHeader toggle={() => setMessageModal(false)}>
          Enviar Mensaje por WhatsApp
        </ModalHeader>
        <ModalBody>
          <Alert color="info">
            <i className="bi bi-info-circle me-2"></i>
            Enviando a {selectedStudentsForMessage.length} estudiantes seleccionados
          </Alert>
          <FormGroup>
            <Label for="message">Mensaje</Label>
            <Input
              type="textarea"
              id="message"
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escriba el mensaje que desea enviar..."
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setMessageModal(false)}>
            Cancelar
          </Button>
          <Button
            color="success"
            onClick={handleSendMessage}
            disabled={sendingMessage || !messageText.trim()}
          >
            {sendingMessage ? (
              <>
                <Spinner size="sm" className="me-2" />
                Enviando...
              </>
            ) : (
              <>
                <i className="bi bi-send me-2"></i>
                Enviar
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default TeacherStudents;