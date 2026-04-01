import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  FormGroup,
  Input,
  InputGroup,
  InputGroupText,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from 'reactstrap';
import { toast } from 'react-toastify';
import { IClassroom } from '../../models';
import { StudentClassroomManagementService } from '../../services/student/student-classroom-management.service';

export interface IStudentEnrollmentTarget {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  enrolledClassrooms?: string[];
}

interface StudentEnrollmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: IStudentEnrollmentTarget[];
  classrooms: IClassroom[];
  programNamesById?: Record<string, string>;
  mode?: 'sync' | 'bulk-add';
  title?: string;
  description?: string;
  confirmLabel?: string;
  loadingClassrooms?: boolean;
  onSaved?: () => Promise<void> | void;
}

const StudentEnrollmentManagerModal: React.FC<StudentEnrollmentManagerModalProps> = ({
  isOpen,
  onClose,
  students,
  classrooms,
  programNamesById = {},
  mode = 'sync',
  title,
  description,
  confirmLabel,
  loadingClassrooms = false,
  onSaved,
}) => {
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const defaultTitle = mode === 'bulk-add'
    ? 'Inscribir estudiantes en clases'
    : `Gestionar Inscripciones${students[0] ? ` - ${students[0].fullName}` : ''}`;
  const defaultDescription = mode === 'bulk-add'
    ? 'Selecciona una o varias clases para inscribir masivamente a los estudiantes elegidos.'
    : 'Selecciona las clases en las que deseas inscribir al estudiante.';
  const defaultConfirmLabel = mode === 'bulk-add'
    ? 'Inscribir estudiantes'
    : 'Guardar inscripciones';

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const initialSelectedClassrooms =
      mode === 'sync' && students.length === 1
        ? [...(students[0].enrolledClassrooms || [])]
        : [];

    setSelectedClassroomIds(initialSelectedClassrooms);
    setSearchQuery('');
  }, [isOpen, mode, students]);

  const filteredClassrooms = useMemo(() => {
    if (!searchQuery.trim()) {
      return classrooms;
    }

    const query = searchQuery.toLowerCase();
    return classrooms.filter((classroom) =>
      [classroom.subject, classroom.name, programNamesById[classroom.programId] || '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [classrooms, programNamesById, searchQuery]);

  const toggleClassroom = (classroomId: string, checked: boolean) => {
    setSelectedClassroomIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, classroomId]));
      }

      return current.filter((id) => id !== classroomId);
    });
  };

  const handleSave = async () => {
    if (students.length === 0) {
      toast.error('No hay estudiantes disponibles para procesar la inscripción.');
      return;
    }

    if (selectedClassroomIds.length === 0) {
      toast.error('Selecciona al menos una clase.');
      return;
    }

    try {
      setSaving(true);

      if (mode === 'bulk-add') {
        await StudentClassroomManagementService.bulkEnrollStudentsInClassrooms({
          userIds: students.map((student) => student.id),
          classroomIds: selectedClassroomIds,
        });
      } else {
        await StudentClassroomManagementService.syncMultipleStudentEnrollments({
          userIds: students.map((student) => student.id),
          desiredClassroomIds: selectedClassroomIds,
          managedClassroomIds: classrooms.map((classroom) => classroom.id),
        });
      }

      await onSaved?.();

      if (mode === 'bulk-add') {
        toast.success(
          `Se inscribieron ${students.length} estudiante${students.length === 1 ? '' : 's'} en ${selectedClassroomIds.length} clase${selectedClassroomIds.length === 1 ? '' : 's'}.`
        );
      } else {
        toast.success('Inscripciones actualizadas exitosamente.');
      }

      onClose();
    } catch (error) {
      console.error('Error saving enrollments:', error);
      toast.error(
        mode === 'bulk-add'
          ? 'Error al inscribir estudiantes.'
          : 'Error al actualizar inscripciones.'
      );
    } finally {
      setSaving(false);
    }
  };

  const studentPreview = students.slice(0, 3).map((student) => student.fullName).join(', ');
  const hasMoreStudents = students.length > 3;

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg">
      <ModalHeader toggle={onClose}>{title || defaultTitle}</ModalHeader>
      <ModalBody>
        <Alert color="info">
          <div className="d-flex flex-column gap-1">
            <span>
              <i className="bi bi-info-circle me-2"></i>
              {description || defaultDescription}
            </span>
            <div className="small">
              <strong>{students.length}</strong> estudiante{students.length === 1 ? '' : 's'}:
              {' '}
              {studentPreview || 'Sin estudiantes'}
              {hasMoreStudents ? '...' : ''}
            </div>
          </div>
        </Alert>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <Badge color="primary" pill>
            {selectedClassroomIds.length} clase{selectedClassroomIds.length === 1 ? '' : 's'} seleccionada{selectedClassroomIds.length === 1 ? '' : 's'}
          </Badge>
          <Badge color="secondary" pill>
            {classrooms.length} clase{classrooms.length === 1 ? '' : 's'} disponible{classrooms.length === 1 ? '' : 's'}
          </Badge>
        </div>

        <InputGroup className="mb-3">
          <InputGroupText>
            <i className="bi bi-search"></i>
          </InputGroupText>
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por nombre de clase, materia o programa"
          />
        </InputGroup>

        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {loadingClassrooms ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <p className="text-muted mt-3 mb-0">Cargando clases...</p>
            </div>
          ) : filteredClassrooms.length > 0 ? (
            filteredClassrooms.map((classroom) => {
              const isChecked = selectedClassroomIds.includes(classroom.id);
              const programName = programNamesById[classroom.programId];

              return (
                <FormGroup check key={classroom.id} className="border rounded p-3 mb-2">
                  <Input
                    type="checkbox"
                    id={`enrollment-classroom-${classroom.id}`}
                    checked={isChecked}
                    onChange={(event) => toggleClassroom(classroom.id, event.target.checked)}
                  />
                    <Label check for={`enrollment-classroom-${classroom.id}`} className="ms-2 w-100">
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div>
                          <strong>{classroom.subject}</strong> - {classroom.name}
                          {programName && (
                            <div className="small text-muted">Programa: {programName}</div>
                          )}
                        </div>
                      <div className="d-flex flex-wrap gap-2">
                        <Badge color={classroom.isActive ? 'success' : 'warning'}>
                          {classroom.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                        {(classroom.studentIds?.length || 0) > 0 && (
                          <Badge color="secondary">
                            {(classroom.studentIds?.length || 0)} estudiante{(classroom.studentIds?.length || 0) === 1 ? '' : 's'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Label>
                </FormGroup>
              );
            })
          ) : (
            <Alert color="light" className="mb-0">
              No hay clases que coincidan con la búsqueda.
            </Alert>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          color="primary"
          onClick={handleSave}
          disabled={saving || loadingClassrooms || classrooms.length === 0}
        >
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" />
              Procesando...
            </>
          ) : (
            confirmLabel || defaultConfirmLabel
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default StudentEnrollmentManagerModal;
