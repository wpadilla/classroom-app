// Offline Storage Service - Handles local storage for offline operations

export interface OfflineOperation {
  id: string;
  type: 'addStudent' | 'removeStudent' | 'createStudent' | 'updateClassroom' | 'addStudentToClassroom';
  timestamp: number;
  data: any;
  status: 'pending' | 'synced' | 'failed';
}

export class OfflineStorageService {
  private static OPERATIONS_KEY = 'offline_operations';
  private static STUDENTS_KEY = 'offline_students';
  private static CLASSROOMS_KEY = 'offline_classrooms';

  /**
   * Save an offline operation to be synced later
   */
  static async saveOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'status'>): Promise<string> {
    const operations = this.getOperations();
    const newOperation: OfflineOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: Date.now(),
      status: 'pending'
    };
    
    operations.push(newOperation);
    localStorage.setItem(this.OPERATIONS_KEY, JSON.stringify(operations));
    
    return newOperation.id;
  }

  /**
   * Get all pending operations
   */
  static getOperations(): OfflineOperation[] {
    try {
      const data = localStorage.getItem(this.OPERATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting offline operations:', error);
      return [];
    }
  }

  /**
   * Get pending operations only
   */
  static getPendingOperations(): OfflineOperation[] {
    return this.getOperations().filter(op => op.status === 'pending');
  }

  /**
   * Mark operation as synced
   */
  static markOperationSynced(operationId: string): void {
    const operations = this.getOperations();
    const updated = operations.map(op => 
      op.id === operationId ? { ...op, status: 'synced' as const } : op
    );
    localStorage.setItem(this.OPERATIONS_KEY, JSON.stringify(updated));
  }

  /**
   * Mark operation as failed
   */
  static markOperationFailed(operationId: string): void {
    const operations = this.getOperations();
    const updated = operations.map(op => 
      op.id === operationId ? { ...op, status: 'failed' as const } : op
    );
    localStorage.setItem(this.OPERATIONS_KEY, JSON.stringify(updated));
  }

  /**
   * Remove an operation
   */
  static removeOperation(operationId: string): void {
    const operations = this.getOperations().filter(op => op.id !== operationId);
    localStorage.setItem(this.OPERATIONS_KEY, JSON.stringify(operations));
  }

  /**
   * Clear all synced operations
   */
  static clearSyncedOperations(): void {
    const operations = this.getOperations().filter(op => op.status !== 'synced');
    localStorage.setItem(this.OPERATIONS_KEY, JSON.stringify(operations));
  }

  /**
   * Store student locally
   */
  static saveStudentLocally(student: any): void {
    const students = this.getLocalStudents();
    const existingIndex = students.findIndex(s => s.id === student.id);
    
    if (existingIndex >= 0) {
      students[existingIndex] = student;
    } else {
      students.push(student);
    }
    
    localStorage.setItem(this.STUDENTS_KEY, JSON.stringify(students));
  }

  /**
   * Get locally stored students
   */
  static getLocalStudents(): any[] {
    try {
      const data = localStorage.getItem(this.STUDENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting local students:', error);
      return [];
    }
  }

  /**
   * Get student by ID from local storage
   */
  static getLocalStudent(studentId: string): any | null {
    const students = this.getLocalStudents();
    return students.find(s => s.id === studentId) || null;
  }

  /**
   * Store classroom locally
   */
  static saveClassroomLocally(classroom: any): void {
    const classrooms = this.getLocalClassrooms();
    const existingIndex = classrooms.findIndex(c => c.id === classroom.id);
    
    if (existingIndex >= 0) {
      classrooms[existingIndex] = classroom;
    } else {
      classrooms.push(classroom);
    }
    
    localStorage.setItem(this.CLASSROOMS_KEY, JSON.stringify(classrooms));
  }

  /**
   * Get locally stored classrooms
   */
  static getLocalClassrooms(): any[] {
    try {
      const data = localStorage.getItem(this.CLASSROOMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting local classrooms:', error);
      return [];
    }
  }

  /**
   * Get classroom by ID from local storage
   */
  static getLocalClassroom(classroomId: string): any | null {
    const classrooms = this.getLocalClassrooms();
    return classrooms.find(c => c.id === classroomId) || null;
  }

  /**
   * Update classroom student list locally
   */
  static updateClassroomStudentsLocally(classroomId: string, studentIds: string[]): void {
    const classroom = this.getLocalClassroom(classroomId);
    if (classroom) {
      classroom.studentIds = studentIds;
      this.saveClassroomLocally(classroom);
    }
  }

  /**
   * Generate a unique ID for offline operations
   */
  private static generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all offline data
   */
  static clearAll(): void {
    localStorage.removeItem(this.OPERATIONS_KEY);
    localStorage.removeItem(this.STUDENTS_KEY);
    localStorage.removeItem(this.CLASSROOMS_KEY);
  }

  /**
   * Get count of pending operations
   */
  static getPendingOperationsCount(): number {
    return this.getPendingOperations().length;
  }
}
