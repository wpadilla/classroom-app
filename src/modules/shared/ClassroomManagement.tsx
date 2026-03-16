// Shared Classroom Management Component - Works for both Teachers and Admins
// Mobile-First Design

import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Alert,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Spinner,
  Progress
} from 'reactstrap';
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
import { getFileIcon, formatFileSize, getFileTypeColor, validateFileSize } from '../../utils/fileUtils';
import { ClassroomReportPdfDownloadButton } from '../../components/pdf/components/ClassroomReportPdfDownloadButton';
import PaymentReceiptPdfDownloadButton from '../../components/pdf/components/PaymentReceiptPdfDownloadButton';
import { motion } from 'framer-motion';
import { SearchInput, Switch, EmptyState } from '../../components/mobile';
import { DataTable } from '../../components/common';
import { useSelection } from '../../hooks';
import BulkAttendanceDialog from './components/BulkAttendanceDialog';
import ScoreInputDialog from './components/ScoreInputDialog';
import BulkParticipationDialog from './components/BulkParticipationDialog';

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
  const [activeTab, setActiveTab] = useState('attendance');

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
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const attendanceSelection = useSelection();
  const [bulkAttendanceOpen, setBulkAttendanceOpen] = useState(false);

  // Participation state - Track total participation including pending changes
  const [participationTotals, setParticipationTotals] = useState<Map<string, number>>(new Map());
  const [participationSearchQuery, setParticipationSearchQuery] = useState('');
  const participationSelection = useSelection();
  const [bulkParticipationOpen, setBulkParticipationOpen] = useState(false);

  // Score input dialog
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [scoreDialogData, setScoreDialogData] = useState<{
    studentId: string;
    studentName: string;
    currentScore: number;
  } | null>(null);

  // Evaluations search
  const [evaluationsSearchQuery, setEvaluationsSearchQuery] = useState('');

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
  const [paymentsTab, setPaymentsTab] = useState<'students' | 'payments'>('students');
  const [paymentForm, setPaymentForm] = useState({
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

  useEffect(() => {
    if (id && user) { // Keep user in dependency for permission checks
      loadClassroomData();
    }
  }, [id, user, isOffline]); // Reload when offline status changes or user changes

  useEffect(() => {
    // Load attendance and participation for current module when it changes
    if (currentModule && evaluations.size > 0) {
      loadModuleAttendance();
      loadParticipationTotals();
    }
  }, [currentModule, evaluations]);

  const loadClassroomData = async () => {
    if (!id || !user) return; // Ensure user is available for permission checks

    setLoading(true);
    try {
      // Load from Firebase (cache-first by default if offline)
      let classroomData = (await ClassroomService.getClassroomById(id)) || {} as any;

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

      // If offline, get updated classroom data from local storage
      if (isOffline) {
        const OfflineStorageService = (await import('../../services/offline/offline-storage.service')).OfflineStorageService;
        const localClassroom = OfflineStorageService.getLocalClassroom(id);
        if (localClassroom && localClassroom.studentIds) {
          classroomData = { ...classroomData, studentIds: localClassroom.studentIds };
        }
      }

      // Load evaluations
      const evaluationsData = await EvaluationService.getClassroomEvaluations(id);

      // Load students
      let studentsData: IUser[] = [];
      if (classroomData.studentIds && classroomData.studentIds.length > 0) {
        studentsData = await UserService.getUsersByIds(classroomData.studentIds);
        
        // If offline, merge with local students
        if (isOffline) {
          const OfflineStorageService = (await import('../../services/offline/offline-storage.service')).OfflineStorageService;
          const localStudents = OfflineStorageService.getLocalStudents();
          
          // Add local students that are not in the fetched list
          const additionalStudents = localStudents.filter(ls => 
            classroomData.studentIds?.includes(ls.id) && !studentsData.find(s => s.id === ls.id)
          );
          studentsData = [...studentsData, ...additionalStudents];
        }
      }

      setClassroom(classroomData);
      setStudents(studentsData);

      // Process evaluations map
      const evalMap = new Map();
      evaluationsData.forEach(e => evalMap.set(e.studentId, e));
      setEvaluations(evalMap);

      // Initialize attendance and participation for current module
      const activeModule = classroomData?.modules?.find((m: any) => !m?.isCompleted) || classroomData?.modules?.[classroomData?.modules?.length - 1];
      setCurrentModule(activeModule);

      // Update local tracking state based on loaded evaluations
      const attendanceMap = new Map<string, boolean>();
      const participationMap = new Map<string, number>();

      evaluationsData.forEach(evaluation => {
        // Attendance for current module
        if (activeModule) {
          const record = evaluation.attendanceRecords?.find(r => r.moduleId === activeModule.id);
          if (record) {
            attendanceMap.set(evaluation.studentId, record.isPresent);
          }
        }

        // Total participation
        participationMap.set(evaluation.studentId, evaluation.participationPoints || 0);
      });

      setAttendanceRecords(attendanceMap);
      setParticipationTotals(participationMap);

      if (user.role === 'admin') {
        await loadPayments(classroomData);
      }

    } catch (error) {
      console.error('Error loading classroom data:', error);
      toast.error('Error al cargar los datos de la clase');
    } finally {
      setLoading(false);
    }
  };

  const loadModuleAttendance = () => {
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

    setAttendanceRecords(attendanceMap);
  };

  const loadParticipationTotals = () => {
    const totalsMap = new Map<string, number>();

    evaluations.forEach((evaluation, studentId) => {
      const total = evaluation.participationPoints || 0;
      totalsMap.set(studentId, total);
    });

    setParticipationTotals(totalsMap);
  };

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

  const loadPayments = async (targetClassroom: IClassroom) => {
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
  };

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

  const getTotalDue = (items: IClassroomPaymentCostItem[]) =>
    items.reduce((sum, item) => sum + item.amount, 0);

  const getTotalPaid = (studentId: string) =>
    studentPayments
      .filter(payment => payment.studentId === studentId)
      .reduce((sum, payment) => sum + payment.amount, 0);

  const filteredPayments = paymentFilterStudentId
    ? studentPayments.filter(payment => payment.studentId === paymentFilterStudentId)
    : studentPayments;

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

      setPaymentModalOpen(false);
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

    // Update UI immediately
    const newAttendance = new Map(attendanceRecords);
    newAttendance.set(studentId, isPresent);
    setAttendanceRecords(newAttendance);

    try {
      await EvaluationService.recordAttendance(
        studentId,
        id,
        currentModule.id,
        isPresent,
        user.id
      );

      // Update evaluations state to reflect the change
      const evaluation = evaluations.get(studentId);
      if (evaluation) {
        const updatedRecords = [...(evaluation.attendanceRecords || [])];
        const existingIndex = updatedRecords.findIndex(r => r.moduleId === currentModule.id);

        const newRecord: IAttendanceRecord = {
          moduleId: currentModule.id,
          studentId: studentId,
          isPresent: isPresent,
          date: new Date(),
          markedBy: user.id,
          markedAt: new Date()
        };

        if (existingIndex !== -1) {
          updatedRecords[existingIndex] = newRecord;
        } else {
          updatedRecords.push(newRecord);
        }

        const updatedEvaluation: IStudentEvaluation = {
          ...evaluation,
          attendanceRecords: updatedRecords
        };

        const newEvaluations = new Map(evaluations);
        newEvaluations.set(studentId, updatedEvaluation);
        setEvaluations(newEvaluations);
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      // Revert UI change on error
      const revertedAttendance = new Map(attendanceRecords);
      setAttendanceRecords(revertedAttendance);
      toast.error('Error al guardar asistencia');
    }
  };

  const handleParticipationChange = async (studentId: string, points: number) => {
    if (!id) return;

    // Update UI immediately
    const currentPoints = participationTotals.get(studentId) || 0;
    const newPoints = Math.max(0, currentPoints + points); // Prevent negative points

    const newTotals = new Map(participationTotals);
    newTotals.set(studentId, newPoints);
    setParticipationTotals(newTotals);

    try {
      await EvaluationService.recordParticipation(
        studentId,
        id,
        points
      );

      // Update evaluations state to reflect the change
      const evaluation = evaluations.get(studentId);
      if (evaluation) {
        const updatedEvaluation: IStudentEvaluation = {
          ...evaluation,
          participationPoints: newPoints
        };

        const newEvaluations = new Map(evaluations);
        newEvaluations.set(studentId, updatedEvaluation);
        setEvaluations(newEvaluations);
      }
    } catch (error) {
      console.error('Error recording participation:', error);
      toast.error('Error al registrar participación');
      // Revert
      newTotals.set(studentId, currentPoints);
      setParticipationTotals(new Map(newTotals));
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
      // Update UI immediately
      const evaluation = evaluations.get(studentId);
      if (evaluation) {
        const updatedEvaluation = { ...evaluation, isActive: !currentStatus };
        const newEvaluations = new Map(evaluations);
        newEvaluations.set(studentId, updatedEvaluation);
        setEvaluations(newEvaluations);
      }

      // Save to database (Firebase handles offline persistence)
      await EvaluationService.updateStudentStatus(studentId, id, !currentStatus);
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
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando clase...</p>
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

  return (
    <Container fluid className="py-3 !px-0">
      {/* Offline Indicator */}
      {isOffline && pendingOperations > 0 && (
        <Alert color="warning" className="mb-3">
          <i className="bi bi-wifi-off me-2"></i>
          Modo sin conexión. {pendingOperations} operación(es) pendiente(s) de sincronizar.
        </Alert>
      )}

      {/* Header - Mobile Optimized */}
      <Row className="mb-3">
        <Col>
          <Button
            color="link"
            className="p-0 mb-2 text-decoration-none"
            onClick={() => navigate(user?.role === 'admin' ? '/admin/classrooms' : '/teacher/dashboard')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </Button>

          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h4 className="mb-1">
                {classroom.subject}
                {isFinalized && (
                  <Badge color="warning" className="ms-2">
                    <i className="bi bi-flag-fill me-1"></i>
                    Finalizada
                  </Badge>
                )}
                {isOffline && (
                  <Badge color="secondary" className="ms-2">
                    <i className="bi bi-wifi-off me-1"></i>
                    Offline
                  </Badge>
                )}
              </h4>
              <p className="text-muted mb-0 small">
                {classroom.name} • {students.length} estudiantes
              </p>
            </div>

            <div className="d-flex gap-2">
              {/* PDF Download Button */}
              <ClassroomReportPdfDownloadButton classroom={classroom}>
                <Button color="outline-secondary" size="sm" tag="span">
                  <i className="bi bi-file-earmark-pdf me-1"></i>
                  <span>Reporte</span>
                </Button>
              </ClassroomReportPdfDownloadButton>

              {/* Finalization Button */}
              <Button
                color={isFinalized ? 'warning' : 'danger'}
                size="sm"
                outline={!isFinalized}
                onClick={() => setFinalizationModal(true)}
                title={isFinalized ? 'Revertir finalización' : 'Finalizar clase'}
              >
                <i className={`bi bi-${isFinalized ? 'arrow-counterclockwise' : 'flag-fill'} me-1`}></i>
                <span>
                  {isFinalized ? 'Revertir' : 'Finalizar'}
                </span>
              </Button>

              {/* WhatsApp Dropdown - Mobile Optimized */}
              <Dropdown
                isOpen={whatsappDropdownOpen}
                toggle={() => setWhatsappDropdownOpen(!whatsappDropdownOpen)}
              >
                <DropdownToggle caret color="success" size="sm">
                  <i className="bi bi-whatsapp me-1"></i>
                  <span>WhatsApp</span>
                </DropdownToggle>
                <DropdownMenu end>
                  {!classroom.whatsappGroup ? (
                    <DropdownItem onClick={handleCreateWhatsappGroup} disabled={creatingGroup}>
                      {creatingGroup ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-circle me-2"></i>
                          Crear Grupo
                        </>
                      )}
                    </DropdownItem>
                  ) : (
                    <>
                      <DropdownItem header>
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        Grupo Conectado
                      </DropdownItem>
                      <DropdownItem divider />
                      <DropdownItem onClick={handleSyncWhatsappGroup} disabled={syncingGroup}>
                        {syncingGroup ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Sincronizando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Sincronizar
                          </>
                        )}
                      </DropdownItem>
                      <DropdownItem onClick={() => setWhatsappMessageModal(true)}>
                        <i className="bi bi-send me-2"></i>
                        Enviar Mensaje
                      </DropdownItem>
                    </>
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </Col>
      </Row>

      {/* Finalized Alert */}
      {isFinalized && (
        <Row className="mb-3">
          <Col>
            <Alert color="warning" className="mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Clase Finalizada:</strong> Esta clase ha sido finalizada.
              No se pueden hacer cambios en asistencia o participación.
              Para modificar, debes revertir la finalización primero.
            </Alert>
          </Col>
        </Row>
      )}

      {/* Module Selector - Mobile Optimized with Completion Tracking */}
      <Row className="mb-3">
        <Col>
          <Card className="border-0 shadow-sm">
            <CardBody className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="mb-0">Progreso del Curso</h6>
                  <small className="text-muted">
                    Módulo {currentModule?.weekNumber || 1} de {classroom.modules.length}
                  </small>
                </div>
                <div className="text-end">
                  <Badge color="info">
                    {classroom.modules.filter(m => m.isCompleted).length}/{classroom.modules.length} Completados
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <Progress
                value={(classroom.modules.filter(m => m.isCompleted).length / classroom.modules.length) * 100}
                color={(classroom.modules.filter(m => m.isCompleted).length / classroom.modules.length) >= 0.75 ? 'success' : 'warning'}
                className="mb-3"
                style={{ height: '8px' }}
              />

              {/* Module Buttons */}
              <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                {classroom.modules.map(module => (
                  <div key={module.id} className="flex-shrink-0">
                    <Button
                      color={currentModule?.id === module.id ? 'primary' :
                        module.isCompleted ? 'success' : 'outline-secondary'}
                      onClick={() => handleModuleChange(module)}
                      size="sm"
                      className="d-flex align-items-center gap-1"
                      style={{ minWidth: '80px' }}
                    >
                      {module.isCompleted && <i className="bi bi-check-circle-fill"></i>}
                      S{module.weekNumber}
                    </Button>

                    {/* Completion Checkbox - Only show for current or past modules */}
                    {(currentModule && module.weekNumber <= currentModule.weekNumber) && (
                      <div className="form-check form-check-sm mt-1 text-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`module-complete-${module.id}`}
                          checked={module.isCompleted}
                          onChange={() => handleToggleModuleCompletion(module.id, module.isCompleted)}
                          disabled={isFinalized}
                          style={{ cursor: isFinalized ? 'not-allowed' : 'pointer' }}
                        />
                        <label
                          className="form-check-label small text-muted"
                          htmlFor={`module-complete-${module.id}`}
                          style={{
                            cursor: isFinalized ? 'not-allowed' : 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          {module.isCompleted ? 'OK' : 'Pendiente'}
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Tabs - Mobile Optimized */}
      <Nav tabs className="mb-3 flex-nowrap overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <NavItem>
          <NavLink
            className={activeTab === 'attendance' ? 'active' : ''}
            onClick={() => setActiveTab('attendance')}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-calendar-check me-1"></i>
            <span>Asistencia</span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'participation' ? 'active' : ''}
            onClick={() => setActiveTab('participation')}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-hand-thumbs-up me-1"></i>
            <span>Participación</span>
          </NavLink>
        </NavItem>
       
        <NavItem>
          <NavLink
            className={activeTab === 'evaluations' ? 'active' : ''}
            onClick={() => setActiveTab('evaluations')}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-clipboard-check me-1"></i>
            <span>Evaluaciones</span>
          </NavLink>
        </NavItem>
         <NavItem>
          <NavLink
            className={activeTab === 'students' ? 'active' : ''}
            onClick={() => setActiveTab('students')}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-people me-1"></i>
            <span>Estudiantes</span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'resources' ? 'active' : ''}
            onClick={() => setActiveTab('resources')}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-folder me-1"></i>
            <span>Recursos</span>
          </NavLink>
        </NavItem>
        {user?.role === 'admin' && (
          <NavItem>
            <NavLink
              className={activeTab === 'payments' ? 'active' : ''}
              onClick={() => setActiveTab('payments')}
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-cash-coin me-1"></i>
              <span>Pagos</span>
            </NavLink>
          </NavItem>
        )}
      </Nav>

      <TabContent activeTab={activeTab}>
        {/* Attendance Tab - Mobile-Optimized with DataTable */}
        <TabPane tabId="attendance">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h6 className="mb-1">
                    <i className="bi bi-calendar-check me-2"></i>
                    Asistencia - Semana {currentModule?.weekNumber}
                  </h6>
                  <small className="text-muted">
                    {isFinalized ? 'Clase finalizada - Solo lectura' : 'Los cambios se guardan automáticamente'}
                  </small>
                </div>
                <Badge color={currentModule?.isCompleted ? 'success' : 'warning'}>
                  {currentModule?.isCompleted ? 'Completado' : 'Pendiente'}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {/* Stats - Horizontal */}
              {students.length > 0 && (
                <div className="d-flex gap-2 overflow-auto mb-3 pb-2" style={{ scrollbarWidth: 'thin' }}>
                  <div className="flex-shrink-0 bg-light rounded p-2 text-center" style={{ minWidth: '110px' }}>
                    <small className="text-muted d-block">Total</small>
                    <strong className="fs-5">{students.length}</strong>
                  </div>
                  <div className="flex-shrink-0 bg-success-subtle rounded p-2 text-center" style={{ minWidth: '110px' }}>
                    <small className="text-success d-block">Presentes</small>
                    <strong className="fs-5 text-success">{Array.from(attendanceRecords.entries()).filter(([id, present]) => present === true).length}</strong>
                  </div>
                  <div className="flex-shrink-0 bg-danger-subtle rounded p-2 text-center" style={{ minWidth: '110px' }}>
                    <small className="text-danger d-block">Ausentes</small>
                    <strong className="fs-5 text-danger">{Array.from(attendanceRecords.entries()).filter(([id, present]) => present === false).length}</strong>
                  </div>
                </div>
              )}

              {/* DataTable with Search and Selection */}
              <DataTable<IUser>
                data={students}
                columns={[
                  // {
                  //   header: '#',
                  //   accessor: (_, idx) => idx + 1,
                  //   width: '50px',
                  //   align: 'center',
                  //   render: (value) => (
                  //     <small className="text-muted">{value}</small>
                  //   ),
                  // },
                  {
                    header: 'Estudiante',
                    accessor: 'firstName',
                    render: (_, student) => (
                      <div className="d-flex align-items-center gap-2">
                        {/* {student.profilePhoto ? (
                          <img
                            src={student.profilePhoto}
                            alt={student.firstName}
                            className="rounded-circle"
                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                          />
                        ) : ( */}
                          {/* <div
                            className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px' }}
                          >
                            <small className="text-primary fw-bold">
                              {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
                            </small>
                          </div> */}
                        {/* )} */}
                        <div>
                          <div className="fw-bold small">{student.firstName} {student.lastName}</div>
                          <small className="text-muted d-none d-sm-inline">{student.phone}</small>
                        </div>
                      </div>
                    ),
                  },
                  {
                    header: 'Asistencia',
                    accessor: (student) => attendanceRecords.get(student.id),
                    width: '150px',
                    align: 'center',
                    render: (isPresent, student) => (
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <span className="small text-muted d-none d-md-inline">
                          {isPresent === true ? 'Presente' : isPresent === false ? 'Ausente' : 'Sin marcar'}
                        </span>
                        <Switch
                          checked={isPresent === true}
                          onChange={(checked) => handleAttendanceChange(student.id, checked)}
                          disabled={isFinalized}
                          onColor="bg-success"
                          offColor="bg-danger"
                        />
                      </div>
                    ),
                  },
                ]}
                keyExtractor={(student) => student.id}
                searchable
                searchFields={['firstName', 'lastName', 'phone']}
                searchPlaceholder="Buscar estudiante por nombre o teléfono..."
                selectable={!isFinalized}
                selectedIds={attendanceSelection.selectedIds}
                onSelectionChange={attendanceSelection.setSelectedIds}
                bulkActions={
                  <>
                    <Button
                      color="primary"
                      size="sm"
                      onClick={() => setBulkAttendanceOpen(true)}
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      Pasar Asistencia
                    </Button>
                    <Button
                      color="secondary"
                      size="sm"
                      outline
                      onClick={attendanceSelection.clear}
                    >
                      <i className="bi bi-x me-1"></i>
                      Cancelar
                    </Button>
                  </>
                }
                emptyState={
                  <EmptyState
                    icon="bi-people"
                    heading="Sin estudiantes inscritos"
                    description="Inscribe estudiantes en la pestaña 'Estudiantes' para comenzar a registrar asistencia."
                  />
                }
                hover
              />
            </CardBody>
          </Card>
        </TabPane>

        {/* Participation Tab - Mobile-Optimized DataTable */}
        <TabPane tabId="participation">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h6 className="mb-1">
                    <i className="bi bi-hand-thumbs-up me-2"></i>
                    Participación - Semana {currentModule?.weekNumber}
                  </h6>
                  <small className="text-muted">
                    {isFinalized ? 'Clase finalizada - Solo lectura' : 'Los cambios se guardan automáticamente'}
                  </small>
                </div>
                <Badge color={currentModule?.isCompleted ? 'success' : 'warning'}>
                  {currentModule?.isCompleted ? 'Completado' : 'Pendiente'}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {/* Top 3 Leaderboard - Horizontal */}
              {students.length > 0 && (
                <div className="mb-3">
                  <h6 className="small text-muted mb-2">🏆 Top 3 Participantes</h6>
                  <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                    {students
                      .map(s => ({ student: s, points: participationTotals.get(s.id) || 0 }))
                      .sort((a, b) => b.points - a.points)
                      .slice(0, 3)
                      .map((item, index) => (
                        <div
                          key={item.student.id}
                          className="flex-shrink-0 bg-warning bg-opacity-10 rounded p-2 d-flex align-items-center gap-2"
                          style={{ minWidth: '200px' }}
                        >
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${
                              index === 0 ? 'bg-warning text-white' : 'bg-secondary text-white'
                            }`}
                            style={{ width: '28px', height: '28px', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <div className="small fw-bold text-truncate">
                              {item.student.firstName} {item.student.lastName}
                            </div>
                            <div className="small text-warning fw-bold">
                              {item.points} puntos
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* DataTable */}
              <DataTable<IUser>
                data={students}
                columns={[
                  // {
                  //   header: '#',
                  //   accessor: (_, index) => index !== undefined ? index + 1 : '',
                  //   width: '50px',
                  //   className: 'text-center text-muted small',
                  // },
                  {
                    header: 'Nombre',
                    accessor: 'firstName',
                    render: (student) => (
                      <div className="d-flex align-items-center gap-2">
                        <b>
                          {student}
</b>
                        {/* {student.profilePhoto ? (
                          <img
                            src={student.profilePhoto}
                            alt={student.firstName}
                            className="rounded-circle"
                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px' }}
                          >
                            <small className="text-primary fw-bold">
                              {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
                            </small>
                          </div>
                        )} */}
                        {/* <div>
                          <div className="fw-bold small">{student.firstName} {student.lastName}</div>
                        </div> */}
                      </div>
                    ),
                  },
                  {
                    header: '',
                    accessor: (student) => participationTotals.get(student.id) || 0,
                    width: '50px',
                    className: 'text-center',
                    render: (student) => {
                      const totalPoints = participationTotals.get(student.id) || 0;
                      return (
                        <motion.div
                          key={totalPoints}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <Badge
                            color={
                              totalPoints >= 10
                                ? 'success'
                                : totalPoints >= 5
                                ? 'warning'
                                : 'secondary'
                            }
                            className="px-2 py-1"
                          >
                            <strong>{totalPoints}</strong>
                          </Badge>
                        </motion.div>
                      );
                    },
                  },
                  {
                    header: 'Acciones',
                    accessor: 'id',
                    width: '320px',
                    className: 'text-center',
                    render: (student) => {
                      const totalPoints = participationTotals.get(student.id) || 0;
                      return (
                        <div className="d-flex gap-1 justify-content-center">
                          <Button
                            color="danger"
                            size="sm"
                            onClick={() => handleParticipationChange(student.id, -1)}
                            disabled={isFinalized || totalPoints <= 0}
                            style={{ minWidth: '60px' }}
                          >
                            <i className="bi bi-dash-lg me-1"></i>
                            -1
                          </Button>
                          <Button
                            color="primary"
                            outline
                            size="sm"
                            onClick={() => {
                              setScoreDialogData({
                                studentId: student.id,
                                studentName: `${student.firstName} ${student.lastName}`,
                                currentScore: totalPoints,
                              });
                              setScoreDialogOpen(true);
                            }}
                            disabled={isFinalized}
                            title="Editar puntuación"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </Button>
                          <Button
                            color="success"
                            size="sm"
                            onClick={() => handleParticipationChange(student.id, 1)}
                            disabled={isFinalized}
                            style={{ minWidth: '60px' }}
                          >
                            <i className="bi bi-plus-lg me-1"></i>
                            +1
                          </Button>
                        </div>
                      );
                    },
                  },
                ]}
                keyExtractor={(student) => student.id}
                searchable
                searchFields={['firstName', 'lastName', 'phone']}
                selectable={!isFinalized}
                selectedIds={participationSelection.selectedIds}
                onSelectionChange={participationSelection.setSelectedIds}
                bulkActions={
                  participationSelection.selectedCount > 0 ? (
                    <div className="d-flex gap-2 align-items-center">
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => setBulkParticipationOpen(true)}
                      >
                        <i className="bi bi-hand-thumbs-up me-1"></i>
                        Asignar Puntos
                      </Button>
                      <Button
                        color="secondary"
                        size="sm"
                        outline
                        onClick={() => participationSelection.clear()}
                      >
                        <i className="bi bi-x me-1"></i>
                        Cancelar
                      </Button>
                    </div>
                  ) : undefined
                }
                emptyState={
                  <EmptyState
                    icon="bi-people"
                    heading="Sin estudiantes inscritos"
                    description='Inscribe estudiantes en la pestaña "Estudiantes" para comenzar a registrar participación.'
                  />
                }
              />
            </CardBody>
          </Card>
        </TabPane>

        {/* Students Tab - Using StudentEnrollment Component */}
        <TabPane tabId="students">
          <StudentEnrollment
            classroom={classroom}
            onUpdate={loadClassroomData}
          />
        </TabPane>

        {/* Evaluations Tab - Mobile Optimized */}
        <TabPane tabId="evaluations">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h6 className="mb-0">
                  <i className="bi bi-clipboard-check me-2"></i>
                  Evaluaciones
                </h6>
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => navigate(`/teacher/evaluation/${id}`)}
                >
                  <i className="bi bi-gear me-1"></i>
                  Gestionar
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <Alert color="info" className="mb-3">
                <i className="bi bi-info-circle me-2"></i>
                <small>Las evaluaciones finales se configuran en el último módulo</small>
              </Alert>

              {/* Search */}
              {students.length > 0 && (
                <div className="mb-3">
                  <SearchInput
                    placeholder="Buscar estudiante por nombre o teléfono..."
                    onSearch={setEvaluationsSearchQuery}
                  />
                </div>
              )}

              {/* Filter Chips */}
              {students.length > 0 && (
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  <small className="text-muted me-2">Filtrar por:</small>
                  <Badge
                    color="success"
                    pill
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      // TODO: Add filter logic
                    }}
                  >
                    Activos
                  </Badge>
                  <Badge
                    color="danger"
                    pill
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      // TODO: Add filter logic
                    }}
                  >
                    Inactivos
                  </Badge>
                </div>
              )}

              {/* Table */}
              {students.length === 0 ? (
                <EmptyState
                  icon="bi-clipboard-check"
                  heading="Sin estudiantes inscritos"
                  description="Inscribe estudiantes en la pestaña 'Estudiantes' para comenzar a evaluar."
                />
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '50px' }} className="text-center">#</th>
                        <th>Estudiante</th>
                        <th className="text-center" style={{ width: '80px' }}>Asist.</th>
                        <th className="text-center" style={{ width: '80px' }}>Part.</th>
                        <th className="text-center" style={{ width: '100px' }}>Estado</th>
                        <th className="text-center" style={{ width: '80px' }}>Activo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students
                        .filter(student => {
                          if (!evaluationsSearchQuery.trim()) return true;
                          const query = evaluationsSearchQuery.toLowerCase();
                          return (
                            student.firstName.toLowerCase().includes(query) ||
                            student.lastName.toLowerCase().includes(query) ||
                            student.phone?.toLowerCase().includes(query)
                          );
                        })
                        .map((student, index) => {
                          const evaluation = evaluations.get(student.id);
                          const attendanceRate = getStudentAttendanceRate(student.id);
                          const participation = participationTotals.get(student.id) || 0;
                          const isActive = evaluation?.isActive !== false;

                          return (
                            <tr
                              key={student.id}
                              className={!isActive ? 'table-secondary text-muted' : ''}
                            >
                              <td className="text-center align-middle">
                                <small className="text-muted">{index + 1}</small>
                              </td>
                              <td className="align-middle">
                                <div className="d-flex align-items-center gap-2">
                                  {/* {student.profilePhoto ? (
                                    <img
                                      src={student.profilePhoto}
                                      alt={student.firstName}
                                      className="rounded-circle"
                                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div
                                      className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                                      style={{ width: '32px', height: '32px' }}
                                    >
                                      <small className="text-primary fw-bold">
                                        {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
                                      </small>
                                    </div>
                                  )} */}
                                  <div>
                                    <div className="fw-bold small">
                                      {student.firstName} {student.lastName}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="text-center align-middle">
                                <Badge
                                  color={attendanceRate >= 80 ? 'success' : 'warning'}
                                  className="px-2 py-1"
                                >
                                  {attendanceRate.toFixed(0)}%
                                </Badge>
                              </td>
                              <td className="text-center align-middle">
                                <Badge color="info" className="px-2 py-1">
                                  {participation}
                                </Badge>
                              </td>
                              <td className="text-center align-middle">
                                <Badge
                                  color={
                                    evaluation?.status === 'evaluated'
                                      ? 'success'
                                      : evaluation?.status === 'in-progress'
                                      ? 'warning'
                                      : 'secondary'
                                  }
                                >
                                  {evaluation?.status === 'evaluated'
                                    ? 'OK'
                                    : evaluation?.status === 'in-progress'
                                    ? 'En Progreso'
                                    : 'Pendiente'}
                                </Badge>
                              </td>
                              <td className="text-center align-middle">
                                <Switch
                                  checked={isActive}
                                  onChange={(checked) =>
                                    handleToggleStudentStatus(student.id, isActive)
                                  }
                                  onColor="bg-success"
                                  offColor="bg-danger"
                                />
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>

                  {/* No Results */}
                  {evaluationsSearchQuery.trim() &&
                    students.filter(s => {
                      const query = evaluationsSearchQuery.toLowerCase();
                      return (
                        s.firstName.toLowerCase().includes(query) ||
                        s.lastName.toLowerCase().includes(query) ||
                        s.phone?.toLowerCase().includes(query)
                      );
                    }).length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-muted">
                          No se encontraron estudiantes con "{evaluationsSearchQuery}"
                        </p>
                        <Button
                          color="link"
                          size="sm"
                          onClick={() => setEvaluationsSearchQuery('')}
                        >
                          Limpiar búsqueda
                        </Button>
                      </div>
                    )}
                </div>
              )}
            </CardBody>
          </Card>
        </TabPane>

        {/* Resources Tab */}
        <TabPane tabId="resources">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white">
              <h6 className="mb-0">
                <i className="bi bi-folder me-2"></i>
                Recursos de la Clase
              </h6>
            </CardHeader>
            <CardBody>
              {/* Upload Section */}
              {!isFinalized && (
                <div className="mb-4 p-3 bg-light rounded">
                  <h6 className="mb-3">Subir Nuevo Recurso</h6>
                  <FormGroup>
                    <Input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      disabled={uploadingResource}
                      accept="*/*"
                    />
                    <small className="text-muted">
                      Puedes subir diapositivas, documentos, imágenes, audios, videos, etc.
                    </small>
                  </FormGroup>
                  <Button
                    color="primary"
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploadingResource}
                  >
                    {uploadingResource ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload me-2"></i>
                        Subir Recurso
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Search */}
              {classroom?.resources && classroom.resources.length > 0 && (
                <div className="mb-3">
                  <SearchInput
                    placeholder="Buscar recurso por nombre..."
                    onSearch={setResourcesSearchQuery}
                  />
                </div>
              )}

              {/* Resources List */}
              {!classroom?.resources || classroom.resources.length === 0 ? (
                <EmptyState
                  icon="bi-folder"
                  heading="Sin recursos disponibles"
                  description={
                    isFinalized
                      ? 'No hay recursos en esta clase.'
                      : 'Sube diapositivas, documentos u otros materiales para compartir con los estudiantes.'
                  }
                />
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '50px' }} className="text-center">Tipo</th>
                        <th>Nombre</th>
                        <th style={{ width: '100px' }}>Tipo</th>
                        <th style={{ width: '100px' }}>Tamaño</th>
                        <th style={{ width: isFinalized ? '100px' : '150px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classroom.resources
                        .filter(resource => {
                          if (!resourcesSearchQuery.trim()) return true;
                          return resource.name
                            .toLowerCase()
                            .includes(resourcesSearchQuery.toLowerCase());
                        })
                        .map((resource) => (
                          <tr key={resource.id}>
                            <td className="text-center align-middle">
                              <i
                                className={`${getFileIcon(resource.type, resource.name)} fs-4`}
                                style={{ color: getFileTypeColor(resource.type) }}
                              ></i>
                            </td>
                            <td className="align-middle">
                              <div className="fw-bold">{resource.name}</div>
                              <small className="text-muted">
                                {new Date(resource.uploadedAt).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </small>
                            </td>
                            <td className="align-middle">
                              <Badge color={getFileTypeColor(resource.type)}>
                                {resource.type.split('/')[1]?.toUpperCase() || 'FILE'}
                              </Badge>
                            </td>
                            <td className="align-middle">{formatFileSize(resource.size)}</td>
                            <td className="align-middle">
                              <div className="d-flex gap-2">
                                <Button
                                  color="success"
                                  size="sm"
                                  onClick={() => handleDownloadResource(resource.url, resource.name)}
                                  title="Descargar"
                                >
                                  <i className="bi bi-download me-1"></i>
                                  Descargar
                                </Button>
                                {!isFinalized && (
                                  <Button
                                    color="danger"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteResource(resource.id, resource.name)
                                    }
                                    title="Eliminar"
                                  >
                                    <i className="bi bi-trash me-1"></i>
                                    Eliminar
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}\n                    </tbody>
                  </Table>

                  {/* No Results */}
                  {resourcesSearchQuery.trim() &&
                    classroom.resources.filter(r =>
                      r.name.toLowerCase().includes(resourcesSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-muted">
                          No se encontraron recursos con "{resourcesSearchQuery}"
                        </p>
                        <Button
                          color="link"
                          size="sm"
                          onClick={() => setResourcesSearchQuery('')}
                        >
                          Limpiar búsqueda
                        </Button>
                      </div>
                    )}
                </div>
              )}
            </CardBody>
          </Card>
        </TabPane>

        {user?.role === 'admin' && (
          <TabPane tabId="payments">
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="bi bi-cash-coin me-2"></i>
                  Gestion de Pagos
                </h6>
                <Button color="primary" size="sm" onClick={() => setPaymentModalOpen(true)}>
                  <i className="bi bi-plus-circle me-1"></i>
                  Registrar Pago
                </Button>
              </CardHeader>
              <CardBody>
                {paymentsLoading ? (
                  <div className="text-center py-4">
                    <Spinner color="primary" />
                    <p className="mt-2">Cargando pagos...</p>
                  </div>
                ) : (
                  <>
                    <Row className="mb-4">
                      <Col md={5}>
                        <h6 className="mb-3">Costos de la Clase</h6>
                        <Form>
                          <FormGroup>
                            <Label>Titulo</Label>
                            <Input
                              value={costForm.title}
                              onChange={(e) => setCostForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </FormGroup>
                          <FormGroup>
                            <Label>Descripcion</Label>
                            <Input
                              value={costForm.description}
                              onChange={(e) => setCostForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </FormGroup>
                          <Row>
                            <Col md={6}>
                              <FormGroup>
                                <Label>Monto</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={costForm.amount}
                                  onChange={(e) => setCostForm(prev => ({ ...prev, amount: e.target.value }))}
                                />
                              </FormGroup>
                            </Col>
                            <Col md={6}>
                              <FormGroup>
                                <Label>Tipo</Label>
                                <Input
                                  type="select"
                                  value={costForm.type}
                                  onChange={(e) => setCostForm(prev => ({ ...prev, type: e.target.value as PaymentItemType }))}
                                >
                                  <option value="material">Material</option>
                                  <option value="fee">Cuota</option>
                                  <option value="custom">Otro</option>
                                </Input>
                              </FormGroup>
                            </Col>
                          </Row>
                          <FormGroup check className="mb-3">
                            <Input
                              type="checkbox"
                              checked={costForm.required}
                              onChange={(e) => setCostForm(prev => ({ ...prev, required: e.target.checked }))}
                            />
                            <Label check>Obligatorio</Label>
                          </FormGroup>
                          <div className="d-flex gap-2">
                            <Button color="success" onClick={handleSaveCostItem}>
                              {editingCostId ? 'Actualizar' : 'Agregar'}
                            </Button>
                            {editingCostId && (
                              <Button color="secondary" onClick={resetCostForm}>
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </Form>
                      </Col>
                      <Col md={7}>
                        {paymentCostItems.length === 0 ? (
                          <Alert color="info">No hay costos registrados</Alert>
                        ) : (
                          <div className="table-responsive">
                            <Table size="sm" bordered>
                              <thead className="table-light">
                                <tr>
                                  <th>Titulo</th>
                                  <th>Monto</th>
                                  <th>Tipo</th>
                                  <th>Obligatorio</th>
                                  <th>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paymentCostItems.map(item => (
                                  <tr key={item.id}>
                                    <td>
                                      <div className="fw-bold">{item.title}</div>
                                      {item.description && <small className="text-muted">{item.description}</small>}
                                    </td>
                                    <td>${item.amount.toFixed(2)}</td>
                                    <td>
                                      <Badge color={item.type === 'material' ? 'info' : item.type === 'fee' ? 'primary' : 'secondary'}>
                                        {item.type === 'material' ? 'Material' : item.type === 'fee' ? 'Cuota' : 'Otro'}
                                      </Badge>
                                    </td>
                                    <td>{item.required ? 'Si' : 'No'}</td>
                                    <td>
                                      <div className="d-flex gap-2">
                                        <Button size="sm" color="info" onClick={() => handleEditCostItem(item)}>
                                          <i className="bi bi-pencil me-1"></i>
                                          Editar
                                        </Button>
                                        <Button size="sm" color="danger" onClick={() => handleDeleteCostItem(item.id)}>
                                          <i className="bi bi-trash me-1"></i>
                                          Eliminar
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        )}
                      </Col>
                    </Row>

                    <Nav tabs className="mb-3">
                      <NavItem>
                        <NavLink
                          className={paymentsTab === 'students' ? 'active' : ''}
                          onClick={() => setPaymentsTab('students')}
                          style={{ cursor: 'pointer' }}
                        >
                          Estudiantes
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={paymentsTab === 'payments' ? 'active' : ''}
                          onClick={() => setPaymentsTab('payments')}
                          style={{ cursor: 'pointer' }}
                        >
                          Pagos
                        </NavLink>
                      </NavItem>
                    </Nav>

                    <TabContent activeTab={paymentsTab}>
                      <TabPane tabId="students">
                        <h6 className="mb-3">Progreso por Estudiante</h6>
                        
                        {/* Search */}
                        {students.length > 0 && (
                          <div className="mb-3">
                            <SearchInput
                              placeholder="Buscar estudiante por nombre o teléfono..."
                              onSearch={setPaymentsStudentsSearchQuery}
                            />
                          </div>
                        )}

                        {students.length === 0 ? (
                          <EmptyState
                            icon="bi-people"
                            heading="Sin estudiantes inscritos"
                            description="Inscribe estudiantes en la pestaña 'Estudiantes' para gestionar sus pagos."
                          />
                        ) : (
                          <div className="table-responsive mb-4">
                            <Table bordered hover>
                              <thead className="table-light">
                                <tr>
                                  <th>Estudiante</th>
                                  <th className="text-center">Total Adeudado</th>
                                  <th className="text-center">Total Pagado</th>
                                  <th className="text-center">Balance</th>
                                  <th className="text-center">Comprobante</th>
                                  {paymentCostItems.map(item => (
                                    <th key={item.id} className="text-center">
                                      {item.title}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {students
                                  .filter(student => {
                                    if (!paymentsStudentsSearchQuery.trim()) return true;
                                    const query = paymentsStudentsSearchQuery.toLowerCase();
                                    return (
                                      student.firstName.toLowerCase().includes(query) ||
                                      student.lastName.toLowerCase().includes(query) ||
                                      student.phone?.toLowerCase().includes(query)
                                    );
                                  })
                                  .map(student => {
                                    const totalDue = getTotalDue(paymentCostItems);
                                    const totalPaid = getTotalPaid(student.id);
                                    const balance = totalDue - totalPaid;

                                    return (
                                      <tr key={student.id}>
                                        <td>
                                          <div className="fw-bold">{student.firstName} {student.lastName}</div>
                                          <small className="text-muted">{student.phone}</small>
                                        </td>
                                        <td className="text-center">${totalDue.toFixed(2)}</td>
                                        <td className="text-center">${totalPaid.toFixed(2)}</td>
                                        <td className="text-center">
                                          <Badge color={balance <= 0 ? 'success' : 'warning'}>
                                            ${balance.toFixed(2)}
                                          </Badge>
                                        </td>
                                        <td className="text-center">
                                          <PaymentReceiptPdfDownloadButton
                                            title="Comprobante de Pagos"
                                            studentName={`${student.firstName} ${student.lastName}`}
                                            studentPhone={student.phone}
                                            studentEmail={student.email}
                                            classroomName={classroom?.name || ''}
                                            classroomSubject={classroom?.subject || ''}
                                            programName={paymentProgramName}
                                            generatedBy={user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Administrador'}
                                            costs={paymentCostItems}
                                            payments={studentPayments.filter(payment => payment.studentId === student.id)}
                                            statuses={
                                              paymentStatuses.find(s => s.studentId === student.id)?.items || []
                                            }
                                          >
                                            <Button color="success" size="sm">
                                              <i className="bi bi-file-pdf me-1"></i>
                                              PDF
                                            </Button>
                                          </PaymentReceiptPdfDownloadButton>
                                        </td>
                                        {paymentCostItems.map(item => (
                                          <td key={item.id} className="text-center">
                                            <Input
                                              type="select"
                                              value={getStatusForItem(student.id, item.id)}
                                              onChange={(e) => handleStatusChange(student.id, item.id, e.target.value as PaymentItemStatus)}
                                            >
                                              <option value="paid">Pagado</option>
                                              <option value="pending">Pendiente</option>
                                              <option value="unpaid">No pagado</option>
                                            </Input>
                                          </td>
                                        ))}
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </Table>

                            {/* No Results */}
                            {paymentsStudentsSearchQuery.trim() &&
                              students.filter(s => {
                                const query = paymentsStudentsSearchQuery.toLowerCase();
                                return (
                                  s.firstName.toLowerCase().includes(query) ||
                                  s.lastName.toLowerCase().includes(query) ||
                                  s.phone?.toLowerCase().includes(query)
                                );
                              }).length === 0 && (
                                <div className="text-center py-4">
                                  <p className="text-muted">
                                    No se encontraron estudiantes con "{paymentsStudentsSearchQuery}"
                                  </p>
                                  <Button
                                    color="link"
                                    size="sm"
                                    onClick={() => setPaymentsStudentsSearchQuery('')}
                                  >
                                    Limpiar búsqueda
                                  </Button>
                                </div>
                              )}
                          </div>
                        )}
                      </TabPane>

                      <TabPane tabId="payments">
                        <div className="d-flex flex-column gap-3 mb-3">
                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <h6 className="mb-0">Pagos Registrados</h6>
                            <Input
                              type="select"
                              value={paymentFilterStudentId}
                              onChange={(e) => setPaymentFilterStudentId(e.target.value)}
                              style={{ maxWidth: '280px' }}
                            >
                              <option value="">Todos los estudiantes</option>
                              {students.map(student => (
                                <option key={student.id} value={student.id}>
                                  {student.firstName} {student.lastName}
                                </option>
                              ))}
                            </Input>
                          </div>
                          
                          {/* Search */}
                          {studentPayments.length > 0 && (
                            <SearchInput
                              placeholder="Buscar pago por estudiante, método o comentario..."
                              onSearch={setPaymentsSearchQuery}
                            />
                          )}
                        </div>

                        {studentPayments.length === 0 ? (
                          <EmptyState
                            icon="bi-cash-coin"
                            heading="Sin pagos registrados"
                            description="Registra los pagos de los estudiantes desde el botón 'Registrar Pago' en el encabezado de esta pestaña."
                          />
                        ) : (
                          <div className="table-responsive">
                            <Table bordered hover>
                              <thead className="table-light">
                                <tr>
                                  <th>Estudiante</th>
                                  <th>Monto</th>
                                  <th>Método</th>
                                  <th>Items</th>
                                  <th>Comentario</th>
                                  <th>Comprobante</th>
                                  <th>Fecha</th>
                                  <th style={{ width: '180px' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPayments
                                  .filter(payment => {
                                    if (!paymentsSearchQuery.trim()) return true;
                                    const student = students.find(s => s.id === payment.studentId);
                                    const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
                                    const query = paymentsSearchQuery.toLowerCase();
                                    return (
                                      studentName.includes(query) ||
                                      getPaymentMethodLabel(payment.method).toLowerCase().includes(query) ||
                                      payment.comment?.toLowerCase().includes(query)
                                    );
                                  })
                                  .map(payment => {
                                    const student = students.find(s => s.id === payment.studentId);
                                    const itemLabels = payment.appliedItemIds
                                      .map(itemId => paymentCostItems.find(item => item.id === itemId)?.title)
                                      .filter(Boolean)
                                      .join(', ');

                                    return (
                                      <tr key={payment.id}>
                                        <td>{student ? `${student.firstName} ${student.lastName}` : payment.studentId}</td>
                                        <td>${payment.amount.toFixed(2)}</td>
                                        <td>{getPaymentMethodLabel(payment.method)}</td>
                                        <td>{itemLabels || 'No asociado'}</td>
                                        <td>{payment.comment || '-'}</td>
                                        <td>
                                          {payment.receiptUrl ? (
                                            <Button
                                              color="success"
                                              size="sm"
                                              onClick={() => handleDownloadResource(payment.receiptUrl!, payment.receiptName || 'comprobante')}
                                            >
                                              <i className="bi bi-download me-1"></i>
                                              Ver
                                            </Button>
                                          ) : (
                                            <span className="text-muted">N/A</span>
                                          )}
                                        </td>
                                        <td>{new Date(payment.createdAt).toLocaleDateString('es-ES')}</td>
                                        <td>
                                          <div className="d-flex gap-2">
                                            <Button color="info" size="sm" onClick={() => handleEditPayment(payment)}>
                                              <i className="bi bi-pencil me-1"></i>
                                              Editar
                                            </Button>
                                            <Button color="danger" size="sm" onClick={() => handleDeletePayment(payment)}>
                                              <i className="bi bi-trash me-1"></i>
                                              Eliminar
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </Table>

                            {/* No Results */}
                            {paymentsSearchQuery.trim() &&
                              filteredPayments.filter(payment => {
                                const student = students.find(s => s.id === payment.studentId);
                                const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
                                const query = paymentsSearchQuery.toLowerCase();
                                return (
                                  studentName.includes(query) ||
                                  getPaymentMethodLabel(payment.method).toLowerCase().includes(query) ||
                                  payment.comment?.toLowerCase().includes(query)
                                );
                              }).length === 0 && (
                                <div className="text-center py-4">
                                  <p className="text-muted">
                                    No se encontraron pagos con "{paymentsSearchQuery}"
                                  </p>
                                  <Button
                                    color="link"
                                    size="sm"
                                    onClick={() => setPaymentsSearchQuery('')}
                                  >
                                    Limpiar búsqueda
                                  </Button>
                                </div>
                              )}
                          </div>
                        )}
                      </TabPane>
                    </TabContent>
                  </>
                )}
              </CardBody>
            </Card>
          </TabPane>
        )}
      </TabContent>

      {/* WhatsApp Message Modal */}
      <Modal
        isOpen={whatsappMessageModal}
        toggle={() => setWhatsappMessageModal(false)}
        className="modal-fullscreen-sm-down"
      >
        <ModalHeader toggle={() => setWhatsappMessageModal(false)}>
          Enviar Mensaje al Grupo
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="message">Mensaje</Label>
              <Input
                type="textarea"
                id="message"
                rows={4}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Escriba el mensaje que desea enviar al grupo..."
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setWhatsappMessageModal(false)}>
            Cancelar
          </Button>
          <Button
            color="success"
            onClick={handleSendWhatsappMessage}
            disabled={sendingMessage || !whatsappMessage.trim()}
          >
            {sendingMessage ? (
              <>
                <Spinner size="sm" className="me-2" />
                Enviando...
              </>
            ) : (
              <>
                <i className="bi bi-send me-2"></i>
                Enviar
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Classroom Finalization Modal */}
      <ClassroomFinalizationModal
        isOpen={finalizationModal}
        onClose={() => setFinalizationModal(false)}
        classroom={classroom}
        onSuccess={() => {
          setFinalizationModal(false);
          loadClassroomData();
        }}
      />

      {/* Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        toggle={() => {
          setPaymentModalOpen(false);
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
        }}
      >
        <ModalHeader toggle={() => setPaymentModalOpen(false)}>
          {editingPaymentId ? 'Editar Pago' : 'Registrar Pago'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label>Estudiante</Label>
              <Input
                type="select"
                value={paymentForm.studentId}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, studentId: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </Input>
            </FormGroup>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    min="0"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Metodo</Label>
                  <Input
                    type="select"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value as PaymentMethod }))}
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="card">Tarjeta</option>
                    <option value="check">Cheque</option>
                    <option value="mobile">Pago movil</option>
                    <option value="other">Otro</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label>Items Asociados</Label>
              {paymentCostItems.length === 0 ? (
                <Alert color="info">No hay costos para asociar</Alert>
              ) : (
                <div className="d-flex flex-wrap gap-3">
                  {paymentCostItems.map(item => (
                    <FormGroup check key={item.id} className="mb-0">
                      <Input
                        type="checkbox"
                        checked={paymentForm.appliedItemIds.includes(item.id)}
                        onChange={() => handlePaymentItemToggle(item.id)}
                      />
                      <Label check>{item.title}</Label>
                    </FormGroup>
                  ))}
                </div>
              )}
            </FormGroup>
            <FormGroup>
              <Label>Comentario</Label>
              <Input
                type="textarea"
                rows={2}
                value={paymentForm.comment}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, comment: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <Label>Comprobante (opcional)</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) =>
                  setPaymentForm(prev => ({ ...prev, receiptFile: e.target.files?.[0] || null }))
                }
              />
              {editingPaymentReceiptUrl && !paymentForm.receiptFile && (
                <small className="text-muted">Comprobante actual: {editingPaymentReceiptName || 'adjunto'}</small>
              )}
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setPaymentModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handlePaymentSubmit}>
            Guardar Pago
          </Button>
        </ModalFooter>
      </Modal>

      {/* Download Progress Modal */}
      <Modal isOpen={downloadModalOpen} centered>
        <ModalHeader>Descargando Archivo</ModalHeader>
        <ModalBody>
          <div className="text-center mb-3">
            <i className="bi bi-download fs-1 text-primary"></i>
          </div>
          <p className="text-center mb-3">
            <strong>{downloadingFileName}</strong>
          </p>
          <Progress
            value={downloadProgress}
            color="primary"
            style={{ height: '25px' }}
          >
            {downloadProgress}%
          </Progress>
        </ModalBody>
      </Modal>

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
          const selectedStudents = students.filter(s => attendanceSelection.isSelected(s.id));
          let successCount = 0;
          let errorCount = 0;

          for (const student of selectedStudents) {
            try {
              await handleAttendanceChange(student.id, isPresent);
              successCount++;
            } catch (error) {
              errorCount++;
              console.error(`Error marking attendance for ${student.firstName}:`, error);
            }
          }

          if (successCount > 0) {
            toast.success(
              `Asistencia registrada para ${successCount} estudiante${successCount !== 1 ? 's' : ''}`
            );
          }

          if (errorCount > 0) {
            toast.error(
              `Error al registrar ${errorCount} estudiante${errorCount !== 1 ? 's' : ''}`
            );
          }

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
        maxScore={20}
        fieldLabel="Puntos de Participación"
        onSave={handleScoreSave}
        helpText="Ingrese la puntuación total deseada (se calculará el cambio automáticamente)"
      />

      {/* Bulk Participation Dialog */}
      <BulkParticipationDialog
        isOpen={bulkParticipationOpen}
        onClose={() => {
          setBulkParticipationOpen(false);
          participationSelection.clear();
        }}
        selectedStudents={students.filter(s => participationSelection.isSelected(s.id))}
        maxScore={20}
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
    </Container>
  );
};

export default ClassroomManagement;
