// Shared Classroom Management Component - Works for both Teachers and Admins
// Mobile-First Design

import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  ButtonGroup,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
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
  Alert,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Spinner
} from 'reactstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StudentEnrollment from './StudentEnrollment';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { WhatsappService } from '../../services/whatsapp/whatsapp.service';
import { IClassroom, IUser, IModule, IStudentEvaluation, IAttendanceRecord } from '../../models';

const ClassroomManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [classroom, setClassroom] = useState<IClassroom | null>(null);
  const [students, setStudents] = useState<IUser[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, IStudentEvaluation>>(new Map());
  const [currentModule, setCurrentModule] = useState<IModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  
  // WhatsApp state
  const [whatsappDropdownOpen, setWhatsappDropdownOpen] = useState(false);
  const [whatsappMessageModal, setWhatsappMessageModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [syncingGroup, setSyncingGroup] = useState(false);
  
  // Attendance state - Now per module
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, boolean>>(new Map());
  
  // Participation state - Track total participation including pending changes
  const [participationTotals, setParticipationTotals] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (id && user) {
      loadClassroomData();
    }
  }, [id, user]);

  useEffect(() => {
    // Load attendance and participation for current module when it changes
    if (currentModule && evaluations.size > 0) {
      loadModuleAttendance();
      loadParticipationTotals();
    }
  }, [currentModule, evaluations]);

  const loadClassroomData = async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      
      // Load classroom
      const classroomData = await ClassroomService.getClassroomById(id);
      if (!classroomData) {
        toast.error('Clase no encontrada');
        navigate(user.role === 'admin' ? '/admin/classrooms' : '/teacher/dashboard');
        return;
      }
      
      // Check permissions
      if (user.role !== 'admin' && classroomData.teacherId !== user.id) {
        toast.error('No tienes permiso para acceder a esta clase');
        navigate('/teacher/dashboard');
        return;
      }
      
      setClassroom(classroomData);
      setCurrentModule(classroomData.currentModule || classroomData.modules[0]);
      
      // Load students
      if (classroomData.studentIds && classroomData.studentIds.length > 0) {
        const studentPromises = classroomData.studentIds.map(studentId => 
          UserService.getUserById(studentId)
        );
        const studentResults = await Promise.all(studentPromises);
        const validStudents = studentResults.filter(s => s !== null) as IUser[];
        setStudents(validStudents);
        
        // Load evaluations for all students
        const evaluationPromises = validStudents.map(student =>
          EvaluationService.getStudentClassroomEvaluation(student.id, id)
        );
        const evaluationResults = await Promise.all(evaluationPromises);
        
        const evaluationMap = new Map<string, IStudentEvaluation>();
        validStudents.forEach((student, index) => {
          const evaluation = evaluationResults[index];
          if (evaluation) {
            evaluationMap.set(student.id, evaluation);
          }
        });
        
        setEvaluations(evaluationMap);
      }
    } catch (error) {
      console.error('Error loading classroom data:', error);
      toast.error('Error al cargar los datos de la clase');
    } finally {
      setLoading(false);
    }
  };

  const loadModuleAttendance = () => {
    if (!currentModule) return;
    
    const attendanceMap = new Map<string, boolean>();
    
    evaluations.forEach((evaluation, studentId) => {
      const moduleAttendance = evaluation.attendanceRecords?.find(
        record => record.moduleId === currentModule.id
      );
      
      if (moduleAttendance) {
        attendanceMap.set(studentId, moduleAttendance.isPresent);
      }
    });
    
    setAttendanceRecords(attendanceMap);
  };

  const loadParticipationTotals = () => {
    const totalsMap = new Map<string, number>();
    
    evaluations.forEach((evaluation, studentId) => {
      const total = evaluation.participationPoints || 0;
      totalsMap.set(studentId, total);
    });
    
    setParticipationTotals(totalsMap);
  };

  const handleCreateWhatsappGroup = async () => {
    if (!id) return;
    
    try {
      setCreatingGroup(true);
      await ClassroomService.createWhatsappGroup(id);
      toast.success('Grupo de WhatsApp creado exitosamente');
      await loadClassroomData();
    } catch (error: any) {
      console.error('Error creating WhatsApp group:', error);
      toast.error(error.message || 'Error al crear grupo de WhatsApp');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSyncWhatsappGroup = async () => {
    if (!id) return;
    
    try {
      setSyncingGroup(true);
      await ClassroomService.syncWhatsappGroup(id);
      toast.success('Grupo sincronizado exitosamente');
      await loadClassroomData();
    } catch (error: any) {
      console.error('Error syncing WhatsApp group:', error);
      toast.error(error.message || 'Error al sincronizar grupo');
    } finally {
      setSyncingGroup(false);
    }
  };

  const handleSendWhatsappMessage = async () => {
    if (!id || !whatsappMessage.trim()) {
      toast.error('Por favor ingrese un mensaje');
      return;
    }
    
    try {
      setSendingMessage(true);
      await ClassroomService.sendWhatsappMessage(id, whatsappMessage);
      toast.success('Mensaje enviado exitosamente');
      setWhatsappMessage('');
      setWhatsappMessageModal(false);
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      toast.error(error.message || 'Error al enviar mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAttendanceChange = async (studentId: string, isPresent: boolean) => {
    if (!currentModule || !user || !id) return;
    
    // Update UI immediately
    const newAttendance = new Map(attendanceRecords);
    newAttendance.set(studentId, isPresent);
    setAttendanceRecords(newAttendance);
    
    // Save to database in background
    try {
      await EvaluationService.recordAttendance(
        studentId,
        id,
        currentModule.id,
        isPresent,
        user.id
      );
      
      // Update evaluations state to reflect the change
      const evaluation = evaluations.get(studentId);
      if (evaluation) {
        const updatedRecords = [...(evaluation.attendanceRecords || [])];
        const existingIndex = updatedRecords.findIndex(r => r.moduleId === currentModule.id);
        
        const newRecord: IAttendanceRecord = {
          moduleId: currentModule.id,
          studentId: studentId,
          isPresent: isPresent,
          date: new Date(),
          markedBy: user.id,
          markedAt: new Date()
        };
        
        if (existingIndex !== -1) {
          updatedRecords[existingIndex] = newRecord;
        } else {
          updatedRecords.push(newRecord);
        }
        
        const updatedEvaluation: IStudentEvaluation = {
          ...evaluation,
          attendanceRecords: updatedRecords
        };
        
        const newEvaluations = new Map(evaluations);
        newEvaluations.set(studentId, updatedEvaluation);
        setEvaluations(newEvaluations);
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      // Revert UI change on error
      const revertedAttendance = new Map(attendanceRecords);
      setAttendanceRecords(revertedAttendance);
      toast.error('Error al guardar asistencia');
    }
  };

  const handleParticipationChange = async (studentId: string, delta: number) => {
    if (!id) return;
    
    // Update UI immediately
    const currentTotal = participationTotals.get(studentId) || 0;
    const newTotal = currentTotal + delta;
    
    const newTotals = new Map(participationTotals);
    newTotals.set(studentId, newTotal);
    setParticipationTotals(newTotals);
    
    // Save to database in background
    try {
      await EvaluationService.recordParticipation(
        studentId,
        id,
        delta
      );
      
      // Update evaluations state to reflect the change
      const evaluation = evaluations.get(studentId);
      if (evaluation) {
        const updatedEvaluation: IStudentEvaluation = {
          ...evaluation,
          participationPoints: newTotal
        };
        
        const newEvaluations = new Map(evaluations);
        newEvaluations.set(studentId, updatedEvaluation);
        setEvaluations(newEvaluations);
      }
    } catch (error) {
      console.error('Error saving participation:', error);
      // Revert UI change on error
      const revertedTotals = new Map(participationTotals);
      revertedTotals.set(studentId, currentTotal);
      setParticipationTotals(revertedTotals);
      toast.error('Error al guardar participación');
    }
  };

  const handleModuleChange = async (module: IModule) => {
    if (!id) return;
    
    setCurrentModule(module);
    
    // Update current module in classroom
    try {
      await ClassroomService.updateClassroom(id, {
        currentModule: module
      });
    } catch (error) {
      console.error('Error updating current module:', error);
    }
  };

  const getStudentAttendanceRate = (studentId: string): number => {
    const evaluation = evaluations.get(studentId);
    if (!evaluation?.attendanceRecords || evaluation.attendanceRecords.length === 0) {
      return 0;
    }
    
    const present = evaluation.attendanceRecords.filter(r => r.isPresent).length;
    return (present / evaluation.attendanceRecords.length) * 100;
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
        <Alert color="danger">Clase no encontrada</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3 px-2 px-sm-3">
      {/* Header - Mobile Optimized */}
      <Row className="mb-3">
        <Col>
          <Button
            color="link"
            className="p-0 mb-2 text-decoration-none"
            onClick={() => navigate(user?.role === 'admin' ? '/admin/classrooms' : '/teacher/dashboard')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </Button>
          
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h4 className="mb-1">{classroom.subject}</h4>
              <p className="text-muted mb-0 small">
                {classroom.name} • {students.length} estudiantes
              </p>
            </div>
            
            {/* WhatsApp Dropdown - Mobile Optimized */}
            <Dropdown 
              isOpen={whatsappDropdownOpen} 
              toggle={() => setWhatsappDropdownOpen(!whatsappDropdownOpen)}
            >
              <DropdownToggle caret color="success" size="sm">
                <i className="bi bi-whatsapp me-1"></i>
                <span className="d-none d-sm-inline">WhatsApp</span>
              </DropdownToggle>
              <DropdownMenu end>
                {!classroom.whatsappGroup ? (
                  <DropdownItem onClick={handleCreateWhatsappGroup} disabled={creatingGroup}>
                    {creatingGroup ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-2"></i>
                        Crear Grupo
                      </>
                    )}
                  </DropdownItem>
                ) : (
                  <>
                    <DropdownItem header>
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Grupo Conectado
                    </DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem onClick={handleSyncWhatsappGroup} disabled={syncingGroup}>
                      {syncingGroup ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-repeat me-2"></i>
                          Sincronizar
                        </>
                      )}
                    </DropdownItem>
                    <DropdownItem onClick={() => setWhatsappMessageModal(true)}>
                      <i className="bi bi-send me-2"></i>
                      Enviar Mensaje
                    </DropdownItem>
                  </>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        </Col>
      </Row>

      {/* Module Selector - Mobile Optimized */}
      <Row className="mb-3">
        <Col>
          <Card className="border-0 shadow-sm">
            <CardBody className="p-2">
              <div className="d-flex align-items-center mb-2">
                <small className="text-muted me-2">Módulo:</small>
                <Badge color="primary">
                  {currentModule?.weekNumber || 1} de {classroom.modules.length}
                </Badge>
              </div>
              <div className="d-flex gap-1 overflow-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                {classroom.modules.map(module => (
                  <Button
                    key={module.id}
                    color={currentModule?.id === module.id ? 'primary' : 'outline-primary'}
                    onClick={() => handleModuleChange(module)}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {module.isCompleted && <i className="bi bi-check-circle-fill me-1"></i>}
                    S{module.weekNumber}
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Tabs - Mobile Optimized */}
      <Nav tabs className="mb-3 flex-nowrap overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <NavItem>
          <NavLink
            className={activeTab === 'attendance' ? 'active' : ''}
            onClick={() => setActiveTab('attendance')}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-calendar-check me-1"></i>
            <span className="d-none d-sm-inline">Asistencia</span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'participation' ? 'active' : ''}
            onClick={() => setActiveTab('participation')}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-hand-thumbs-up me-1"></i>
            <span className="d-none d-sm-inline">Participación</span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'students' ? 'active' : ''}
            onClick={() => setActiveTab('students')}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-people me-1"></i>
            <span className="d-none d-sm-inline">Estudiantes</span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'evaluations' ? 'active' : ''}
            onClick={() => setActiveTab('evaluations')}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-clipboard-check me-1"></i>
            <span className="d-none d-sm-inline">Evaluaciones</span>
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={activeTab}>
        {/* Attendance Tab - Mobile Optimized */}
        <TabPane tabId="attendance">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white">
              <h6 className="mb-0">
                <i className="bi bi-calendar-check me-2"></i>
                Semana {currentModule?.weekNumber}
              </h6>
              <small className="text-muted">Los cambios se guardan automáticamente</small>
            </CardHeader>
            <CardBody className="p-0">
              {students.length === 0 ? (
                <Alert color="info" className="m-3">
                  No hay estudiantes inscritos
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table className="mb-0" hover>
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">#</th>
                        <th>Estudiante</th>
                        <th className="text-center">Presente</th>
                        <th className="text-center">Ausente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student.id}>
                          <td className="ps-3">{index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              {student.profilePhoto ? (
                                <img
                                  src={student.profilePhoto}
                                  alt={student.firstName}
                                  className="rounded-circle me-2"
                                  style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
                                  style={{ width: '32px', height: '32px' }}
                                >
                                  <small className="text-white fw-bold">
                                    {student.firstName[0]}{student.lastName[0]}
                                  </small>
                                </div>
                              )}
                              <div>
                                <div className="fw-bold small">{student.firstName} {student.lastName}</div>
                                <small className="text-muted d-none d-sm-block">{student.phone}</small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <Input
                              type="radio"
                              name={`attendance-${student.id}`}
                              checked={attendanceRecords.get(student.id) === true}
                              onChange={() => handleAttendanceChange(student.id, true)}
                            />
                          </td>
                          <td className="text-center">
                            <Input
                              type="radio"
                              name={`attendance-${student.id}`}
                              checked={attendanceRecords.get(student.id) === false}
                              onChange={() => handleAttendanceChange(student.id, false)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </TabPane>

        {/* Participation Tab - Mobile Optimized */}
        <TabPane tabId="participation">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white">
              <h6 className="mb-0">
                <i className="bi bi-hand-thumbs-up me-2"></i>
                Participación - Semana {currentModule?.weekNumber}
              </h6>
              <small className="text-muted">Los cambios se guardan automáticamente</small>
            </CardHeader>
            <CardBody className="p-0">
              {students.length === 0 ? (
                <Alert color="info" className="m-3">
                  No hay estudiantes inscritos
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table className="mb-0" hover>
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">#</th>
                        <th>Estudiante</th>
                        <th className="text-center">Participación</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const totalPoints = participationTotals.get(student.id) || 0;
                        
                        return (
                          <tr key={student.id}>
                            <td className="ps-3">{index + 1}</td>
                            <td>
                              <div className="fw-bold small">{student.firstName} {student.lastName}</div>
                            </td>
                            <td className="text-center">
                              <Badge color="info" className="px-3">
                                {totalPoints} pts
                              </Badge>
                            </td>
                            <td className="text-center">
                              <ButtonGroup size="sm">
                                <Button
                                  color="danger"
                                  outline
                                  onClick={() => handleParticipationChange(student.id, -1)}
                                >
                                  <i className="bi bi-dash"></i>
                                </Button>
                                <Button
                                  color="success"
                                  outline
                                  onClick={() => handleParticipationChange(student.id, 1)}
                                >
                                  <i className="bi bi-plus"></i>
                                </Button>
                              </ButtonGroup>
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
        </TabPane>

        {/* Students Tab - Using StudentEnrollment Component */}
        <TabPane tabId="students">
          <StudentEnrollment 
            classroom={classroom} 
            onUpdate={loadClassroomData}
          />
        </TabPane>

        {/* Evaluations Tab - Mobile Optimized */}
        <TabPane tabId="evaluations">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="bi bi-clipboard-check me-2"></i>
                Evaluaciones
              </h6>
              <Button
                color="primary"
                size="sm"
                onClick={() => navigate(`/teacher/evaluation/${id}`)}
              >
                <i className="bi bi-gear me-1"></i>
                <span className="d-none d-sm-inline">Gestionar</span>
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              <Alert color="info" className="m-3 mb-0">
                <i className="bi bi-info-circle me-2"></i>
                <small>Las evaluaciones finales se configuran en el último módulo</small>
              </Alert>
              
              {students.length === 0 ? (
                <Alert color="warning" className="m-3">
                  No hay estudiantes inscritos
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table className="mb-0" hover>
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">#</th>
                        <th>Estudiante</th>
                        <th className="text-center">Asist.</th>
                        <th className="text-center">Part.</th>
                        <th className="text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const evaluation = evaluations.get(student.id);
                        const attendanceRate = getStudentAttendanceRate(student.id);
                        const participation = participationTotals.get(student.id) || 0;
                        
                        return (
                          <tr key={student.id}>
                            <td className="ps-3">{index + 1}</td>
                            <td>
                              <div className="fw-bold small">{student.firstName} {student.lastName}</div>
                            </td>
                            <td className="text-center">
                              <Badge color={attendanceRate >= 80 ? 'success' : 'warning'} className="small">
                                {attendanceRate.toFixed(0)}%
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge color="info" className="small">
                                {participation}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge 
                                color={
                                  evaluation?.status === 'evaluated' ? 'success' :
                                  evaluation?.status === 'in-progress' ? 'warning' : 'secondary'
                                }
                                className="small"
                              >
                                {evaluation?.status === 'evaluated' ? 'OK' :
                                 evaluation?.status === 'in-progress' ? 'En Progreso' : 'Pendiente'}
                              </Badge>
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
        </TabPane>
      </TabContent>

      {/* WhatsApp Message Modal */}
      <Modal 
        isOpen={whatsappMessageModal} 
        toggle={() => setWhatsappMessageModal(false)}
        className="modal-fullscreen-sm-down"
      >
        <ModalHeader toggle={() => setWhatsappMessageModal(false)}>
          Enviar Mensaje al Grupo
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="message">Mensaje</Label>
              <Input
                type="textarea"
                id="message"
                rows={4}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Escriba el mensaje que desea enviar al grupo..."
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setWhatsappMessageModal(false)}>
            Cancelar
          </Button>
          <Button
            color="success"
            onClick={handleSendWhatsappMessage}
            disabled={sendingMessage || !whatsappMessage.trim()}
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

export default ClassroomManagement;
