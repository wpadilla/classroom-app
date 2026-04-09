// Shared Classroom Management Component - Works for both Teachers and Admins
// Mobile-First Design

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'reactstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StudentEnrollment from './StudentEnrollment';
import ClassroomFinalizationModal from './ClassroomFinalizationModal';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { ProgramService } from '../../services/program/program.service';
import { PaymentService } from '../../services/payment/payment.service';
import {
  IClassroom,
  IUser,
  IModule,
  IStudentEvaluation,
  IAttendanceRecord,
  IClassroomResource,
  IClassroomPaymentCost,
  IClassroomPaymentCostItem,
  IClassroomStudentPayment,
  IClassroomStudentPaymentStatus,
  PaymentMethod,
  PaymentItemStatus,
  PaymentItemType,
} from '../../models';

import { useOffline } from '../../contexts/OfflineContext';
import { GCloudService } from '../../services/gcloud/gcloud.service';
import { validateFileSize } from '../../utils/fileUtils';
import { ClassroomReportPdfDownloadButton } from '../../components/pdf/components/ClassroomReportPdfDownloadButton';
import { MobileInfoBanner } from '../../components/common';
import SectionHeader from '../../components/student/SectionHeader';
import { useSelection } from '../../hooks';
import BulkAttendanceDialog from './components/BulkAttendanceDialog';
import ScoreInputDialog from './components/ScoreInputDialog';
import BulkParticipationDialog from './components/BulkParticipationDialog';
import ClassroomHero from './components/classroom-management/ClassroomHero';
import ClassroomModuleProgress from './components/classroom-management/ClassroomModuleProgress';
import ClassroomAttendanceSection from './components/classroom-management/ClassroomAttendanceSection';
import ClassroomParticipationSection from './components/classroom-management/ClassroomParticipationSection';
import ClassroomEvaluationSection from './components/classroom-management/ClassroomEvaluationSection';
import ClassroomResourcesSection from './components/classroom-management/ClassroomResourcesSection';
import ClassroomPaymentsSection from './components/classroom-management/ClassroomPaymentsSection';
import {
  ClassroomDownloadProgressDialog,
  ClassroomPaymentDialog,
  ClassroomPaymentFormState,
  ClassroomWhatsappDialog,
} from './components/classroom-management/ClassroomDialogs';

const ClassroomManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOffline, pendingOperations } = useOffline();

  // State
  const [classroom, setClassroom] = useState<IClassroom | null>(null);
  const [students, setStudents] = useState<IUser[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, IStudentEvaluation>>(new Map());
  const [currentModule, setCurrentModule] = useState<IModule | null>(null);
  const [loading, setLoading] = useState(true);

  // WhatsApp state
  const [whatsappDropdownOpen, setWhatsappDropdownOpen] = useState(false);
  const [whatsappMessageModal, setWhatsappMessageModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [syncingGroup, setSyncingGroup] = useState(false);

  // Finalization state
  const [finalizationModal, setFinalizationModal] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

  // Attendance state - Now per module
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, boolean>>(new Map());
  const attendanceSelection = useSelection();
  const [bulkAttendanceOpen, setBulkAttendanceOpen] = useState(false);

  // Participation state - Track total participation including pending changes
  const [participationTotals, setParticipationTotals] = useState<Map<string, number>>(new Map());
  const participationSelection = useSelection();
  const [bulkParticipationOpen, setBulkParticipationOpen] = useState(false);

  // Score input dialog
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [scoreDialogData, setScoreDialogData] = useState<{
    studentId: string;
    studentName: string;
    currentScore: number;
  } | null>(null);

  // Resources search
  const [resourcesSearchQuery, setResourcesSearchQuery] = useState('');

  // Resources state
  const [uploadingResource, setUploadingResource] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadingFileName, setDownloadingFileName] = useState('');

  // Payments state (admin-only)
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentCosts, setPaymentCosts] = useState<IClassroomPaymentCost | null>(null);
  const [paymentCostItems, setPaymentCostItems] = useState<IClassroomPaymentCostItem[]>([]);
  
  // Payments search queries
  const [paymentsStudentsSearchQuery, setPaymentsStudentsSearchQuery] = useState('');
  const [paymentsSearchQuery, setPaymentsSearchQuery] = useState('');
  const [studentPayments, setStudentPayments] = useState<IClassroomStudentPayment[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<IClassroomStudentPaymentStatus[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentProgramName, setPaymentProgramName] = useState('');
  const [paymentFilterStudentId, setPaymentFilterStudentId] = useState('');
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPaymentReceiptUrl, setEditingPaymentReceiptUrl] = useState<string | undefined>(undefined);
  const [editingPaymentReceiptName, setEditingPaymentReceiptName] = useState<string | undefined>(undefined);
  const [paymentForm, setPaymentForm] = useState<ClassroomPaymentFormState>({
    studentId: '',
    amount: '',
    method: 'cash' as PaymentMethod,
    comment: '',
    appliedItemIds: [] as string[],
    receiptFile: null as File | null,
  });
  const [costForm, setCostForm] = useState({
    title: '',
    description: '',
    amount: '',
    required: true,
    type: 'custom' as PaymentItemType,
  });
  const [editingCostId, setEditingCostId] = useState<string | null>(null);

  const evaluationsRef = useRef<Map<string, IStudentEvaluation>>(new Map());
  const attendanceRecordsRef = useRef<Map<string, boolean>>(new Map());
  const participationTotalsRef = useRef<Map<string, number>>(new Map());
  const evaluationWriteQueuesRef = useRef<Map<string, Promise<void>>>(new Map());

  const replaceEvaluations = useCallback((next: Map<string, IStudentEvaluation>) => {
    evaluationsRef.current = next;
    setEvaluations(next);
  }, []);

  const replaceAttendanceRecords = useCallback((next: Map<string, boolean>) => {
    attendanceRecordsRef.current = next;
    setAttendanceRecords(next);
  }, []);

  const replaceParticipationTotals = useCallback((next: Map<string, number>) => {
    participationTotalsRef.current = next;
    setParticipationTotals(next);
  }, []);

  const buildOptimisticEvaluation = useCallback((studentId: string, overrides: Partial<IStudentEvaluation> = {}): IStudentEvaluation => {
    const now = new Date();

    return {
      id: overrides.id || '',
      studentId,
      classroomId: id || '',
      moduleId: overrides.moduleId || currentModule?.id || '',
      participationRecords: overrides.participationRecords || [],
      scores: overrides.scores || {
        questionnaires: 0,
        attendance: 0,
        participation: 0,
        finalExam: 0,
        customScores: [],
      },
      attendanceRecords: overrides.attendanceRecords || [],
      participationPoints: overrides.participationPoints ?? 0,
      totalScore: overrides.totalScore ?? 0,
      percentage: overrides.percentage ?? 0,
      status: overrides.status || 'in-progress',
      letterGrade: overrides.letterGrade,
      isActive: overrides.isActive ?? true,
      evaluatedBy: overrides.evaluatedBy,
      evaluatedAt: overrides.evaluatedAt,
      comments: overrides.comments,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
    };
  }, [currentModule?.id, id]);

  const updateStudentEvaluation = useCallback((
    studentId: string,
    updater: (current: IStudentEvaluation | undefined) => IStudentEvaluation
  ) => {
    const nextEvaluations = new Map(evaluationsRef.current);
    const updatedEvaluation = updater(nextEvaluations.get(studentId));
    nextEvaluations.set(studentId, updatedEvaluation);
    replaceEvaluations(nextEvaluations);
    return updatedEvaluation;
  }, [replaceEvaluations]);

  const mergePersistedEvaluation = useCallback((studentId: string, persistedEvaluation: IStudentEvaluation) => {
    updateStudentEvaluation(studentId, (current) => {
      if (!current) {
        return persistedEvaluation;
      }

      return {
        ...persistedEvaluation,
        ...current,
        id: persistedEvaluation.id,
        createdAt: current.createdAt || persistedEvaluation.createdAt,
        updatedAt: persistedEvaluation.updatedAt,
      };
    });
  }, [updateStudentEvaluation]);

  const enqueueEvaluationWrite = useCallback((studentId: string, task: () => Promise<void>) => {
    const previousTask = evaluationWriteQueuesRef.current.get(studentId) || Promise.resolve();
    const nextTask = previousTask
      .catch(() => undefined)
      .then(task);

    evaluationWriteQueuesRef.current.set(studentId, nextTask);
    nextTask.finally(() => {
      if (evaluationWriteQueuesRef.current.get(studentId) === nextTask) {
        evaluationWriteQueuesRef.current.delete(studentId);
      }
    });

    return nextTask;
  }, []);

  // Calculate max participation points based on classroom configuration
  // Formula: totalModules × participationPointsPerModule
  const maxParticipationPoints = useMemo(() => {
    if (!classroom) return 8; // Default fallback
    const totalModules = classroom.modules?.length || 8;
    const pointsPerModule = classroom.evaluationCriteria?.participationPointsPerModule || 1;
    return totalModules * pointsPerModule;
  }, [classroom]);

  const completedModules = useMemo(
    () => classroom?.modules.filter((module) => module.isCompleted).length || 0,
    [classroom]
  );

  const currentModuleLabel = useMemo(() => {
    if (!currentModule) {
      return 'Pendiente';
    }

    return `S${currentModule.weekNumber}`;
  }, [currentModule]);

  const handleBackNavigation = useCallback(() => {
    navigate(user?.role === 'admin' ? '/admin/classrooms' : '/teacher/dashboard');
  }, [navigate, user?.role]);

  const loadClassroomData = useCallback(async () => {
    if (!id || !user) return; // Ensure user is available for permission checks

    setLoading(true);
    try {
      let classroomData = await ClassroomService.getClassroomById(id);

      if (!classroomData) {
        toast.error('Clase no encontrada');
        navigate(user.role === 'admin' ? '/admin/classrooms' : '/teacher/dashboard');
        return;
      }

      // Check permissions
      if (user.role !== 'admin' && classroomData.teacherId !== user.id) {
        toast.error('No tienes permiso para acceder a esta clase');
        navigate('/teacher/dashboard');
        return;
      }

      const offlineModulePromise = isOffline
        ? import('../../services/offline/offline-storage.service')
        : Promise.resolve(null);

      const [evaluationsData, finalized, offlineModule] = await Promise.all([
        EvaluationService.getClassroomEvaluations(id),
        ClassroomService.isFinalized(id),
        offlineModulePromise,
      ]);

      if (isOffline && offlineModule) {
        const { OfflineStorageService } = offlineModule;
        const localClassroom = OfflineStorageService.getLocalClassroom(id);
        if (localClassroom && localClassroom.studentIds) {
          classroomData = { ...classroomData, studentIds: localClassroom.studentIds };
        }
      }

      let studentsData: IUser[] = [];
      if (classroomData.studentIds && classroomData.studentIds.length > 0) {
        const classroomStudentIds = classroomData.studentIds;
        studentsData = await UserService.getUsersByIds(classroomData.studentIds);

        if (isOffline && offlineModule) {
          const { OfflineStorageService } = offlineModule;
          const localStudents = OfflineStorageService.getLocalStudents();

          const additionalStudents = localStudents.filter((student) =>
            classroomStudentIds.includes(student.id) && !studentsData.find((item) => item.id === student.id)
          );
          studentsData = [...studentsData, ...additionalStudents];
        }
      }

      setClassroom(classroomData);
      setIsFinalized(finalized);
      setStudents(studentsData);
      const evalMap = new Map<string, IStudentEvaluation>();
      evaluationsData.forEach((evaluation) => evalMap.set(evaluation.studentId, evaluation));
      replaceEvaluations(evalMap);

      const activeModule =
        classroomData.modules?.find((module) => !module?.isCompleted) ||
        classroomData.modules?.[classroomData.modules.length - 1] ||
        null;
      setCurrentModule(activeModule);

      const attendanceMap = new Map<string, boolean>();
      const participationMap = new Map<string, number>();

      evaluationsData.forEach((evaluation) => {
        if (activeModule) {
          const record = evaluation.attendanceRecords?.find((item) => item.moduleId === activeModule.id);
          if (record) {
            attendanceMap.set(evaluation.studentId, record.isPresent);
          }
        }

        participationMap.set(evaluation.studentId, evaluation.participationPoints || 0);
      });

      replaceAttendanceRecords(attendanceMap);
      replaceParticipationTotals(participationMap);

      if (user.role === 'admin') {
        await loadPayments(classroomData);
      }

    } catch (error) {
      console.error('Error loading classroom data:', error);
      toast.error('Error al cargar los datos de la clase');
    } finally {
      setLoading(false);
    }
  // loadPayments depends on user role and is declared below; keeping this callback stable avoids redundant reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isOffline, navigate, replaceAttendanceRecords, replaceEvaluations, replaceParticipationTotals, user]);

  const loadModuleAttendance = useCallback(() => {
    if (!currentModule) return;

    const attendanceMap = new Map<string, boolean>();

    evaluations.forEach((evaluation, studentId) => {
      const moduleAttendance = evaluation.attendanceRecords?.find(
        record => record.moduleId === currentModule.id
      );

      if (moduleAttendance) {
        attendanceMap.set(studentId, moduleAttendance.isPresent);
      }
    });

    replaceAttendanceRecords(attendanceMap);
  }, [currentModule, evaluations, replaceAttendanceRecords]);

  const loadParticipationTotals = useCallback(() => {
    const totalsMap = new Map<string, number>();

    evaluations.forEach((evaluation, studentId) => {
      const total = evaluation.participationPoints || 0;
      totalsMap.set(studentId, total);
    });

    replaceParticipationTotals(totalsMap);
  }, [evaluations, replaceParticipationTotals]);

  const buildDefaultCostItems = (targetClassroom: IClassroom, monthlyFee?: number) => {
    const items: IClassroomPaymentCostItem[] = [];
    const now = new Date();

    if (targetClassroom.materialPrice && targetClassroom.materialPrice > 0) {
      items.push({
        id: `cost-material-${Date.now()}`,
        title: 'Material',
        description: 'Costo de material',
        amount: targetClassroom.materialPrice,
        required: true,
        type: 'material',
        createdAt: now,
        updatedAt: now,
      });
    }

    if (monthlyFee && monthlyFee > 0) {
      items.push({
        id: `cost-fee-${Date.now() + 1}`,
        title: 'Cuota mensual',
        description: 'Cuota mensual del programa',
        amount: monthlyFee,
        required: true,
        type: 'fee',
        createdAt: now,
        updatedAt: now,
      });
    }

    return items;
  };

  const loadPayments = useCallback(async (targetClassroom: IClassroom) => {
    if (!user || user.role !== 'admin') return;

    setPaymentsLoading(true);
    try {
      const [costDoc, payments, statuses, program] = await Promise.all([
        PaymentService.getClassroomPaymentCosts(targetClassroom.id),
        PaymentService.getClassroomPayments(targetClassroom.id),
        PaymentService.getClassroomPaymentStatuses(targetClassroom.id),
        ProgramService.getProgramById(targetClassroom.programId),
      ]);

      setPaymentProgramName(program?.name || '');

      let nextCostDoc = costDoc;
      if (!nextCostDoc) {
        const defaultItems = buildDefaultCostItems(targetClassroom, program?.monthlyFee || 0);
        if (defaultItems.length > 0) {
          const newId = await PaymentService.saveClassroomPaymentCosts(targetClassroom.id, defaultItems);
          nextCostDoc = {
            id: newId,
            classroomId: targetClassroom.id,
            items: defaultItems,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }

      setPaymentCosts(nextCostDoc || null);
      setPaymentCostItems(nextCostDoc?.items || []);
      setStudentPayments(payments);
      setPaymentStatuses(statuses);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Error al cargar pagos');
    } finally {
      setPaymentsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (id && user) {
      loadClassroomData();
    }
  }, [id, user, isOffline, loadClassroomData]);

  useEffect(() => {
    if (currentModule && evaluations.size > 0) {
      loadModuleAttendance();
      loadParticipationTotals();
    }
  }, [currentModule, evaluations, loadModuleAttendance, loadParticipationTotals]);

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const map: Record<PaymentMethod, string> = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
      card: 'Tarjeta',
      check: 'Cheque',
      mobile: 'Pago movil',
      other: 'Otro',
    };
    return map[method] || method;
  };

  const getStatusForItem = (studentId: string, itemId: string): PaymentItemStatus => {
    const statusDoc = paymentStatuses.find(s => s.studentId === studentId);
    const itemStatus = statusDoc?.items.find(i => i.itemId === itemId);
    return itemStatus?.status || 'unpaid';
  };

  const handleStatusChange = async (studentId: string, itemId: string, status: PaymentItemStatus) => {
    if (!user || user.role !== 'admin' || !classroom) return;

    const existing = paymentStatuses.find(s => s.studentId === studentId);
    const nextItems = existing
      ? existing.items.map(item =>
          item.itemId === itemId
            ? { ...item, status, updatedAt: new Date(), updatedBy: user.id }
            : item
        )
      : [];

    if (!existing || !existing.items.some(item => item.itemId === itemId)) {
      nextItems.push({ itemId, status, updatedAt: new Date(), updatedBy: user.id });
    }

    try {
      const id = await PaymentService.saveStudentPaymentStatus(
        classroom.id,
        studentId,
        nextItems,
        existing?.id
      );

      const nextStatuses = existing
        ? paymentStatuses.map(s => (s.studentId === studentId ? { ...s, items: nextItems } : s))
        : [
            ...paymentStatuses,
            {
              id,
              classroomId: classroom.id,
              studentId,
              items: nextItems,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];

      setPaymentStatuses(nextStatuses);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const resetCostForm = () => {
    setCostForm({
      title: '',
      description: '',
      amount: '',
      required: true,
      type: 'custom',
    });
    setEditingCostId(null);
  };

  const resetPaymentForm = useCallback(() => {
    setEditingPaymentId(null);
    setEditingPaymentReceiptUrl(undefined);
    setEditingPaymentReceiptName(undefined);
    setPaymentForm({
      studentId: '',
      amount: '',
      method: 'cash',
      comment: '',
      appliedItemIds: [],
      receiptFile: null,
    });
  }, []);

  const closePaymentModal = useCallback(() => {
    setPaymentModalOpen(false);
    resetPaymentForm();
  }, [resetPaymentForm]);

  const updatePaymentForm = useCallback(
    <K extends keyof ClassroomPaymentFormState>(field: K, value: ClassroomPaymentFormState[K]) => {
      setPaymentForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateCostForm = useCallback(
    (field: 'title' | 'description' | 'amount' | 'required' | 'type', value: string | boolean) => {
      setCostForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSaveCostItem = async () => {
    if (!classroom) return;
    if (!costForm.title.trim() || !costForm.amount) {
      toast.error('Complete el titulo y el monto');
      return;
    }

    const amount = Number(costForm.amount);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error('Monto invalido');
      return;
    }

    const now = new Date();
    const nextItems = editingCostId
      ? paymentCostItems.map(item =>
          item.id === editingCostId
            ? {
                ...item,
                title: costForm.title.trim(),
                description: costForm.description.trim() || undefined,
                amount,
                required: costForm.required,
                type: costForm.type,
                updatedAt: now,
              }
            : item
        )
      : [
          ...paymentCostItems,
          {
            id: `cost-${Date.now()}`,
            title: costForm.title.trim(),
            description: costForm.description.trim() || undefined,
            amount,
            required: costForm.required,
            type: costForm.type,
            createdAt: now,
            updatedAt: now,
          },
        ];

    try {
      const savedId = await PaymentService.saveClassroomPaymentCosts(
        classroom.id,
        nextItems,
        paymentCosts?.id
      );

      setPaymentCosts(
        paymentCosts
          ? { ...paymentCosts, items: nextItems }
          : { id: savedId, classroomId: classroom.id, items: nextItems, createdAt: now, updatedAt: now }
      );
      setPaymentCostItems(nextItems);
      resetCostForm();
      toast.success('Costo guardado');
    } catch (error) {
      console.error('Error saving cost item:', error);
      toast.error('Error al guardar el costo');
    }
  };

  const handleEditCostItem = (item: IClassroomPaymentCostItem) => {
    setCostForm({
      title: item.title,
      description: item.description || '',
      amount: String(item.amount),
      required: item.required,
      type: item.type,
    });
    setEditingCostId(item.id);
  };

  const handleDeleteCostItem = async (itemId: string) => {
    if (!classroom) return;
    if (!window.confirm('Desea eliminar este costo?')) return;

    const nextItems = paymentCostItems.filter(item => item.id !== itemId);
    try {
      const savedId = await PaymentService.saveClassroomPaymentCosts(
        classroom.id,
        nextItems,
        paymentCosts?.id
      );
      setPaymentCosts(
        paymentCosts
          ? { ...paymentCosts, items: nextItems }
          : { id: savedId, classroomId: classroom.id, items: nextItems, createdAt: new Date(), updatedAt: new Date() }
      );
      setPaymentCostItems(nextItems);
      toast.success('Costo eliminado');
    } catch (error) {
      console.error('Error deleting cost item:', error);
      toast.error('Error al eliminar el costo');
    }
  };

  const handlePaymentItemToggle = (itemId: string) => {
    setPaymentForm(prev => {
      const exists = prev.appliedItemIds.includes(itemId);
      return {
        ...prev,
        appliedItemIds: exists
          ? prev.appliedItemIds.filter(id => id !== itemId)
          : [...prev.appliedItemIds, itemId],
      };
    });
  };

  const handlePaymentSubmit = async () => {
    if (!classroom || !user) return;
    if (!paymentForm.studentId || !paymentForm.amount) {
      toast.error('Complete estudiante y monto');
      return;
    }

    const amount = Number(paymentForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Monto invalido');
      return;
    }

    try {
      let receiptUrl = editingPaymentReceiptUrl;
      let receiptName = editingPaymentReceiptName;
      if (paymentForm.receiptFile) {
        if (!validateFileSize(paymentForm.receiptFile, 20)) {
          toast.error('El comprobante no debe superar los 20MB');
          return;
        }
        receiptUrl = await GCloudService.uploadFile(
          paymentForm.receiptFile,
          `payment-${classroom.id}-${paymentForm.studentId}`
        );
        receiptName = paymentForm.receiptFile.name;
      }

      if (editingPaymentId) {
        await PaymentService.updateStudentPayment(editingPaymentId, {
          studentId: paymentForm.studentId,
          amount,
          method: paymentForm.method,
          comment: paymentForm.comment.trim() || undefined,
          receiptUrl,
          receiptName,
          appliedItemIds: paymentForm.appliedItemIds,
        });

        setStudentPayments(prev =>
          prev.map(payment =>
            payment.id === editingPaymentId
              ? {
                  ...payment,
                  studentId: paymentForm.studentId,
                  amount,
                  method: paymentForm.method,
                  comment: paymentForm.comment.trim() || undefined,
                  receiptUrl,
                  receiptName,
                  appliedItemIds: paymentForm.appliedItemIds,
                  updatedAt: new Date(),
                }
              : payment
          )
        );
        toast.success('Pago actualizado');
      } else {
        const newPayment: Omit<IClassroomStudentPayment, 'id' | 'createdAt' | 'updatedAt'> = {
          classroomId: classroom.id,
          studentId: paymentForm.studentId,
          amount,
          method: paymentForm.method,
          comment: paymentForm.comment.trim() || undefined,
          receiptUrl,
          receiptName,
          appliedItemIds: paymentForm.appliedItemIds,
          createdBy: user.id,
        };

        const id = await PaymentService.addStudentPayment(newPayment);
        setStudentPayments(prev => [
          {
            ...newPayment,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...prev,
        ]);
        toast.success('Pago registrado');
      }

      closePaymentModal();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error('Error al guardar pago');
    }
  };

  const handleEditPayment = (payment: IClassroomStudentPayment) => {
    setEditingPaymentId(payment.id);
    setEditingPaymentReceiptUrl(payment.receiptUrl);
    setEditingPaymentReceiptName(payment.receiptName);
    setPaymentForm({
      studentId: payment.studentId,
      amount: String(payment.amount),
      method: payment.method,
      comment: payment.comment || '',
      appliedItemIds: payment.appliedItemIds || [],
      receiptFile: null,
    });
    setPaymentModalOpen(true);
  };

  const handleDeletePayment = async (payment: IClassroomStudentPayment) => {
    if (!window.confirm('Desea eliminar este pago?')) return;

    try {
      await PaymentService.deleteStudentPayment(payment.id);
      setStudentPayments(prev => prev.filter(item => item.id !== payment.id));
      toast.success('Pago eliminado');
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Error al eliminar pago');
    }
  };

  const handleCreateWhatsappGroup = async () => {
    if (!id) return;

    try {
      setCreatingGroup(true);
      await ClassroomService.createWhatsappGroup(id);
      toast.success('Grupo de WhatsApp creado exitosamente');
      await loadClassroomData();
    } catch (error: any) {
      console.error('Error creating WhatsApp group:', error);
      toast.error(error.message || 'Error al crear grupo de WhatsApp');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSyncWhatsappGroup = async () => {
    if (!id) return;

    try {
      setSyncingGroup(true);
      await ClassroomService.syncWhatsappGroup(id);
      toast.success('Grupo sincronizado exitosamente');
      await loadClassroomData();
    } catch (error: any) {
      console.error('Error syncing WhatsApp group:', error);
      toast.error(error.message || 'Error al sincronizar grupo');
    } finally {
      setSyncingGroup(false);
    }
  };

  const handleSendWhatsappMessage = async () => {
    if (!id || !whatsappMessage.trim()) {
      toast.error('Por favor ingrese un mensaje');
      return;
    }

    try {
      setSendingMessage(true);
      await ClassroomService.sendWhatsappMessage(id, whatsappMessage);
      toast.success('Mensaje enviado exitosamente');
      setWhatsappMessage('');
      setWhatsappMessageModal(false);
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      toast.error(error.message || 'Error al enviar mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAttendanceChange = async (studentId: string, isPresent: boolean) => {
    if (!id || !currentModule || !user) return;

    const previousAttendance = attendanceRecordsRef.current.get(studentId);
    const now = new Date();
    const nextAttendance = new Map(attendanceRecordsRef.current);
    nextAttendance.set(studentId, isPresent);
    replaceAttendanceRecords(nextAttendance);

    updateStudentEvaluation(studentId, (current) => {
      const evaluation = current || buildOptimisticEvaluation(studentId);
      const updatedRecords = [...(evaluation.attendanceRecords || [])];
      const existingIndex = updatedRecords.findIndex((record) => record.moduleId === currentModule.id);

      const newRecord: IAttendanceRecord = {
        moduleId: currentModule.id,
        studentId,
        isPresent,
        date: now,
        markedBy: user.id,
        markedAt: now,
      };

      if (existingIndex >= 0) {
        updatedRecords[existingIndex] = newRecord;
      } else {
        updatedRecords.push(newRecord);
      }

      return {
        ...evaluation,
        moduleId: evaluation.moduleId || currentModule.id,
        attendanceRecords: updatedRecords,
        scores: {
          ...evaluation.scores,
          attendance: EvaluationService.calculateAttendanceScore(updatedRecords),
        },
        updatedAt: now,
      };
    });

    try {
      await enqueueEvaluationWrite(studentId, async () => {
        const persistedEvaluation = await EvaluationService.saveAttendanceState(
          studentId,
          id,
          currentModule.id,
          isPresent,
          user.id,
          evaluationsRef.current.get(studentId)
        );
        mergePersistedEvaluation(studentId, persistedEvaluation);
      });
    } catch (error) {
      console.error('Error saving attendance:', error);
      const revertedAttendance = new Map(attendanceRecordsRef.current);
      if (previousAttendance === undefined) {
        revertedAttendance.delete(studentId);
      } else {
        revertedAttendance.set(studentId, previousAttendance);
      }
      replaceAttendanceRecords(revertedAttendance);
      await loadClassroomData();
      toast.error('Error al guardar asistencia');
    }
  };

  // Handle bulk attendance change (avoids state conflicts from multiple updates)
  const handleBulkAttendanceChange = async (studentIds: string[], isPresent: boolean) => {
    if (!id || !currentModule || !user) return;

    const now = new Date();
    const nextAttendance = new Map(attendanceRecordsRef.current);
    studentIds.forEach((studentId) => {
      nextAttendance.set(studentId, isPresent);
    });
    replaceAttendanceRecords(nextAttendance);

    const nextEvaluations = new Map(evaluationsRef.current);
    studentIds.forEach((studentId) => {
      const evaluation = nextEvaluations.get(studentId) || buildOptimisticEvaluation(studentId);
      const updatedRecords = [...(evaluation.attendanceRecords || [])];
      const existingIndex = updatedRecords.findIndex((record) => record.moduleId === currentModule.id);

      const newRecord: IAttendanceRecord = {
        moduleId: currentModule.id,
        studentId,
        isPresent,
        date: now,
        markedBy: user.id,
        markedAt: now,
      };

      if (existingIndex >= 0) {
        updatedRecords[existingIndex] = newRecord;
      } else {
        updatedRecords.push(newRecord);
      }

      nextEvaluations.set(studentId, {
        ...evaluation,
        moduleId: evaluation.moduleId || currentModule.id,
        attendanceRecords: updatedRecords,
        scores: {
          ...evaluation.scores,
          attendance: EvaluationService.calculateAttendanceScore(updatedRecords),
        },
        updatedAt: now,
      });
    });
    replaceEvaluations(nextEvaluations);

    let successCount = 0;
    let errorCount = 0;

    const results = await Promise.all(
      studentIds.map(async (studentId) => {
        try {
          await enqueueEvaluationWrite(studentId, async () => {
            const persistedEvaluation = await EvaluationService.saveAttendanceState(
              studentId,
              id,
              currentModule.id,
              isPresent,
              user.id,
              evaluationsRef.current.get(studentId)
            );
            mergePersistedEvaluation(studentId, persistedEvaluation);
          });
          return { ok: true as const };
        } catch (error) {
          console.error(`Error saving attendance for student ${studentId}:`, error);
          return { ok: false as const };
        }
      })
    );

    results.forEach((result) => {
      if (result.ok) {
        successCount++;
      } else {
        errorCount++;
      }
    });

    if (successCount > 0) {
      toast.success(
        `Asistencia registrada para ${successCount} estudiante${successCount !== 1 ? 's' : ''}`
      );
    }

    if (errorCount > 0) {
      toast.error(
        `Error al registrar ${errorCount} estudiante${errorCount !== 1 ? 's' : ''}`
      );
      // On error, reload to get accurate state
      await loadClassroomData();
    }
  };

  const handleParticipationChange = async (studentId: string, points: number) => {
    if (!id) return;

    const currentPoints = participationTotalsRef.current.get(studentId) || 0;
    const newPoints = Math.max(0, Math.min(maxParticipationPoints, currentPoints + points));

    if (newPoints === currentPoints) {
      return;
    }

    const newTotals = new Map(participationTotalsRef.current);
    newTotals.set(studentId, newPoints);
    replaceParticipationTotals(newTotals);

    updateStudentEvaluation(studentId, (current) => {
      const evaluation = current || buildOptimisticEvaluation(studentId);
      return {
        ...evaluation,
        participationPoints: newPoints,
        updatedAt: new Date(),
      };
    });

    try {
      await enqueueEvaluationWrite(studentId, async () => {
        const persistedEvaluation = await EvaluationService.saveParticipationPoints(
          studentId,
          id,
          newPoints,
          evaluationsRef.current.get(studentId)
        );
        mergePersistedEvaluation(studentId, persistedEvaluation);
      });
    } catch (error) {
      console.error('Error recording participation:', error);
      toast.error('Error al registrar participación');
      newTotals.set(studentId, currentPoints);
      replaceParticipationTotals(new Map(newTotals));
      await loadClassroomData();
    }
  };

  // Handle score dialog save
  const handleScoreSave = async (newScore: number) => {
    if (!id || !scoreDialogData) return;

    const { studentId, currentScore } = scoreDialogData;
    const delta = newScore - currentScore;

    if (delta === 0) {
      // No change
      return;
    }

    // Call handleParticipationChange with the delta
    await handleParticipationChange(studentId, delta);
  };

  const handleOpenScoreDialog = useCallback((student: IUser, currentScore: number) => {
    setScoreDialogData({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      currentScore,
    });
    setScoreDialogOpen(true);
  }, []);

  const handleModuleChange = async (module: IModule) => {
    if (!id || !classroom) return;

    try {
      // Auto-complete previous module when moving forward
      if (currentModule && module.weekNumber > currentModule.weekNumber && !currentModule.isCompleted) {
        await handleToggleModuleCompletion(currentModule.id, false);
      }

      setCurrentModule(module);

      // Update current module in classroom
      await ClassroomService.updateClassroom(id, {
        currentModule: module
      });
    } catch (error) {
      console.error('Error updating current module:', error);
      toast.error('Error al cambiar de módulo');
    }
  };

  const handleToggleModuleCompletion = async (moduleId: string, currentStatus: boolean) => {
    if (!id || !classroom || isFinalized) return;

    try {
      const updatedModules = classroom.modules.map(m =>
        m.id === moduleId ? { ...m, isCompleted: !currentStatus } : m
      );

      // Update local state immediately
      setClassroom({ ...classroom, modules: updatedModules });

      // Update in database
      await ClassroomService.updateClassroom(id, {
        modules: updatedModules
      });

      toast.success(`Módulo ${!currentStatus ? 'completado' : 'marcado como pendiente'}`);
    } catch (error) {
      console.error('Error toggling module completion:', error);
      toast.error('Error al actualizar el módulo');
      // Reload to revert optimistic update
      await loadClassroomData();
    }
  };

  const getStudentAttendanceRate = (studentId: string): number => {
    const evaluation = evaluations.get(studentId);
    if (!evaluation?.attendanceRecords || evaluation.attendanceRecords.length === 0) {
      return 0;
    }

    const present = evaluation.attendanceRecords.filter(r => r.isPresent).length;
    return (present / evaluation.attendanceRecords.length) * 100;
  };

  const handleToggleStudentStatus = async (studentId: string, currentStatus: boolean) => {
    if (!id) return;

    try {
      if (evaluationsRef.current.has(studentId)) {
        updateStudentEvaluation(studentId, (evaluation) => ({
          ...(evaluation as IStudentEvaluation),
          isActive: !currentStatus,
        }));
      }

      await enqueueEvaluationWrite(studentId, async () => {
        await EvaluationService.updateStudentStatus(studentId, id, !currentStatus);
      });
      toast.success(`Estudiante ${!currentStatus ? 'activado' : 'desactivado'} en esta clase`);
    } catch (error) {
      console.error('Error toggling student status:', error);
      toast.error('Error al cambiar estado del estudiante');
      // Revert on error
      await loadClassroomData();
    }
  };

  const handleFileUpload = async () => {
    if (!id || !selectedFile || !user) return;

    try {
      setUploadingResource(true);

      // Upload file to GCloud
      const fileUrl = await GCloudService.uploadFile(selectedFile, `classroom-${id}`);

      // Create resource object
      const resource: Omit<IClassroomResource, 'id'> = {
        name: selectedFile.name,
        url: fileUrl,
        type: selectedFile.type,
        size: selectedFile.size,
        uploadedBy: user.id,
        uploadedAt: new Date()
      };

      // Add resource to classroom
      const resourceWithId: IClassroomResource = {
        ...resource,
        id: `resource-${Date.now()}`
      };

      await ClassroomService.addResource(id, resourceWithId);

      toast.success('Recurso subido exitosamente');
      setSelectedFile(null);
      await loadClassroomData();
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Error al subir el recurso');
    } finally {
      setUploadingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId: string, filename: string) => {
    if (!id) return;

    const confirmed = window.confirm(`¿Estás seguro de eliminar el recurso "${filename}"?`);
    if (!confirmed) return;

    try {
      // Delete from GCloud
      const filenameMatch = filename.match(/classroom-.*$/);
      if (filenameMatch) {
        await GCloudService.deletePhoto(filenameMatch[0]);
      }

      // Remove from classroom
      await ClassroomService.deleteResource(id, resourceId);

      toast.success('Recurso eliminado exitosamente');
      await loadClassroomData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Error al eliminar el recurso');
    }
  };

  const handleDownloadResource = async (url: string, filename: string) => {
    try {
      // Show modal
      setDownloadingFileName(filename);
      setDownloadProgress(0);
      setDownloadModalOpen(true);

      // Fetch the file with progress tracking
      const response = await fetch(url);

      if (!response.ok) throw new Error('Error al obtener el archivo');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer el archivo');

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Update progress
        if (total > 0) {
          const progress = Math.round((receivedLength / total) * 100);
          setDownloadProgress(progress);
        }
      }

      // Combine chunks into single array
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      // Create blob from combined chunks
      const blob = new Blob([chunksAll]);

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // Close modal after a short delay
      setTimeout(() => {
        setDownloadModalOpen(false);
      }, 500);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar el archivo');
      setDownloadModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="px-1 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-40 rounded-[28px] bg-slate-200" />
          <div className="h-28 rounded-[28px] bg-slate-100" />
          <div className="h-64 rounded-[28px] bg-slate-100" />
          <div className="h-64 rounded-[28px] bg-slate-100" />
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
          description="No pudimos cargar la información de esta clase."
          tone="danger"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1 pb-8 -mx-3 -my-3">
      <ClassroomHero
        classroom={classroom}
        studentsCount={students.length}
        completedModules={completedModules}
        currentModuleLabel={currentModuleLabel}
        isFinalized={isFinalized}
        isOffline={isOffline}
        pendingOperations={pendingOperations}
        whatsappDropdownOpen={whatsappDropdownOpen}
        creatingGroup={creatingGroup}
        syncingGroup={syncingGroup}
        onBack={handleBackNavigation}
        onToggleWhatsappDropdown={() => setWhatsappDropdownOpen((open) => !open)}
        onCreateWhatsappGroup={handleCreateWhatsappGroup}
        onSyncWhatsappGroup={handleSyncWhatsappGroup}
        onOpenWhatsappMessage={() => setWhatsappMessageModal(true)}
        onOpenFinalization={() => setFinalizationModal(true)}
        reportAction={(
          <ClassroomReportPdfDownloadButton classroom={classroom}>
            <Button color="light" tag="span" className="rounded-pill px-3 py-2 text-sm fw-semibold">
              <i className="bi bi-file-earmark-pdf me-2" />
              Descargar reporte
            </Button>
          </ClassroomReportPdfDownloadButton>
        )}
      />

      {isOffline && pendingOperations > 0 && (
        <MobileInfoBanner
          icon="bi-wifi-off"
          title="Modo sin conexión"
          description={`${pendingOperations} operación(es) pendiente(s) de sincronizar cuando vuelvas a tener internet.`}
          tone="warning"
        />
      )}

      {isFinalized && (
        <MobileInfoBanner
          icon="bi-flag"
          title="Clase finalizada"
          description="Asistencia y participación quedan en modo lectura hasta que reviertas la finalización."
          tone="warning"
        />
      )}

      <ClassroomModuleProgress
        modules={classroom.modules}
        currentModule={currentModule}
        isFinalized={isFinalized}
        onModuleChange={handleModuleChange}
        onToggleModuleCompletion={handleToggleModuleCompletion}
      />

      <ClassroomAttendanceSection
        students={students}
        currentModule={currentModule}
        isFinalized={isFinalized}
        attendanceRecords={attendanceRecords}
        selectedIds={attendanceSelection.selectedIds}
        onSelectionChange={attendanceSelection.setSelectedIds}
        onOpenBulkAttendance={() => setBulkAttendanceOpen(true)}
        onClearSelection={attendanceSelection.clear}
        onAttendanceChange={handleAttendanceChange}
      />

      <ClassroomParticipationSection
        students={students}
        currentModule={currentModule}
        isFinalized={isFinalized}
        participationTotals={participationTotals}
        maxParticipationPoints={maxParticipationPoints}
        selectedIds={participationSelection.selectedIds}
        onSelectionChange={participationSelection.setSelectedIds}
        onClearSelection={participationSelection.clear}
        onOpenBulkParticipation={() => setBulkParticipationOpen(true)}
        onParticipationChange={handleParticipationChange}
        onOpenScoreDialog={handleOpenScoreDialog}
      />

      <ClassroomEvaluationSection
        students={students}
        evaluations={evaluations}
        participationTotals={participationTotals}
        maxParticipationPoints={maxParticipationPoints}
        onNavigateToManager={() => navigate(`/teacher/evaluation/${id}`)}
        onToggleStudentStatus={handleToggleStudentStatus}
        getStudentAttendanceRate={getStudentAttendanceRate}
      />

      <SectionHeader
        icon="bi-people"
        title="Estudiantes"
        badge={students.length}
        badgeColor="bg-slate-100 text-slate-700"
        defaultOpen={false}
      >
        <div className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <StudentEnrollment classroom={classroom} onUpdate={loadClassroomData} />
        </div>
      </SectionHeader>

      <ClassroomResourcesSection
        resources={classroom.resources || []}
        isFinalized={isFinalized}
        selectedFile={selectedFile}
        uploadingResource={uploadingResource}
        searchQuery={resourcesSearchQuery}
        onSearchQueryChange={setResourcesSearchQuery}
        onFileChange={setSelectedFile}
        onUpload={handleFileUpload}
        onDownload={handleDownloadResource}
        onDelete={handleDeleteResource}
      />

      {user?.role === 'admin' ? (
        <ClassroomPaymentsSection
          classroom={classroom}
          user={user}
          paymentsLoading={paymentsLoading}
          paymentProgramName={paymentProgramName}
          paymentCostItems={paymentCostItems}
          studentPayments={studentPayments}
          paymentStatuses={paymentStatuses}
          students={students}
          paymentsStudentsSearchQuery={paymentsStudentsSearchQuery}
          paymentsSearchQuery={paymentsSearchQuery}
          paymentFilterStudentId={paymentFilterStudentId}
          costForm={costForm}
          editingCostId={editingCostId}
          onOpenPaymentModal={() => setPaymentModalOpen(true)}
          onCostFormChange={updateCostForm}
          onResetCostForm={resetCostForm}
          onSaveCostItem={handleSaveCostItem}
          onEditCostItem={handleEditCostItem}
          onDeleteCostItem={handleDeleteCostItem}
          onStatusChange={handleStatusChange}
          onEditPayment={handleEditPayment}
          onDeletePayment={handleDeletePayment}
          onDownloadReceipt={handleDownloadResource}
          onPaymentsStudentsSearchQueryChange={setPaymentsStudentsSearchQuery}
          onPaymentsSearchQueryChange={setPaymentsSearchQuery}
          onPaymentFilterStudentIdChange={setPaymentFilterStudentId}
          getPaymentMethodLabel={getPaymentMethodLabel}
          getStatusForItem={getStatusForItem}
        />
      ) : null}

      <ClassroomWhatsappDialog
        isOpen={whatsappMessageModal}
        message={whatsappMessage}
        sending={sendingMessage}
        onClose={() => setWhatsappMessageModal(false)}
        onMessageChange={setWhatsappMessage}
        onSend={handleSendWhatsappMessage}
      />

      <ClassroomFinalizationModal
        isOpen={finalizationModal}
        onClose={() => setFinalizationModal(false)}
        classroom={classroom}
        onSuccess={() => {
          setFinalizationModal(false);
          loadClassroomData();
        }}
      />

      <ClassroomPaymentDialog
        isOpen={paymentModalOpen}
        editingPaymentId={editingPaymentId}
        students={students}
        paymentCostItems={paymentCostItems}
        paymentForm={paymentForm}
        editingPaymentReceiptUrl={editingPaymentReceiptUrl}
        editingPaymentReceiptName={editingPaymentReceiptName}
        onClose={closePaymentModal}
        onSubmit={handlePaymentSubmit}
        onChange={updatePaymentForm}
        onToggleItem={handlePaymentItemToggle}
      />

      <ClassroomDownloadProgressDialog
        isOpen={downloadModalOpen}
        filename={downloadingFileName}
        progress={downloadProgress}
        onClose={() => setDownloadModalOpen(false)}
      />

      {/* Bulk Attendance Dialog */}
      <BulkAttendanceDialog
        isOpen={bulkAttendanceOpen}
        onClose={() => {
          setBulkAttendanceOpen(false);
          attendanceSelection.clear();
        }}
        selectedStudents={students.filter(s => attendanceSelection.isSelected(s.id))}
        currentModuleName={currentModule ? `Módulo ${currentModule.weekNumber}: ${currentModule.name}` : undefined}
        onConfirm={async (isPresent: boolean) => {
          const selectedStudentIds = students
            .filter(s => attendanceSelection.isSelected(s.id))
            .map(s => s.id);
          
          await handleBulkAttendanceChange(selectedStudentIds, isPresent);
          attendanceSelection.clear();
        }}
      />

      {/* Score Input Dialog */}
      <ScoreInputDialog
        isOpen={scoreDialogOpen}
        onClose={() => {
          setScoreDialogOpen(false);
          setScoreDialogData(null);
        }}
        studentName={scoreDialogData?.studentName || ''}
        currentScore={scoreDialogData?.currentScore || 0}
        maxScore={maxParticipationPoints}
        fieldLabel="Puntos de Participación"
        onSave={handleScoreSave}
        helpText={`Máximo: ${maxParticipationPoints} puntos (${classroom?.modules?.length || 8} módulos × ${classroom?.evaluationCriteria?.participationPointsPerModule || 1} punto${(classroom?.evaluationCriteria?.participationPointsPerModule || 1) > 1 ? 's' : ''}/módulo)`}
      />

      {/* Bulk Participation Dialog */}
      <BulkParticipationDialog
        isOpen={bulkParticipationOpen}
        onClose={() => {
          setBulkParticipationOpen(false);
          participationSelection.clear();
        }}
        selectedStudents={students.filter(s => participationSelection.isSelected(s.id))}
        maxScore={maxParticipationPoints}
        currentModuleName={currentModule ? `Módulo ${currentModule.weekNumber}` : undefined}
        onConfirm={async (pointsToAdd: number) => {
          const selectedStudents = students.filter(s => participationSelection.isSelected(s.id));
          let successCount = 0;
          let errorCount = 0;

          for (const student of selectedStudents) {
            try {
              await handleParticipationChange(student.id, pointsToAdd);
              successCount++;
            } catch (error) {
              errorCount++;
              console.error(`Error assigning points to ${student.firstName}:`, error);
            }
          }

          if (successCount > 0) {
            toast.success(
              `Puntos asignados a ${successCount} estudiante${successCount !== 1 ? 's' : ''}`
            );
          }

          if (errorCount > 0) {
            toast.error(
              `Error al asignar puntos a ${errorCount} estudiante${errorCount !== 1 ? 's' : ''}`
            );
          }

          participationSelection.clear();
        }}
      />
    </div>
  );
};

export default ClassroomManagement;
