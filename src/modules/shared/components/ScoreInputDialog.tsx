import React, { useState, useEffect } from 'react';
import { Button, FormGroup, Label, Input, Alert, InputGroup, InputGroupText, Badge } from 'reactstrap';
import { Dialog } from '../../../components/common/Dialog';

/**
 * ScoreInputDialog Component
 * 
 * Dialog for manual score entry with validation and "Max Score" quick action.
 * Used for entering participation points or any numeric score with constraints.
 * 
 * @example
 * ```tsx
 * <ScoreInputDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   studentName="Juan Pérez"
 *   currentScore={5}
 *   maxScore={10}
 *   fieldLabel="Puntos de Participación"
 *   onSave={handleSaveScore}
 * />
 * ```
 */

export interface ScoreInputDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;
  
  /** Callback when dialog should close */
  onClose: () => void;
  
  /** Name of student being evaluated */
  studentName: string;
  
  /** Current score value */
  currentScore: number;
  
  /** Maximum allowed score */
  maxScore: number;
  
  /** Label for the score field (e.g., "Puntos de Participación") */
  fieldLabel: string;
  
  /** Minimum allowed score */
  minScore?: number;
  
  /** Step increment for number input */
  step?: number;
  
  /** Callback when user saves the score */
  onSave: (newScore: number) => Promise<void>;
  
  /** Show loading state during async operation */
  loading?: boolean;
  
  /** Optional help text */
  helpText?: string;
}

export const ScoreInputDialog: React.FC<ScoreInputDialogProps> = ({
  isOpen,
  onClose,
  studentName,
  currentScore,
  maxScore,
  fieldLabel,
  minScore = 0,
  step = 0.5,
  onSave,
  loading = false,
  helpText,
}) => {
  const [inputValue, setInputValue] = useState(currentScore.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setInputValue(currentScore.toString());
      setError(null);
    }
  }, [isOpen, currentScore]);

  // Validate input
  const validateInput = (value: string): { valid: boolean; message?: string } => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return { valid: false, message: 'Ingrese un número válido' };
    }
    
    if (numValue < minScore) {
      return { valid: false, message: `El mínimo es ${minScore}` };
    }
    
    if (numValue > maxScore) {
      return { valid: false, message: `El máximo es ${maxScore}` };
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

  // Handle save
  const handleSave = async () => {
    const validation = validateInput(inputValue);
    
    if (!validation.valid) {
      setError(validation.message || 'Valor inválido');
      return;
    }
    
    const numValue = parseFloat(inputValue);
    
    // Clamp value to ensure it's within bounds
    const clampedValue = Math.max(minScore, Math.min(maxScore, numValue));
    
    setIsSubmitting(true);
    try {
      await onSave(clampedValue);
      onClose();
    } catch (error) {
      console.error('Error saving score:', error);
      setError('Error al guardar la puntuación');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !error && inputValue.trim()) {
      handleSave();
    }
  };

  const numValue = parseFloat(inputValue) || 0;
  const isValid = !error && inputValue.trim() !== '';
  const hasChanged = numValue !== currentScore;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignar ${fieldLabel}`}
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
            onClick={handleSave}
            disabled={!isValid || !hasChanged || isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-1"></i>
                Guardar
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="d-flex flex-column gap-3">
        {/* Student Name */}
        <div className="text-center">
          <h6 className="mb-0">{studentName}</h6>
          <small className="text-muted">
            Puntuación actual: <strong>{currentScore}</strong>
          </small>
        </div>

        {/* Score Input */}
        <FormGroup>
          <Label for="score-input" className="fw-bold">
            {fieldLabel}
          </Label>
          <InputGroup size="lg">
            <Input
              id="score-input"
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              min={minScore}
              max={maxScore}
              step={step}
              autoFocus
              invalid={!!error}
              className="text-center fs-3 fw-bold"
              style={{ height: '64px' }}
            />
            <InputGroupText>
              / {maxScore}
            </InputGroupText>
          </InputGroup>
          {error && (
            <div className="invalid-feedback d-block">
              {error}
            </div>
          )}
          {helpText && !error && (
            <small className="form-text text-muted">
              {helpText}
            </small>
          )}
        </FormGroup>

        {/* Max Score Button */}
        <Button
          color="warning"
          outline
          block
          onClick={handleMaxScore}
          disabled={numValue === maxScore}
        >
          <i className="bi bi-lightning-fill me-1"></i>
          Puntuación Máxima ({maxScore})
        </Button>

        {/* Info */}
        <Alert color="info" className="mb-0 small">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Rango válido:</strong> {minScore} - {maxScore} puntos
        </Alert>

        {/* Current vs New */}
        {hasChanged && isValid && (
          <div className="bg-light rounded p-2 text-center">
            <small className="text-muted d-block mb-1">Cambio</small>
            <div className="d-flex align-items-center justify-content-center gap-2">
              <strong className="text-danger">{currentScore}</strong>
              <i className="bi bi-arrow-right text-muted"></i>
              <strong className="text-success">{numValue}</strong>
              <Badge color={numValue > currentScore ? 'success' : 'danger'}>
                {numValue > currentScore ? '+' : ''}{(numValue - currentScore).toFixed(1)}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ScoreInputDialog;
