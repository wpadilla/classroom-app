// BulkOperationsToolbar Component
// Provides bulk action capabilities for user management
// Features: select all, bulk enroll/unenroll, bulk activate/deactivate

import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
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
  Badge,
  Alert,
} from 'reactstrap';
import { IUser, IClassroom, IProgram } from '../../../models';
import { ClassroomService } from '../../../services/classroom/classroom.service';
import { ProgramService } from '../../../services/program/program.service';
import { UserService } from '../../../services/user/user.service';
import { toast } from 'react-toastify';

interface BulkOperationsToolbarProps {
  users: IUser[];
  allClassrooms: IClassroom[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRefresh: () => Promise<void> | void;
  protectedUserId?: string;
  onProgressChange?: (state: { active: boolean; label?: string; progress?: number }) => void;
}

const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  users,
  allClassrooms,
  selectedIds,
  onSelectAll,
  onClearSelection,
  onRefresh,
  protectedUserId,
  onProgressChange,
}) => {
  // Dropdown state
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  
  // Modal states
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [unenrollModalOpen, setUnenrollModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
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

  const beginOperation = (label: string) => {
    setProcessing(true);
    setProgress(0);
    setCurrentOperation(label);
    onProgressChange?.({
      active: true,
      label,
      progress: 0,
    });
  };

  const reportOperationProgress = (nextProgress: number, label: string) => {
    setProgress(nextProgress);
    setCurrentOperation(label);
    onProgressChange?.({ active: true, label, progress: nextProgress });
  };

  const finishOperation = () => {
    setProcessing(false);
    onProgressChange?.({ active: false });
  };

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

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedIds.has(user.id)),
    [selectedIds, users]
  );

  const assignedTeacherIds = useMemo(
    () => allClassrooms.reduce((teacherIds, classroom) => {
      if (classroom.teacherId) teacherIds.add(classroom.teacherId);
      return teacherIds;
    }, new Set<string>()),
    [allClassrooms]
  );

  const existingClassroomIds = useMemo(
    () => new Set(allClassrooms.map((classroom) => classroom.id)),
    [allClassrooms]
  );

  const classroomMembershipIdsByStudent = useMemo(
    () => allClassrooms.reduce((memberships, classroom) => {
      (classroom.studentIds || []).forEach((studentId) => {
        const classroomIds = memberships.get(studentId) || [];
        classroomIds.push(classroom.id);
        memberships.set(studentId, classroomIds);
      });
      return memberships;
    }, new Map<string, string[]>()),
    [allClassrooms]
  );

  const protectedSelectedUsers = useMemo(
    () => selectedUsers.filter((user) =>
      user.id === protectedUserId || assignedTeacherIds.has(user.id)
    ),
    [assignedTeacherIds, protectedUserId, selectedUsers]
  );

  const deletableSelectedUsers = useMemo(
    () => selectedUsers.filter((user) =>
      user.id !== protectedUserId && !assignedTeacherIds.has(user.id)
    ),
    [assignedTeacherIds, protectedUserId, selectedUsers]
  );

  // Bulk enroll
  const handleBulkEnroll = async () => {
    if (!selectedClassroomId) {
      toast.error('Seleccione una clase');
      return;
    }

    const classroom = classrooms.find(c => c.id === selectedClassroomId);
    
    if (!classroom) {
      toast.error('Clase no encontrada');
      return;
    }
    const classroomStudentIds = new Set(classroom.studentIds || []);

    beginOperation('Inscribiendo estudiantes...');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    try {
      for (let index = 0; index < selectedUsers.length; index++) {
        const selectedUser = selectedUsers[index];
        reportOperationProgress(
          Math.round(((index + 1) / selectedUsers.length) * 100),
          `Inscribiendo: ${selectedUser.firstName} ${selectedUser.lastName}`
        );

        const isFullyEnrolled =
          selectedUser.enrolledClassrooms?.includes(selectedClassroomId) &&
          classroomStudentIds.has(selectedUser.id);
        if (isFullyEnrolled) {
          skippedCount++;
          continue;
        }

        try {
          await ClassroomService.addStudentToClassroom(selectedClassroomId, selectedUser.id);
          successCount++;
        } catch (error) {
          console.error(`Error enrolling ${selectedUser.id}:`, error);
          errorCount++;
        }
      }

      setEnrollModalOpen(false);
      setSelectedClassroomId('');
      setSelectedProgramId('');
      onClearSelection();
      await onRefresh();

      const message = [`${successCount} inscrito(s)`];
      if (skippedCount > 0) message.push(`${skippedCount} ya estaba(n) inscrito(s)`);
      if (errorCount > 0) message.push(`${errorCount} error(es)`);

      if (errorCount > 0) {
        toast.warning(message.join(', '));
      } else {
        toast.success(message.join(', '));
      }
    } finally {
      finishOperation();
    }
  };

  // Bulk unenroll
  const handleBulkUnenroll = async () => {
    if (!selectedClassroomId) {
      toast.error('Seleccione una clase');
      return;
    }

    const classroom = classrooms.find(c => c.id === selectedClassroomId);

    if (!classroom) {
      toast.error('Clase no encontrada');
      return;
    }
    const classroomStudentIds = new Set(classroom.studentIds || []);

    beginOperation('Desinscribiendo estudiantes...');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    try {
      for (let index = 0; index < selectedUsers.length; index++) {
        const selectedUser = selectedUsers[index];
        reportOperationProgress(
          Math.round(((index + 1) / selectedUsers.length) * 100),
          `Desinscribiendo: ${selectedUser.firstName} ${selectedUser.lastName}`
        );

        const isFullyUnenrolled =
          !selectedUser.enrolledClassrooms?.includes(selectedClassroomId) &&
          !classroomStudentIds.has(selectedUser.id);
        if (isFullyUnenrolled) {
          skippedCount++;
          continue;
        }

        try {
          await ClassroomService.removeStudentFromClassroom(selectedClassroomId, selectedUser.id);
          successCount++;
        } catch (error) {
          console.error(`Error unenrolling ${selectedUser.id}:`, error);
          errorCount++;
        }
      }

      setUnenrollModalOpen(false);
      setSelectedClassroomId('');
      setSelectedProgramId('');
      onClearSelection();
      await onRefresh();

      const message = [`${successCount} desinscrito(s)`];
      if (skippedCount > 0) message.push(`${skippedCount} no estaba(n) inscrito(s)`);
      if (errorCount > 0) message.push(`${errorCount} error(es)`);

      if (errorCount > 0) {
        toast.warning(message.join(', '));
      } else {
        toast.success(message.join(', '));
      }
    } finally {
      finishOperation();
    }
  };

  // Bulk status change
  const handleBulkStatusChange = async () => {
    beginOperation(statusAction === 'activate' ? 'Activando usuarios...' : 'Desactivando usuarios...');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    try {
      for (let index = 0; index < selectedUsers.length; index++) {
        const selectedUser = selectedUsers[index];
        reportOperationProgress(
          Math.round(((index + 1) / selectedUsers.length) * 100),
          `Procesando: ${selectedUser.firstName} ${selectedUser.lastName}`
        );

        const alreadyInDesiredState =
          (statusAction === 'activate' && selectedUser.isActive) ||
          (statusAction === 'deactivate' && !selectedUser.isActive);
        if (alreadyInDesiredState) {
          skippedCount++;
          continue;
        }

        try {
          await UserService.updateUser(selectedUser.id, { isActive: statusAction === 'activate' });
          successCount++;
        } catch (error) {
          console.error(`Error updating ${selectedUser.id}:`, error);
          errorCount++;
        }
      }

      setStatusModalOpen(false);
      onClearSelection();
      await onRefresh();

      const message = [`${successCount} ${statusAction === 'activate' ? 'activado(s)' : 'desactivado(s)'}`];
      if (skippedCount > 0) message.push(`${skippedCount} ya estaba(n) en ese estado`);
      if (errorCount > 0) message.push(`${errorCount} error(es)`);

      if (errorCount > 0) {
        toast.warning(message.join(', '));
      } else {
        toast.success(message.join(', '));
      }
    } finally {
      finishOperation();
    }
  };

  const handleBulkDelete = async () => {
    if (deletableSelectedUsers.length === 0) {
      toast.error('No hay usuarios eliminables en la selección actual.');
      return;
    }

    beginOperation('Preparando eliminación definitiva...');

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let index = 0; index < deletableSelectedUsers.length; index++) {
        const selectedUser = deletableSelectedUsers[index];
        reportOperationProgress(
          Math.round(((index + 1) / deletableSelectedUsers.length) * 100),
          `Eliminando: ${selectedUser.firstName} ${selectedUser.lastName}`
        );

        const classroomMembershipIds = Array.from(new Set([
          ...(classroomMembershipIdsByStudent.get(selectedUser.id) || []),
          ...(selectedUser.enrolledClassrooms || []).filter((classroomId) =>
            existingClassroomIds.has(classroomId)
          ),
        ]));

        try {
          await UserService.deleteUser(selectedUser.id, classroomMembershipIds);
          successCount++;
        } catch (error) {
          console.error(`Error deleting ${selectedUser.id}:`, error);
          errorCount++;
        }
      }

      setDeleteModalOpen(false);
      onClearSelection();
      await onRefresh();

      const message = [`${successCount} eliminado(s)`];
      if (protectedSelectedUsers.length > 0) {
        message.push(`${protectedSelectedUsers.length} protegido(s)`);
      }
      if (errorCount > 0) message.push(`${errorCount} error(es)`);

      if (errorCount > 0 || protectedSelectedUsers.length > 0) {
        toast.warning(message.join(', '));
      } else {
        toast.success(message.join(', '));
      }
    } finally {
      finishOperation();
    }
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
      <div className="user-management-bulk-toolbar">
        <div className="user-management-bulk-toolbar__selection">
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

          {hasSelection && (
            <Badge color="primary" pill>
              {selectedIds.size} seleccionado(s)
            </Badge>
          )}
        </div>

        <div className="user-management-bulk-toolbar__actions">
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
                <DropdownItem divider />
                <DropdownItem header>Zona de riesgo</DropdownItem>
                <DropdownItem className="text-danger" onClick={() => setDeleteModalOpen(true)}>
                  <i className="bi bi-trash3 me-2"></i>
                  Eliminar definitivamente
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
        </div>

        {hasSelection && (
            <Button
              size="sm"
              color="link"
              onClick={onClearSelection}
              className="user-management-bulk-toolbar__clear text-muted"
            >
              <i className="bi bi-x me-1"></i>
              Limpiar selección
            </Button>
        )}
      </div>

      {/* Enroll Modal */}
      <Modal
        isOpen={enrollModalOpen}
        toggle={() => !processing && setEnrollModalOpen(false)}
        backdrop="static"
        centered
        scrollable
        className="user-management-modal"
      >
        <ModalHeader toggle={() => !processing && setEnrollModalOpen(false)}>
          <i className="bi bi-person-plus me-2"></i>
          Inscribir en Clase
        </ModalHeader>
        <ModalBody>
          <Alert color="info">
            <i className="bi bi-info-circle me-2"></i>
            Se inscribirán <strong>{selectedIds.size}</strong> usuario(s) en la clase seleccionada.
          </Alert>
          {processing && (
            <Alert color="primary" className="small" role="status">
              <strong>{progress}%</strong> · {currentOperation}
            </Alert>
          )}

          <FormGroup>
            <Label>Filtrar por Programa</Label>
            <Input
              type="select"
              value={selectedProgramId}
              disabled={processing}
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
              disabled={processing}
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
      <Modal
        isOpen={unenrollModalOpen}
        toggle={() => !processing && setUnenrollModalOpen(false)}
        backdrop="static"
        centered
        scrollable
        className="user-management-modal"
      >
        <ModalHeader toggle={() => !processing && setUnenrollModalOpen(false)}>
          <i className="bi bi-person-dash me-2"></i>
          Desinscribir de Clase
        </ModalHeader>
        <ModalBody>
          <Alert color="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Se desinscribirán <strong>{selectedIds.size}</strong> usuario(s) de la clase seleccionada.
          </Alert>
          {processing && (
            <Alert color="primary" className="small" role="status">
              <strong>{progress}%</strong> · {currentOperation}
            </Alert>
          )}

          <FormGroup>
            <Label>Filtrar por Programa</Label>
            <Input
              type="select"
              value={selectedProgramId}
              disabled={processing}
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
              disabled={processing}
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
      <Modal
        isOpen={statusModalOpen}
        toggle={() => !processing && setStatusModalOpen(false)}
        backdrop="static"
        centered
        className="user-management-modal"
      >
        <ModalHeader toggle={() => !processing && setStatusModalOpen(false)}>
          <i className={`bi bi-${statusAction === 'activate' ? 'check-circle' : 'x-circle'} me-2`}></i>
          {statusAction === 'activate' ? 'Activar' : 'Desactivar'} Usuarios
        </ModalHeader>
        <ModalBody>
          <Alert color={statusAction === 'activate' ? 'success' : 'warning'}>
            <i className={`bi bi-${statusAction === 'activate' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
            {statusAction === 'activate'
              ? `Se activarán ${selectedIds.size} usuario(s). Podrán acceder al sistema.`
              : `Se desactivarán ${selectedIds.size} usuario(s). No podrán acceder al sistema.`
            }
          </Alert>
          {processing && (
            <Alert color="primary" className="small mb-0" role="status">
              <strong>{progress}%</strong> · {currentOperation}
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

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        toggle={() => !processing && setDeleteModalOpen(false)}
        backdrop="static"
        centered
        scrollable
        className="user-management-modal"
      >
        <ModalHeader toggle={() => !processing && setDeleteModalOpen(false)}>
          <i className="bi bi-trash3 me-2 text-danger" />
          Eliminar usuarios
        </ModalHeader>
        <ModalBody>
          <Alert color="danger">
            <strong>Esta acción es permanente.</strong>
            <div className="mt-1">
              Se eliminarán {deletableSelectedUsers.length} de los {selectedUsers.length} usuario(s)
              seleccionados, junto con sus vínculos de inscripción actuales.
            </div>
          </Alert>

          {protectedSelectedUsers.length > 0 && (
            <Alert color="warning">
              <div className="fw-semibold mb-1">
                {protectedSelectedUsers.length} usuario(s) no se eliminarán:
              </div>
              <ul className="small mb-0 ps-3">
                {protectedSelectedUsers.map((selectedUser) => (
                  <li key={selectedUser.id}>
                    {selectedUser.firstName} {selectedUser.lastName} —{' '}
                    {selectedUser.id === protectedUserId
                      ? 'es tu sesión actual'
                      : 'tiene una o más clases asignadas como profesor'}
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {processing && (
            <Alert color="primary" className="small mb-0" role="status">
              <strong>{progress}%</strong> · {currentOperation}
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setDeleteModalOpen(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button
            color="danger"
            onClick={handleBulkDelete}
            disabled={processing || deletableSelectedUsers.length === 0}
          >
            <i className="bi bi-trash3 me-2" />
            Eliminar {deletableSelectedUsers.length} usuario(s)
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default BulkOperationsToolbar;
