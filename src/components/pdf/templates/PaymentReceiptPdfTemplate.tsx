import React from 'react';
import { Link, Text } from '@react-pdf/renderer';
import { PDFDocument } from '../core/PDFDocument';
import { PDFHeader } from '../layout/PDFHeader';
import { PDFSection } from '../layout/PDFSection';
import { PDFColumns } from '../layout/PDFColumns';
import { PDFKeyValue } from '../data/PDFKeyValue';
import { PDFTable } from '../data/PDFTable';
import { IClassroomPaymentCostItem, IClassroomStudentPayment, IClassroomStudentPaymentStatus } from '../../../models';

export interface PaymentReceiptPdfProps {
  title: string;
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  classroomName: string;
  classroomSubject: string;
  programName?: string;
  generatedBy: string;
  costs: IClassroomPaymentCostItem[];
  payments: IClassroomStudentPayment[];
  statuses: IClassroomStudentPaymentStatus['items'];
}

const methodLabels: Record<IClassroomStudentPayment['method'], string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  check: 'Cheque',
  mobile: 'Pago movil',
  other: 'Otro',
};

const PaymentReceiptPdfTemplate: React.FC<PaymentReceiptPdfProps> = ({
  title,
  studentName,
  studentPhone,
  studentEmail,
  classroomName,
  classroomSubject,
  programName,
  generatedBy,
  costs,
  payments,
  statuses,
}) => {
  const totalDue = costs.filter(c => c.required).reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = totalDue - totalPaid;

  const statusMap = new Map(statuses.map(item => [item.itemId, item.status]));

  const costRows = costs.map(item => ({
    title: item.title,
    amount: `$${item.amount.toFixed(2)}`,
    required: item.required ? 'Si' : 'No',
    status: statusMap.get(item.id) || 'unpaid',
  }));

  const paymentRows = payments.map(payment => ({
    date: new Date(payment.createdAt).toLocaleDateString('es-ES'),
    method: methodLabels[payment.method] || payment.method,
    amount: `$${payment.amount.toFixed(2)}`,
    items: payment.appliedItemIds
      .map(id => costs.find(item => item.id === id)?.title)
      .filter(Boolean)
      .join(', ') || 'No asociado',
    comment: payment.comment || 'N/A',
    receiptUrl: payment.receiptUrl
      ? (payment.receiptUrl.startsWith('http') ? payment.receiptUrl : `https://${payment.receiptUrl}`)
      : '',
    receiptText: payment.receiptUrl
      ? (payment.receiptUrl.startsWith('http') ? payment.receiptUrl : `https://${payment.receiptUrl}`)
      : 'N/A',
  }));

  return (
    <PDFDocument
      metadata={{
        title,
        author: generatedBy,
        subject: `Comprobante de pagos - ${studentName}`,
      }}
    >
      <PDFHeader
        title={title}
        subtitle="Comprobante de pagos"
        metadata={{
          Estudiante: studentName,
          Telefono: studentPhone,
          Email: studentEmail || 'N/A',
          Programa: programName || 'N/A',
          Clase: `${classroomSubject} - ${classroomName}`,
          Generado: new Date().toLocaleDateString('es-ES'),
        }}
      />

      <PDFColumns columns={2} gap={12}>
        <PDFSection title="Resumen">
          <PDFKeyValue
            data={{
              'Total Adeudado': `$${totalDue.toFixed(2)}`,
              'Total Pagado': `$${totalPaid.toFixed(2)}`,
              Balance: `$${balance.toFixed(2)}`,
            }}
          />
        </PDFSection>
        <PDFSection title="Emitido por">
          <PDFKeyValue
            data={{
              Administrador: generatedBy,
              Fecha: new Date().toLocaleDateString('es-ES'),
            }}
          />
        </PDFSection>
      </PDFColumns>

      <PDFSection title="Costos y estado">
        <PDFTable
          columns={[
            { key: 'title', label: 'Concepto', width: '35%' },
            { key: 'amount', label: 'Monto', width: '15%', align: 'center' },
            { key: 'required', label: 'Obligatorio', width: '15%', align: 'center' },
            { key: 'status', label: 'Estado', width: '15%', align: 'center' },
          ]}
          data={costRows}
          stripe
        />
      </PDFSection>

      <PDFSection title="Pagos registrados">
        <PDFTable
          columns={[
            { key: 'date', label: 'Fecha', width: '12%' },
            { key: 'method', label: 'Metodo', width: '12%' },
            { key: 'amount', label: 'Monto', width: '12%', align: 'center' },
            { key: 'items', label: 'Items', width: '16%' },
            { key: 'comment', label: 'Comentario', width: '18%' },
            {
              key: 'receiptUrl',
              label: 'Comp.',
              width: '8%',
              align: 'center',
              render: (value) =>
                value ? (
                  <Link src={String(value)}>
                    <Text style={{ fontSize: 8, color: '#2563eb' }}>Abrir</Text>
                  </Link>
                ) : (
                  'N/A'
                ),
            },
            { key: 'receiptText', label: 'URL', width: '22%' },
          ]}
          data={paymentRows}
          stripe
        />
      </PDFSection>
    </PDFDocument>
  );
};

export default PaymentReceiptPdfTemplate;
