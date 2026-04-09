import React, { useMemo, useState } from 'react';
import { Alert, Badge, Spinner } from 'reactstrap';
import { AnimatePresence, motion } from 'framer-motion';
import PaymentReceiptPdfDownloadButton from '../../../../components/pdf/components/PaymentReceiptPdfDownloadButton';
import { EmptyState, SearchInput } from '../../../../components/mobile';
import SectionHeader from '../../../../components/student/SectionHeader';
import { Dialog } from '../../../../components/common';
import {
  IClassroom,
  IUser,
  IClassroomPaymentCostItem,
  IClassroomStudentPayment,
  IClassroomStudentPaymentStatus,
  PaymentItemStatus,
  PaymentItemType,
} from '../../../../models';

interface ClassroomPaymentsSectionProps {
  classroom: IClassroom;
  user: Pick<IUser, 'firstName' | 'lastName'> | null;
  paymentsLoading: boolean;
  paymentProgramName: string;
  paymentCostItems: IClassroomPaymentCostItem[];
  studentPayments: IClassroomStudentPayment[];
  paymentStatuses: IClassroomStudentPaymentStatus[];
  students: IUser[];
  paymentsStudentsSearchQuery: string;
  paymentsSearchQuery: string;
  paymentFilterStudentId: string;
  costForm: {
    title: string;
    description: string;
    amount: string;
    required: boolean;
    type: PaymentItemType;
  };
  editingCostId: string | null;
  onOpenPaymentModal: () => void;
  onCostFormChange: (field: 'title' | 'description' | 'amount' | 'required' | 'type', value: string | boolean) => void;
  onResetCostForm: () => void;
  onSaveCostItem: () => void;
  onEditCostItem: (item: IClassroomPaymentCostItem) => void;
  onDeleteCostItem: (itemId: string) => void;
  onStatusChange: (studentId: string, itemId: string, status: PaymentItemStatus) => void;
  onEditPayment: (payment: IClassroomStudentPayment) => void;
  onDeletePayment: (payment: IClassroomStudentPayment) => void;
  onDownloadReceipt: (url: string, filename: string) => void;
  onPaymentsStudentsSearchQueryChange: (query: string) => void;
  onPaymentsSearchQueryChange: (query: string) => void;
  onPaymentFilterStudentIdChange: (studentId: string) => void;
  getPaymentMethodLabel: (method: IClassroomStudentPayment['method']) => string;
  getStatusForItem: (studentId: string, itemId: string) => PaymentItemStatus;
}

const paymentTypeLabelMap: Record<PaymentItemType, string> = {
  material: 'Material',
  fee: 'Cuota',
  custom: 'Otro',
};

const paymentTypeToneMap: Record<PaymentItemType, string> = {
  material: 'info',
  fee: 'primary',
  custom: 'secondary',
};

