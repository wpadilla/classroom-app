// Payment Service - classroom-level costs and student payments

import { where, QueryConstraint } from 'firebase/firestore';
import { FirebaseService, COLLECTIONS } from '../firebase/firebase.service';
import {
  IClassroomPaymentCost,
  IClassroomPaymentCostItem,
  IClassroomPaymentCostCreate,
  IClassroomPaymentCostUpdate,
  IClassroomStudentPayment,
  IClassroomStudentPaymentCreate,
  IClassroomStudentPaymentUpdate,
  IClassroomStudentPaymentStatus,
  IClassroomStudentPaymentStatusCreate,
  IClassroomStudentPaymentStatusUpdate,
  IClassroomPaymentsSnapshot,
} from '../../models';

export class PaymentService {
  static async getClassroomPaymentCosts(classroomId: string): Promise<IClassroomPaymentCost | null> {
    try {
      const results = await FirebaseService.queryDocuments<IClassroomPaymentCost>(
        COLLECTIONS.CLASSROOM_PAYMENT_COSTS,
        'classroomId',
        '==',
        classroomId
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error getting classroom payment costs:', error);
      return null;
    }
  }

  static async saveClassroomPaymentCosts(
    classroomId: string,
    items: IClassroomPaymentCostItem[],
    existingId?: string
  ): Promise<string> {
    const payload: IClassroomPaymentCostCreate = {
      classroomId,
      items,
    };

    if (existingId) {
      await FirebaseService.updateDocument<IClassroomPaymentCostUpdate>(
        COLLECTIONS.CLASSROOM_PAYMENT_COSTS,
        existingId,
        payload
      );
      return existingId;
    }

    return FirebaseService.createDocument(COLLECTIONS.CLASSROOM_PAYMENT_COSTS, payload);
  }

  static async getClassroomPayments(classroomId: string): Promise<IClassroomStudentPayment[]> {
    try {
      return await FirebaseService.queryDocuments<IClassroomStudentPayment>(
        COLLECTIONS.CLASSROOM_STUDENT_PAYMENTS,
        'classroomId',
        '==',
        classroomId
      );
    } catch (error) {
      console.error('Error getting classroom payments:', error);
      return [];
    }
  }

  static async getStudentPayments(
    classroomId: string,
    studentId: string
  ): Promise<IClassroomStudentPayment[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('classroomId', '==', classroomId),
        where('studentId', '==', studentId),
      ];
      return await FirebaseService.getDocuments<IClassroomStudentPayment>(
        COLLECTIONS.CLASSROOM_STUDENT_PAYMENTS,
        constraints
      );
    } catch (error) {
      console.error('Error getting student payments:', error);
      return [];
    }
  }

  static async addStudentPayment(payment: IClassroomStudentPaymentCreate): Promise<string> {
    try {
      return await FirebaseService.createDocument(COLLECTIONS.CLASSROOM_STUDENT_PAYMENTS, payment);
    } catch (error) {
      console.error('Error creating student payment:', error);
      throw error;
    }
  }

  static async updateStudentPayment(
    paymentId: string,
    updates: IClassroomStudentPaymentUpdate
  ): Promise<void> {
    try {
      await FirebaseService.updateDocument(COLLECTIONS.CLASSROOM_STUDENT_PAYMENTS, paymentId, updates);
    } catch (error) {
      console.error('Error updating student payment:', error);
      throw error;
    }
  }

  static async deleteStudentPayment(paymentId: string): Promise<void> {
    try {
      await FirebaseService.deleteDocument(COLLECTIONS.CLASSROOM_STUDENT_PAYMENTS, paymentId);
    } catch (error) {
      console.error('Error deleting student payment:', error);
      throw error;
    }
  }

  static async getClassroomPaymentStatuses(classroomId: string): Promise<IClassroomStudentPaymentStatus[]> {
    try {
      return await FirebaseService.queryDocuments<IClassroomStudentPaymentStatus>(
        COLLECTIONS.CLASSROOM_PAYMENT_STATUSES,
        'classroomId',
        '==',
        classroomId
      );
    } catch (error) {
      console.error('Error getting classroom payment statuses:', error);
      return [];
    }
  }

  static async getStudentPaymentStatus(
    classroomId: string,
    studentId: string
  ): Promise<IClassroomStudentPaymentStatus | null> {
    try {
      const constraints: QueryConstraint[] = [
        where('classroomId', '==', classroomId),
        where('studentId', '==', studentId),
      ];
      const results = await FirebaseService.getDocuments<IClassroomStudentPaymentStatus>(
        COLLECTIONS.CLASSROOM_PAYMENT_STATUSES,
        constraints
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error getting student payment status:', error);
      return null;
    }
  }

  static async saveStudentPaymentStatus(
    classroomId: string,
    studentId: string,
    items: IClassroomStudentPaymentStatus['items'],
    existingId?: string
  ): Promise<string> {
    const payload: IClassroomStudentPaymentStatusCreate = {
      classroomId,
      studentId,
      items,
    };

    if (existingId) {
      await FirebaseService.updateDocument<IClassroomStudentPaymentStatusUpdate>(
        COLLECTIONS.CLASSROOM_PAYMENT_STATUSES,
        existingId,
        payload
      );
      return existingId;
    }

    return FirebaseService.createDocument(COLLECTIONS.CLASSROOM_PAYMENT_STATUSES, payload);
  }

  static async getClassroomPaymentsSnapshot(classroomId: string): Promise<IClassroomPaymentsSnapshot> {
    const [costDoc, payments, statuses] = await Promise.all([
      this.getClassroomPaymentCosts(classroomId),
      this.getClassroomPayments(classroomId),
      this.getClassroomPaymentStatuses(classroomId),
    ]);

    return {
      costs: costDoc?.items || [],
      payments,
      statuses,
    };
  }
}
