// Firebase Service - Core database operations

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  UpdateData,
  DocumentReference,
  CollectionReference,
  Timestamp
} from 'firebase/firestore';
import { firebaseStoreDB } from '../../utils/firebase';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PROGRAMS: 'programs',
  CLASSROOMS: 'classrooms',
  EVALUATIONS: 'evaluations',
  SESSIONS: 'sessions',
  ATTENDANCE: 'attendance',
  PARTICIPATION: 'participation',
  CLASSROOM_RUNS: 'classroom_runs',
  FINALIZATION_SNAPSHOTS: 'finalization_snapshots'
} as const;

export class FirebaseService {
  /**
   * Convert Firestore Timestamps to JavaScript Date objects
   * Recursively processes nested objects and arrays
   */
  private static convertTimestamps(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Check if it's a Firestore Timestamp
    if (data instanceof Timestamp) {
      return data.toDate();
    }

    // Check if it has toDate method (alternative Timestamp check)
    if (data && typeof data.toDate === 'function') {
      return data.toDate();
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.convertTimestamps(item));
    }

    // Handle objects
    if (typeof data === 'object') {
      const converted: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          converted[key] = this.convertTimestamps(data[key]);
        }
      }
      return converted;
    }

    // Return primitive values as-is
    return data;
  }

  // Generic CRUD operations

  /**
   * Get a single document by ID
   */
  static async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(firebaseStoreDB, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const converted = this.convertTimestamps(data);
        return { ...converted, id: docSnap.id } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get all documents from a collection with optional query constraints
   */
  static async getDocuments<T>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const collectionRef = collection(firebaseStoreDB, collectionName);
      const q = constraints.length > 0
        ? query(collectionRef, ...constraints)
        : collectionRef;

      const querySnapshot = await getDocs(q);
      const documents: T[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const converted = this.convertTimestamps(data);
        documents.push({ ...converted, id: doc.id } as T);
      });

      return documents;
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new document
   */
  static async createDocument<T extends DocumentData>(
    collectionName: string,
    data: WithFieldValue<T>
  ): Promise<string> {
    try {
      const collectionRef = collection(firebaseStoreDB, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing document
   */
  static async updateDocument<T extends DocumentData>(
    collectionName: string,
    docId: string,
    data: UpdateData<T>
  ): Promise<void> {
    try {
      const docRef = doc(firebaseStoreDB, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(firebaseStoreDB, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Query documents with specific conditions
   */
  static async queryDocuments<T>(
    collectionName: string,
    field: string,
    operator: any,
    value: any
  ): Promise<T[]> {
    try {
      const collectionRef = collection(firebaseStoreDB, collectionName);
      const q = query(collectionRef, where(field, operator, value));
      const querySnapshot = await getDocs(q);

      const documents: T[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const converted = this.convertTimestamps(data);
        documents.push({ ...converted, id: doc.id } as T);
      });

      return documents;
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Batch update multiple documents
   */
  static async batchUpdate<T extends DocumentData>(
    collectionName: string,
    updates: { id: string; data: UpdateData<T> }[]
  ): Promise<void> {
    try {
      const promises = updates.map(({ id, data }) =>
        this.updateDocument(collectionName, id, data)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error(`Error batch updating documents in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Check if a document exists
   */
  static async documentExists(collectionName: string, docId: string): Promise<boolean> {
    try {
      const docRef = doc(firebaseStoreDB, collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error(`Error checking document existence in ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Get documents with pagination
   */
  static async getDocumentsPaginated<T>(
    collectionName: string,
    pageSize: number,
    lastDocId?: string,
    constraints: QueryConstraint[] = []
  ): Promise<{ documents: T[]; hasMore: boolean }> {
    try {
      const collectionRef = collection(firebaseStoreDB, collectionName);
      let q = query(collectionRef, ...constraints, limit(pageSize + 1));

      if (lastDocId) {
        const lastDocRef = doc(firebaseStoreDB, collectionName, lastDocId);
        const lastDocSnap = await getDoc(lastDocRef);
        if (lastDocSnap.exists()) {
          q = query(collectionRef, ...constraints, orderBy('createdAt'), limit(pageSize + 1));
        }
      }

      const querySnapshot = await getDocs(q);
      const documents: T[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const converted = this.convertTimestamps(data);
        documents.push({ ...converted, id: doc.id } as T);
      });

      const hasMore = documents.length > pageSize;
      if (hasMore) {
        documents.pop(); // Remove the extra document
      }

      return { documents, hasMore };
    } catch (error) {
      console.error(`Error getting paginated documents from ${collectionName}:`, error);
      throw error;
    }
  }
}
