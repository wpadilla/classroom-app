// Classroom Form Component - Reusable for Create and Edit
// Follows Single Responsibility Principle and Component Composition Pattern

import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  Row,
  Col
} from 'reactstrap';
import { IClassroom, IUser, IProgram, ICustomCriterion } from '../../../models';

// Props Interface following Interface Segregation Principle
interface ClassroomFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: ClassroomFormData) => Promise<void>;
  classroom?: IClassroom | null; // null for create, IClassroom for edit
  program: IProgram | null;
  teachers: IUser[];
}

// Form Data Interface - separated from IClassroom for form handling
export interface ClassroomFormData {
  name: string;
  subject: string;
  description: string;
  teacherId: string;
  isActive: boolean;
  materialPrice: number;
  room: string;
  schedule: {
    dayOfWeek: string;
    time: string;
    duration: number;
  };
  evaluationCriteria: {
    questionnaires: number;
    attendance: number;
    participation: number;
    participationPointsPerModule: number;
    finalExam: number;
    customCriteria: ICustomCriterion[];
    participationRecords: any[];
  };
}

// Initial form state factory - Factory Pattern
const createInitialFormState = (classroom?: IClassroom | null): ClassroomFormData => {
  if (classroom) {
    return {
      name: classroom.name,
      subject: classroom.subject,
      description: classroom.description || '',
      teacherId: classroom.teacherId,
      isActive: classroom.isActive,
      materialPrice: classroom.materialPrice || 0,
      room: classroom.room || '',
      schedule: {
        dayOfWeek: classroom.schedule?.dayOfWeek || 'Monday',
        time: classroom.schedule?.time || '18:00',
        duration: classroom.schedule?.duration || 120
      },
      evaluationCriteria: {
        questionnaires: classroom.evaluationCriteria?.questionnaires || 25,
        attendance: classroom.evaluationCriteria?.attendance || 25,
        participation: classroom.evaluationCriteria?.participation || 25,
        participationPointsPerModule: classroom.evaluationCriteria?.participationPointsPerModule || 1,
        finalExam: classroom.evaluationCriteria?.finalExam || 25,
        customCriteria: classroom.evaluationCriteria?.customCriteria || [],
        participationRecords: classroom.evaluationCriteria?.participationRecords || []
      }
    };
  }
  
  // Default values for new classroom
  return {
    name: '',
    subject: '',
    description: '',
    teacherId: '',
    isActive: true,
    materialPrice: 0,
    room: '',
    schedule: {
      dayOfWeek: 'Monday',
      time: '18:00',
      duration: 120
    },
    evaluationCriteria: {
      questionnaires: 25,
      attendance: 25,
      participation: 25,
      participationPointsPerModule: 1,
      finalExam: 25,
      customCriteria: [] as ICustomCriterion[],
      participationRecords: []
    }
  };
};

