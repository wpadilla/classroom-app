// Payment models for classroom-level billing

export type PaymentMethod =
  | 'cash'
  | 'transfer'
  | 'card'
  | 'check'
  | 'mobile'
  | 'other';

export type PaymentItemType = 'material' | 'fee' | 'custom';

export type PaymentItemStatus = 'paid' | 'pending' | 'unpaid';

export interface IClassroomPaymentCostItem {
  id: string;
  title: string;
  description?: string;
  amount: number;
  required: boolean;
  type: PaymentItemType;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClassroomPaymentCost {
  id: string;
  classroomId: string;
  items: IClassroomPaymentCostItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IClassroomStudentPayment {
  id: string;
  classroomId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  comment?: string;
  receiptUrl?: string;
  receiptName?: string;
  appliedItemIds: string[];
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface IClassroomStudentPaymentStatusItem {
  itemId: string;
  status: PaymentItemStatus;
  updatedAt: Date;
  updatedBy: string;
}

export interface IClassroomStudentPaymentStatus {
  id: string;
  classroomId: string;
  studentId: string;
  items: IClassroomStudentPaymentStatusItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IClassroomPaymentsSnapshot {
  costs: IClassroomPaymentCostItem[];
  payments: IClassroomStudentPayment[];
  statuses: IClassroomStudentPaymentStatus[];
}

export type IClassroomPaymentCostCreate = Omit<IClassroomPaymentCost, 'id' | 'createdAt' | 'updatedAt'>;
export type IClassroomPaymentCostUpdate = Partial<Omit<IClassroomPaymentCost, 'id' | 'createdAt'>>;

export type IClassroomStudentPaymentCreate = Omit<IClassroomStudentPayment, 'id' | 'createdAt' | 'updatedAt'>;
export type IClassroomStudentPaymentUpdate = Partial<Omit<IClassroomStudentPayment, 'id' | 'createdAt'>>;

export type IClassroomStudentPaymentStatusCreate = Omit<IClassroomStudentPaymentStatus, 'id' | 'createdAt' | 'updatedAt'>;
export type IClassroomStudentPaymentStatusUpdate = Partial<Omit<IClassroomStudentPaymentStatus, 'id' | 'createdAt'>>;
