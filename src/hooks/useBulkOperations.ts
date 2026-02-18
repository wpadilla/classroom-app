// Hook for bulk operations on users
// Selection management and batch actions

import { useState, useCallback, useMemo } from 'react';
import { IUser } from '../models';
import { ClassroomService } from '../services/classroom/classroom.service';
import { UserService } from '../services/user/user.service';
import { toast } from 'react-toastify';

interface UseBulkOperationsReturn {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  selectedCount: number;
  toggleSelection: (id: string) => void;
  selectAll: (users: IUser[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  bulkEnroll: (classroomIds: string[]) => Promise<BulkOperationResult>;
  bulkUnenroll: (classroomIds: string[]) => Promise<BulkOperationResult>;
  bulkActivate: () => Promise<BulkOperationResult>;
  bulkDeactivate: () => Promise<BulkOperationResult>;
  getSelectedUsers: (users: IUser[]) => IUser[];
}

interface BulkOperationResult {
  success: boolean;
  processed: number;
  errors: number;
  messages: string[];
}

export const useBulkOperations = (): UseBulkOperationsReturn => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((users: IUser[]) => {
    const allIds = users.map(u => u.id);
    const allSelected = allIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      setSelectedIds(new Set(allIds));
    }
  }, [selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const isAllSelected = useMemo(() => {
    return selectedIds.size > 0;
  }, [selectedIds]);

  const getSelectedUsers = useCallback((users: IUser[]): IUser[] => {
    return users.filter(u => selectedIds.has(u.id));
  }, [selectedIds]);

  const bulkEnroll = useCallback(async (classroomIds: string[]): Promise<BulkOperationResult> => {
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      errors: 0,
      messages: [],
    };

    const userIds = Array.from(selectedIds);
    
    for (const userId of userIds) {
      for (const classroomId of classroomIds) {
        try {
          await ClassroomService.addStudentToClassroom(classroomId, userId);
          result.processed++;
        } catch (err: any) {
          result.errors++;
          result.messages.push(`Error inscribiendo usuario ${userId} en clase ${classroomId}: ${err.message}`);
        }
      }
    }

    if (result.errors > 0) {
      result.success = false;
      toast.warning(`Inscripción completada con ${result.errors} errores`);
    } else {
      toast.success(`${result.processed} inscripciones realizadas exitosamente`);
    }

    return result;
  }, [selectedIds]);

  const bulkUnenroll = useCallback(async (classroomIds: string[]): Promise<BulkOperationResult> => {
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      errors: 0,
      messages: [],
    };

    const userIds = Array.from(selectedIds);
    
    for (const userId of userIds) {
      for (const classroomId of classroomIds) {
        try {
          await ClassroomService.removeStudentFromClassroom(classroomId, userId);
          result.processed++;
        } catch (err: any) {
          result.errors++;
          result.messages.push(`Error removiendo usuario ${userId} de clase ${classroomId}: ${err.message}`);
        }
      }
    }

    if (result.errors > 0) {
      result.success = false;
      toast.warning(`Desinscripción completada con ${result.errors} errores`);
    } else {
      toast.success(`${result.processed} desinscripciones realizadas exitosamente`);
    }

    return result;
  }, [selectedIds]);

  const bulkActivate = useCallback(async (): Promise<BulkOperationResult> => {
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      errors: 0,
      messages: [],
    };

    const userIds = Array.from(selectedIds);
    
    for (const userId of userIds) {
      try {
        await UserService.updateUser(userId, { isActive: true });
        result.processed++;
      } catch (err: any) {
        result.errors++;
        result.messages.push(`Error activando usuario ${userId}: ${err.message}`);
      }
    }

    if (result.errors > 0) {
      result.success = false;
      toast.warning(`Activación completada con ${result.errors} errores`);
    } else {
      toast.success(`${result.processed} usuarios activados exitosamente`);
    }

    return result;
  }, [selectedIds]);

  const bulkDeactivate = useCallback(async (): Promise<BulkOperationResult> => {
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      errors: 0,
      messages: [],
    };

    const userIds = Array.from(selectedIds);
    
    for (const userId of userIds) {
      try {
        await UserService.updateUser(userId, { isActive: false });
        result.processed++;
      } catch (err: any) {
        result.errors++;
        result.messages.push(`Error desactivando usuario ${userId}: ${err.message}`);
      }
    }

    if (result.errors > 0) {
      result.success = false;
      toast.warning(`Desactivación completada con ${result.errors} errores`);
    } else {
      toast.success(`${result.processed} usuarios desactivados exitosamente`);
    }

    return result;
  }, [selectedIds]);

  return {
    selectedIds,
    isAllSelected,
    selectedCount,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    bulkEnroll,
    bulkUnenroll,
    bulkActivate,
    bulkDeactivate,
    getSelectedUsers,
  };
};
