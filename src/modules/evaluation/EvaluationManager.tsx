// Complete Evaluation Manager for Teachers

import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Table,
  Input,
  FormGroup,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Spinner,
  Progress,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  InputGroup,
  InputGroupText,
  Form
} from 'reactstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { UserService } from '../../services/user/user.service';
import { IClassroom, IStudentEvaluation, IUser, IEvaluationCriteria, ICustomCriterion } from '../../models';
import { toast } from 'react-toastify';

interface EvaluationFormData {
  questionnaires: number;
  finalExam: number;
  customScores: { criterionId: string; score: number }[];
}

const EvaluationManager: React.FC = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [classroom, setClassroom] = useState<IClassroom | null>(null);
  const [students, setStudents] = useState<IUser[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, IStudentEvaluation>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('final');
  
  // Modal states
  const [criteriaModal, setCriteriaModal] = useState(false);
  const [evaluationModal, setEvaluationModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<IUser | null>(null);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationFormData>({
    questionnaires: 0,
    finalExam: 0,
    customScores: []
  });
  
  // Criteria form
  const [criteriaForm, setCriteriaForm] = useState<IEvaluationCriteria>({
    questionnaires: 20,
    attendance: 20,
    participation: 20,
    participationPointsPerModule: 1, // Default: 1 point per module
    finalExam: 40,
    customCriteria: [],
    participationRecords: []
  });

  useEffect(() => {
    if (classroomId && user) {
      loadData();
    }
  }, [classroomId, user]);

  const loadData = async () => {
    if (!classroomId || !user) return;
    
    try {
      setLoading(true);
      
      // Load classroom
      const classroomData = await ClassroomService.getClassroomById(classroomId);
      if (!classroomData) {
        toast.error('Clase no encontrada');
        navigate('/teacher/dashboard');
        return;
      }
      
      // Verify teacher
      if (classroomData.teacherId !== user.id && user.role !== 'admin') {
        toast.error('No tienes permiso para evaluar esta clase');
        navigate('/teacher/dashboard');
        return;
      }
      
      setClassroom(classroomData);
      
      // Set criteria from classroom
      if (classroomData.evaluationCriteria) {
        setCriteriaForm({
          ...classroomData.evaluationCriteria,
          customCriteria: classroomData.evaluationCriteria.customCriteria || [],
          participationPointsPerModule: classroomData.evaluationCriteria.participationPointsPerModule || 1
        });
      }
      
      // Load students
      if (classroomData.studentIds && classroomData.studentIds.length > 0) {
        const studentPromises = classroomData.studentIds.map(id => 
          UserService.getUserById(id)
        );
        const studentResults = await Promise.all(studentPromises);
        const validStudents = studentResults.filter(s => s !== null) as IUser[];
        setStudents(validStudents);
        
        // Load evaluations
        const evaluationPromises = validStudents.map(student =>
          EvaluationService.getStudentClassroomEvaluation(student.id, classroomId)
        );
        const evaluationResults = await Promise.all(evaluationPromises);
        
        const evaluationMap = new Map<string, IStudentEvaluation>();
        const totalModules = classroomData.modules?.length || 8;
        
        validStudents.forEach((student, index) => {
          const evaluation = evaluationResults[index];
          if (evaluation) {
            // Recalculate scores to ensure they're up to date
            if (classroomData.evaluationCriteria) {
              const recalculated = EvaluationService.calculateFinalGrade(
                evaluation,
                classroomData.evaluationCriteria,
                totalModules
              );
              evaluationMap.set(student.id, recalculated);
            } else {
              evaluationMap.set(student.id, evaluation);
            }
          } else {
            // Create initial evaluation
            const newEvaluation: IStudentEvaluation = {
              id: `${classroomId}_${student.id}`,
              studentId: student.id,
              classroomId: classroomId,
              moduleId: '', // Will be set when evaluation is done
              participationRecords: [],
              scores: {
                questionnaires: 0,
                attendance: 0,
                participation: 0,
                finalExam: 0,
                customScores: []
              },
              attendanceRecords: [],
              participationPoints: 0,
              totalScore: 0,
              percentage: 0,
              status: 'in-progress',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            evaluationMap.set(student.id, newEvaluation);
          }
        });
        
        setEvaluations(evaluationMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCriteria = async () => {
    if (!classroom) return;
    
    // Validate total points
    const total = criteriaForm.questionnaires + 
                  criteriaForm.attendance + 
                  criteriaForm.participation + 
                  criteriaForm.finalExam +
                  (criteriaForm.customCriteria?.reduce((sum: number, c: ICustomCriterion) => sum + c.points, 0) || 0);
    
    if (total !== 100) {
      toast.error(`Los puntos deben sumar 100. Total actual: ${total}`);
      return;
    }
    
    try {
      setSaving(true);
      await ClassroomService.updateClassroom(classroom.id, {
        evaluationCriteria: criteriaForm
      });
      
      // Update local classroom
      setClassroom({
        ...classroom,
        evaluationCriteria: criteriaForm
      });
      
      toast.success('Criterios de evaluación actualizados');
      setCriteriaModal(false);
      
      // Recalculate all evaluations
      await recalculateAllEvaluations();
    } catch (error) {
      console.error('Error saving criteria:', error);
      toast.error('Error al guardar los criterios');
    } finally {
      setSaving(false);
    }
  };

  const recalculateAllEvaluations = async () => {
    if (!classroom?.evaluationCriteria) return;
    
    const updatedEvaluations = new Map<string, IStudentEvaluation>();
    const totalModules = classroom.modules?.length || 8;
    
    for (const [studentId, evaluation] of Array.from(evaluations.entries())) {
      const updated = EvaluationService.calculateFinalGrade(
        evaluation,
        classroom.evaluationCriteria,
        totalModules
      );
      updatedEvaluations.set(studentId, updated);
    }
    
    setEvaluations(updatedEvaluations);
  };

  const handleAddCustomCriterion = () => {
    const newCriterion: ICustomCriterion = {
      id: `custom_${Date.now()}`,
      name: '',
      points: 0
    };
    setCriteriaForm({
      ...criteriaForm,
      customCriteria: [...(criteriaForm.customCriteria || []), newCriterion]
    });
  };

  const handleRemoveCustomCriterion = (id: string) => {
    setCriteriaForm({
      ...criteriaForm,
      customCriteria: (criteriaForm.customCriteria || []).filter((c: ICustomCriterion) => c.id !== id)
    });
  };

  const handleUpdateCustomCriterion = (id: string, field: 'name' | 'points', value: string | number) => {
    setCriteriaForm({
      ...criteriaForm,
      customCriteria: (criteriaForm.customCriteria || []).map((c: ICustomCriterion) => 
        c.id === id ? { ...c, [field]: value } : c
      )
    });
  };

  const handleOpenEvaluationModal = (student: IUser) => {
    const evaluation = evaluations.get(student.id);
    if (!evaluation || !classroom?.evaluationCriteria) return;
    
    setSelectedStudent(student);
    setEvaluationForm({
      questionnaires: evaluation.scores.questionnaires,
      finalExam: evaluation.scores.finalExam,
      customScores: [...evaluation.scores.customScores]
    });
    setEvaluationModal(true);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedStudent || !classroom?.evaluationCriteria) return;
    
    const evaluation = evaluations.get(selectedStudent.id);
    if (!evaluation) return;
    
    try {
      setSaving(true);
      
      // Update scores
      const updatedEvaluation: IStudentEvaluation = {
        ...evaluation,
        scores: {
          ...evaluation.scores,
          questionnaires: evaluationForm.questionnaires,
          finalExam: evaluationForm.finalExam,
          customScores: evaluationForm.customScores
        },
        status: 'evaluated',
        updatedAt: new Date()
      };
      
      // Calculate final grade
      const totalModules = classroom.modules?.length || 8;
      const finalEvaluation = EvaluationService.calculateFinalGrade(
        updatedEvaluation,
        classroom.evaluationCriteria,
        totalModules
      );
      
      // Save to database
      await EvaluationService.saveEvaluation(finalEvaluation);
      
      // Update local state
      const newEvaluations = new Map(evaluations);
      newEvaluations.set(selectedStudent.id, finalEvaluation);
      setEvaluations(newEvaluations);
      
      toast.success(`Evaluación de ${selectedStudent.firstName} guardada`);
      setEvaluationModal(false);
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Error al guardar la evaluación');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllAsEvaluated = async () => {
    if (!classroom?.evaluationCriteria) return;
    
    try {
      setSaving(true);
      
      const promises: Promise<string>[] = [];
      const newEvaluations = new Map<string, IStudentEvaluation>();
      const totalModules = classroom.modules?.length || 8;
      
      for (const [studentId, evaluation] of Array.from(evaluations.entries())) {
        const finalEvaluation = EvaluationService.calculateFinalGrade(
          { ...evaluation, status: 'evaluated' },
          classroom.evaluationCriteria,
          totalModules
        );
        
        promises.push(
          EvaluationService.saveEvaluation(finalEvaluation)
        );
        newEvaluations.set(studentId, finalEvaluation);
      }
      
      await Promise.all(promises);
      setEvaluations(newEvaluations);
      
      toast.success('Todas las evaluaciones han sido finalizadas');
    } catch (error) {
      console.error('Error marking evaluations as completed:', error);
      toast.error('Error al finalizar las evaluaciones');
    } finally {
      setSaving(false);
    }
  };

  const getClassAverage = (): number => {
    let total = 0;
    let count = 0;
    
    evaluations.forEach(evaluation => {
      if (evaluation.percentage) {
        total += evaluation.percentage;
        count++;
      }
    });
    
    return count > 0 ? total / count : 0;
  };

  const getGradeDistribution = () => {
    const distribution = {
      excellent: 0, // 90-100
      good: 0,      // 80-89
      regular: 0,   // 70-79
      poor: 0       // <70
    };
    
    evaluations.forEach(evaluation => {
      const percentage = evaluation.percentage || 0;
      if (percentage >= 90) distribution.excellent++;
      else if (percentage >= 80) distribution.good++;
      else if (percentage >= 70) distribution.regular++;
      else distribution.poor++;
    });
    
    return distribution;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando evaluaciones...</p>
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

  const distribution = getGradeDistribution();

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Button
            color="link"
            className="p-0 mb-3 text-decoration-none"
            onClick={() => navigate(`/teacher/classroom/${classroomId}`)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver a la Clase
          </Button>
          
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Evaluaciones - {classroom.subject}</h2>
              <p className="text-muted">{classroom.name}</p>
            </div>
            <div>
              <Button
                color="info"
                className="me-2"
                onClick={() => setCriteriaModal(true)}
              >
                <i className="bi bi-gear me-2"></i>
                Configurar Criterios
              </Button>
              <Button
                color="success"
                onClick={handleMarkAllAsEvaluated}
                disabled={saving}
              >
                <i className="bi bi-check-all me-2"></i>
                Finalizar Todas
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h4 className="mb-0">{students.length}</h4>
              <small className="text-muted">Estudiantes</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h4 className="mb-0">{getClassAverage().toFixed(1)}%</h4>
              <small className="text-muted">Promedio de Clase</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h4 className="mb-0 text-success">{distribution.excellent + distribution.good}</h4>
              <small className="text-muted">Aprobados (≥70)</small>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h4 className="mb-0 text-danger">{distribution.poor}</h4>
              <small className="text-muted">Reprobados menos de 70</small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Nav tabs className="mb-3">
        <NavItem>
          <NavLink
            className={activeTab === 'final' ? 'active' : ''}
            onClick={() => setActiveTab('final')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-clipboard-check me-2"></i>
            Evaluación Final
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'summary' ? 'active' : ''}
            onClick={() => setActiveTab('summary')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-graph-up me-2"></i>
            Resumen
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={activeTab}>
        {/* Final Evaluation Tab */}
        <TabPane tabId="final">
          <Card>
            <CardBody>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th className="text-center">Cuestionarios</th>
                    <th className="text-center">Asistencia</th>
                    <th className="text-center">Participación</th>
                    <th className="text-center">Examen Final</th>
                    {classroom.evaluationCriteria?.customCriteria?.map((criterion: ICustomCriterion) => (
                      <th key={criterion.id} className="text-center">
                        {criterion.name}
                      </th>
                    ))}
                    <th className="text-center">Total</th>
                    <th className="text-center">Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const evaluation = evaluations.get(student.id);
                    if (!evaluation) return null;
                    
                    return (
                      <tr key={student.id}>
                        <td>
                          <strong>{student.firstName} {student.lastName}</strong>
                        </td>
                        <td className="text-center">
                          {evaluation.scores.questionnaires}/{classroom.evaluationCriteria?.questionnaires}
                        </td>
                        <td className="text-center">
                          {evaluation.scores.attendance.toFixed(1)}/{classroom.evaluationCriteria?.attendance}
                        </td>
                        <td className="text-center">
                          {evaluation.scores.participation.toFixed(1)}/{classroom.evaluationCriteria?.participation}
                        </td>
                        <td className="text-center">
                          {evaluation.scores.finalExam}/{classroom.evaluationCriteria?.finalExam}
                        </td>
                        {classroom.evaluationCriteria?.customCriteria?.map((criterion: ICustomCriterion) => (
                          <td key={criterion.id} className="text-center">
                            {evaluation.scores.customScores.find(cs => cs.criterionId === criterion.id)?.score || 0}/{criterion.points}
                          </td>
                        ))}
                        <td className="text-center">
                          <Badge color={evaluation.percentage && evaluation.percentage >= 70 ? 'success' : 'danger'}>
                            {evaluation.percentage?.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-center">
                          {evaluation.status === 'evaluated' ? (
                            <Badge color="success">Evaluado</Badge>
                          ) : (
                            <Badge color="warning">En Progreso</Badge>
                          )}
                        </td>
                        <td className="text-center">
                          <Button
                            color="primary"
                            size="sm"
                            onClick={() => handleOpenEvaluationModal(student)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </TabPane>

        {/* Summary Tab */}
        <TabPane tabId="summary">
          <Row>
            <Col md={6}>
              <Card>
                <CardHeader>
                  <h5 className="mb-0">Distribución de Calificaciones</h5>
                </CardHeader>
                <CardBody>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Excelente (90-100)</span>
                      <Badge color="success">{distribution.excellent}</Badge>
                    </div>
                    <Progress value={(distribution.excellent / students.length) * 100} color="success" />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Bueno (80-89)</span>
                      <Badge color="info">{distribution.good}</Badge>
                    </div>
                    <Progress value={(distribution.good / students.length) * 100} color="info" />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Regular (70-79)</span>
                      <Badge color="warning">{distribution.regular}</Badge>
                    </div>
                    <Progress value={(distribution.regular / students.length) * 100} color="warning" />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Deficiente (70)</span>
                      <Badge color="danger">{distribution.poor}</Badge>
                    </div>
                    <Progress value={(distribution.poor / students.length) * 100} color="danger" />
                  </div>
                </CardBody>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card>
                <CardHeader>
                  <h5 className="mb-0">Top Estudiantes</h5>
                </CardHeader>
                <CardBody>
                  <Table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Estudiante</th>
                        <th>Calificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(evaluations.entries())
                        .sort((a, b) => (b[1].percentage || 0) - (a[1].percentage || 0))
                        .slice(0, 5)
                        .map(([studentId, evaluation], index) => {
                          const student = students.find(s => s.id === studentId);
                          return (
                            <tr key={studentId}>
                              <td>{index + 1}</td>
                              <td>{student?.firstName} {student?.lastName}</td>
                              <td>
                                <Badge color="success">
                                  {evaluation.percentage?.toFixed(1)}%
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </TabContent>

      {/* Criteria Configuration Modal */}
      <Modal isOpen={criteriaModal} toggle={() => setCriteriaModal(false)} size="lg">
        <ModalHeader toggle={() => setCriteriaModal(false)}>
          Configurar Criterios de Evaluación
        </ModalHeader>
        <ModalBody>
          <Alert color="info">
            <i className="bi bi-info-circle me-2"></i>
            Los puntos deben sumar exactamente 100
          </Alert>
          
          <Form>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="questionnaires">Cuestionarios (Libro)</Label>
                  <Input
                    type="number"
                    id="questionnaires"
                    value={criteriaForm.questionnaires}
                    onChange={(e) => setCriteriaForm({
                      ...criteriaForm,
                      questionnaires: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    max="100"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="attendance">Asistencia</Label>
                  <Input
                    type="number"
                    id="attendance"
                    value={criteriaForm.attendance}
                    onChange={(e) => setCriteriaForm({
                      ...criteriaForm,
                      attendance: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    max="100"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="participation">Participación (Puntos del Criterio)</Label>
                  <Input
                    type="number"
                    id="participation"
                    value={criteriaForm.participation}
                    onChange={(e) => setCriteriaForm({
                      ...criteriaForm,
                      participation: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    max="100"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="participationPointsPerModule">
                    Puntos por Participación por Clase
                    <small className="text-muted d-block">
                      Puntos requeridos por módulo (1-3)
                    </small>
                  </Label>
                  <Input
                    type="number"
                    id="participationPointsPerModule"
                    value={criteriaForm.participationPointsPerModule}
                    onChange={(e) => setCriteriaForm({
                      ...criteriaForm,
                      participationPointsPerModule: Math.min(Math.max(parseInt(e.target.value) || 1, 1), 3)
                    })}
                    min="1"
                    max="3"
                  />
                  <small className="text-muted">
                    Con {criteriaForm.participationPointsPerModule} punto(s) por clase, 
                    se requieren {(classroom?.modules?.length || 8) * criteriaForm.participationPointsPerModule} puntos 
                    para obtener el 100% de participación
                  </small>
                </FormGroup>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="finalExam">Examen Final / Práctica</Label>
                  <Input
                    type="number"
                    id="finalExam"
                    value={criteriaForm.finalExam}
                    onChange={(e) => setCriteriaForm({
                      ...criteriaForm,
                      finalExam: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    max="100"
                  />
                </FormGroup>
              </Col>
            </Row>
            
            <hr />
            
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Criterios Personalizados</h5>
              <Button color="primary" size="sm" onClick={handleAddCustomCriterion}>
                <i className="bi bi-plus-circle me-2"></i>
                Agregar Criterio
              </Button>
            </div>
            
            {criteriaForm.customCriteria?.map((criterion: ICustomCriterion, index: number) => (
              <Row key={criterion.id} className="mb-2">
                <Col md={6}>
                  <Input
                    type="text"
                    placeholder="Nombre del criterio"
                    value={criterion.name}
                    onChange={(e) => handleUpdateCustomCriterion(criterion.id, 'name', e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Input
                    type="number"
                    placeholder="Puntos"
                    value={criterion.points}
                    onChange={(e) => handleUpdateCustomCriterion(
                      criterion.id, 
                      'points', 
                      parseInt(e.target.value) || 0
                    )}
                    min="0"
                    max="100"
                  />
                </Col>
                <Col md={2}>
                  <Button
                    color="danger"
                    onClick={() => handleRemoveCustomCriterion(criterion.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </Col>
              </Row>
            ))}
            
            <hr />
            
            <div className="text-center">
              <h4>
                Total: {' '}
                <Badge color={
                  criteriaForm.questionnaires + 
                  criteriaForm.attendance + 
                  criteriaForm.participation + 
                  criteriaForm.finalExam +
                  (criteriaForm.customCriteria?.reduce((sum: number, c: ICustomCriterion) => sum + c.points, 0) || 0) === 100
                    ? 'success' 
                    : 'danger'
                }>
                  {criteriaForm.questionnaires + 
                   criteriaForm.attendance + 
                   criteriaForm.participation + 
                   criteriaForm.finalExam +
                   (criteriaForm.customCriteria?.reduce((sum: number, c: ICustomCriterion) => sum + c.points, 0) || 0)} / 100
                </Badge>
              </h4>
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setCriteriaModal(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSaveCriteria} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Criterios'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Student Evaluation Modal */}
      <Modal isOpen={evaluationModal} toggle={() => setEvaluationModal(false)} size="lg">
        <ModalHeader toggle={() => setEvaluationModal(false)}>
          Evaluar - {selectedStudent?.firstName} {selectedStudent?.lastName}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="eval-questionnaires">
                    Cuestionarios (Libro) - Máx: {classroom.evaluationCriteria?.questionnaires}
                  </Label>
                  <Input
                    type="number"
                    id="eval-questionnaires"
                    value={evaluationForm.questionnaires}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      questionnaires: parseFloat(e.target.value) || 0
                    })}
                    min="0"
                    max={classroom.evaluationCriteria?.questionnaires}
                    step="0.1"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="eval-finalExam">
                    Examen Final - Máx: {classroom.evaluationCriteria?.finalExam}
                  </Label>
                  <Input
                    type="number"
                    id="eval-finalExam"
                    value={evaluationForm.finalExam}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      finalExam: parseFloat(e.target.value) || 0
                    })}
                    min="0"
                    max={classroom.evaluationCriteria?.finalExam}
                    step="0.1"
                  />
                </FormGroup>
              </Col>
            </Row>
            
            {classroom.evaluationCriteria?.customCriteria?.map((criterion: ICustomCriterion) => {
              const currentScore = evaluationForm.customScores.find(cs => cs.criterionId === criterion.id);
              return (
                <Row key={criterion.id}>
                  <Col>
                    <FormGroup>
                      <Label for={`eval-custom-${criterion.id}`}>
                        {criterion.name} - Máx: {criterion.points}
                      </Label>
                      <Input
                        type="number"
                        id={`eval-custom-${criterion.id}`}
                        value={currentScore?.score || 0}
                        onChange={(e) => {
                          const newScore = parseFloat(e.target.value) || 0;
                          const updatedScores = evaluationForm.customScores.filter(cs => cs.criterionId !== criterion.id);
                          updatedScores.push({ criterionId: criterion.id, score: newScore });
                          setEvaluationForm({
                            ...evaluationForm,
                            customScores: updatedScores
                          });
                        }}
                        min="0"
                        max={criterion.points}
                        step="0.1"
                      />
                    </FormGroup>
                  </Col>
                </Row>
              );
            })}
            
            <Alert color="info">
              <i className="bi bi-info-circle me-2"></i>
              La asistencia y participación se calculan automáticamente basándose en los registros de cada módulo
            </Alert>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setEvaluationModal(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSaveEvaluation} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Evaluación'}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default EvaluationManager;
