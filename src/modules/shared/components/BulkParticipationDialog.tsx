import React, { useState, useEffect } from 'react';
import { Button, Alert, Badge, FormGroup, Label, Input, InputGroup, InputGroupText } from 'reactstrap';
import { Dialog } from '../../../components/common/Dialog';
import { IUser } from '../../../models';

/**
 * BulkParticipationDialog Component
 * 
 * Dialog for assigning participation points to multiple students at once.
 * Includes input validation and "Max Score" quick action.
 * 
 * @example
 * ```tsx
 * <BulkParticipationDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   selectedStudents={selectedStudents}
 *   maxScore={20}
 *   onConfirm={handleBulkParticipation}
 * />
 * ```
 */

export interface BulkParticipationDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;
  
  /** Callback when dialog should close */
  onClose: () => void;
  
  /** Array of selected students */
  selectedStudents: IUser[];
  
  /** Maximum allowed score */
  maxScore?: number;
  
  /** Optional current module name for context */
  currentModuleName?: string;
  
  /** Callback when user confirms - receives the points to add */
  onConfirm: (pointsToAdd: number) => Promise<void>;
  
  /** Show loading state during async operation */
  loading?: boolean;
}

export const BulkParticipationDialog: React.FC<BulkParticipationDialogProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  maxScore = 20,
  currentModuleName,
  onConfirm,
  loading = false,
}) => {
  const [inputValue, setInputValue] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('1');
      setError(null);
    }
  }, [isOpen]);

  // Validate input
  const validateInput = (value: string): { valid: boolean; message?: string } => {
    const numValue = Number.parseFloat(value);
    
    if (Number.isNaN(numValue)) {
      return { valid: false, message: 'Ingrese un número válido' };
    }
    
    if (numValue < -maxScore) {
      return { valid: false, message: `El mínimo es -${maxScore}` };
    }
    
    if (numValue > maxScore) {
      return { valid: false, message: `El máximo es ${maxScore}` };
    }
    
    if (numValue === 0) {
      return { valid: false, message: 'El valor debe ser diferente de cero' };
    }
    
    return { valid: true };
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim()) {
      const validation = validateInput(value);
      setError(validation.valid ? null : validation.message || null);
    } else {
      setError(null);
    }
  };

  // Handle max score button click
  const handleMaxScore = () => {
    setInputValue(maxScore.toString());
    setError(null);
  };

  // Handle zero score (remove points)
  const handleZeroScore = () => {
    setInputValue('-' + maxScore.toString());
    setError(null);
  };

  // Handle confirm
  const handleConfirm = async () => {
    const validation = validateInput(inputValue);
    
    if (!validation.valid) {
      setError(validation.message || 'Valor inválido');
      return;
    }
    
    const numValue = Number.parseFloat(inputValue);
    
    setIsSubmitting(true);
    try {
      await onConfirm(numValue);
      onClose();
    } catch (error) {
      console.error('Error in bulk participation:', error);
      setError('Error al asignar puntos');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !error && inputValue.trim()) {
      handleConfirm();
    }
  };

  const numValue = Number.parseFloat(inputValue) || 0;
  const isValid = !error && inputValue.trim() !== '';
  const isPositive = numValue > 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Puntos Masivos"
      size="sm"
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
            color="primary"
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting || loading}
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
        {/* Context Info */}
        {currentModuleName && (
          <div className="text-center">
            <small className="text-muted d-block">Módulo:</small>
            <strong className="text-primary">{currentModuleName}</strong>
          </div>
        )}

        {/* Selected Count */}
        <Alert color="info" className="mb-0">
          <div className="d-flex align-items-center justify-content-between">
            <span>
              <i className="bi bi-people-fill me-2"></i>
              <strong>Estudiantes seleccionados:</strong>
            </span>
            <Badge color="primary" pill>
              {selectedStudents.length}
            </Badge>
          </div>
        </Alert>

        {/* Points Input */}
        <FormGroup>
          <Label for="points-input" className="fw-bold">
            Puntos a Asignar
          </Label>
          <InputGroup size="lg">
            <Input
              id="points-input"
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              min={-maxScore}
              max={maxScore}
              step={0.5}
              autoFocus
              invalid={!!error}
              className="text-center fs-3 fw-bold"
              style={{ height: '64px' }}
            />
            <InputGroupText>
              pts
            </InputGroupText>
          </InputGroup>
          {error && (
            <div className="invalid-feedback d-block">
              {error}
            </div>
          )}
          <small className="form-text text-muted">
            Rango válido: -{maxScore} a +{maxScore} puntos
          </small>
        </FormGroup>

        {/* Quick Actions */}
        <div className="d-flex gap-2">
          <Button
            color="success"
            outline
            block
            onClick={handleMaxScore}
            disabled={numValue === maxScore}
          >
            <i className="bi bi-lightning-fill me-1"></i>
            Máximo (+{maxScore})
          </Button>
          <Button
            color="danger"
            outline
            block
            onClick={handleZeroScore}
            disabled={numValue === -maxScore}
          >
            <i className="bi bi-x-circle me-1"></i>
            Restar Todo (-{maxScore})
          </Button>
        </div>

        {/* Preview */}
        {isValid && (
          <div className={`alert alert-${isPositive ? 'success' : 'warning'} mb-0`}>
            <div className="text-center">
              <small className="d-block mb-1">
                {isPositive ? 'Se agregarán' : 'Se restarán'}
              </small>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <Badge color={isPositive ? 'success' : 'danger'} className="fs-5 px-3 py-2">
                  {isPositive ? '+' : ''}{numValue}
                </Badge>
                <span className="text-muted">puntos a cada estudiante</span>
              </div>
            </div>
          </div>
        )}

        {/* Student List */}
        <div className="border rounded p-2 bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <small className="text-muted fw-bold d-block mb-2">Estudiantes:</small>
          <div className="d-flex flex-column gap-1">
            {selectedStudents.map((student) => (
              <div 
                key={student.id}
                className="d-flex align-items-center gap-2 p-1"
              >
                {student.profilePhoto ? (
                  <img
                    src={student.profilePhoto}
                    alt={student.firstName}
                    className="rounded-circle"
                    style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                    style={{ width: '24px', height: '24px' }}
                  >
                    <small className="text-primary fw-bold" style={{ fontSize: '10px' }}>
                      {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
                    </small>
                  </div>
                )}
                <small>{student.firstName} {student.lastName}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Warning for negative points */}
        {isValid && !isPositive && (
          <Alert color="warning" className="mb-0 small">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Atención:</strong> Estás a punto de restar puntos a {selectedStudents.length} estudiante{selectedStudents.length !== 1 ? 's' : ''}. Esta acción no se puede deshacer fácilmente.
          </Alert>
        )}
      </div>
    </Dialog>
  );
};

export default BulkParticipationDialog;
