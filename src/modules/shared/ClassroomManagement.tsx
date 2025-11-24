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
  Spinner,
  Progress
} from 'reactstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StudentEnrollment from './StudentEnrollment';
import ClassroomFinalizationModal from './ClassroomFinalizationModal';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { WhatsappService } from '../../services/whatsapp/whatsapp.service';
import { IClassroom, IUser, IModule, IStudentEvaluation, IAttendanceRecord, IClassroomResource } from '../../models';

import { useOffline } from '../../contexts/OfflineContext';
import { GCloudService } from '../../services/gcloud/gcloud.service';
import { getFileIcon, formatFileSize, getFileTypeColor } from '../../utils/fileUtils';

const ClassroomManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOffline } = useOffline();

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

  // Finalization state
  const [finalizationModal, setFinalizationModal] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

  // Attendance state - Now per module
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, boolean>>(new Map());

  // Participation state - Track total participation including pending changes
  const [participationTotals, setParticipationTotals] = useState<Map<string, number>>(new Map());

  // Resources state
  const [uploadingResource, setUploadingResource] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadingFileName, setDownloadingFileName] = useState('');

  useEffect(() => {
    if (id && user) { // Keep user in dependency for permission checks
      loadClassroomData();
    }
  }, [id, user, isOffline]); // Reload when offline status changes or user changes

  useEffect(() => {
    // Load attendance and participation for current module when it changes
    if (currentModule && evaluations.size > 0) {
      loadModuleAttendance();
      loadParticipationTotals();
    }
  }, [currentModule, evaluations]);

  const loadClassroomData = async () => {
    if (!id || !user) return; // Ensure user is available for permission checks

    setLoading(true);
    try {
      // Load from Firebase (cache-first by default if offline)
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

      // Load evaluations
      const evaluationsData = await EvaluationService.getClassroomEvaluations(id);

      // Load students
      let studentsData: IUser[] = [];
      if (classroomData.studentIds && classroomData.studentIds.length > 0) {
        studentsData = await UserService.getUsersByIds(classroomData.studentIds);
      }

      setClassroom(classroomData);
      setStudents(studentsData);

      // Process evaluations map
      const evalMap = new Map();
      evaluationsData.forEach(e => evalMap.set(e.studentId, e));
      setEvaluations(evalMap);

      // Initialize attendance and participation for current module
      const activeModule = classroomData.modules.find(m => !m.isCompleted) || classroomData.modules[classroomData.modules.length - 1];
      setCurrentModule(activeModule);

      // Update local tracking state based on loaded evaluations
      const attendanceMap = new Map<string, boolean>();
      const participationMap = new Map<string, number>();

      evaluationsData.forEach(evaluation => {
        // Attendance for current module
        if (activeModule) {
          const record = evaluation.attendanceRecords?.find(r => r.moduleId === activeModule.id);
          if (record) {
            attendanceMap.set(evaluation.studentId, record.isPresent);
          }
        }

        // Total participation
        participationMap.set(evaluation.studentId, evaluation.participationPoints || 0);
      });

      setAttendanceRecords(attendanceMap);
      setParticipationTotals(participationMap);

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
    if (!id || !currentModule || !user) return;

    // Update UI immediately
    const newAttendance = new Map(attendanceRecords);
    newAttendance.set(studentId, isPresent);
    setAttendanceRecords(newAttendance);

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

  const handleParticipationChange = async (studentId: string, points: number) => {
    if (!id) return;

    // Update UI immediately
    const currentPoints = participationTotals.get(studentId) || 0;
    const newPoints = Math.max(0, currentPoints + points); // Prevent negative points

    const newTotals = new Map(participationTotals);
    newTotals.set(studentId, newPoints);
    setParticipationTotals(newTotals);

    try {
      await EvaluationService.recordParticipation(
        studentId,
        id,
        points
      );

      // Update evaluations state to reflect the change
      const evaluation = evaluations.get(studentId);
      if (evaluation) {
        const updatedEvaluation: IStudentEvaluation = {
          ...evaluation,
          participationPoints: newPoints
        };

        const newEvaluations = new Map(evaluations);
        newEvaluations.set(studentId, updatedEvaluation);
        setEvaluations(newEvaluations);
      }
    } catch (error) {
      console.error('Error recording participation:', error);
      toast.error('Error al registrar participación');
      // Revert
      newTotals.set(studentId, currentPoints);
      setParticipationTotals(new Map(newTotals));
    }
  };

  const handleModuleChange = async (module: IModule) => {
    if (!id || !classroom) return;

    try {
      // Auto-complete previous module when moving forward
      if (currentModule && module.weekNumber > currentModule.weekNumber && !currentModule.isCompleted) {
        await handleToggleModuleCompletion(currentModule.id, false);
      }

      setCurrentModule(module);

      // Update current module in classroom
      await ClassroomService.updateClassroom(id, {
        currentModule: module
      });
    } catch (error) {
      console.error('Error updating current module:', error);
      toast.error('Error al cambiar de módulo');
    }
  };

  const handleToggleModuleCompletion = async (moduleId: string, currentStatus: boolean) => {
    if (!id || !classroom || isFinalized) return;

    try {
      const updatedModules = classroom.modules.map(m =>
        m.id === moduleId ? { ...m, isCompleted: !currentStatus } : m
      );

      // Update local state immediately
      setClassroom({ ...classroom, modules: updatedModules });

      // Update in database
      await ClassroomService.updateClassroom(id, {
        modules: updatedModules
      });

      toast.success(`Módulo ${!currentStatus ? 'completado' : 'marcado como pendiente'}`);
    } catch (error) {
      console.error('Error toggling module completion:', error);
      toast.error('Error al actualizar el módulo');
      // Reload to revert optimistic update
      await loadClassroomData();
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

  const handleToggleStudentStatus = async (studentId: string, currentStatus: boolean) => {
    if (!id) return;

    try {
      // Update UI immediately
      const evaluation = evaluations.get(studentId);
      if (evaluation) {
        const updatedEvaluation = { ...evaluation, isActive: !currentStatus };
        const newEvaluations = new Map(evaluations);
        newEvaluations.set(studentId, updatedEvaluation);
        setEvaluations(newEvaluations);
      }

      // Save to database (Firebase handles offline persistence)
      await EvaluationService.updateStudentStatus(studentId, id, !currentStatus);
      toast.success(`Estudiante ${!currentStatus ? 'activado' : 'desactivado'} en esta clase`);
    } catch (error) {
      console.error('Error toggling student status:', error);
      toast.error('Error al cambiar estado del estudiante');
      // Revert on error
      await loadClassroomData();
    }
  };

  const handleFileUpload = async () => {
    if (!id || !selectedFile || !user) return;

    try {
      setUploadingResource(true);

      // Upload file to GCloud
      const fileUrl = await GCloudService.uploadFile(selectedFile, `classroom-${id}`);

      // Create resource object
      const resource: Omit<IClassroomResource, 'id'> = {
        name: selectedFile.name,
        url: fileUrl,
        type: selectedFile.type,
        size: selectedFile.size,
        uploadedBy: user.id,
        uploadedAt: new Date()
      };

      // Add resource to classroom
      const resourceWithId: IClassroomResource = {
        ...resource,
        id: `resource-${Date.now()}`
      };

      await ClassroomService.addResource(id, resourceWithId);

      toast.success('Recurso subido exitosamente');
      setSelectedFile(null);
      await loadClassroomData();
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Error al subir el recurso');
    } finally {
      setUploadingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId: string, filename: string) => {
    if (!id) return;

    const confirmed = window.confirm(`¿Estás seguro de eliminar el recurso "${filename}"?`);
    if (!confirmed) return;

    try {
      // Delete from GCloud
      const filenameMatch = filename.match(/classroom-.*$/);
      if (filenameMatch) {
        await GCloudService.deletePhoto(filenameMatch[0]);
      }

      // Remove from classroom
      await ClassroomService.deleteResource(id, resourceId);

      toast.success('Recurso eliminado exitosamente');
      await loadClassroomData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Error al eliminar el recurso');
    }
  };

  const handleDownloadResource = async (url: string, filename: string) => {
    try {
      // Show modal
      setDownloadingFileName(filename);
      setDownloadProgress(0);
      setDownloadModalOpen(true);

      // Fetch the file with progress tracking
      const response = await fetch(url);

      if (!response.ok) throw new Error('Error al obtener el archivo');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer el archivo');

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Update progress
        if (total > 0) {
          const progress = Math.round((receivedLength / total) * 100);
          setDownloadProgress(progress);
        }
      }

      // Combine chunks into single array
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      // Create blob from combined chunks
      const blob = new Blob([chunksAll]);

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // Close modal after a short delay
      setTimeout(() => {
        setDownloadModalOpen(false);
      }, 500);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar el archivo');
      setDownloadModalOpen(false);
    }
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
              <h4 className="mb-1">
                {classroom.subject}
                {isFinalized && (
                  <Badge color="warning" className="ms-2">
                    <i className="bi bi-flag-fill me-1"></i>
                    Finalizada
                  </Badge>
                )}
              </h4>
              <p className="text-muted mb-0 small">
                {classroom.name} • {students.length} estudiantes
              </p>
            </div>

            <div className="d-flex gap-2">
              {/* Finalization Button */}
              <Button
                color={isFinalized ? 'warning' : 'danger'}
                size="sm"
                outline={!isFinalized}
                onClick={() => setFinalizationModal(true)}
                title={isFinalized ? 'Revertir finalización' : 'Finalizar clase'}
              >
                <i className={`bi bi-${isFinalized ? 'arrow-counterclockwise' : 'flag-fill'} me-1`}></i>
                <span className="d-none d-sm-inline">
                  {isFinalized ? 'Revertir' : 'Finalizar'}
                </span>
              </Button>

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
          </div>
        </Col>
      </Row>

      {/* Finalized Alert */}
      {isFinalized && (
        <Row className="mb-3">
          <Col>
            <Alert color="warning" className="mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Clase Finalizada:</strong> Esta clase ha sido finalizada.
              No se pueden hacer cambios en asistencia o participación.
              Para modificar, debes revertir la finalización primero.
            </Alert>
          </Col>
        </Row>
      )}

      {/* Module Selector - Mobile Optimized with Completion Tracking */}
      <Row className="mb-3">
        <Col>
          <Card className="border-0 shadow-sm">
            <CardBody className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="mb-0">Progreso del Curso</h6>
                  <small className="text-muted">
                    Módulo {currentModule?.weekNumber || 1} de {classroom.modules.length}
                  </small>
                </div>
                <div className="text-end">
                  <Badge color="info">
                    {classroom.modules.filter(m => m.isCompleted).length}/{classroom.modules.length} Completados
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <Progress
                value={(classroom.modules.filter(m => m.isCompleted).length / classroom.modules.length) * 100}
                color={(classroom.modules.filter(m => m.isCompleted).length / classroom.modules.length) >= 0.75 ? 'success' : 'warning'}
                className="mb-3"
                style={{ height: '8px' }}
              />

              {/* Module Buttons */}
              <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                {classroom.modules.map(module => (
                  <div key={module.id} className="flex-shrink-0">
                    <Button
                      color={currentModule?.id === module.id ? 'primary' :
                        module.isCompleted ? 'success' : 'outline-secondary'}
                      onClick={() => handleModuleChange(module)}
                      size="sm"
                      className="d-flex align-items-center gap-1"
                      style={{ minWidth: '80px' }}
                    >
                      {module.isCompleted && <i className="bi bi-check-circle-fill"></i>}
                      S{module.weekNumber}
                    </Button>

                    {/* Completion Checkbox - Only show for current or past modules */}
                    {(currentModule && module.weekNumber <= currentModule.weekNumber) && (
                      <div className="form-check form-check-sm mt-1 text-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`module-complete-${module.id}`}
                          checked={module.isCompleted}
                          onChange={() => handleToggleModuleCompletion(module.id, module.isCompleted)}
                          disabled={isFinalized}
                          style={{ cursor: isFinalized ? 'not-allowed' : 'pointer' }}
                        />
                        <label
                          className="form-check-label small text-muted"
                          htmlFor={`module-complete-${module.id}`}
                          style={{
                            cursor: isFinalized ? 'not-allowed' : 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          {module.isCompleted ? 'OK' : 'Pendiente'}
                        </label>
                      </div>
                    )}
                  </div>
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
        <NavItem>
          <NavLink
            className={activeTab === 'resources' ? 'active' : ''}
            onClick={() => setActiveTab('resources')}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-folder me-1"></i>
            <span className="d-none d-sm-inline">Recursos</span>
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={activeTab}>
        {/* Attendance Tab - Mobile Optimized */}
        <TabPane tabId="attendance">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">
                    <i className="bi bi-calendar-check me-2"></i>
                    Semana {currentModule?.weekNumber} - {currentModule?.name}
                  </h6>
                  <small className="text-muted">
                    {isFinalized ? 'Clase finalizada - Solo lectura' : 'Los cambios se guardan automáticamente'}
                  </small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="current-module-complete"
                      checked={currentModule?.isCompleted || false}
                      onChange={() => currentModule && handleToggleModuleCompletion(currentModule.id, currentModule.isCompleted)}
                      disabled={isFinalized}
                      style={{ cursor: isFinalized ? 'not-allowed' : 'pointer' }}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="current-module-complete"
                      style={{ cursor: isFinalized ? 'not-allowed' : 'pointer' }}
                    >
                      <Badge color={currentModule?.isCompleted ? 'success' : 'warning'}>
                        {currentModule?.isCompleted ? 'Completado' : 'Pendiente'}
                      </Badge>
                    </label>
                  </div>
                </div>
              </div>
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
                              disabled={isFinalized}
                            />
                          </td>
                          <td className="text-center">
                            <Input
                              type="radio"
                              name={`attendance-${student.id}`}
                              checked={attendanceRecords.get(student.id) === false}
                              onChange={() => handleAttendanceChange(student.id, false)}
                              disabled={isFinalized}
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
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">
                    <i className="bi bi-hand-thumbs-up me-2"></i>
                    Participación - Semana {currentModule?.weekNumber}
                  </h6>
                  <small className="text-muted">
                    {isFinalized ? 'Clase finalizada - Solo lectura' : 'Los cambios se guardan automáticamente'}
                  </small>
                </div>
                <Badge color={currentModule?.isCompleted ? 'success' : 'warning'}>
                  Módulo {currentModule?.isCompleted ? 'Completado' : 'Pendiente'}
                </Badge>
              </div>
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
                                  disabled={isFinalized}
                                >
                                  <i className="bi bi-dash"></i>
                                </Button>
                                <Button
                                  color="success"
                                  outline
                                  onClick={() => handleParticipationChange(student.id, 1)}
                                  disabled={isFinalized}
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
                        <th className="text-center">Activo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const evaluation = evaluations.get(student.id);
                        const attendanceRate = getStudentAttendanceRate(student.id);
                        const participation = participationTotals.get(student.id) || 0;
                        const isActive = evaluation?.isActive !== false; // Default to true if undefined

                        return (
                          <tr key={student.id} className={!isActive ? 'table-secondary text-muted' : ''}>
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
                            <td className="text-center">
                              <div className="form-check form-switch d-flex justify-content-center">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  role="switch"
                                  checked={isActive}
                                  onChange={() => handleToggleStudentStatus(student.id, isActive)}
                                  style={{ cursor: 'pointer' }}
                                />
                              </div>
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

        {/* Resources Tab */}
        <TabPane tabId="resources">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white">
              <h6 className="mb-0">
                <i className="bi bi-folder me-2"></i>
                Recursos de la Clase
              </h6>
            </CardHeader>
            <CardBody>
              {/* Upload Section */}
              {!isFinalized && (
                <div className="mb-4 p-3 bg-light rounded">
                  <h6 className="mb-3">Subir Nuevo Recurso</h6>
                  <FormGroup>
                    <Input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      disabled={uploadingResource}
                      accept="*/*"
                    />
                    <small className="text-muted">
                      Puedes subir diapositivas, documentos, imágenes, audios, videos, etc.
                    </small>
                  </FormGroup>
                  <Button
                    color="primary"
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploadingResource}
                  >
                    {uploadingResource ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload me-2"></i>
                        Subir Recurso
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Resources List */}
              {!classroom?.resources || classroom.resources.length === 0 ? (
                <Alert color="info">
                  <i className="bi bi-info-circle me-2"></i>
                  No hay recursos disponibles para esta clase
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '50px' }}></th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Tamaño</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classroom.resources.map((resource) => (
                        <tr key={resource.id}>
                          <td className="text-center">
                            <i
                              className={`${getFileIcon(resource.type, resource.name)} fs-4`}
                              style={{ color: getFileTypeColor(resource.type) }}
                            ></i>
                          </td>
                          <td>
                            <div className="fw-bold">{resource.name}</div>
                            <small className="text-muted">
                              {new Date(resource.uploadedAt).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </small>
                          </td>
                          <td>
                            <Badge color={getFileTypeColor(resource.type)}>
                              {resource.type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </Badge>
                          </td>
                          <td>{formatFileSize(resource.size)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                color="success"
                                size="sm"
                                onClick={() => handleDownloadResource(resource.url, resource.name)}
                              >
                                <i className="bi bi-download"></i>
                              </Button>
                              {!isFinalized && (
                                <Button
                                  color="danger"
                                  size="sm"
                                  onClick={() => handleDeleteResource(resource.id, resource.name)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              )}
                            </div>
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

      {/* Classroom Finalization Modal */}
      <ClassroomFinalizationModal
        isOpen={finalizationModal}
        onClose={() => setFinalizationModal(false)}
        classroom={classroom}
        onSuccess={() => {
          setFinalizationModal(false);
          loadClassroomData();
        }}
      />

      {/* Download Progress Modal */}
      <Modal isOpen={downloadModalOpen} centered>
        <ModalHeader>Descargando Archivo</ModalHeader>
        <ModalBody>
          <div className="text-center mb-3">
            <i className="bi bi-download fs-1 text-primary"></i>
          </div>
          <p className="text-center mb-3">
            <strong>{downloadingFileName}</strong>
          </p>
          <Progress
            value={downloadProgress}
            color="primary"
            style={{ height: '25px' }}
          >
            {downloadProgress}%
          </Progress>
        </ModalBody>
      </Modal>
    </Container>
  );
};

export default ClassroomManagement;
