import {
  IClassroomPaymentsSnapshot,
  IClassroomPaymentCostItem,
  IClassroomStudentPayment,
  IClassroomStudentPaymentStatus,
  PaymentItemStatus,
  PaymentMethod,
} from '../models';

const STATUS_LABELS: Record<PaymentItemStatus, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  unpaid: 'No pagado',
};

const STATUS_COLORS: Record<PaymentItemStatus, string> = {
  paid: 'success',
  pending: 'warning',
  unpaid: 'danger',
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  check: 'Cheque',
  mobile: 'Pago móvil',
  other: 'Otro',
};

export const formatCurrency = (amount: number, currency: string = 'RD$'): string => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${currency}${safeAmount.toLocaleString('es-DO')}`;
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  return METHOD_LABELS[method] || method;
};

export const getPaymentStatusLabel = (status: PaymentItemStatus): string => {
  return STATUS_LABELS[status] || status;
};

export const getPaymentStatusColor = (status: PaymentItemStatus): string => {
  return STATUS_COLORS[status] || 'secondary';
};

export const getTotalDuePerStudent = (items: IClassroomPaymentCostItem[]): number => {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
};

export const getTotalPaid = (payments: IClassroomStudentPayment[]): number => {
  return payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
};

export const getStudentTotalPaid = (
  payments: IClassroomStudentPayment[],
  studentId: string
): number => {
  return payments
    .filter(payment => payment.studentId === studentId)
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);
};

export const getStudentItemStatus = (
  statuses: IClassroomStudentPaymentStatus[],
  studentId: string,
  itemId: string
): PaymentItemStatus => {
  const statusDoc = statuses.find(status => status.studentId === studentId);
  const itemStatus = statusDoc?.items.find(item => item.itemId === itemId);
  return itemStatus?.status || 'unpaid';
};

export const getStudentStatusCounts = (
  costs: IClassroomPaymentCostItem[],
  statuses: IClassroomStudentPaymentStatus[],
  studentId: string
): Record<PaymentItemStatus, number> => {
  const counts: Record<PaymentItemStatus, number> = {
    paid: 0,
    pending: 0,
    unpaid: 0,
  };

  costs.forEach(item => {
    const status = getStudentItemStatus(statuses, studentId, item.id);
    counts[status] = (counts[status] || 0) + 1;
  });

  return counts;
};

export const getStatusCountsForSnapshot = (
  costs: IClassroomPaymentCostItem[],
  statuses: IClassroomStudentPaymentStatus[],
  studentIds: string[]
): Record<PaymentItemStatus, number> => {
  const counts: Record<PaymentItemStatus, number> = {
    paid: 0,
    pending: 0,
    unpaid: 0,
  };

  if (costs.length === 0 || studentIds.length === 0) {
    return counts;
  }

  studentIds.forEach(studentId => {
    const studentCounts = getStudentStatusCounts(costs, statuses, studentId);
    counts.paid += studentCounts.paid;
    counts.pending += studentCounts.pending;
    counts.unpaid += studentCounts.unpaid;
  });

  return counts;
};

export const buildPaymentsSnapshotSummary = (
  snapshot: IClassroomPaymentsSnapshot,
  studentIds: string[]
) => {
  const totalDuePerStudent = getTotalDuePerStudent(snapshot.costs);
  const totalDue = totalDuePerStudent * studentIds.length;
  const totalPaid = getTotalPaid(snapshot.payments);
  const balance = totalDue - totalPaid;
  const statusCounts = getStatusCountsForSnapshot(snapshot.costs, snapshot.statuses, studentIds);

  return {
    totalDuePerStudent,
    totalDue,
    totalPaid,
    balance,
    statusCounts,
  };
};

export const groupPaymentsByStudent = (payments: IClassroomStudentPayment[]) => {
  return payments.reduce<Record<string, IClassroomStudentPayment[]>>((acc, payment) => {
    if (!acc[payment.studentId]) {
      acc[payment.studentId] = [];
    }
    acc[payment.studentId].push(payment);
    return acc;
  }, {});
};
