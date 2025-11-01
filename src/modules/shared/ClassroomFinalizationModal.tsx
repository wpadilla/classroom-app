/**
 * Classroom Finalization Modal Component
 * 
 * Implements:
 * - Facade Pattern: Simplifies complex finalization process
 * - Observer Pattern: Real-time feedback during process
 * - State Machine Pattern: Clear states (validating, finalizing, success, error)
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Alert,
  Spinner,
  Table,
  Badge,
  Progress,
  Card,
  CardBody,
  FormGroup,
  Label,
  Input,
  ListGroup,
  ListGroupItem
} from 'reactstrap';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { ClassroomFinalizationService } from '../../services/classroom/classroom-finalization.service';
import { IClassroom } from '../../models';

interface ClassroomFinalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: IClassroom | null;
  onSuccess: () => void;
}

type FinalizationState = 'initial' | 'validating' | 'ready' | 'finalizing' | 'success' | 'error' | 'reverting';

const ClassroomFinalizationModal: React.FC<ClassroomFinalizationModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onSuccess
}) => {
  const [state, setState] = useState<FinalizationState>('initial');
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: false, errors: [], warnings: [] });
  
  const [stats, setStats] = useState<any>(null);
  const [forceFinalize, setForceFinalize] = useState(false);
  const [archiveWhatsapp, setArchiveWhatsapp] = useState(true);
  const [customDate, setCustomDate] = useState<string>('');
  const [processMessage, setProcessMessage] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    if (isOpen && classroom) {
      validateAndLoadStats();
    } else {
      resetState();
    }
  }, [isOpen, classroom]);

  const resetState = () => {
    setState('initial');
    setValidation({ isValid: false, errors: [], warnings: [] });
    setStats(null);
    setForceFinalize(false);
    setArchiveWhatsapp(true);
    setCustomDate('');
    setProcessMessage('');
    setIsFinalized(false);
  };

  const validateAndLoadStats = async () => {
    if (!classroom) return;

    setState('validating');
    setProcessMessage('Validando estado de la clase...');

    try {
      // Check if already finalized
      const finalized = await ClassroomService.isFinalized(classroom.id);
      setIsFinalized(finalized);

      // Get validation
      const validationResult = await ClassroomFinalizationService.validateFinalization(
        classroom.id
      );
      setValidation(validationResult);

      // Get stats
      const statsResult = await ClassroomService.getFinalizationStats(classroom.id);
      setStats(statsResult);

      setState(validationResult.isValid || finalized ? 'ready' : 'initial');
      setProcessMessage('');
    } catch (error) {
      console.error('Error validating:', error);
      setState('error');
      setProcessMessage('Error al validar la clase');
    }
  };

  const handleFinalize = async () => {
    if (!classroom) return;

    setState('finalizing');
    setProcessMessage('Finalizando clase...');

    try {
      const options = {
        force: forceFinalize,
        archiveWhatsappGroup: archiveWhatsapp,
        customCompletionDate: customDate ? new Date(customDate) : undefined
      };

      const result = await ClassroomService.finalizeClassroom(classroom.id, options);

      if (result.success) {
        setState('success');
        setProcessMessage(
          `Clase finalizada exitosamente. ${result.studentsProcessed} estudiantes procesados.`
        );
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setState('error');
        setProcessMessage(result.errors.join(', '));
      }
    } catch (error: any) {
      console.error('Error finalizing:', error);
      setState('error');
      setProcessMessage(error.message || 'Error al finalizar la clase');
    }
  };

  const handleRevert = async () => {
    if (!classroom) return;

    setState('reverting');
    setProcessMessage('Revirtiendo finalización...');

    try {
      const result = await ClassroomService.revertFinalization(classroom.id);

      if (result.success) {
        setState('success');
        setProcessMessage(
          `Finalización revertida. ${result.studentsProcessed} estudiantes restaurados.`
        );
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setState('error');
        setProcessMessage(result.errors.join(', '));
      }
    } catch (error: any) {
      console.error('Error reverting:', error);
      setState('error');
      setProcessMessage(error.message || 'Error al revertir la finalización');
    }
  };

  const handleClose = () => {
    if (state === 'finalizing' || state === 'reverting') {
      return; // Don't allow closing during operation
    }
    resetState();
    onClose();
  };

  if (!classroom) return null;

  const isProcessing = state === 'finalizing' || state === 'reverting' || state === 'validating';
  const canFinalize = (validation.isValid || forceFinalize) && !isFinalized;
  const canRevert = isFinalized && state !== 'finalizing';

  return (
    <Modal isOpen={isOpen} toggle={handleClose} size="lg">
      <ModalHeader toggle={handleClose}>
        {isFinalized ? 'Gestionar Clase Finalizada' : 'Finalizar Clase'}
      </ModalHeader>
      
      <ModalBody>
        {/* Classroom Info */}
        <Card className="mb-3 bg-light">
          <CardBody>
            <h5 className="mb-2">{classroom.subject}</h5>
            <p className="text-muted mb-0">
              <i className="bi bi-tag me-2"></i>
              {classroom.name}
            </p>
          </CardBody>
        </Card>

        {/* Status Messages */}
        {state === 'validating' && (
          <Alert color="info">
            <Spinner size="sm" className="me-2" />
            {processMessage}
          </Alert>
        )}

        {state === 'success' && (
          <Alert color="success">
            <i className="bi bi-check-circle me-2"></i>
            {processMessage}
          </Alert>
        )}

        {state === 'error' && (
          <Alert color="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {processMessage}
          </Alert>
        )}

        {/* Finalized Status */}
        {isFinalized && state === 'ready' && (
          <Alert color="warning">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Esta clase ya ha sido finalizada.</strong> Puedes revertir la finalización para hacer cambios.
          </Alert>
        )}

        {/* Validation Errors */}
        {validation.errors.length > 0 && (
          <Alert color="danger">
            <h6 className="mb-2">Errores de Validación:</h6>
            <ul className="mb-0">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Validation Warnings */}
        {validation.warnings.length > 0 && !isFinalized && (
          <Alert color="warning">
            <h6 className="mb-2">Advertencias:</h6>
            <ul className="mb-0">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
            <hr />
            <FormGroup check className="mb-0">
              <Input
                type="checkbox"
                id="forceFinalize"
                checked={forceFinalize}
                onChange={(e) => setForceFinalize(e.target.checked)}
              />
              <Label check for="forceFinalize">
                Finalizar de todas formas (forzar)
              </Label>
            </FormGroup>
          </Alert>
        )}

        {/* Statistics */}
        {stats && state === 'ready' && (
          <Card className="mb-3">
            <CardBody>
              <h6 className="mb-3">Estadísticas de la Clase</h6>
              <Table size="sm" borderless>
                <tbody>
                  <tr>
                    <td><i className="bi bi-people me-2"></i>Total de Estudiantes:</td>
                    <td className="text-end"><Badge color="primary">{stats.totalStudents}</Badge></td>
                  </tr>
                  <tr>
                    <td><i className="bi bi-clipboard-check me-2"></i>Evaluados:</td>
                    <td className="text-end">
                      <Badge color={stats.evaluated === stats.totalStudents ? 'success' : 'warning'}>
                        {stats.evaluated} / {stats.totalStudents}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td><i className="bi bi-check-circle me-2"></i>Aprobados (≥70%):</td>
                    <td className="text-end"><Badge color="success">{stats.passed}</Badge></td>
                  </tr>
                  <tr>
                    <td><i className="bi bi-x-circle me-2"></i>Reprobados (&lt;70%):</td>
                    <td className="text-end"><Badge color="danger">{stats.failed}</Badge></td>
                  </tr>
                  <tr>
                    <td><i className="bi bi-graph-up me-2"></i>Promedio de Clase:</td>
                    <td className="text-end">
                      <Badge color={stats.averageGrade >= 70 ? 'success' : 'warning'}>
                        {stats.averageGrade.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td><i className="bi bi-list-check me-2"></i>Módulos Completados:</td>
                    <td className="text-end">
                      <Badge color={stats.completedModules === stats.totalModules ? 'success' : 'warning'}>
                        {stats.completedModules} / {stats.totalModules}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>

              {/* Progress Bar */}
              <div className="mt-3">
                <small className="text-muted">Progreso del Curso</small>
                <Progress
                  value={(stats.completedModules / stats.totalModules) * 100}
                  color={(stats.completedModules / stats.totalModules) >= 0.75 ? 'success' : 'warning'}
                  className="mt-1"
                >
                  {((stats.completedModules / stats.totalModules) * 100).toFixed(0)}%
                </Progress>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Finalization Options */}
        {!isFinalized && state === 'ready' && (
          <Card className="mb-3">
            <CardBody>
              <h6 className="mb-3">Opciones de Finalización</h6>
              
              <FormGroup check className="mb-2">
                <Input
                  type="checkbox"
                  id="archiveWhatsapp"
                  checked={archiveWhatsapp}
                  onChange={(e) => setArchiveWhatsapp(e.target.checked)}
                />
                <Label check for="archiveWhatsapp">
                  Archivar grupo de WhatsApp
                </Label>
              </FormGroup>

              <FormGroup>
                <Label for="customDate">
                  Fecha de Finalización (opcional)
                </Label>
                <Input
                  type="date"
                  id="customDate"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                <small className="text-muted">
                  Si no se especifica, se usará la fecha actual
                </small>
              </FormGroup>
            </CardBody>
          </Card>
        )}

        {/* Processing Progress */}
        {(state === 'finalizing' || state === 'reverting') && (
          <Card>
            <CardBody className="text-center">
              <Spinner color="primary" className="mb-3" />
              <h6>{processMessage}</h6>
              <Progress animated value={100} color="primary" className="mt-3" />
            </CardBody>
          </Card>
        )}

        {/* Information Alert */}
        {!isFinalized && state === 'ready' && (
          <Alert color="info">
            <h6 className="mb-2">
              <i className="bi bi-info-circle me-2"></i>
              ¿Qué sucederá al finalizar?
            </h6>
            <ListGroup flush>
              <ListGroupItem className="bg-transparent border-0 py-1">
                <i className="bi bi-check me-2"></i>
                La clase se marcará como inactiva
              </ListGroupItem>
              <ListGroupItem className="bg-transparent border-0 py-1">
                <i className="bi bi-check me-2"></i>
                Los estudiantes se moverán al historial con sus calificaciones
              </ListGroupItem>
              <ListGroupItem className="bg-transparent border-0 py-1">
                <i className="bi bi-check me-2"></i>
                El profesor verá la clase en su historial de clases impartidas
              </ListGroupItem>
              <ListGroupItem className="bg-transparent border-0 py-1">
                <i className="bi bi-check me-2"></i>
                Se creará un respaldo para poder revertir
              </ListGroupItem>
              <ListGroupItem className="bg-transparent border-0 py-1 text-success">
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                <strong>Esta acción puede ser revertida</strong>
              </ListGroupItem>
            </ListGroup>
          </Alert>
        )}

        {/* Revert Information */}
        {isFinalized && state === 'ready' && (
          <Alert color="warning">
            <h6 className="mb-2">
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              Revertir Finalización
            </h6>
            <p className="mb-2">
              Al revertir la finalización:
            </p>
            <ul className="mb-0">
              <li>La clase volverá a estar activa</li>
              <li>Los estudiantes volverán a sus clases actuales</li>
              <li>El profesor volverá a tener la clase asignada</li>
              <li>Podrás modificar evaluaciones y datos</li>
              <li>Luego puedes finalizar nuevamente con los cambios</li>
            </ul>
          </Alert>
        )}
      </ModalBody>

      <ModalFooter>
        <Button 
          color="secondary" 
          onClick={handleClose}
          disabled={isProcessing}
        >
          Cancelar
        </Button>

        {!isFinalized ? (
          <Button
            color="danger"
            onClick={handleFinalize}
            disabled={!canFinalize || isProcessing}
          >
            {state === 'finalizing' ? (
              <>
                <Spinner size="sm" className="me-2" />
                Finalizando...
              </>
            ) : (
              <>
                <i className="bi bi-flag-fill me-2"></i>
                Finalizar Clase
              </>
            )}
          </Button>
        ) : (
          <Button
            color="warning"
            onClick={handleRevert}
            disabled={!canRevert || isProcessing}
          >
            {state === 'reverting' ? (
              <>
                <Spinner size="sm" className="me-2" />
                Revirtiendo...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Revertir Finalización
              </>
            )}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default ClassroomFinalizationModal;

