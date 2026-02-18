// BulkOperationsToolbar Component
// Provides bulk action capabilities for user management
// Features: select all, bulk enroll/unenroll, bulk activate/deactivate

import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Button,
  ButtonGroup,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Label,
  FormGroup,
  Card,
  CardBody,
  Badge,
  Progress,
  Spinner,
  Alert,
} from 'reactstrap';
import { IUser, IClassroom, IProgram } from '../../../models';
import { ClassroomService } from '../../../services/classroom/classroom.service';
import { ProgramService } from '../../../services/program/program.service';
import { UserService } from '../../../services/user/user.service';
import { toast } from 'react-toastify';

interface BulkOperationsToolbarProps {
  users: IUser[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onToggleSelection: (id: string) => void;
  onRefresh: () => void;
}

const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  users,
  selectedIds,
  onSelectAll,
  onClearSelection,
  onToggleSelection,
  onRefresh,
}) => {
  // Dropdown state
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  
  // Modal states
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [unenrollModalOpen, setUnenrollModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  
  // Data
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [statusAction, setStatusAction] = useState<'activate' | 'deactivate'>('activate');
  
  // Operation state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');

  // Load classrooms and programs
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allClassrooms, allPrograms] = await Promise.all([
        ClassroomService.getAllClassrooms(),
        ProgramService.getAllPrograms(),
      ]);
      setClassrooms(allClassrooms.filter(c => c.isActive));
      setPrograms(allPrograms);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Toggle action dropdown
  const toggleActionDropdown = () => setActionDropdownOpen(prev => !prev);

  // Get selected users
  const getSelectedUsers = (): IUser[] => {
    return users.filter(u => selectedIds.has(u.id));
  };

  // Bulk enroll
  const handleBulkEnroll = async () => {
    if (!selectedClassroomId) {
      toast.error('Seleccione una clase');
      return;
    }

    const selectedUsers = getSelectedUsers();
    const classroom = classrooms.find(c => c.id === selectedClassroomId);
    
    if (!classroom) {
      toast.error('Clase no encontrada');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setCurrentOperation('Inscribiendo estudiantes...');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      setProgress(Math.round(((i + 1) / selectedUsers.length) * 100));
      setCurrentOperation(`Inscribiendo: ${user.firstName} ${user.lastName}`);

      // Check if already enrolled
      if (user.enrolledClassrooms?.includes(selectedClassroomId)) {
        skippedCount++;
        continue;
      }

      try {
        const newEnrolledClassrooms = [...(user.enrolledClassrooms || []), selectedClassroomId];
        await UserService.updateUser(user.id, { enrolledClassrooms: newEnrolledClassrooms });
        
        // Also add user to classroom
        const newStudentIds = [...(classroom.studentIds || []), user.id];
        await ClassroomService.updateClassroom(selectedClassroomId, { studentIds: newStudentIds });
        
        successCount++;
      } catch (error) {
        console.error(`Error enrolling ${user.id}:`, error);
        errorCount++;
      }
    }

    setProcessing(false);
    setEnrollModalOpen(false);
    setSelectedClassroomId('');
    setSelectedProgramId('');
    onClearSelection();
    onRefresh();

    const message = [`${successCount} inscrito(s)`];
    if (skippedCount > 0) message.push(`${skippedCount} ya estaba(n) inscrito(s)`);
    if (errorCount > 0) message.push(`${errorCount} error(es)`);
    
    toast.success(message.join(', '));
  };

  // Bulk unenroll
  const handleBulkUnenroll = async () => {
    if (!selectedClassroomId) {
      toast.error('Seleccione una clase');
      return;
    }

    const selectedUsers = getSelectedUsers();

    setProcessing(true);
    setProgress(0);
    setCurrentOperation('Desinscribiendo estudiantes...');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      setProgress(Math.round(((i + 1) / selectedUsers.length) * 100));
      setCurrentOperation(`Desinscribiendo: ${user.firstName} ${user.lastName}`);

      // Check if enrolled
      if (!user.enrolledClassrooms?.includes(selectedClassroomId)) {
        skippedCount++;
        continue;
      }

      try {
        const newEnrolledClassrooms = (user.enrolledClassrooms || []).filter(id => id !== selectedClassroomId);
        await UserService.updateUser(user.id, { enrolledClassrooms: newEnrolledClassrooms });
        
        // Also remove user from classroom
        const classroom = classrooms.find(c => c.id === selectedClassroomId);
        if (classroom) {
          const newStudentIds = (classroom.studentIds || []).filter(id => id !== user.id);
          await ClassroomService.updateClassroom(selectedClassroomId, { studentIds: newStudentIds });
        }
        
        successCount++;
      } catch (error) {
        console.error(`Error unenrolling ${user.id}:`, error);
        errorCount++;
      }
    }

    setProcessing(false);
    setUnenrollModalOpen(false);
    setSelectedClassroomId('');
    setSelectedProgramId('');
    onClearSelection();
    onRefresh();

    const message = [`${successCount} desinscrito(s)`];
    if (skippedCount > 0) message.push(`${skippedCount} no estaba(n) inscrito(s)`);
    if (errorCount > 0) message.push(`${errorCount} error(es)`);
    
    toast.success(message.join(', '));
  };

  // Bulk status change
  const handleBulkStatusChange = async () => {
    const selectedUsers = getSelectedUsers();

    setProcessing(true);
    setProgress(0);
    setCurrentOperation(statusAction === 'activate' ? 'Activando usuarios...' : 'Desactivando usuarios...');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      setProgress(Math.round(((i + 1) / selectedUsers.length) * 100));
      setCurrentOperation(`Procesando: ${user.firstName} ${user.lastName}`);

      // Check if already in desired state
      if ((statusAction === 'activate' && user.isActive) || 
          (statusAction === 'deactivate' && !user.isActive)) {
        skippedCount++;
        continue;
      }

      try {
        await UserService.updateUser(user.id, { isActive: statusAction === 'activate' });
        successCount++;
      } catch (error) {
        console.error(`Error updating ${user.id}:`, error);
        errorCount++;
      }
    }

    setProcessing(false);
    setStatusModalOpen(false);
    onClearSelection();
    onRefresh();

    const message = [`${successCount} ${statusAction === 'activate' ? 'activado(s)' : 'desactivado(s)'}`];
    if (skippedCount > 0) message.push(`${skippedCount} ya estaba(n) en ese estado`);
    if (errorCount > 0) message.push(`${errorCount} error(es)`);
    
    toast.success(message.join(', '));
  };

  // Filter classrooms by program
  const filteredClassrooms = selectedProgramId
    ? classrooms.filter(c => c.programId === selectedProgramId)
    : classrooms;

  // Render selection info
  const hasSelection = selectedIds.size > 0;
  const allSelected = selectedIds.size === users.length && users.length > 0;

  return (
    <>
      {/* Toolbar */}
      <Row className="align-items-center mb-3 p-2 bg-light rounded">
        <Col xs="auto">
          <FormGroup check className="mb-0">
            <Input
              type="checkbox"
              checked={allSelected}
              onChange={() => allSelected ? onClearSelection() : onSelectAll()}
              id="select-all-checkbox"
            />
            <Label check htmlFor="select-all-checkbox" className="mb-0">
              Seleccionar todo
            </Label>
          </FormGroup>
        </Col>
        
        <Col xs="auto">
          {hasSelection && (
            <Badge color="primary" className="me-2">
              {selectedIds.size} seleccionado(s)
            </Badge>
          )}
        </Col>

        <Col xs="auto">
          <ButtonGroup size="sm">
            <Dropdown isOpen={actionDropdownOpen} toggle={toggleActionDropdown}>
              <DropdownToggle 
                caret 
                color="primary" 
                disabled={!hasSelection}
              >
                <i className="bi bi-lightning-charge me-1"></i>
                Acciones
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem header>Inscripciones</DropdownItem>
                <DropdownItem onClick={() => setEnrollModalOpen(true)}>
                  <i className="bi bi-person-plus me-2"></i>
                  Inscribir en clase
                </DropdownItem>
                <DropdownItem onClick={() => setUnenrollModalOpen(true)}>
                  <i className="bi bi-person-dash me-2"></i>
                  Desinscribir de clase
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem header>Estado</DropdownItem>
                <DropdownItem onClick={() => { setStatusAction('activate'); setStatusModalOpen(true); }}>
                  <i className="bi bi-check-circle me-2 text-success"></i>
                  Activar usuarios
                </DropdownItem>
                <DropdownItem onClick={() => { setStatusAction('deactivate'); setStatusModalOpen(true); }}>
                  <i className="bi bi-x-circle me-2 text-danger"></i>
                  Desactivar usuarios
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </ButtonGroup>
        </Col>

        {hasSelection && (
          <Col xs="auto" className="ms-auto">
            <Button size="sm" color="link" onClick={onClearSelection} className="text-muted">
              <i className="bi bi-x me-1"></i>
              Limpiar selección
            </Button>
          </Col>
        )}
      </Row>

      {/* Enroll Modal */}
      <Modal isOpen={enrollModalOpen} toggle={() => setEnrollModalOpen(false)} backdrop="static">
        <ModalHeader toggle={() => setEnrollModalOpen(false)}>
          <i className="bi bi-person-plus me-2"></i>
          Inscribir en Clase
        </ModalHeader>
        <ModalBody>
          {processing ? (
            <div className="text-center py-4">
              <Spinner color="primary" className="mb-3" />
              <p>{currentOperation}</p>
              <Progress value={progress} className="mb-2" />
              <small>{progress}% completado</small>
            </div>
          ) : (
            <>
              <Alert color="info">
                <i className="bi bi-info-circle me-2"></i>
                Se inscribirán <strong>{selectedIds.size}</strong> usuario(s) en la clase seleccionada.
              </Alert>
              
              <FormGroup>
                <Label>Filtrar por Programa</Label>
                <Input
                  type="select"
                  value={selectedProgramId}
                  onChange={e => {
                    setSelectedProgramId(e.target.value);
                    setSelectedClassroomId('');
                  }}
                >
                  <option value="">Todos los programas</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Input>
              </FormGroup>

              <FormGroup>
                <Label>Clase *</Label>
                <Input
                  type="select"
                  value={selectedClassroomId}
                  onChange={e => setSelectedClassroomId(e.target.value)}
                >
                  <option value="">Seleccionar clase...</option>
                  {programs.map(program => {
                    const programClassrooms = filteredClassrooms.filter(c => c.programId === program.id);
                    if (programClassrooms.length === 0) return null;
                    return (
                      <optgroup key={program.id} label={program.name}>
                        {programClassrooms.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.studentIds?.length || 0} estudiantes)
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </Input>
              </FormGroup>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setEnrollModalOpen(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button color="success" onClick={handleBulkEnroll} disabled={processing || !selectedClassroomId}>
            <i className="bi bi-check me-1"></i>
            Inscribir
          </Button>
        </ModalFooter>
      </Modal>

      {/* Unenroll Modal */}
      <Modal isOpen={unenrollModalOpen} toggle={() => setUnenrollModalOpen(false)} backdrop="static">
        <ModalHeader toggle={() => setUnenrollModalOpen(false)}>
          <i className="bi bi-person-dash me-2"></i>
          Desinscribir de Clase
        </ModalHeader>
        <ModalBody>
          {processing ? (
            <div className="text-center py-4">
              <Spinner color="primary" className="mb-3" />
              <p>{currentOperation}</p>
              <Progress value={progress} className="mb-2" />
              <small>{progress}% completado</small>
            </div>
          ) : (
            <>
              <Alert color="warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Se desinscribirán <strong>{selectedIds.size}</strong> usuario(s) de la clase seleccionada.
              </Alert>
              
              <FormGroup>
                <Label>Filtrar por Programa</Label>
                <Input
                  type="select"
                  value={selectedProgramId}
                  onChange={e => {
                    setSelectedProgramId(e.target.value);
                    setSelectedClassroomId('');
                  }}
                >
                  <option value="">Todos los programas</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Input>
              </FormGroup>

              <FormGroup>
                <Label>Clase *</Label>
                <Input
                  type="select"
                  value={selectedClassroomId}
                  onChange={e => setSelectedClassroomId(e.target.value)}
                >
                  <option value="">Seleccionar clase...</option>
                  {programs.map(program => {
                    const programClassrooms = filteredClassrooms.filter(c => c.programId === program.id);
                    if (programClassrooms.length === 0) return null;
                    return (
                      <optgroup key={program.id} label={program.name}>
                        {programClassrooms.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.studentIds?.length || 0} estudiantes)
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </Input>
              </FormGroup>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setUnenrollModalOpen(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button color="danger" onClick={handleBulkUnenroll} disabled={processing || !selectedClassroomId}>
            <i className="bi bi-x me-1"></i>
            Desinscribir
          </Button>
        </ModalFooter>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={statusModalOpen} toggle={() => setStatusModalOpen(false)} backdrop="static">
        <ModalHeader toggle={() => setStatusModalOpen(false)}>
          <i className={`bi bi-${statusAction === 'activate' ? 'check-circle' : 'x-circle'} me-2`}></i>
          {statusAction === 'activate' ? 'Activar' : 'Desactivar'} Usuarios
        </ModalHeader>
        <ModalBody>
          {processing ? (
            <div className="text-center py-4">
              <Spinner color="primary" className="mb-3" />
              <p>{currentOperation}</p>
              <Progress value={progress} className="mb-2" />
              <small>{progress}% completado</small>
            </div>
          ) : (
            <Alert color={statusAction === 'activate' ? 'success' : 'warning'}>
              <i className={`bi bi-${statusAction === 'activate' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
              {statusAction === 'activate' 
                ? `Se activarán ${selectedIds.size} usuario(s). Podrán acceder al sistema.`
                : `Se desactivarán ${selectedIds.size} usuario(s). No podrán acceder al sistema.`
              }
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setStatusModalOpen(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button 
            color={statusAction === 'activate' ? 'success' : 'danger'} 
            onClick={handleBulkStatusChange} 
            disabled={processing}
          >
            <i className={`bi bi-${statusAction === 'activate' ? 'check' : 'x'} me-1`}></i>
            {statusAction === 'activate' ? 'Activar' : 'Desactivar'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default BulkOperationsToolbar;
