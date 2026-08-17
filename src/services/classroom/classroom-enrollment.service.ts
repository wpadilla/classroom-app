import { arrayRemove, arrayUnion, doc, writeBatch } from 'firebase/firestore';
import { firebaseStoreDB } from '../../utils/firebase';
import { COLLECTIONS } from '../firebase/firebase.service';

/**
 * Keeps the denormalized student/classroom enrollment relationship consistent.
 * Both documents are updated in one atomic Firestore batch so a partial
 * enrollment can never be committed.
 */
export class ClassroomEnrollmentService {
  static async enrollStudent(classroomId: string, studentId: string): Promise<void> {
    this.assertIdentifiers(classroomId, studentId);

    const batch = writeBatch(firebaseStoreDB);
    const updatedAt = new Date();

    batch.update(doc(firebaseStoreDB, COLLECTIONS.CLASSROOMS, classroomId), {
      studentIds: arrayUnion(studentId),
      updatedAt,
    });
    batch.update(doc(firebaseStoreDB, COLLECTIONS.USERS, studentId), {
      enrolledClassrooms: arrayUnion(classroomId),
      updatedAt,
    });

    await batch.commit();
  }

  static async unenrollStudent(classroomId: string, studentId: string): Promise<void> {
    this.assertIdentifiers(classroomId, studentId);

    const batch = writeBatch(firebaseStoreDB);
    const updatedAt = new Date();

    batch.update(doc(firebaseStoreDB, COLLECTIONS.CLASSROOMS, classroomId), {
      studentIds: arrayRemove(studentId),
      updatedAt,
    });
    batch.update(doc(firebaseStoreDB, COLLECTIONS.USERS, studentId), {
      enrolledClassrooms: arrayRemove(classroomId),
      updatedAt,
    });

    await batch.commit();
  }

  private static assertIdentifiers(classroomId: string, studentId: string): void {
    if (!classroomId || !studentId) {
      throw new Error('La clase y el estudiante son obligatorios para actualizar la inscripción');
    }
  }
}