const ClassroomForm: React.FC<ClassroomFormProps> = ({
  isOpen,
  onClose,
  onSave,
  classroom,
  program,
  teachers
}) => {
  const [formData, setFormData] = React.useState<ClassroomFormData>(
    createInitialFormState(classroom)
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Update form when classroom prop changes - Reactive Pattern
  React.useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormState(classroom));
    }
  }, [classroom, isOpen]);

  // Form field update handler - reduces boilerplate
  const updateField = (field: keyof ClassroomFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateScheduleField = (field: keyof ClassroomFormData['schedule'], value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [field]: value }
    }));
  };

  const updateEvaluationField = (
    field: keyof ClassroomFormData['evaluationCriteria'],
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      evaluationCriteria: { ...prev.evaluationCriteria, [field]: value }
    }));
  };

  // Validation - Business Logic
  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'El nombre de la clase es requerido';
    if (!formData.subject.trim()) return 'La materia es requerida';
    if (!formData.teacherId) return 'Debe seleccionar un profesor';
    
    const totalPoints = 
      formData.evaluationCriteria.questionnaires +
      formData.evaluationCriteria.attendance +
      formData.evaluationCriteria.participation +
      formData.evaluationCriteria.finalExam;
    
    if (totalPoints !== 100) {
      return 'Los criterios de evaluación deben sumar exactamente 100 puntos';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Error saving classroom:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(createInitialFormState(null));
    setIsSubmitting(false);
    onClose();
  };

  // Calculate evaluation total
  const evaluationTotal = 
    formData.evaluationCriteria.questionnaires +
    formData.evaluationCriteria.attendance +
    formData.evaluationCriteria.participation +
    formData.evaluationCriteria.finalExam;

  const isEditMode = !!classroom;

  return (
    <Modal isOpen={isOpen} toggle={handleClose} size="lg">
      <ModalHeader toggle={handleClose}>
        {isEditMode ? 'Editar Clase' : `Nueva Clase para ${program?.name || ''}`}
      </ModalHeader>
      <ModalBody>
        <Form>
          <Row>
            {/* Basic Information */}
            <Col md={6}>
              <FormGroup>
                <Label for="className">Nombre de la Clase *</Label>
                <Input
                  type="text"
                  id="className"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ej: Grupo A"
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="subject">Materia *</Label>
                <Input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  placeholder="Ej: Introducción a la Teología"
                />
              </FormGroup>
            </Col>

            {/* Description */}
            <Col md={12}>
              <FormGroup>
                <Label for="classDescription">Descripción</Label>
                <Input
                  type="textarea"
                  id="classDescription"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </FormGroup>
            </Col>

            {/* Teacher and Room */}
            <Col md={6}>
              <FormGroup>
                <Label for="teacher">Profesor *</Label>
                <Input
                  type="select"
                  id="teacher"
                  value={formData.teacherId}
                  onChange={(e) => updateField('teacherId', e.target.value)}
                >
                  <option value="">Seleccione un profesor</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="room">Salón/Aula</Label>
                <Input
                  type="text"
                  id="room"
                  value={formData.room}
                  onChange={(e) => updateField('room', e.target.value)}
                  placeholder="Ej: Aula 101, Salón Principal"
                />
              </FormGroup>
            </Col>

            {/* Material Price */}
            <Col md={12}>
              <FormGroup>
                <Label for="materialPrice">Precio del Material (RD$)</Label>
                <Input
                  type="number"
                  id="materialPrice"
                  value={formData.materialPrice}
                  onChange={(e) => updateField('materialPrice', parseInt(e.target.value) || 0)}
                  min={0}
                />
              </FormGroup>
            </Col>

            {/* Schedule Section */}
            <Col md={12}>
              <hr />
              <h6 className="mb-3">Horario</h6>
            </Col>
            
            <Col md={4}>
              <FormGroup>
                <Label for="dayOfWeek">Día de la Semana</Label>
                <Input
                  type="select"
                  id="dayOfWeek"
                  value={formData.schedule.dayOfWeek}
                  onChange={(e) => updateScheduleField('dayOfWeek', e.target.value)}
                >
                  <option value="Monday">Lunes</option>
                  <option value="Tuesday">Martes</option>
                  <option value="Wednesday">Miércoles</option>
                  <option value="Thursday">Jueves</option>
                  <option value="Friday">Viernes</option>
                  <option value="Saturday">Sábado</option>
                  <option value="Sunday">Domingo</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="time">Hora</Label>
                <Input
                  type="time"
                  id="time"
                  value={formData.schedule.time}
                  onChange={(e) => updateScheduleField('time', e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="duration">Duración (minutos)</Label>
                <Input
                  type="number"
                  id="duration"
                  value={formData.schedule.duration}
                  onChange={(e) => updateScheduleField('duration', parseInt(e.target.value) || 0)}
                  min={15}
                  step={15}
                />
              </FormGroup>
            </Col>

            {/* Evaluation Criteria Section */}
            <Col md={12}>
              <hr />
              <h6 className="mb-3">Criterios de Evaluación (Total: 100 puntos)</h6>
            </Col>
            
            <Col md={3}>
              <FormGroup>
                <Label for="questionnaires">Cuestionarios</Label>
                <Input
                  type="number"
                  id="questionnaires"
                  value={formData.evaluationCriteria.questionnaires}
                  onChange={(e) => updateEvaluationField('questionnaires', parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label for="attendance">Asistencia</Label>
                <Input
                  type="number"
                  id="attendance"
                  value={formData.evaluationCriteria.attendance}
                  onChange={(e) => updateEvaluationField('attendance', parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label for="participation">Participación</Label>
                <Input
                  type="number"
                  id="participation"
                  value={formData.evaluationCriteria.participation}
                  onChange={(e) => updateEvaluationField('participation', parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label for="finalExam">Examen Final</Label>
                <Input
                  type="number"
                  id="finalExam"
                  value={formData.evaluationCriteria.finalExam}
                  onChange={(e) => updateEvaluationField('finalExam', parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </FormGroup>
            </Col>

            {/* Evaluation Total Alert */}
            <Col md={12}>
              <Alert color={evaluationTotal === 100 ? 'success' : 'warning'}>
                <i className={`bi bi-${evaluationTotal === 100 ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                Total: {evaluationTotal} / 100 puntos
                {evaluationTotal !== 100 && (
                  <span className="ms-2">
                    {evaluationTotal > 100 ? '(Excede en ' : '(Faltan '}
                    {Math.abs(100 - evaluationTotal)} puntos)
                  </span>
                )}
              </Alert>
            </Col>
          </Row>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button 
          color="primary" 
          onClick={handleSubmit}
          disabled={isSubmitting || evaluationTotal !== 100}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Guardando...
            </>
          ) : (
            isEditMode ? 'Actualizar Clase' : 'Crear Clase'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ClassroomForm;

