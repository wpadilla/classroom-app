// Complete Evaluation Manager for Teachers

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { UserService } from '../../services/user/user.service';
import { IClassroom, IStudentEvaluation, IUser, IEvaluationCriteria, ICustomCriterion } from '../../models';
import { toast } from 'react-toastify';
import ClassroomFinalizationModal from '../shared/ClassroomFinalizationModal';
import { MobileInfoBanner } from '../../components/common';
import { useSelection } from '../../hooks';
import { generateCertificateBlob, generateCertificateDataUrl } from './certificates/certificate.canvas';
import {
  buildBulkCertificateFileName,
  buildCertificateData,
  buildCertificateFileName,
  isStudentEligibleForCertificate,
} from './certificates/certificate.utils';
import EvaluationHero from './components/EvaluationHero';
import EvaluationStudentsSection, { StudentWithEvaluation } from './components/EvaluationStudentsSection';
import EvaluationSummarySection from './components/EvaluationSummarySection';
import {
  BulkEvaluationDialog,
  EvaluationCriteriaDialog,
  EvaluationFormData,
  StudentEvaluationDialog,
} from './components/EvaluationDialogs';

const EvaluationManager: React.FC = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [classroom, setClassroom] = useState<IClassroom | null>(null);
  const [teacher, setTeacher] = useState<Pick<IUser, 'firstName' | 'lastName'> | null>(null);
  const [students, setStudents] = useState<IUser[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, IStudentEvaluation>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [certificateLoadingId, setCertificateLoadingId] = useState<string | null>(null);
  const [bulkCertificateLoading, setBulkCertificateLoading] = useState(false);
  
  // Modal states
  const [criteriaModal, setCriteriaModal] = useState(false);
  const [evaluationModal, setEvaluationModal] = useState(false);
  const [finalizationModal, setFinalizationModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<IUser | null>(null);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationFormData>({
    questionnaires: 0,
    finalExam: 0,
    customScores: []
  });
  const [isFinalized, setIsFinalized] = useState(false);
  
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

  // Bulk evaluation state
  const evaluationSelection = useSelection();
  const [bulkEvaluationModal, setBulkEvaluationModal] = useState(false);
  const [bulkEvaluationForm, setBulkEvaluationForm] = useState<EvaluationFormData>({
    questionnaires: 0,
    finalExam: 0,
    customScores: []
  });

  const loadData = useCallback(async () => {
    if (!classroomId || !user) return;
    
    try {
      setLoading(true);

      const [classroomData, finalized, classroomEvaluations] = await Promise.all([
        ClassroomService.getClassroomById(classroomId),
        ClassroomService.isFinalized(classroomId),
        EvaluationService.getClassroomEvaluations(classroomId),
      ]);

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
      setIsFinalized(finalized);

      if (classroomData.evaluationCriteria) {
        setCriteriaForm({
          ...classroomData.evaluationCriteria,
          customCriteria: classroomData.evaluationCriteria.customCriteria || [],
          participationPointsPerModule: classroomData.evaluationCriteria.participationPointsPerModule || 1,
        });
      }

      const [teacherData, validStudents] = await Promise.all([
        classroomData.teacherId === user.id
          ? Promise.resolve(user)
          : UserService.getUserById(classroomData.teacherId),
        classroomData.studentIds?.length
          ? UserService.getUsersByIds(classroomData.studentIds)
          : Promise.resolve([]),
      ]);

      setTeacher(teacherData || null);
      setStudents(validStudents);

      const evaluationLookup = new Map<string, IStudentEvaluation>();
      classroomEvaluations.forEach((evaluation) => evaluationLookup.set(evaluation.studentId, evaluation));

      const totalModules = classroomData.modules?.length || 8;
      const evaluationMap = new Map<string, IStudentEvaluation>();

      validStudents.forEach((student) => {
        const existingEvaluation = evaluationLookup.get(student.id);
        if (existingEvaluation) {
          if (classroomData.evaluationCriteria) {
            evaluationMap.set(
              student.id,
              EvaluationService.calculateFinalGrade(
                existingEvaluation,
                classroomData.evaluationCriteria,
                totalModules
              )
            );
          } else {
            evaluationMap.set(student.id, existingEvaluation);
          }
          return;
        }

        evaluationMap.set(student.id, {
          id: `${classroomId}_${student.id}`,
          studentId: student.id,
          classroomId,
          moduleId: '',
          participationRecords: [],
          scores: {
            questionnaires: 0,
            attendance: 0,
            participation: 0,
            finalExam: 0,
            customScores: [],
          },
          attendanceRecords: [],
          participationPoints: 0,
          totalScore: 0,
          percentage: 0,
          status: 'in-progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      setEvaluations(evaluationMap);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [classroomId, navigate, user]);

  useEffect(() => {
    if (classroomId && user) {
      loadData();
    }
  }, [classroomId, user, loadData]);

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
      
      await recalculateAllEvaluations(criteriaForm);
    } catch (error) {
      console.error('Error saving criteria:', error);
      toast.error('Error al guardar los criterios');
    } finally {
      setSaving(false);
    }
  };

  const recalculateAllEvaluations = async (criteria: IEvaluationCriteria | undefined = classroom?.evaluationCriteria) => {
    if (!criteria || !classroom) return;
    
    const updatedEvaluations = new Map<string, IStudentEvaluation>();
    const totalModules = classroom.modules?.length || 8;
    
    for (const [studentId, evaluation] of Array.from(evaluations.entries())) {
      const updated = EvaluationService.calculateFinalGrade(
        evaluation,
        criteria,
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

  const handleSetAllEvaluationMax = useCallback(() => {
    if (!classroom?.evaluationCriteria) return;

    setEvaluationForm({
      questionnaires: classroom.evaluationCriteria.questionnaires,
      finalExam: classroom.evaluationCriteria.finalExam,
      customScores: (classroom.evaluationCriteria.customCriteria || []).map((criterion) => ({
        criterionId: criterion.id,
        score: criterion.points,
      })),
    });
  }, [classroom?.evaluationCriteria]);

  // Bulk evaluation handler
  const handleBulkEvaluation = async () => {
    if (!classroom?.evaluationCriteria || evaluationSelection.selectedIds.size === 0) return;
    
    try {
      setSaving(true);
      
      const selectedIds = Array.from(evaluationSelection.selectedIds);
      const totalModules = classroom.modules?.length || 8;
      const newEvaluations = new Map(evaluations);
      const promises: Promise<string>[] = [];
      
      for (const studentId of selectedIds) {
        const evaluation = evaluations.get(studentId);
        if (!evaluation) continue;
        
        // Update scores
        const updatedEvaluation: IStudentEvaluation = {
          ...evaluation,
          scores: {
            ...evaluation.scores,
            questionnaires: bulkEvaluationForm.questionnaires,
            finalExam: bulkEvaluationForm.finalExam,
            customScores: bulkEvaluationForm.customScores
          },
          status: 'evaluated',
          updatedAt: new Date()
        };
        
        // Calculate final grade
        const finalEvaluation = EvaluationService.calculateFinalGrade(
          updatedEvaluation,
          classroom.evaluationCriteria,
          totalModules
        );
        
        newEvaluations.set(studentId, finalEvaluation);
        promises.push(EvaluationService.saveEvaluation(finalEvaluation));
      }
      
      // Update UI first
      setEvaluations(newEvaluations);
      
      // Save to database
      await Promise.all(promises);
      
      toast.success(`${selectedIds.length} evaluaciones actualizadas`);
      setBulkEvaluationModal(false);
      evaluationSelection.clear();
    } catch (error) {
      console.error('Error saving bulk evaluations:', error);
      toast.error('Error al guardar las evaluaciones');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenBulkEvaluationModal = useCallback(() => {
    setBulkEvaluationForm({
      questionnaires: 0,
      finalExam: 0,
      customScores: classroom?.evaluationCriteria?.customCriteria?.map((criterion) => ({
        criterionId: criterion.id,
        score: 0,
      })) || [],
    });
    setBulkEvaluationModal(true);
  }, [classroom?.evaluationCriteria?.customCriteria]);

  const handleSetAllBulkEvaluationMax = useCallback(() => {
    setBulkEvaluationForm({
      questionnaires: classroom?.evaluationCriteria?.questionnaires || 0,
      finalExam: classroom?.evaluationCriteria?.finalExam || 0,
      customScores: classroom?.evaluationCriteria?.customCriteria?.map((criterion) => ({
        criterionId: criterion.id,
        score: criterion.points,
      })) || [],
    });
  }, [classroom?.evaluationCriteria]);

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

  const classAverage = useMemo(() => {
    let total = 0;
    let count = 0;

    evaluations.forEach((evaluation) => {
      if (evaluation.percentage) {
        total += evaluation.percentage;
        count++;
      }
    });

    return count > 0 ? total / count : 0;
  }, [evaluations]);

  const distribution = useMemo(() => {
    const nextDistribution = {
      excellent: 0,
      good: 0,
      regular: 0,
      poor: 0,
    };

    evaluations.forEach((evaluation) => {
      const percentage = evaluation.percentage || 0;
      if (percentage >= 90) nextDistribution.excellent++;
      else if (percentage >= 80) nextDistribution.good++;
      else if (percentage >= 70) nextDistribution.regular++;
      else nextDistribution.poor++;
    });

    return nextDistribution;
  }, [evaluations]);

  // Students with evaluation data for DataTable - must be before conditional returns
  const studentsWithEvaluation = useMemo(() => {
    return students
      .filter(student => evaluations.has(student.id))
      .map(student => ({
        ...student,
        evaluation: evaluations.get(student.id)!
      }));
  }, [students, evaluations]) as StudentWithEvaluation[];

  const selectedStudentsWithEvaluation = useMemo(() => {
    return studentsWithEvaluation.filter((student) => evaluationSelection.selectedIds.has(student.id));
  }, [studentsWithEvaluation, evaluationSelection.selectedIds]);

  const selectedEligibleCertificateStudents = useMemo(() => {
    return selectedStudentsWithEvaluation.filter((student) => isStudentEligibleForCertificate(student.evaluation));
  }, [selectedStudentsWithEvaluation]);

  const handleDownloadCertificate = async (student: StudentWithEvaluation) => {
    if (!classroom) {
      return;
    }

    if (!isStudentEligibleForCertificate(student.evaluation)) {
      toast.info('Solo puedes generar certificados para estudiantes evaluados y aprobados');
      return;
    }

    try {
      setCertificateLoadingId(student.id);

      const certificate = buildCertificateData({
        classroom,
        student,
        teacher,
      });

      const blob = await generateCertificateBlob(certificate, { format: 'png' });
      saveAs(blob, buildCertificateFileName(certificate.studentName, certificate.subjectName, 'png'));
      toast.success(`Certificado generado para ${certificate.studentName}`);
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('No se pudo generar el certificado');
    } finally {
      setCertificateLoadingId(null);
    }
  };

  const handleBulkCertificateDownload = async () => {
    if (!classroom) {
      return;
    }

    if (selectedStudentsWithEvaluation.length === 0) {
      toast.info('Selecciona al menos un estudiante para generar certificados');
      return;
    }

    if (selectedEligibleCertificateStudents.length === 0) {
      toast.info('Los certificados solo están disponibles para estudiantes evaluados y aprobados');
      return;
    }

    try {
      setBulkCertificateLoading(true);

      const pages = [];
      for (const student of selectedEligibleCertificateStudents) {
        const certificate = buildCertificateData({
          classroom,
          student,
          teacher,
        });

        const imageSrc = await generateCertificateDataUrl(certificate, {
          format: 'jpeg',
          quality: 0.92,
        });

        pages.push({
          id: certificate.id,
          imageSrc,
        });
      }

      const [{ pdf }, { default: CertificatesPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./certificates/CertificatesPdfDocument'),
      ]);

      const blob = await pdf(<CertificatesPdfDocument certificates={pages} />).toBlob();
      saveAs(blob, buildBulkCertificateFileName(classroom));

      if (selectedEligibleCertificateStudents.length < selectedStudentsWithEvaluation.length) {
        toast.info(
          `Se generaron ${selectedEligibleCertificateStudents.length} certificados. ` +
          `${selectedStudentsWithEvaluation.length - selectedEligibleCertificateStudents.length} estudiantes no cumplen los requisitos.`
        );
      } else {
        toast.success(`Se generaron ${selectedEligibleCertificateStudents.length} certificados en PDF`);
      }
    } catch (error) {
      console.error('Error generating bulk certificates:', error);
      toast.error('No se pudo generar el PDF de certificados');
    } finally {
      setBulkCertificateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-1 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-40 rounded-[28px] bg-slate-200" />
          <div className="h-72 rounded-[28px] bg-slate-100" />
          <div className="h-72 rounded-[28px] bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="px-1 py-4">
        <MobileInfoBanner
          icon="bi-exclamation-octagon"
          title="Clase no encontrada"
          description="No pudimos cargar el gestor de evaluaciones para esta clase."
          tone="danger"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1 pb-8 -mx-3 -my-3">
      <EvaluationHero
        classroom={classroom}
        studentCount={students.length}
        classAverage={classAverage}
        approvedCount={distribution.excellent + distribution.good + distribution.regular}
        failedCount={distribution.poor}
        isFinalized={isFinalized}
        saving={saving}
        onBack={() => navigate(`/teacher/classroom/${classroomId}`)}
        onOpenCriteria={() => setCriteriaModal(true)}
        onMarkAllAsEvaluated={handleMarkAllAsEvaluated}
        onOpenFinalization={() => setFinalizationModal(true)}
      />

      {isFinalized && (
        <MobileInfoBanner
          icon="bi-flag"
          title="Clase finalizada"
          description="Los estudiantes fueron movidos al historial. Revierta la finalización si necesita editar notas o criterios."
          tone="warning"
        />
      )}

      <EvaluationStudentsSection
        classroom={classroom}
        students={studentsWithEvaluation}
        selectedIds={evaluationSelection.selectedIds}
        isFinalized={isFinalized}
        certificateLoadingId={certificateLoadingId}
        bulkCertificateLoading={bulkCertificateLoading}
        onSelectionChange={evaluationSelection.setSelectedIds}
        onDownloadCertificate={handleDownloadCertificate}
        onOpenEvaluationModal={handleOpenEvaluationModal}
        onBulkDownloadCertificates={handleBulkCertificateDownload}
        onOpenBulkEvaluation={handleOpenBulkEvaluationModal}
        onClearSelection={evaluationSelection.clear}
      />

      <EvaluationSummarySection
        classroom={classroom}
        students={students}
        evaluations={evaluations}
        classAverage={classAverage}
        distribution={distribution}
      />

      <EvaluationCriteriaDialog
        isOpen={criteriaModal}
        saving={saving}
        classroom={classroom}
        criteriaForm={criteriaForm}
        onClose={() => setCriteriaModal(false)}
        onSave={handleSaveCriteria}
        onChange={setCriteriaForm}
        onAddCustomCriterion={handleAddCustomCriterion}
        onRemoveCustomCriterion={handleRemoveCustomCriterion}
        onUpdateCustomCriterion={handleUpdateCustomCriterion}
      />

      <StudentEvaluationDialog
        isOpen={evaluationModal}
        classroom={classroom}
        selectedStudent={selectedStudent}
        evaluationForm={evaluationForm}
        saving={saving}
        onClose={() => setEvaluationModal(false)}
        onSave={handleSaveEvaluation}
        onChange={setEvaluationForm}
        onSetAllMax={handleSetAllEvaluationMax}
      />

      <ClassroomFinalizationModal
        isOpen={finalizationModal}
        onClose={() => setFinalizationModal(false)}
        classroom={classroom}
        onSuccess={loadData}
      />

      <BulkEvaluationDialog
        isOpen={bulkEvaluationModal}
        classroom={classroom}
        selectedCount={evaluationSelection.selectedIds.size}
        bulkEvaluationForm={bulkEvaluationForm}
        saving={saving}
        onClose={() => setBulkEvaluationModal(false)}
        onSave={handleBulkEvaluation}
        onChange={setBulkEvaluationForm}
        onSetAllMax={handleSetAllBulkEvaluationMax}
      />
    </div>
  );
};

export default EvaluationManager;
