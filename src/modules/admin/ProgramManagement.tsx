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
import { IProgram, IClassroom, IUser, ICustomCriterion, IClassroomRun } from '../../models';
import ClassroomForm, { ClassroomFormData } from './components/ClassroomForm';
import ClassroomRestartModal from './components/ClassroomRestartModal';

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
  const [editingClassroom, setEditingClassroom] = useState<IClassroom | null>(null);
  const [statsModal, setStatsModal] = useState(false);
  const [selectedProgramStats, setSelectedProgramStats] = useState<any>(null);
  const [restartModal, setRestartModal] = useState(false);
  const [classroomToRestart, setClassroomToRestart] = useState<IClassroom | null>(null);
  const [classroomRunsModal, setClassroomRunsModal] = useState(false);
  const [selectedClassroomForRuns, setSelectedClassroomForRuns] = useState<IClassroom | null>(null);
  const [classroomRuns, setClassroomRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [runDetailsModal, setRunDetailsModal] = useState(false);
  
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
        materials: {
          books: program.materials?.books || [],
          resources: program.materials?.resources || [],
          cost: program.materials?.cost || 0
        }
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
        await ProgramService.createProgram({
          ...programForm,
          classrooms: []
        });
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

  const handleOpenClassroomModal = (program: IProgram, classroom?: IClassroom) => {
    setSelectedProgram(program);
    setEditingClassroom(classroom || null);
    setClassroomModal(true);
  };

  const handleSaveClassroom = async (formData: ClassroomFormData) => {
    if (!selectedProgram) {
      throw new Error('No se ha seleccionado un programa');
    }
    
    try {
      if (editingClassroom) {
        // Update existing classroom
        await ClassroomService.updateClassroom(editingClassroom.id, {
          ...formData,
          programId: selectedProgram.id
        });
        
        // Update teacher assignment if changed
        if (formData.teacherId !== editingClassroom.teacherId) {
          // Remove old teacher
          await UserService.removeTeacherFromClassroom(editingClassroom.teacherId, editingClassroom.id);
          // Assign new teacher
          await UserService.assignTeacherToClassroom(formData.teacherId, editingClassroom.id);
        }
        
        toast.success('Clase actualizada exitosamente');
      } else {
        // Create new classroom
        const classroomId = await ClassroomService.createClassroom({
          ...formData,
          programId: selectedProgram.id,
          studentIds: [],
          startDate: new Date(),
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
        await UserService.assignTeacherToClassroom(formData.teacherId, classroomId);
        
        toast.success('Clase creada exitosamente');
      }
      
      setClassroomModal(false);
      setEditingClassroom(null);
      await loadData();
    } catch (error: any) {
      console.error('Error saving classroom:', error);
      throw error; // Re-throw to be handled by the form
    }
  };

  const handleCloseClassroomModal = () => {
    setClassroomModal(false);
    setEditingClassroom(null);
    setSelectedProgram(null);
  };

  const handleToggleClassroomStatus = async (classroomId: string, currentStatus: boolean) => {
    try {
      await ClassroomService.updateClassroom(classroomId, {
        isActive: !currentStatus
      });
      toast.success(`Clase ${currentStatus ? 'desactivada' : 'activada'} exitosamente`);
      await loadData();
    } catch (error) {
      console.error('Error toggling classroom status:', error);
      toast.error('Error al cambiar el estado de la clase');
    }
  };

  const handleOpenRestartModal = (classroom: IClassroom) => {
    setClassroomToRestart(classroom);
    setRestartModal(true);
  };

  const handleRestartSuccess = () => {
    setRestartModal(false);
    setClassroomToRestart(null);
    loadData();
  };

  const handleViewClassroomRuns = async (classroom: IClassroom) => {
    try {
      const runs = await ClassroomService.getClassroomRuns(classroom.id);
      setClassroomRuns(runs);
      setSelectedClassroomForRuns(classroom);
      setClassroomRunsModal(true);
    } catch (error) {
      console.error('Error loading classroom runs:', error);
      toast.error('Error al cargar el historial');
    }
  };

  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return 'success';
    if (grade >= 80) return 'info';
    if (grade >= 70) return 'warning';
    return 'danger';
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
                            const completedModules = classroom.modules?.filter(m => m.isCompleted).length || 0;
                            const totalModules = classroom.modules?.length || 0;
                            
                            return (
                              <ListGroupItem key={classroom.id}>
                                <div className="d-flex justify-content-between align-items-center">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                      <strong>{classroom.subject}</strong> - {classroom.name}
                                      {classroom.room && (
                                        <Badge color="secondary" className="small">
                                          <i className="bi bi-door-open me-1"></i>
                                          {classroom.room}
                                        </Badge>
                                      )}
                                    </div>
                                    <small className="text-muted d-block mb-1">
                                      <i className="bi bi-person-badge me-1"></i>
                                      Profesor: {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Sin asignar'}
                                      {' • '}
                                      <i className="bi bi-people ms-2 me-1"></i>
                                      {classroom.studentIds?.length || 0} estudiantes
                                      {' • '}
                                      <i className="bi bi-list-check ms-2 me-1"></i>
                                      {completedModules}/{totalModules} módulos
                                    </small>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    {/* Finalized Badge */}
                                    {!classroom.isActive && classroom.endDate && (
                                      <Badge color="warning" className="me-1">
                                        <i className="bi bi-flag-fill me-1"></i>
                                        Finalizada
                                      </Badge>
                                    )}
                                    
                                    {/* View History Button - Show for all classes */}
                                    <Button
                                      color="info"
                                      size="sm"
                                      outline
                                      onClick={() => handleViewClassroomRuns(classroom)}
                                      title="Ver historial de ejecuciones"
                                    >
                                      <i className="bi bi-archive"></i>
                                    </Button>
                                    
                                    {/* Restart Button - Only show for finalized classes */}
                                    {!classroom.isActive && classroom.endDate && (
                                      <Button
                                        color="success"
                                        size="sm"
                                        outline
                                        onClick={() => handleOpenRestartModal(classroom)}
                                        title="Reiniciar clase para nuevo grupo"
                                      >
                                        <i className="bi bi-arrow-clockwise"></i>
                                      </Button>
                                    )}
                                    
                                    {/* Status Switch */}
                                    <div className="form-check form-switch">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        id={`switch-${classroom.id}`}
                                        checked={classroom.isActive}
                                        onChange={() => handleToggleClassroomStatus(classroom.id, classroom.isActive)}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      <label 
                                        className="form-check-label text-muted small" 
                                        htmlFor={`switch-${classroom.id}`}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        {classroom.isActive ? 'Activa' : 'Inactiva'}
                                      </label>
                                    </div>
                                    
                                    {/* Edit Button */}
                                    <Button
                                      color="primary"
                                      size="sm"
                                      outline
                                      onClick={() => handleOpenClassroomModal(program, classroom)}
                                      title="Editar clase"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </Button>
                                  </div>
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

      {/* Classroom Form Component */}
      <ClassroomForm
        isOpen={classroomModal}
        onClose={handleCloseClassroomModal}
        onSave={handleSaveClassroom}
        classroom={editingClassroom}
        program={selectedProgram}
        teachers={teachers}
      />

      {/* Classroom Restart Modal */}
      <ClassroomRestartModal
        isOpen={restartModal}
        onClose={() => setRestartModal(false)}
        classroom={classroomToRestart}
        onSuccess={handleRestartSuccess}
      />

      {/* Classroom Runs History Modal */}
      <Modal isOpen={classroomRunsModal} toggle={() => setClassroomRunsModal(false)} size="xl">
        <ModalHeader toggle={() => setClassroomRunsModal(false)}>
          <i className="bi bi-archive me-2"></i>
          Historial de Ejecuciones - {selectedClassroomForRuns?.subject}
        </ModalHeader>
        <ModalBody>
          {selectedClassroomForRuns && (
            <>
              <Alert color="info" className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{selectedClassroomForRuns.name}</strong>
                    <br />
                    <small>
                      Cada ejecución representa un grupo de estudiantes que completó esta clase
                    </small>
                  </div>
                  <Badge color="primary">
                    {classroomRuns.length} Ejecuciones Totales
                  </Badge>
                </div>
              </Alert>

              {classroomRuns.length === 0 ? (
                <Alert color="warning">
                  <i className="bi bi-info-circle me-2"></i>
                  Esta clase aún no tiene ejecuciones finalizadas
                </Alert>
              ) : (
                <>
                  {/* Summary Statistics */}
                  <Row className="mb-3">
                    <Col md={3}>
                      <Card className="text-center bg-light">
                        <CardBody>
                          <h4 className="mb-0">{classroomRuns.length}</h4>
                          <small className="text-muted">Ejecuciones</small>
                        </CardBody>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center bg-light">
                        <CardBody>
                          <h4 className="mb-0">
                            {classroomRuns.reduce((sum, r) => sum + r.totalStudents, 0)}
                          </h4>
                          <small className="text-muted">Total Estudiantes</small>
                        </CardBody>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center bg-light">
                        <CardBody>
                          <h4 className="mb-0">
                            {(classroomRuns.reduce((sum, r) => sum + r.statistics.averageGrade, 0) / classroomRuns.length).toFixed(1)}%
                          </h4>
                          <small className="text-muted">Promedio Histórico</small>
                        </CardBody>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center bg-light">
                        <CardBody>
                          <h4 className="mb-0">
                            {(classroomRuns.reduce((sum, r) => sum + r.statistics.passRate, 0) / classroomRuns.length).toFixed(0)}%
                          </h4>
                          <small className="text-muted">Tasa Aprobación</small>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>

                  {/* Runs Table */}
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Ejecución</th>
                        <th className="text-center">Estudiantes</th>
                        <th className="text-center">Promedio</th>
                        <th className="text-center">Aprobados</th>
                        <th className="text-center">Asistencia</th>
                        <th className="text-center">Módulos</th>
                        <th>Período</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classroomRuns.map((run: IClassroomRun) => {
                        const passedStudents = 
                          run.statistics.distribution.excellent +
                          run.statistics.distribution.good +
                          run.statistics.distribution.regular;
                        
                        return (
                          <tr key={run.id}>
                            <td>
                              <Badge color="secondary">#{run.runNumber}</Badge>
                            </td>
                            <td className="text-center">
                              <Badge color="primary">{run.totalStudents}</Badge>
                            </td>
                            <td className="text-center">
                              <Badge color={getGradeColor(run.statistics.averageGrade)}>
                                {run.statistics.averageGrade.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge color="success">
                                {passedStudents}/{run.totalStudents}
                              </Badge>
                              <br />
                              <small className="text-muted">
                                {run.statistics.passRate.toFixed(0)}%
                              </small>
                            </td>
                            <td className="text-center">
                              <Badge color={run.statistics.attendanceRate >= 80 ? 'success' : 'warning'}>
                                {run.statistics.attendanceRate.toFixed(0)}%
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge color={run.completedModules === run.totalModules ? 'success' : 'warning'}>
                                {run.completedModules}/{run.totalModules}
                              </Badge>
                            </td>
                            <td>
                              <small>
                                {new Date(run.startDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                {' - '}
                                {new Date(run.endDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </small>
                            </td>
                            <td className="text-center">
                              <Button
                                color="primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedRun(run);
                                  setRunDetailsModal(true);
                                }}
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setClassroomRunsModal(false)}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Run Details Modal */}
      <Modal isOpen={runDetailsModal} toggle={() => setRunDetailsModal(false)} size="xl">
        <ModalHeader toggle={() => setRunDetailsModal(false)}>
          <i className="bi bi-file-earmark-text me-2"></i>
          Detalles Completos - Ejecución {selectedRun && `#${selectedRun.runNumber}`}
        </ModalHeader>
        <ModalBody>
          {selectedRun && (
            <>
              {/* Header Info */}
              <Row className="mb-4">
                <Col md={8}>
                  <h4>{selectedRun.classroomSubject}</h4>
                  <p className="text-muted mb-2">{selectedRun.classroomName} - {selectedRun.programName}</p>
                  <div className="d-flex gap-2 flex-wrap">
                    <Badge color="secondary">Ejecución #{selectedRun.runNumber}</Badge>
                    <Badge color="info">
                      <i className="bi bi-people me-1"></i>
                      {selectedRun.totalStudents} Estudiantes
                    </Badge>
                    <Badge color="secondary">
                      <i className="bi bi-person-badge me-1"></i>
                      {selectedRun.teacherName}
                    </Badge>
                    {selectedRun.room && (
                      <Badge color="secondary">
                        <i className="bi bi-door-open me-1"></i>
                        {selectedRun.room}
                      </Badge>
                    )}
                    {selectedRun.schedule && (
                      <Badge color="secondary">
                        <i className="bi bi-clock me-1"></i>
                        {selectedRun.schedule.dayOfWeek} {selectedRun.schedule.time}
                      </Badge>
                    )}
                  </div>
                </Col>
                <Col md={4} className="text-md-end">
                  <small className="text-muted d-block">Período</small>
                  <strong>
                    {new Date(selectedRun.startDate).toLocaleDateString('es-ES')}
                  </strong>
                  {' - '}
                  <strong>
                    {new Date(selectedRun.endDate).toLocaleDateString('es-ES')}
                  </strong>
                </Col>
              </Row>

              {/* Statistics Cards */}
              <Row className="mb-4">
                <Col md={2}>
                  <Card className="text-center">
                    <CardBody>
                      <h4>
                        <Badge color={getGradeColor(selectedRun.statistics.averageGrade)}>
                          {selectedRun.statistics.averageGrade.toFixed(1)}%
                        </Badge>
                      </h4>
                      <small className="text-muted">Promedio</small>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="text-center">
                    <CardBody>
                      <h4 className="text-success">{selectedRun.statistics.passRate.toFixed(0)}%</h4>
                      <small className="text-muted">Aprobación</small>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="text-center">
                    <CardBody>
                      <h4 className="text-info">{selectedRun.statistics.attendanceRate.toFixed(0)}%</h4>
                      <small className="text-muted">Asistencia</small>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="text-center">
                    <CardBody>
                      <h4 className="text-success">{selectedRun.statistics.highestGrade.toFixed(1)}%</h4>
                      <small className="text-muted">Más Alta</small>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="text-center">
                    <CardBody>
                      <h4 className="text-danger">{selectedRun.statistics.lowestGrade.toFixed(1)}%</h4>
                      <small className="text-muted">Más Baja</small>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="text-center">
                    <CardBody>
                      <h4>{selectedRun.completedModules}/{selectedRun.totalModules}</h4>
                      <small className="text-muted">Módulos</small>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Distribution */}
              <Card className="mb-3">
                <CardHeader>
                  <h6 className="mb-0">Distribución de Calificaciones</h6>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col md={3}>
                      <div className="text-center">
                        <h5><Badge color="success">{selectedRun.statistics.distribution.excellent}</Badge></h5>
                        <Progress value={(selectedRun.statistics.distribution.excellent / selectedRun.totalStudents) * 100} color="success" />
                        <small>Excelente (90-100)</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center">
                        <h5><Badge color="info">{selectedRun.statistics.distribution.good}</Badge></h5>
                        <Progress value={(selectedRun.statistics.distribution.good / selectedRun.totalStudents) * 100} color="info" />
                        <small>Bueno (80-89)</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center">
                        <h5><Badge color="warning">{selectedRun.statistics.distribution.regular}</Badge></h5>
                        <Progress value={(selectedRun.statistics.distribution.regular / selectedRun.totalStudents) * 100} color="warning" />
                        <small>Regular (70-79)</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center">
                        <h5><Badge color="danger">{selectedRun.statistics.distribution.poor}</Badge></h5>
                        <Progress value={(selectedRun.statistics.distribution.poor / selectedRun.totalStudents) * 100} color="danger" />
                        <small>Deficiente (&lt;70)</small>
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>

              {/* Student List */}
              <Card>
                <CardHeader>
                  <h6 className="mb-0">Lista de Estudiantes ({selectedRun.totalStudents})</h6>
                </CardHeader>
                <CardBody>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table responsive hover size="sm">
                      <thead className="sticky-top bg-white">
                        <tr>
                          <th>#</th>
                          <th>Nombre</th>
                          <th>Teléfono</th>
                          <th className="text-center">Calificación</th>
                          <th className="text-center">Asistencia</th>
                          <th className="text-center">Participación</th>
                          <th className="text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRun.students
                          .sort((a: any, b: any) => (b.finalGrade || 0) - (a.finalGrade || 0))
                          .map((student: any, index: number) => (
                            <tr key={student.studentId}>
                              <td>{index + 1}</td>
                              <td>
                                <strong>{student.studentName}</strong>
                                {student.studentEmail && (
                                  <>
                                    <br />
                                    <small className="text-muted">{student.studentEmail}</small>
                                  </>
                                )}
                              </td>
                              <td>{student.studentPhone}</td>
                              <td className="text-center">
                                {student.finalGrade !== undefined ? (
                                  <Badge color={getGradeColor(student.finalGrade)}>
                                    {student.finalGrade.toFixed(1)}%
                                  </Badge>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )}
                              </td>
                              <td className="text-center">
                                <Badge color={student.attendanceRate >= 80 ? 'success' : 'warning'}>
                                  {student.attendanceRate.toFixed(0)}%
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge color="info">
                                  {student.participationPoints} pts
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge color={student.status === 'completed' ? 'success' : 'danger'}>
                                  {student.status === 'completed' ? 'Aprobado' : 'Reprobado'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>

              {/* Notes */}
              {selectedRun.notes && (
                <Alert color="info" className="mt-3">
                  <i className="bi bi-sticky me-2"></i>
                  <strong>Notas:</strong> {selectedRun.notes}
                </Alert>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setRunDetailsModal(false)}>
            Cerrar
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