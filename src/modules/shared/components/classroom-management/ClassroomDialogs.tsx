import React from 'react';
import { Alert, Input, Progress, Spinner } from 'reactstrap';
import { Dialog } from '../../../../components/common';
import { IClassroomPaymentCostItem, IUser, PaymentMethod } from '../../../../models';

export interface ClassroomPaymentFormState {
  studentId: string;
  amount: string;
  method: PaymentMethod;
  comment: string;
  appliedItemIds: string[];
  receiptFile: File | null;
}

interface ClassroomWhatsappDialogProps {
  isOpen: boolean;
  message: string;
  sending: boolean;
  onClose: () => void;
  onMessageChange: (message: string) => void;
  onSend: () => void;
}

export const ClassroomWhatsappDialog: React.FC<ClassroomWhatsappDialogProps> = ({
  isOpen,
  message,
  sending,
  onClose,
  onMessageChange,
  onSend,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar mensaje al grupo"
      fullScreen
      footer={(
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={sending || !message.trim()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <>
                <Spinner size="sm" />
                Enviando...
              </>
            ) : (
              <>
                <i className="bi bi-send" />
                Enviar mensaje
              </>
            )}
          </button>
        </div>
      )}
    >
      <label className="block text-sm font-medium text-slate-700">
        Mensaje
        <Input
          type="textarea"
          rows={6}
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Escribe el mensaje que deseas enviar al grupo..."
          className="mt-2 rounded-3xl"
        />
      </label>
    </Dialog>
  );
};

interface ClassroomPaymentDialogProps {
  isOpen: boolean;
  editingPaymentId: string | null;
  students: IUser[];
  paymentCostItems: IClassroomPaymentCostItem[];
  paymentForm: ClassroomPaymentFormState;
  editingPaymentReceiptUrl?: string;
  editingPaymentReceiptName?: string;
  onClose: () => void;
  onSubmit: () => void;
  onChange: <K extends keyof ClassroomPaymentFormState>(field: K, value: ClassroomPaymentFormState[K]) => void;
  onToggleItem: (itemId: string) => void;
}

export const ClassroomPaymentDialog: React.FC<ClassroomPaymentDialogProps> = ({
  isOpen,
  editingPaymentId,
  students,
  paymentCostItems,
  paymentForm,
  editingPaymentReceiptUrl,
  editingPaymentReceiptName,
  onClose,
  onSubmit,
  onChange,
  onToggleItem,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={editingPaymentId ? 'Editar pago' : 'Registrar pago'}
      fullScreen
      footer={(
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <i className="bi bi-check-circle" />
            Guardar pago
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Estudiante
          <select
            value={paymentForm.studentId}
            onChange={(event) => onChange('studentId', event.target.value)}
            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
          >
            <option value="">Seleccionar...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Monto
            <Input
              type="number"
              min="0"
              value={paymentForm.amount}
              onChange={(event) => onChange('amount', event.target.value)}
              className="mt-2 rounded-2xl"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Método
            <select
              value={paymentForm.method}
              onChange={(event) => onChange('method', event.target.value as PaymentMethod)}
              className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="card">Tarjeta</option>
              <option value="check">Cheque</option>
              <option value="mobile">Pago móvil</option>
              <option value="other">Otro</option>
            </select>
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Items asociados</p>
          {paymentCostItems.length === 0 ? (
            <Alert color="info" className="mb-0">
              No hay costos para asociar.
            </Alert>
          ) : (
            <div className="flex flex-wrap gap-2">
              {paymentCostItems.map((item) => (
                <label
                  key={item.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${
                    paymentForm.appliedItemIds.includes(item.id)
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={paymentForm.appliedItemIds.includes(item.id)}
                    onChange={() => onToggleItem(item.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {item.title}
                </label>
              ))}
            </div>
          )}
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Comentario
          <Input
            type="textarea"
            rows={4}
            value={paymentForm.comment}
            onChange={(event) => onChange('comment', event.target.value)}
            className="mt-2 rounded-3xl"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Comprobante (opcional)
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => onChange('receiptFile', event.target.files?.[0] || null)}
            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
          />
        </label>

        {editingPaymentReceiptUrl && !paymentForm.receiptFile ? (
          <p className="mb-0 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Comprobante actual: <span className="font-medium">{editingPaymentReceiptName || 'adjunto'}</span>
          </p>
        ) : null}
      </div>
    </Dialog>
  );
};

interface ClassroomDownloadProgressDialogProps {
  isOpen: boolean;
  filename: string;
  progress: number;
  onClose: () => void;
}

export const ClassroomDownloadProgressDialog: React.FC<ClassroomDownloadProgressDialogProps> = ({
  isOpen,
  filename,
  progress,
  onClose,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Descargando archivo"
      centered
    >
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <i className="bi bi-download text-2xl" />
        </div>
        <p className="mb-3 text-sm text-slate-600">{filename}</p>
        <Progress value={progress} color="primary" style={{ height: '18px' }}>
          {progress}%
        </Progress>
      </div>
    </Dialog>
  );
};