const ClassroomPaymentsSection: React.FC<ClassroomPaymentsSectionProps> = ({
  classroom,
  user,
  paymentsLoading,
  paymentProgramName,
  paymentCostItems,
  studentPayments,
  paymentStatuses,
  students,
  paymentsStudentsSearchQuery,
  paymentsSearchQuery,
  paymentFilterStudentId,
  costForm,
  editingCostId,
  onOpenPaymentModal,
  onCostFormChange,
  onResetCostForm,
  onSaveCostItem,
  onEditCostItem,
  onDeleteCostItem,
  onStatusChange,
  onEditPayment,
  onDeletePayment,
  onDownloadReceipt,
  onPaymentsStudentsSearchQueryChange,
  onPaymentsSearchQueryChange,
  onPaymentFilterStudentIdChange,
  getPaymentMethodLabel,
  getStatusForItem,
}) => {
  const [costDrawerOpen, setCostDrawerOpen] = useState(false);
  const [paymentsDrawerOpen, setPaymentsDrawerOpen] = useState(false);
  const [studentBalancesOpen, setStudentBalancesOpen] = useState(false);
  const [expandedStudentIds, setExpandedStudentIds] = useState<Set<string>>(new Set());

  const totalDue = useMemo(
    () => paymentCostItems.reduce((sum, item) => sum + item.amount, 0),
    [paymentCostItems]
  );

  const totalCollected = useMemo(
    () => studentPayments.reduce((sum, payment) => sum + payment.amount, 0),
    [studentPayments]
  );

  const filteredStudents = useMemo(() => {
    if (!paymentsStudentsSearchQuery.trim()) {
      return students;
    }

    const query = paymentsStudentsSearchQuery.toLowerCase();
    return students.filter((student) =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(query) ||
      student.phone?.toLowerCase().includes(query)
    );
  }, [paymentsStudentsSearchQuery, students]);

  const filteredPayments = useMemo(() => {
    const byStudent = paymentFilterStudentId
      ? studentPayments.filter((payment) => payment.studentId === paymentFilterStudentId)
      : studentPayments;

    if (!paymentsSearchQuery.trim()) {
      return byStudent;
    }

    const query = paymentsSearchQuery.toLowerCase();
    return byStudent.filter((payment) => {
      const student = students.find((item) => item.id === payment.studentId);
      const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
      return (
        studentName.includes(query) ||
        getPaymentMethodLabel(payment.method).toLowerCase().includes(query) ||
        payment.comment?.toLowerCase().includes(query)
      );
    });
  }, [getPaymentMethodLabel, paymentFilterStudentId, paymentsSearchQuery, studentPayments, students]);

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  return (
    <SectionHeader
      icon="bi-cash-coin"
      title="Pagos"
      badge={studentPayments.length}
      badgeColor="bg-emerald-100 text-emerald-700"
      defaultOpen={false}
      rightAction={(
        <button
          type="button"
          onClick={onOpenPaymentModal}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          <i className="bi bi-plus-circle" />
          Registrar pago
        </button>
      )}
    >
      <div className="rounded-[28px] p-2 bg-white">
        {paymentsLoading ? (
          <div className="py-8 text-center text-slate-500">
            <Spinner color="primary" />
            <p className="mb-0 mt-3">Cargando pagos...</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <div className="min-w-[160px] flex-shrink-0 rounded-2xl bg-slate-100 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pagos</p>
                <p className="mb-0 text-lg font-semibold text-slate-900">
                  {studentPayments.length}
                </p>
              </div>
              <div className="min-w-[160px] flex-shrink-0 rounded-2xl bg-blue-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">Costos</p>
                <p className="mb-0 text-lg font-semibold text-blue-900">
                  ${totalDue.toFixed(2)}
                </p>
              </div>
              <div className="min-w-[160px] flex-shrink-0 rounded-2xl bg-emerald-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">Cobrado</p>
                <p className="mb-0 text-lg font-semibold text-emerald-900">
                  ${totalCollected.toFixed(2)}
                </p>
              </div>
              
              
            </div>

            <div className="rounded-[24px]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mb-1 text-base font-semibold text-slate-900">Costos de la clase</p>
                  <p className="mb-0 text-sm text-slate-500">Configura materiales, cuotas y cargos personalizados.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCostDrawerOpen(true)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  <i className="bi bi-sliders" />
                  {editingCostId ? 'Editar costos' : 'Gestionar costos'}
                </button>
              </div>

              {paymentCostItems.length === 0 ? (
                <Alert color="info" className="mb-0 mt-4">
                  No hay costos registrados para esta clase.
                </Alert>
              ) : (
                <div className="mt-4 space-y-3">
                  {paymentCostItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.04 }}
                      className="rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="mb-0 text-sm font-semibold text-slate-900">{item.title}</p>
                            <Badge color={paymentTypeToneMap[item.type]}>{paymentTypeLabelMap[item.type]}</Badge>
                            {item.required ? <Badge color="dark">Obligatorio</Badge> : null}
                          </div>
                          {item.description ? (
                            <p className="mb-0 mt-1 text-sm text-slate-500">{item.description}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                            ${item.amount.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onEditCostItem(item)}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            <i className="bi bi-pencil" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCostItem(item.id)}
                            className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            <i className="bi bi-trash" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setStudentBalancesOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <p className="mb-1 text-base font-semibold text-slate-900">Balance por estudiante</p>
                  <p className="mb-0 text-sm text-slate-500">Controla deuda, pagos y estado por concepto.</p>
                </div>
                <motion.i
                  className="bi bi-chevron-down shrink-0 text-slate-400"
                  animate={{ rotate: studentBalancesOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                />
              </button>

              <AnimatePresence initial={false}>
                {studentBalancesOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4">
                      {students.length > 0 ? (
                        <div className="mb-4 w-full max-w-md">
                          <SearchInput
                            placeholder="Buscar estudiante..."
                            onSearch={onPaymentsStudentsSearchQueryChange}
                          />
                        </div>
                      ) : null}

                      {filteredStudents.length === 0 ? (
                        <EmptyState
                          icon="bi-people"
                          heading="Sin estudiantes para mostrar"
                          description="No hay coincidencias o aún no hay estudiantes inscritos."
                        />
                      ) : (
                        <div className="space-y-3">
                          {filteredStudents.map((student, index) => {
                            const paidByStudent = studentPayments
                              .filter((payment) => payment.studentId === student.id)
                              .reduce((sum, payment) => sum + payment.amount, 0);
                            const balance = totalDue - paidByStudent;
                            const statusDocument = paymentStatuses.find((item) => item.studentId === student.id);
                            const isExpanded = expandedStudentIds.has(student.id);

                            return (
                              <motion.div
                                key={student.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22, delay: index * 0.04 }}
                                className="rounded-2xl border border-slate-200 bg-white p-3"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleStudentExpansion(student.id)}
                                  className="flex w-full items-center justify-between gap-3 text-left"
                                >
                                  <div className="min-w-0">
                                    <p className="mb-1 truncate text-sm font-semibold text-slate-900">
                                      {student.firstName} {student.lastName}
                                    </p>
                                    <p className="mb-0 text-sm text-slate-500">{student.phone || 'Sin teléfono'}</p>
                                  </div>
                                  <motion.i
                                    className="bi bi-chevron-down shrink-0 text-slate-400"
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  />
                                </button>

                                <div className="mt-4 grid grid-cols-3 gap-2">
                                  <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm">
                                    <p className="mb-1 truncate text-[11px] uppercase tracking-[0.16em] text-slate-500">Adeudado</p>
                                    <p className="mb-0 font-semibold text-slate-800">${totalDue.toFixed(2)}</p>
                                  </div>
                                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm">
                                    <p className="mb-1 truncate text-[11px] uppercase tracking-[0.16em] text-emerald-500">Pagado</p>
                                    <p className="mb-0 font-semibold text-emerald-800">${paidByStudent.toFixed(2)}</p>
                                  </div>
                                  <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm">
                                    <p className="mb-1 truncate text-[11px] uppercase tracking-[0.16em] text-amber-500">Balance</p>
                                    <p className="mb-0 font-semibold text-amber-900">${balance.toFixed(2)}</p>
                                  </div>
                                </div>

                                <AnimatePresence initial={false}>
                                  {isExpanded ? (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.24, ease: 'easeInOut' }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        <PaymentReceiptPdfDownloadButton
                                          title="Comprobante de Pagos"
                                          studentName={`${student.firstName} ${student.lastName}`}
                                          studentPhone={student.phone}
                                          studentEmail={student.email}
                                          classroomName={classroom.name}
                                          classroomSubject={classroom.subject}
                                          programName={paymentProgramName}
                                          generatedBy={
                                            user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Administrador'
                                          }
                                          costs={paymentCostItems}
                                          payments={studentPayments.filter((payment) => payment.studentId === student.id)}
                                          statuses={statusDocument?.items || []}
                                        >
                                          <button
                                            type="button"
                                            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                          >
                                            <i className="bi bi-file-earmark-pdf" />
                                            Comprobante PDF
                                          </button>
                                        </PaymentReceiptPdfDownloadButton>
                                      </div>

                                      {paymentCostItems.length > 0 ? (
                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                          {paymentCostItems.map((item) => (
                                            <label key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                                              <span className="mb-2 block">{item.title}</span>
                                              <select
                                                value={getStatusForItem(student.id, item.id)}
                                                onChange={(event) =>
                                                  onStatusChange(student.id, item.id, event.target.value as PaymentItemStatus)
                                                }
                                                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                                              >
                                                <option value="paid">Pagado</option>
                                                <option value="pending">Pendiente</option>
                                                <option value="unpaid">No pagado</option>
                                              </select>
                                            </label>
                                          ))}
                                        </div>
                                      ) : null}
                                    </motion.div>
                                  ) : null}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mb-1 text-base font-semibold text-slate-900">Pagos registrados</p>
                  <p className="mb-0 text-sm text-slate-500">Abre el historial completo en un drawer para revisar, filtrar y editar.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentsDrawerOpen(true)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <i className="bi bi-receipt" />
                  Ver pagos registrados
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Registros</p>
                  <p className="mb-0 text-lg font-semibold text-slate-900">{studentPayments.length}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Último filtro</p>
                  <p className="mb-0 truncate text-sm font-semibold text-slate-900">
                    {paymentFilterStudentId
                      ? students.find((student) => student.id === paymentFilterStudentId)?.firstName || 'Estudiante'
                      : 'Todos'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Búsqueda</p>
                  <p className="mb-0 truncate text-sm font-semibold text-slate-900">
                    {paymentsSearchQuery.trim() || 'Sin búsqueda'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        isOpen={costDrawerOpen}
        onClose={() => setCostDrawerOpen(false)}
        title="Costos de la clase"
        fullScreen
        footer={(
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {editingCostId ? (
              <button
                type="button"
                onClick={onResetCostForm}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                <i className="bi bi-x-circle" />
                Cancelar edición
              </button>
            ) : null}
            <button
              type="button"
              onClick={onSaveCostItem}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <i className="bi bi-check-circle" />
              {editingCostId ? 'Actualizar costo' : 'Agregar costo'}
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Título
              <input
                value={costForm.title}
                onChange={(event) => onCostFormChange('title', event.target.value)}
                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-3"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Tipo
              <select
                value={costForm.type}
                onChange={(event) => onCostFormChange('type', event.target.value)}
                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-3"
              >
                <option value="material">Material</option>
                <option value="fee">Cuota</option>
                <option value="custom">Otro</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Descripción
              <input
                value={costForm.description}
                onChange={(event) => onCostFormChange('description', event.target.value)}
                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-3"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Monto
              <input
                type="number"
                min="0"
                value={costForm.amount}
                onChange={(event) => onCostFormChange('amount', event.target.value)}
                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-3"
              />
            </label>
            <label className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={costForm.required}
                onChange={(event) => onCostFormChange('required', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Obligatorio
            </label>
          </div>

          {paymentCostItems.length === 0 ? (
            <Alert color="info" className="mb-0">
              No hay costos registrados para esta clase.
            </Alert>
          ) : (
            <div className="space-y-3">
              {paymentCostItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.04 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="mb-0 text-sm font-semibold text-slate-900">{item.title}</p>
                        <Badge color={paymentTypeToneMap[item.type]}>{paymentTypeLabelMap[item.type]}</Badge>
                        {item.required ? <Badge color="dark">Obligatorio</Badge> : null}
                      </div>
                      {item.description ? <p className="mb-0 mt-1 text-sm text-slate-500">{item.description}</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                        ${item.amount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditCostItem(item)}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        <i className="bi bi-pencil" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCostItem(item.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        <i className="bi bi-trash" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        isOpen={paymentsDrawerOpen}
        onClose={() => setPaymentsDrawerOpen(false)}
        title="Pagos registrados"
        fullScreen
      >
        <div className="space-y-4">
          <div className="grid gap-3 lg:min-w-[360px]">
            <select
              value={paymentFilterStudentId}
              onChange={(event) => onPaymentFilterStudentIdChange(event.target.value)}
              className="block w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
            >
              <option value="">Todos los estudiantes</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>

            {studentPayments.length > 0 ? (
              <SearchInput
                placeholder="Buscar pago..."
                onSearch={onPaymentsSearchQueryChange}
              />
            ) : null}
          </div>

          {filteredPayments.length === 0 ? (
            <EmptyState
              icon="bi-cash-coin"
              heading="Sin pagos registrados"
              description="Registra el primer pago para comenzar a llevar control detallado."
            />
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment, index) => {
                const student = students.find((item) => item.id === payment.studentId);
                const itemLabels = payment.appliedItemIds
                  .map((itemId) => paymentCostItems.find((item) => item.id === itemId)?.title)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.04 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="mb-1 text-sm font-semibold text-slate-900">
                          {student ? `${student.firstName} ${student.lastName}` : payment.studentId}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>{getPaymentMethodLabel(payment.method)}</span>
                          <span>·</span>
                          <span>{new Date(payment.createdAt).toLocaleDateString('es-ES')}</span>
                        </div>
                        <p className="mb-0 mt-2 text-sm text-slate-600">
                          {payment.comment || 'Sin comentario'}
                        </p>
                        <p className="mb-0 mt-2 text-xs text-slate-500">
                          {itemLabels || 'Sin items asociados'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                          ${payment.amount.toFixed(2)}
                        </span>
                        {payment.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => onDownloadReceipt(payment.receiptUrl!, payment.receiptName || 'comprobante')}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            <i className="bi bi-download" />
                            Ver comprobante
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onEditPayment(payment)}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          <i className="bi bi-pencil" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePayment(payment)}
                          className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          <i className="bi bi-trash" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Dialog>
    </SectionHeader>
  );
};

export default ClassroomPaymentsSection;
