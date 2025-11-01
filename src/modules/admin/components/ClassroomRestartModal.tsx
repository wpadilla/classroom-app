/**
 * Classroom Restart Modal Component
 * 
 * Allows restarting a finalized classroom for a new group of students
 * while preserving complete history of previous run
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
  FormGroup,
  Label,
  Input,
  Card,
  CardBody,
  Row,
  Col
} from 'reactstrap';
import { ClassroomService } from '../../../services/classroom/classroom.service';
import { ClassroomRestartService } from '../../../services/classroom/classroom-restart.service';
import { IClassroom, IClassroomRun } from '../../../models';
import { useAuth } from '../../../contexts/AuthContext';

interface ClassroomRestartModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: IClassroom | null;
  onSuccess: () => void;
}

type RestartState = 'initial' | 'validating' | 'ready' | 'restarting' | 'success' | 'error';

const ClassroomRestartModal: React.FC<ClassroomRestartModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onSuccess
}) => {
  const { user } = useAuth();
  const [state, setState] = useState<RestartState>('initial');
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: false, errors: [], warnings: [] });
  
  const [runs, setRuns] = useState<IClassroomRun[]>([]);
  const [notes, setNotes] = useState('');
  const [processMessage, setProcessMessage] = useState('');
  const [nextRunNumber, setNextRunNumber] = useState(1);

  useEffect(() => {
    if (isOpen && classroom) {
      validateAndLoadHistory();
    } else {
      resetState();
    }
  }, [isOpen, classroom]);

  const resetState = () => {
    setState('initial');
    setValidation({ isValid: false, errors: [], warnings: [] });
    setRuns([]);
    setNotes('');
    setProcessMessage('');
    setNextRunNumber(1);
  };

  const validateAndLoadHistory = async () => {
    if (!classroom) return;

    setState('validating');
    setProcessMessage('Validando y cargando historial...');

    try {
      // Validate
      const validationResult = await ClassroomRestartService.validateRestart(classroom.id);
      setValidation(validationResult);

      // Load previous runs
      const classroomRuns = await ClassroomService.getClassroomRuns(classroom.id);
      setRuns(classroomRuns);
      setNextRunNumber(classroomRuns.length + 1);

      setState(validationResult.isValid ? 'ready' : 'initial');
      setProcessMessage('');
    } catch (error) {
      console.error('Error validating:', error);
      setState('error');
      setProcessMessage('Error al validar el reinicio');
    }
  };

  const handleRestart = async () => {
    if (!classroom || !user) return;

    setState('restarting');
    setProcessMessage('Guardando historial y reiniciando clase...');

    try {
      const result = await ClassroomService.restartClassroom(
        classroom.id,
        user.id,
        notes || undefined
      );

      if (result.success) {
        setState('success');
        setProcessMessage(
          `Clase reiniciada exitosamente. Historial guardado como Ejecución #${result.runNumber}.`
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
      console.error('Error restarting:', error);
      setState('error');
      setProcessMessage(error.message || 'Error al reiniciar la clase');
    }
  };

  const handleClose = () => {
    if (state === 'restarting') {
      return; // Don't allow closing during operation
    }
    resetState();
    onClose();
  };

  if (!classroom) return null;

  const isProcessing = state === 'restarting' || state === 'validating';
  const canRestart = validation.isValid && state === 'ready';

  return (
    <Modal isOpen={isOpen} toggle={handleClose} size="lg">
      <ModalHeader toggle={handleClose}>
        <i className="bi bi-arrow-clockwise me-2"></i>
        Reiniciar Clase
      </ModalHeader>
      
      <ModalBody>
        {/* Classroom Info */}
        <Card className="mb-3 bg-light">
          <CardBody>
            <h5 className="mb-2">{classroom.subject}</h5>
            <p className="text-muted mb-1">{classroom.name}</p>
            <Badge color="warning">
              <i className="bi bi-flag-fill me-1"></i>
              Clase Finalizada
            </Badge>
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
        {validation.warnings.length > 0 && (
          <Alert color="warning">
            <h6 className="mb-2">Advertencias:</h6>
            <ul className="mb-0">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Previous Runs History */}
        {state === 'ready' && runs.length > 0 && (
          <Card className="mb-3">
            <CardBody>
              <h6 className="mb-3">Historial de Ejecuciones Anteriores</h6>
              <Table size="sm" hover>
                <thead>
                  <tr>
                    <th>Ejecución</th>
                    <th>Estudiantes</th>
                    <th>Promedio</th>
                    <th>Aprobados</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.slice(0, 5).map(run => (
                    <tr key={run.id}>
                      <td>
                        <Badge color="secondary">#{run.runNumber}</Badge>
                      </td>
                      <td>{run.totalStudents}</td>
                      <td>
                        <Badge color={run.statistics.averageGrade >= 70 ? 'success' : 'warning'}>
                          {run.statistics.averageGrade.toFixed(1)}%
                        </Badge>
                      </td>
                      <td>
                        <Badge color="info">
                          {run.statistics.distribution.excellent + 
                           run.statistics.distribution.good + 
                           run.statistics.distribution.regular}
                        </Badge>
                      </td>
                      <td>
                        <small>
                          {new Date(run.endDate).toLocaleDateString('es-ES')}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {runs.length > 5 && (
                <small className="text-muted">
                  Mostrando las 5 ejecuciones más recientes de {runs.length} totales
                </small>
              )}
            </CardBody>
          </Card>
        )}

        {/* Restart Information */}
        {state === 'ready' && (
          <>
            <Alert color="info">
              <h6 className="mb-2">
                <i className="bi bi-info-circle me-2"></i>
                ¿Qué sucederá al reiniciar?
              </h6>
              <ul className="mb-2">
                <li>
                  <strong>Se guardará</strong> un registro completo del grupo actual 
                  (Ejecución #{nextRunNumber})
                </li>
                <li>
                  <strong>Se vaciarán</strong> todos los estudiantes de la clase
                </li>
                <li>
                  <strong>Se resetearán</strong> todos los módulos a pendiente
                </li>
                <li>
                  <strong>Se activará</strong> la clase para el nuevo grupo
                </li>
                <li>
                  <strong>Se mantendrá</strong> el mismo profesor asignado
                </li>
                <li>
                  <strong>Se mantendrán</strong> los criterios de evaluación
                </li>
              </ul>
              <p className="mb-0 text-success">
                <i className="bi bi-database-fill me-1"></i>
                El historial completo se preservará en: <strong>Ejecución #{nextRunNumber}</strong>
              </p>
            </Alert>

            <FormGroup>
              <Label for="restartNotes">
                Notas (Opcional)
              </Label>
              <Input
                type="textarea"
                id="restartNotes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Grupo de verano 2024, horario modificado, etc..."
              />
              <small className="text-muted">
                Agrega notas para identificar esta ejecución en el futuro
              </small>
            </FormGroup>
          </>
        )}

        {/* Processing Progress */}
        {state === 'restarting' && (
          <Card>
            <CardBody className="text-center">
              <Spinner color="primary" className="mb-3" />
              <h6>{processMessage}</h6>
              <small className="text-muted">
                Guardando datos de {classroom.studentIds?.length || 0} estudiantes...
              </small>
            </CardBody>
          </Card>
        )}

        {/* Quick Stats */}
        {state === 'ready' && (
          <Card className="bg-light">
            <CardBody>
              <h6 className="mb-3">Datos de la Ejecución Actual</h6>
              <Row>
                <Col xs={6}>
                  <div className="mb-2">
                    <small className="text-muted d-block">Estudiantes Actuales</small>
                    <strong>{classroom.studentIds?.length || 0}</strong>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="mb-2">
                    <small className="text-muted d-block">Módulos Completados</small>
                    <strong>
                      {classroom.modules.filter(m => m.isCompleted).length}/{classroom.modules.length}
                    </strong>
                  </div>
                </Col>
                <Col xs={6}>
                  <div>
                    <small className="text-muted d-block">Fecha Inicio</small>
                    <strong>
                      {classroom.startDate 
                        ? new Date(classroom.startDate).toLocaleDateString('es-ES')
                        : 'N/A'
                      }
                    </strong>
                  </div>
                </Col>
                <Col xs={6}>
                  <div>
                    <small className="text-muted d-block">Fecha Finalización</small>
                    <strong>
                      {classroom.endDate 
                        ? new Date(classroom.endDate).toLocaleDateString('es-ES')
                        : 'N/A'
                      }
                    </strong>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
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

        <Button
          color="primary"
          onClick={handleRestart}
          disabled={!canRestart || isProcessing}
        >
          {state === 'restarting' ? (
            <>
              <Spinner size="sm" className="me-2" />
              Reiniciando...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Reiniciar Clase
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ClassroomRestartModal;

