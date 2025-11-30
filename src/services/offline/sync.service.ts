// Sync Service - Handles synchronization of offline operations

import { OfflineStorageService, OfflineOperation } from './offline-storage.service';
import { ClassroomService } from '../classroom/classroom.service';
import { UserService } from '../user/user.service';
import { toast } from 'react-toastify';

export class SyncService {
  private static isSyncing = false;

  /**
   * Sync all pending operations when connection is restored
   */
  static async syncPendingOperations(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    const operations = OfflineStorageService.getPendingOperations();
    
    if (operations.length === 0) {
      this.isSyncing = false;
      return { success: 0, failed: 0 };
    }

    console.log(`Starting sync of ${operations.length} operations`);
    let successCount = 0;
    let failedCount = 0;

    // Sort operations by timestamp to maintain order
    const sortedOps = [...operations].sort((a, b) => a.timestamp - b.timestamp);

    for (const operation of sortedOps) {
      try {
        await this.syncOperation(operation);
        OfflineStorageService.markOperationSynced(operation.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        OfflineStorageService.markOperationFailed(operation.id);
        failedCount++;
      }
    }

    // Clean up synced operations
    OfflineStorageService.clearSyncedOperations();

    this.isSyncing = false;

    if (successCount > 0) {
      toast.success(`${successCount} operación(es) sincronizada(s)`);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} operación(es) fallida(s)`);
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Sync a single operation
   */
  private static async syncOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.type) {
      case 'createStudent':
        await this.syncCreateStudent(operation);
        break;
      case 'addStudentToClassroom':
        await this.syncAddStudentToClassroom(operation);
        break;
      case 'removeStudent':
        await this.syncRemoveStudent(operation);
        break;
      default:
        console.warn(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Sync create student operation
   */
  private static async syncCreateStudent(operation: OfflineOperation): Promise<void> {
    const { studentData, classroomId } = operation.data;
    
    // Create the student in Firebase
    const studentId = await UserService.createUser(studentData);
    
    // Add student to classroom
    if (classroomId) {
      await ClassroomService.addStudentToClassroom(classroomId, studentId);
    }
  }

  /**
   * Sync add student to classroom operation
   */
  private static async syncAddStudentToClassroom(operation: OfflineOperation): Promise<void> {
    const { classroomId, studentId } = operation.data;
    await ClassroomService.addStudentToClassroom(classroomId, studentId);
  }

  /**
   * Sync remove student operation
   */
  private static async syncRemoveStudent(operation: OfflineOperation): Promise<void> {
    const { classroomId, studentId } = operation.data;
    await ClassroomService.removeStudentFromClassroom(classroomId, studentId);
  }

  /**
   * Check if there are pending operations
   */
  static hasPendingOperations(): boolean {
    return OfflineStorageService.getPendingOperationsCount() > 0;
  }

  /**
   * Get pending operations count
   */
  static getPendingCount(): number {
    return OfflineStorageService.getPendingOperationsCount();
  }
}
