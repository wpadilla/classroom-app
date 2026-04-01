// Complete Program Management Module for Admins

import React, { useState, useEffect } from 'react';
import { deleteField } from 'firebase/firestore';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
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
  Alert,
  Spinner,
  Progress,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import { toast } from 'react-toastify';
import { ProgramService } from '../../services/program/program.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { IProgram, IClassroom, IUser, IClassroomRun } from '../../models';
import ClassroomForm, { ClassroomFormData } from './components/ClassroomForm';
import ClassroomRestartModal from './components/ClassroomRestartModal';
import { ProgramPensumPdfDownloadButton } from '../../components/pdf/components/ProgramPensumPdfDownloadButton';
import ClassroomRunsHistoryModal from '../../components/classroom-runs/ClassroomRunsHistoryModal';
import ClassroomRunDetailsModal from '../../components/classroom-runs/ClassroomRunDetailsModal';
import { formatDateForInput } from '../../utils/moduleUtils';
import { formatProgramEnrollmentRange, isProgramEnrollmentActive } from '../../utils/programPeriods';
import './ProgramManagement.css';

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
  const [classroomRuns, setClassroomRuns] = useState<IClassroomRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<IClassroomRun | null>(null);
  const [runDetailsModal, setRunDetailsModal] = useState(false);
  const [duplicationSourceClassroom, setDuplicationSourceClassroom] = useState<IClassroom | null>(null);

  // Form state for program
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    code: '',
    startDate: '',
    endDate: '',
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
        startDate: formatDateForInput(program.startDate),
        endDate: formatDateForInput(program.endDate),
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
        startDate: '',
        endDate: '',
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

    if ((programForm.startDate && !programForm.endDate) || (!programForm.startDate && programForm.endDate)) {
      toast.error('Debes completar ambas fechas del período de inscripción');
      return;
    }

    if (programForm.startDate && programForm.endDate) {
      const startDate = new Date(`${programForm.startDate}T00:00:00`);
      const endDate = new Date(`${programForm.endDate}T23:59:59`);

      if (startDate > endDate) {
        toast.error('La fecha final de inscripción no puede ser menor que la inicial');
        return;
      }
    }

    try {
      if (editingProgram) {
        const updatePayload = {
          ...programForm,
          startDate: programForm.startDate
            ? new Date(`${programForm.startDate}T00:00:00`)
            : deleteField(),
          endDate: programForm.endDate
            ? new Date(`${programForm.endDate}T23:59:59`)
            : deleteField(),
        };

        // Update existing program
        await ProgramService.updateProgram(editingProgram.id, updatePayload as any);
        toast.success('Programa actualizado exitosamente');
      } else {
        const createPayload = {
          ...programForm,
          startDate: programForm.startDate
            ? new Date(`${programForm.startDate}T00:00:00`)
            : undefined,
          endDate: programForm.endDate
            ? new Date(`${programForm.endDate}T23:59:59`)
            : undefined,
        };

        // Create new program
        await ProgramService.createProgram({
          ...createPayload,
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
    setDuplicationSourceClassroom(null);
    setClassroomModal(true);
  };

  const handleDuplicateClassroom = (program: IProgram, classroom: IClassroom) => {
    setSelectedProgram(program);
    setEditingClassroom(null);
    setDuplicationSourceClassroom(classroom);
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
        await ClassroomService.setClassroomProgramPosition(
          selectedProgram.id,
          editingClassroom.id,
          formData.programPosition
        );

        // Update teacher assignment if changed
        if (formData.teacherId !== editingClassroom.teacherId) {
          // Remove old teacher
          await UserService.removeTeacherFromClassroom(editingClassroom.teacherId, editingClassroom.id);
          // Assign new teacher
          await UserService.assignTeacherToClassroom(formData.teacherId, editingClassroom.id);
        }

        toast.success('Clase actualizada exitosamente');
      } else {
        // Create new classroom - modules come from formData
        const classroomId = await ClassroomService.createClassroom({
          ...formData,
          programId: selectedProgram.id,
          studentIds: [],
          startDate: new Date(),
          modules: formData.modules
        });

        await ClassroomService.setClassroomProgramPosition(
          selectedProgram.id,
          classroomId,
          formData.programPosition
        );

        // Add classroom to program
        await ProgramService.addClassroomToProgram(selectedProgram.id, classroomId);

        // Assign teacher to classroom
        await UserService.assignTeacherToClassroom(formData.teacherId, classroomId);

        toast.success('Clase creada exitosamente');
      }

      setClassroomModal(false);
      setEditingClassroom(null);
      setDuplicationSourceClassroom(null);
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
    setDuplicationSourceClassroom(null);
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

  const handleMoveClassroomPosition = async (
    programId: string,
    classroomId: string,
    direction: 'up' | 'down'
  ) => {
    try {
      await ClassroomService.moveClassroomProgramPosition(programId, classroomId, direction);
      toast.success(
        `Clase movida ${direction === 'up' ? 'hacia arriba' : 'hacia abajo'} exitosamente`
      );
      await loadData();
    } catch (error) {
      console.error('Error moving classroom position:', error);
      toast.error('No se pudo actualizar el orden de la clase');
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
    return ClassroomService.sortClassroomsByProgramPosition(
      classrooms.filter(c => c.programId === programId)
    );
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

  const getProgramLevelLabel = (level?: string) => {
    if (level === 'intermediate') return 'Intermedio';
    if (level === 'advanced') return 'Avanzado';
    return 'Básico';
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
    <Container className="program-management-page py-3">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="program-management-hero">
            <div>
              <p className="program-management-hero__eyebrow">Administración académica</p>
              <h2 className="program-management-hero__title">Gestión de Programas</h2>
              <p className="program-management-hero__text">
                Organiza el pensum, ordena las clases y define campañas de inscripción por programa.
              </p>
            </div>
            <Button color="primary" onClick={() => handleOpenProgramModal()} className="program-management-hero__button">
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Programa
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistics */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="program-management-stat">
            <CardBody className="program-management-stat__body">
              <div className="program-management-stat__icon bg-slate-100 text-slate-700">
                <i className="bi bi-grid-1x2"></i>
              </div>
              <div>
                <h3 className="mb-0">{programs.length}</h3>
                <small className="text-muted">Total Programas</small>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="program-management-stat">
            <CardBody className="program-management-stat__body">
              <div className="program-management-stat__icon bg-emerald-50 text-emerald-600">
                <i className="bi bi-check2-circle"></i>
              </div>
              <div>
                <h3 className="mb-0 text-success">
                {programs.filter(p => p.isActive).length}
                </h3>
                <small className="text-muted">Activos</small>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="program-management-stat">
            <CardBody className="program-management-stat__body">
              <div className="program-management-stat__icon bg-sky-50 text-sky-600">
                <i className="bi bi-collection"></i>
              </div>
              <div>
                <h3 className="mb-0 text-info">{classrooms.length}</h3>
                <small className="text-muted">Total Clases</small>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="program-management-stat">
            <CardBody className="program-management-stat__body">
              <div className="program-management-stat__icon bg-amber-50 text-amber-600">
                <i className="bi bi-lightning-charge"></i>
              </div>
              <div>
                <h3 className="mb-0 text-warning">
                {classrooms.filter(c => c.isActive).length}
                </h3>
                <small className="text-muted">Clases Activas</small>
              </div>
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
            <Card key={program.id} className="program-management-card mb-3">
              <CardHeader className="program-management-card__header">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                  <button
                    type="button"
                    className="program-management-card__trigger"
                    onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`program-panel-${program.id}`}
                  >
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <span className="program-management-chevron">
                        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                      </span>
                      <h5 className="mb-0 program-management-card__title">
                        {program.name}
                      </h5>
                      <Badge color={getCategoryColor(program.category || 'general')}>
                        {program.category || 'General'}
                      </Badge>
                      <Badge color={getLevelBadge(program.level || 'basic')}>
                        {getProgramLevelLabel(program.level)}
                      </Badge>
                      {isProgramEnrollmentActive(program) && (
                        <Badge color="success">
                          <i className="bi bi-calendar-check me-1"></i>
                          Inscripción abierta
                        </Badge>
                      )}
                      {!program.isActive && (
                        <Badge color="danger">Inactivo</Badge>
                      )}
                    </div>
                    <h5 className="mb-1 d-none">
                      <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} me-2`}></i>
                      {program.name}
                    </h5>
                    <div className="program-management-card__meta">
                      <span>Código: {program.code}</span>
                      <span>{programClassrooms.length} clases</span>
                      {program.duration && <span>Duración: {program.duration}</span>}
                      <span>Inscripción: {formatProgramEnrollmentRange(program)}</span>
                    </div>
                  </button>

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
                      <DropdownItem>
                        <ProgramPensumPdfDownloadButton program={program}>
                          <span><i className="bi bi-file-earmark-pdf me-2"></i>Descargar Pensum</span>
                        </ProgramPensumPdfDownloadButton>
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
                <CardBody className="program-management-card__body" id={`program-panel-${program.id}`}>
                  <Row className="g-3">
                    <Col xl={8}>
                      <div className="program-management-section">
                        <p className="program-management-description">{program.description}</p>

                        {program.requirements && program.requirements.length > 0 && (
                          <div className="mb-3">
                            <h6 className="program-management-section__title">Requisitos</h6>
                            <ul className="program-management-bullets">
                            {program.requirements.map((req) => (
                              <li key={req}>{req}</li>
                            ))}
                            </ul>
                          </div>
                        )}

                        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                          <h6 className="program-management-section__title mb-0">Clases del programa</h6>
                          <Button color="primary" size="sm" outline onClick={() => handleOpenClassroomModal(program)}>
                            <i className="bi bi-plus-circle me-1"></i>
                            Agregar clase
                          </Button>
                        </div>

                        {programClassrooms.length === 0 ? (
                          <Alert color="warning" className="mb-0">
                            No hay clases asignadas a este programa.
                          </Alert>
                        ) : (
                          <div className="program-management-classroom-list">
                            {programClassrooms.map((classroom, index) => {
                              const teacher = teachers.find(t => t.id === classroom.teacherId);
                              const completedModules = classroom.modules?.filter(m => m.isCompleted).length || 0;
                              const totalModules = classroom.modules?.length || 0;
                              const isFirst = index === 0;
                              const isLast = index === programClassrooms.length - 1;

                              return (
                                <div key={classroom.id} className="program-management-classroom-card">
                                  <div className="program-management-classroom-card__main">
                                    <div className="program-management-classroom-card__header">
                                      <div className="d-flex flex-wrap align-items-center gap-2">
                                        <span className="program-management-classroom-card__order">
                                          {classroom.programPosition || index + 1}
                                        </span>
                                        <div className="min-w-0">
                                          <h6 className="program-management-classroom-card__title">
                                            {classroom.subject}
                                          </h6>
                                          <p className="program-management-classroom-card__subtitle">
                                            {classroom.name}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="d-flex flex-wrap gap-2">
                                        <Badge color={classroom.isActive ? 'success' : 'secondary'}>
                                          {classroom.isActive ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                        {!classroom.isActive && classroom.endDate && (
                                          <Badge color="warning">Finalizada</Badge>
                                        )}
                                      </div>
                                    </div>

                                    <div className="program-management-classroom-card__meta">
                                      <span>
                                        <i className="bi bi-person-badge me-1"></i>
                                        {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Sin asignar'}
                                      </span>
                                      <span>
                                        <i className="bi bi-people me-1"></i>
                                        {classroom.studentIds?.length || 0} estudiantes
                                      </span>
                                      <span>
                                        <i className="bi bi-list-check me-1"></i>
                                        {completedModules}/{totalModules} módulos
                                      </span>
                                      {classroom.schedule?.time && (
                                        <span>
                                          <i className="bi bi-clock me-1"></i>
                                          {classroom.schedule.dayOfWeek} {classroom.schedule.time}
                                        </span>
                                      )}
                                    </div>

                                    <div className="program-management-classroom-card__tags">
                                      {classroom.room && (
                                        <Badge color="secondary" className="small">
                                          <i className="bi bi-door-open me-1"></i>
                                          {classroom.room}
                                        </Badge>
                                      )}
                                      {classroom.location && (
                                        <Badge color="light" className="small text-dark border">
                                          <i className="bi bi-geo-alt me-1"></i>
                                          {classroom.location}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  <div className="program-management-classroom-card__actions">
                                    <div className="program-management-classroom-card__order-actions">
                                      <Button
                                        color="light"
                                        size="sm"
                                        outline
                                        disabled={isFirst}
                                        onClick={() => handleMoveClassroomPosition(program.id, classroom.id, 'up')}
                                        title="Subir de lugar"
                                      >
                                        <i className="bi bi-arrow-up"></i>
                                      </Button>
                                      <Button
                                        color="light"
                                        size="sm"
                                        outline
                                        disabled={isLast}
                                        onClick={() => handleMoveClassroomPosition(program.id, classroom.id, 'down')}
                                        title="Bajar de lugar"
                                      >
                                        <i className="bi bi-arrow-down"></i>
                                      </Button>
                                    </div>

                                    <Button
                                      color="info"
                                      size="sm"
                                      outline
                                      onClick={() => handleViewClassroomRuns(classroom)}
                                      title="Ver historial de ejecuciones"
                                    >
                                      <i className="bi bi-archive"></i>
                                    </Button>

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

                                    <div className="form-check form-switch m-0">
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

                                    <Button
                                      color="primary"
                                      size="sm"
                                      outline
                                      onClick={() => handleOpenClassroomModal(program, classroom)}
                                      title="Editar clase"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </Button>

                                    <Button
                                      color="secondary"
                                      size="sm"
                                      outline
                                      onClick={() => handleDuplicateClassroom(program, classroom)}
                                      title="Duplicar clase"
                                    >
                                      <i className="bi bi-files"></i>
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Col>

                    <Col xl={4}>
                      <Card className="program-management-info-card">
                        <CardBody>
                          <h6 className="program-management-section__title">Información del programa</h6>
                          <div className="program-management-info-grid">
                            <div className="program-management-info-item">
                              <span className="program-management-info-item__label">Estudiantes</span>
                              <strong>{program.minStudents} - {program.maxStudents}</strong>
                            </div>
                            <div className="program-management-info-item">
                              <span className="program-management-info-item__label">Créditos</span>
                              <strong>{program.totalCredits || 0}</strong>
                            </div>
                            <div className="program-management-info-item">
                              <span className="program-management-info-item__label">Inscripción</span>
                              <strong>{formatProgramEnrollmentRange(program)}</strong>
                            </div>
                            <div className="program-management-info-item">
                              <span className="program-management-info-item__label">Costo material</span>
                              <strong>RD${program.materials?.cost || 0}</strong>
                            </div>
                          </div>

                          {program.materials?.books && program.materials.books.length > 0 && (
                            <div className="mt-3">
                              <span className="program-management-info-item__label">Libros</span>
                              <ul className="program-management-bullets mb-0 mt-2">
                                {program.materials.books.map((book) => (
                                  <li key={book}>{book}</li>
                                ))}
                              </ul>
                            </div>
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
                  <Label for="startDate">Inicio de inscripción</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={programForm.startDate}
                    onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="endDate">Fin de inscripción</Label>
                  <Input
                    type="date"
                    id="endDate"
                    value={programForm.endDate}
                    onChange={(e) => setProgramForm({ ...programForm, endDate: e.target.value })}
                  />
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
        initialData={duplicationSourceClassroom}
        program={selectedProgram}
        programClassrooms={selectedProgram ? getProgramClassrooms(selectedProgram.id) : []}
        teachers={teachers}
      />

      {/* Classroom Restart Modal */}
      <ClassroomRestartModal
        isOpen={restartModal}
        onClose={() => setRestartModal(false)}
        classroom={classroomToRestart}
        onSuccess={handleRestartSuccess}
      />

      <ClassroomRunsHistoryModal
        isOpen={classroomRunsModal}
        onClose={() => setClassroomRunsModal(false)}
        classroom={selectedClassroomForRuns}
        runs={classroomRuns}
        onViewRun={(run) => {
          setSelectedRun(run);
          setRunDetailsModal(true);
        }}
      />

      <ClassroomRunDetailsModal
        isOpen={runDetailsModal}
        onClose={() => setRunDetailsModal(false)}
        run={selectedRun}
      />

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
