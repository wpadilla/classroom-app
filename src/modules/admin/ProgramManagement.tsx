// Complete Program Management Module for Admins

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
  Alert,
  Spinner,
  Progress,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  ListGroup,
  ListGroupItem
} from 'reactstrap';
import { toast } from 'react-toastify';
import { ProgramService } from '../../services/program/program.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { IProgram, IClassroom, IUser } from '../../models';

const ProgramManagement: React.FC = () => {
  // State
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [teachers, setTeachers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  
  // Modal states
  const [programModal, setProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<IProgram | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<IProgram | null>(null);
  const [classroomModal, setClassroomModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<IProgram | null>(null);
  const [statsModal, setStatsModal] = useState(false);
  const [selectedProgramStats, setSelectedProgramStats] = useState<any>(null);
  
  // Form state for program
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    code: '',
    category: 'general' as any,
    level: 'basic' as any,
    duration: '',
    isActive: true,
    maxStudents: 30,
    minStudents: 5,
    totalCredits: 0,
    requirements: [] as string[],
    materials: {
      books: [] as string[],
      resources: [] as string[],
      cost: 0
    }
  });
  
  // Form state for classroom
  const [classroomForm, setClassroomForm] = useState({
    name: '',
    subject: '',
    description: '',
    teacherId: '',
    isActive: true,
    materialPrice: 0,
    schedule: {
      dayOfWeek: 'Monday',
      time: '18:00',
      duration: 120
    },
    evaluationCriteria: {
      questionnaires: 25,
      attendance: 25,
      participation: 25,
      finalExam: 25,
      customCriteria: []
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [programsList, classroomsList, teachersList] = await Promise.all([
        ProgramService.getAllPrograms(),
        ClassroomService.getAllClassrooms(),
        UserService.getTeachers()
      ]);
      setPrograms(programsList);
      setClassrooms(classroomsList);
      setTeachers(teachersList);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProgramModal = (program?: IProgram) => {
    if (program) {
      setEditingProgram(program);
      setProgramForm({
        name: program.name,
        description: program.description,
        code: program.code,
        category: program.category || 'general',
        level: program.level || 'basic',
        duration: program.duration || '',
        isActive: program.isActive,
        maxStudents: program.maxStudents || 30,
        minStudents: program.minStudents || 5,
        totalCredits: program.totalCredits || 0,
        requirements: program.requirements || [],
        materials: program.materials || { books: [], resources: [], cost: 0 }
      });
    } else {
      setEditingProgram(null);
      setProgramForm({
        name: '',
        description: '',
        code: '',
        category: 'general',
        level: 'basic',
        duration: '',
        isActive: true,
        maxStudents: 30,
        minStudents: 5,
        totalCredits: 0,
        requirements: [],
        materials: { books: [], resources: [], cost: 0 }
      });
    }
    setProgramModal(true);
  };

  const handleSaveProgram = async () => {
    // Validation
    if (!programForm.name || !programForm.code || !programForm.description) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    try {
      if (editingProgram) {
        // Update existing program
        await ProgramService.updateProgram(editingProgram.id, programForm);
        toast.success('Programa actualizado exitosamente');
      } else {
        // Create new program
        await ProgramService.createProgram(programForm);
        toast.success('Programa creado exitosamente');
      }
      
      setProgramModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Error saving program:', error);
      toast.error(error.message || 'Error al guardar programa');
    }
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;
    
    try {
      await ProgramService.deleteProgram(programToDelete.id);
      toast.success('Programa eliminado exitosamente');
      setDeleteModal(false);
      setProgramToDelete(null);
      await loadData();
    } catch (error: any) {
      console.error('Error deleting program:', error);
      toast.error(error.message || 'Error al eliminar programa');
    }
  };

  const handleToggleProgramStatus = async (program: IProgram) => {
    try {
      await ProgramService.toggleProgramStatus(program.id);
      toast.success(`Programa ${program.isActive ? 'desactivado' : 'activado'} exitosamente`);
      await loadData();
    } catch (error) {
      console.error('Error toggling program status:', error);
      toast.error('Error al cambiar el estado del programa');
    }
  };

  const handleOpenClassroomModal = (program: IProgram) => {
    setSelectedProgram(program);
    setClassroomForm({
      name: '',
      subject: '',
      description: '',
      teacherId: '',
      isActive: true,
      materialPrice: 0,
      schedule: {
        dayOfWeek: 'Monday',
        time: '18:00',
        duration: 120
      },
      evaluationCriteria: {
        questionnaires: 25,
        attendance: 25,
        participation: 25,
        finalExam: 25,
        customCriteria: []
      }
    });
    setClassroomModal(true);
  };

  const handleCreateClassroom = async () => {
    if (!selectedProgram) return;
    
    // Validation
    if (!classroomForm.name || !classroomForm.subject || !classroomForm.teacherId) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    try {
      // Create classroom
      const classroomId = await ClassroomService.createClassroom({
        ...classroomForm,
        programId: selectedProgram.id,
        studentIds: [],
        modules: Array.from({ length: 8 }, (_, i) => ({
          id: `module-${Date.now()}-${i}`,
          name: `Semana ${i + 1}`,
          weekNumber: i + 1,
          date: new Date(),
          isCompleted: false
        }))
      });
      
      // Add classroom to program
      await ProgramService.addClassroomToProgram(selectedProgram.id, classroomId);
      
      // Assign teacher to classroom
      await UserService.assignTeacherToClassroom(classroomForm.teacherId, classroomId);
      
      toast.success('Clase creada exitosamente');
      setClassroomModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Error creating classroom:', error);
      toast.error(error.message || 'Error al crear clase');
    }
  };

  const handleViewStats = async (program: IProgram) => {
    try {
      const stats = await ProgramService.getProgramStatistics(program.id);
      setSelectedProgramStats({ program, stats });
      setStatsModal(true);
    } catch (error) {
      console.error('Error getting program stats:', error);
      toast.error('Error al obtener estadísticas');
    }
  };

  const getProgramClassrooms = (programId: string) => {
    return classrooms.filter(c => c.programId === programId);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      theology: 'primary',
      leadership: 'success',
      discipleship: 'info',
      general: 'secondary',
      other: 'dark'
    };
    return colors[category] || 'secondary';
  };

  const getLevelBadge = (level: string) => {
    const badges: Record<string, string> = {
      basic: 'success',
      intermediate: 'warning',
      advanced: 'danger'
    };
    return badges[level] || 'secondary';
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando programas...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Gestión de Programas</h2>
            <Button color="primary" onClick={() => handleOpenProgramModal()}>
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Programa
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0">{programs.length}</h3>
              <small className="text-muted">Total Programas</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0 text-success">
                {programs.filter(p => p.isActive).length}
              </h3>
              <small className="text-muted">Activos</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0 text-info">{classrooms.length}</h3>
              <small className="text-muted">Total Clases</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="mb-0 text-warning">
                {classrooms.filter(c => c.isActive).length}
              </h3>
              <small className="text-muted">Clases Activas</small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Programs List */}
      {programs.length === 0 ? (
        <Alert color="info">
          <i className="bi bi-info-circle me-2"></i>
          No hay programas registrados. Cree el primer programa.
        </Alert>
      ) : (
        programs.map(program => {
          const programClassrooms = getProgramClassrooms(program.id);
          const isExpanded = expandedProgram === program.id;
          
          return (
            <Card key={program.id} className="mb-3">
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <div 
                    className="flex-grow-1"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                  >
                    <h5 className="mb-1">
                      <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} me-2`}></i>
                      {program.name}
                      <Badge color={getCategoryColor(program.category || 'general')} className="ms-2">
                        {program.category || 'General'}
                      </Badge>
                      <Badge color={getLevelBadge(program.level || 'basic')} className="ms-2">
                        {program.level === 'basic' ? 'Básico' : 
                         program.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                      </Badge>
                      {!program.isActive && (
                        <Badge color="danger" className="ms-2">Inactivo</Badge>
                      )}
                    </h5>
                    <p className="text-muted mb-0">
                      Código: {program.code} • {programClassrooms.length} clases • 
                      {program.duration && ` Duración: ${program.duration}`}
                    </p>
                  </div>
                  
                  <UncontrolledDropdown>
                    <DropdownToggle color="link" className="text-dark p-0">
                      <i className="bi bi-three-dots-vertical"></i>
                    </DropdownToggle>
                    <DropdownMenu end>
                      <DropdownItem onClick={() => handleOpenProgramModal(program)}>
                        <i className="bi bi-pencil me-2"></i>
                        Editar
                      </DropdownItem>
                      <DropdownItem onClick={() => handleOpenClassroomModal(program)}>
                        <i className="bi bi-plus-circle me-2"></i>
                        Agregar Clase
                      </DropdownItem>
                      <DropdownItem onClick={() => handleViewStats(program)}>
                        <i className="bi bi-bar-chart me-2"></i>
                        Ver Estadísticas
                      </DropdownItem>
                      <DropdownItem onClick={() => handleToggleProgramStatus(program)}>
                        <i className={`bi bi-${program.isActive ? 'pause' : 'play'}-circle me-2`}></i>
                        {program.isActive ? 'Desactivar' : 'Activar'}
                      </DropdownItem>
                      <DropdownItem divider />
                      <DropdownItem 
                        className="text-danger"
                        onClick={() => {
                          setProgramToDelete(program);
                          setDeleteModal(true);
                        }}
                        disabled={programClassrooms.length > 0}
                      >
                        <i className="bi bi-trash me-2"></i>
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardBody>
                  <Row>
                    <Col md={8}>
                      <p>{program.description}</p>
                      
                      {program.requirements && program.requirements.length > 0 && (
                        <div className="mb-3">
                          <h6>Requisitos:</h6>
                          <ul>
                            {program.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <h6>Clases del Programa:</h6>
                      {programClassrooms.length === 0 ? (
                        <Alert color="warning">
                          No hay clases asignadas a este programa
                        </Alert>
                      ) : (
                        <ListGroup>
                          {programClassrooms.map(classroom => {
                            const teacher = teachers.find(t => t.id === classroom.teacherId);
                            return (
                              <ListGroupItem key={classroom.id}>
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <strong>{classroom.subject}</strong> - {classroom.name}
                                    <br />
                                    <small className="text-muted">
                                      Profesor: {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Sin asignar'}
                                      {' • '}
                                      {classroom.studentIds?.length || 0} estudiantes
                                    </small>
                                  </div>
                                  <Badge color={classroom.isActive ? 'success' : 'secondary'}>
                                    {classroom.isActive ? 'Activa' : 'Inactiva'}
                                  </Badge>
                                </div>
                              </ListGroupItem>
                            );
                          })}
                        </ListGroup>
                      )}
                    </Col>
                    
                    <Col md={4}>
                      <Card className="bg-light">
                        <CardBody>
                          <h6>Información del Programa</h6>
                          <hr />
                          <p className="mb-2">
                            <strong>Estudiantes:</strong> {program.minStudents} - {program.maxStudents}
                          </p>
                          <p className="mb-2">
                            <strong>Créditos:</strong> {program.totalCredits || 0}
                          </p>
                          {program.materials && (
                            <>
                              <p className="mb-2">
                                <strong>Costo Material:</strong> RD${program.materials.cost || 0}
                              </p>
                              {program.materials.books && program.materials.books.length > 0 && (
                                <div>
                                  <strong>Libros:</strong>
                                  <ul className="mb-0">
                                    {program.materials.books.map((book, index) => (
                                      <li key={index}>{book}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </CardBody>
              )}
            </Card>
          );
        })
      )}

      {/* Program Modal */}
      <Modal isOpen={programModal} toggle={() => setProgramModal(false)} size="lg">
        <ModalHeader toggle={() => setProgramModal(false)}>
          {editingProgram ? 'Editar Programa' : 'Nuevo Programa'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="name">Nombre del Programa *</Label>
                  <Input
                    type="text"
                    id="name"
                    value={programForm.name}
                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="code">Código *</Label>
                  <Input
                    type="text"
                    id="code"
                    value={programForm.code}
                    onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })}
                    placeholder="Ej: TEOL-101"
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="description">Descripción *</Label>
                  <Input
                    type="textarea"
                    id="description"
                    rows={3}
                    value={programForm.description}
                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="category">Categoría</Label>
                  <Input
                    type="select"
                    id="category"
                    value={programForm.category}
                    onChange={(e) => setProgramForm({ ...programForm, category: e.target.value as any })}
                  >
                    <option value="theology">Teología</option>
                    <option value="leadership">Liderazgo</option>
                    <option value="discipleship">Discipulado</option>
                    <option value="general">General</option>
                    <option value="other">Otro</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="level">Nivel</Label>
                  <Input
                    type="select"
                    id="level"
                    value={programForm.level}
                    onChange={(e) => setProgramForm({ ...programForm, level: e.target.value as any })}
                  >
                    <option value="basic">Básico</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="duration">Duración</Label>
                  <Input
                    type="text"
                    id="duration"
                    value={programForm.duration}
                    onChange={(e) => setProgramForm({ ...programForm, duration: e.target.value })}
                    placeholder="Ej: 6 meses"
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="minStudents">Mínimo Estudiantes</Label>
                  <Input
                    type="number"
                    id="minStudents"
                    value={programForm.minStudents}
                    onChange={(e) => setProgramForm({ ...programForm, minStudents: parseInt(e.target.value) })}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="maxStudents">Máximo Estudiantes</Label>
                  <Input
                    type="number"
                    id="maxStudents"
                    value={programForm.maxStudents}
                    onChange={(e) => setProgramForm({ ...programForm, maxStudents: parseInt(e.target.value) })}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="totalCredits">Créditos</Label>
                  <Input
                    type="number"
                    id="totalCredits"
                    value={programForm.totalCredits}
                    onChange={(e) => setProgramForm({ ...programForm, totalCredits: parseInt(e.target.value) })}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup check>
                  <Input
                    type="checkbox"
                    id="isActive"
                    checked={programForm.isActive}
                    onChange={(e) => setProgramForm({ ...programForm, isActive: e.target.checked })}
                  />
                  <Label check for="isActive">
                    Programa Activo
                  </Label>
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setProgramModal(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSaveProgram}>
            {editingProgram ? 'Actualizar' : 'Crear'} Programa
          </Button>
        </ModalFooter>
      </Modal>

      {/* Classroom Creation Modal */}
      <Modal isOpen={classroomModal} toggle={() => setClassroomModal(false)} size="lg">
        <ModalHeader toggle={() => setClassroomModal(false)}>
          Nueva Clase para {selectedProgram?.name}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="className">Nombre de la Clase *</Label>
                  <Input
                    type="text"
                    id="className"
                    value={classroomForm.name}
                    onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
                    placeholder="Ej: Grupo A"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="subject">Materia *</Label>
                  <Input
                    type="text"
                    id="subject"
                    value={classroomForm.subject}
                    onChange={(e) => setClassroomForm({ ...classroomForm, subject: e.target.value })}
                    placeholder="Ej: Introducción a la Teología"
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="classDescription">Descripción</Label>
                  <Input
                    type="textarea"
                    id="classDescription"
                    rows={2}
                    value={classroomForm.description}
                    onChange={(e) => setClassroomForm({ ...classroomForm, description: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="teacher">Profesor *</Label>
                  <Input
                    type="select"
                    id="teacher"
                    value={classroomForm.teacherId}
                    onChange={(e) => setClassroomForm({ ...classroomForm, teacherId: e.target.value })}
                  >
                    <option value="">Seleccione un profesor</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="materialPrice">Precio del Material</Label>
                  <Input
                    type="number"
                    id="materialPrice"
                    value={classroomForm.materialPrice}
                    onChange={(e) => setClassroomForm({ ...classroomForm, materialPrice: parseInt(e.target.value) })}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="dayOfWeek">Día de la Semana</Label>
                  <Input
                    type="select"
                    id="dayOfWeek"
                    value={classroomForm.schedule.dayOfWeek}
                    onChange={(e) => setClassroomForm({ 
                      ...classroomForm, 
                      schedule: { ...classroomForm.schedule, dayOfWeek: e.target.value }
                    })}
                  >
                    <option value="Monday">Lunes</option>
                    <option value="Tuesday">Martes</option>
                    <option value="Wednesday">Miércoles</option>
                    <option value="Thursday">Jueves</option>
                    <option value="Friday">Viernes</option>
                    <option value="Saturday">Sábado</option>
                    <option value="Sunday">Domingo</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="time">Hora</Label>
                  <Input
                    type="time"
                    id="time"
                    value={classroomForm.schedule.time}
                    onChange={(e) => setClassroomForm({ 
                      ...classroomForm, 
                      schedule: { ...classroomForm.schedule, time: e.target.value }
                    })}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="duration">Duración (minutos)</Label>
                  <Input
                    type="number"
                    id="duration"
                    value={classroomForm.schedule.duration}
                    onChange={(e) => setClassroomForm({ 
                      ...classroomForm, 
                      schedule: { ...classroomForm.schedule, duration: parseInt(e.target.value) }
                    })}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <h6>Criterios de Evaluación (Total: 100 puntos)</h6>
                <Row>
                  <Col md={3}>
                    <FormGroup>
                      <Label for="questionnaires">Cuestionarios</Label>
                      <Input
                        type="number"
                        id="questionnaires"
                        value={classroomForm.evaluationCriteria.questionnaires}
                        onChange={(e) => setClassroomForm({ 
                          ...classroomForm, 
                          evaluationCriteria: { 
                            ...classroomForm.evaluationCriteria, 
                            questionnaires: parseInt(e.target.value) 
                          }
                        })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <FormGroup>
                      <Label for="attendance">Asistencia</Label>
                      <Input
                        type="number"
                        id="attendance"
                        value={classroomForm.evaluationCriteria.attendance}
                        onChange={(e) => setClassroomForm({ 
                          ...classroomForm, 
                          evaluationCriteria: { 
                            ...classroomForm.evaluationCriteria, 
                            attendance: parseInt(e.target.value) 
                          }
                        })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <FormGroup>
                      <Label for="participation">Participación</Label>
                      <Input
                        type="number"
                        id="participation"
                        value={classroomForm.evaluationCriteria.participation}
                        onChange={(e) => setClassroomForm({ 
                          ...classroomForm, 
                          evaluationCriteria: { 
                            ...classroomForm.evaluationCriteria, 
                            participation: parseInt(e.target.value) 
                          }
                        })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <FormGroup>
                      <Label for="finalExam">Examen Final</Label>
                      <Input
                        type="number"
                        id="finalExam"
                        value={classroomForm.evaluationCriteria.finalExam}
                        onChange={(e) => setClassroomForm({ 
                          ...classroomForm, 
                          evaluationCriteria: { 
                            ...classroomForm.evaluationCriteria, 
                            finalExam: parseInt(e.target.value) 
                          }
                        })}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Alert color={
                  (classroomForm.evaluationCriteria.questionnaires +
                   classroomForm.evaluationCriteria.attendance +
                   classroomForm.evaluationCriteria.participation +
                   classroomForm.evaluationCriteria.finalExam) === 100 ? 'success' : 'warning'
                }>
                  Total: {
                    classroomForm.evaluationCriteria.questionnaires +
                    classroomForm.evaluationCriteria.attendance +
                    classroomForm.evaluationCriteria.participation +
                    classroomForm.evaluationCriteria.finalExam
                  } / 100 puntos
                </Alert>
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setClassroomModal(false)}>
            Cancelar
          </Button>
          <Button 
            color="primary" 
            onClick={handleCreateClassroom}
            disabled={
              (classroomForm.evaluationCriteria.questionnaires +
               classroomForm.evaluationCriteria.attendance +
               classroomForm.evaluationCriteria.participation +
               classroomForm.evaluationCriteria.finalExam) !== 100
            }
          >
            Crear Clase
          </Button>
        </ModalFooter>
      </Modal>

      {/* Statistics Modal */}
      <Modal isOpen={statsModal} toggle={() => setStatsModal(false)}>
        <ModalHeader toggle={() => setStatsModal(false)}>
          Estadísticas - {selectedProgramStats?.program.name}
        </ModalHeader>
        <ModalBody>
          {selectedProgramStats && (
            <>
              <Row className="text-center mb-3">
                <Col xs={6}>
                  <h4>{selectedProgramStats.stats.totalClassrooms}</h4>
                  <small className="text-muted">Clases Totales</small>
                </Col>
                <Col xs={6}>
                  <h4 className="text-success">{selectedProgramStats.stats.activeClassrooms}</h4>
                  <small className="text-muted">Clases Activas</small>
                </Col>
              </Row>
              <Row className="text-center mb-3">
                <Col xs={6}>
                  <h4 className="text-primary">{selectedProgramStats.stats.totalStudents}</h4>
                  <small className="text-muted">Estudiantes</small>
                </Col>
                <Col xs={6}>
                  <h4 className="text-info">{selectedProgramStats.stats.totalTeachers}</h4>
                  <small className="text-muted">Profesores</small>
                </Col>
              </Row>
              {selectedProgramStats.stats.averageGrade > 0 && (
                <div className="text-center">
                  <h4>Promedio General</h4>
                  <Progress 
                    value={selectedProgramStats.stats.averageGrade} 
                    color={
                      selectedProgramStats.stats.averageGrade >= 90 ? 'success' :
                      selectedProgramStats.stats.averageGrade >= 70 ? 'warning' : 'danger'
                    }
                  >
                    {selectedProgramStats.stats.averageGrade.toFixed(1)}%
                  </Progress>
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setStatsModal(false)}>
            Cerrar
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
            ¿Está seguro que desea eliminar el programa <strong>{programToDelete?.name}</strong>?
            Esta acción no se puede deshacer.
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModal(false)}>
            Cancelar
          </Button>
          <Button color="danger" onClick={handleDeleteProgram}>
            Eliminar Programa
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default ProgramManagement;