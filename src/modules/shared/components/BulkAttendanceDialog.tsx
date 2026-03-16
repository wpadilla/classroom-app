import React, { useState } from 'react';
import { Button, Alert } from 'reactstrap';
import { Dialog } from '../../../components/common/Dialog';
import { Switch } from '../../../components/mobile/Switch';
import { IUser } from '../../../models';

/**
 * BulkAttendanceDialog Component
 * 
 * Dialog for marking attendance for multiple students at once.
 * Displays selected students and allows teacher to mark all as
 * present or absent with a single action.
 * 
 * @example
 * ```tsx
 * <BulkAttendanceDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   selectedStudents={selectedStudents}
 *   currentModuleName="Módulo 1"
 *   onConfirm={handleBulkAttendance}
 * />
 * ```
 */

export interface BulkAttendanceDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;
  
  /** Callback when dialog should close */
  onClose: () => void;
  
  /** Array of selected students */
  selectedStudents: IUser[];
  
  /** Name of current module */
  currentModuleName?: string;
  
  /** Callback when user confirms attendance action */
  onConfirm: (isPresent: boolean) => Promise<void>;
  
  /** Show loading state during async operation */
  loading?: boolean;
}

export const BulkAttendanceDialog: React.FC<BulkAttendanceDialogProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  currentModuleName = 'el módulo actual',
  onConfirm,
  loading = false,
}) => {
  const [isPresent, setIsPresent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(isPresent);
      onClose();
    } catch (error) {
      // Error handling done by parent
      console.error('Error in bulk attendance:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentCount = selectedStudents.length;
  const statusText = isPresent ? 'presente' : 'ausente';
  const statusTextPlural = isPresent ? 'presentes' : 'ausentes';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Pasar Asistencia Múltiple"
      size="md"
      footer={
        <div className="d-flex gap-2 w-100 justify-content-end">
          <Button 
            color="secondary" 
            onClick={onClose}
            disabled={isSubmitting || loading}
          >
            Cancelar
          </Button>
          <Button 
            color={isPresent ? 'success' : 'danger'}
            onClick={handleConfirm}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Procesando...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-1"></i>
                Confirmar
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="d-flex flex-column gap-3">
        {/* Selection Count Badge */}
        <div className="d-flex align-items-center justify-content-center">
          <span className="badge bg-primary fs-6 px-3 py-2">
            {studentCount} estudiante{studentCount !== 1 ? 's' : ''} seleccionado{studentCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Attendance Switch */}
        <div className="d-flex flex-column align-items-center gap-2 p-3 bg-light rounded">
          <label className="fw-bold mb-2">
            Marcar como:
          </label>
          <Switch
            checked={isPresent}
            onChange={setIsPresent}
            onColor="bg-success"
            offColor="bg-danger"
            label={isPresent ? 'Presente' : 'Ausente'}
          />
        </div>

        {/* Info Alert */}
        <Alert color="info" className="mb-0">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Esta acción marcará a {studentCount} estudiante{studentCount !== 1 ? 's' : ''} como {statusTextPlural}</strong>
          {' '}en {currentModuleName}.
        </Alert>

        {/* Selected Students List */}
        <div className="border rounded">
          <div className="p-2 bg-light border-bottom">
            <strong>Estudiantes seleccionados:</strong>
          </div>
          <div 
            className="p-2"
            style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
            }}
          >
            <ul className="list-unstyled mb-0">
              {selectedStudents.map((student, index) => (
                <li 
                  key={student.id}
                  className="py-2 px-2 border-bottom"
                  style={{ 
                    ...(index === selectedStudents.length - 1 ? { borderBottom: 'none' } : {}),
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-person-circle text-muted"></i>
                    <span className="fw-medium">
                      {student.firstName} {student.lastName}
                    </span>
                  </div>
                  {student.phone && (
                    <small className="text-muted ms-4">
                      {student.phone}
                    </small>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Warning for absent */}
        {!isPresent && (
          <Alert color="warning" className="mb-0">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Recuerda que marcar estudiantes como ausentes afectará su porcentaje de asistencia final.
          </Alert>
        )}
      </div>
    </Dialog>
  );
};

export default BulkAttendanceDialog;
