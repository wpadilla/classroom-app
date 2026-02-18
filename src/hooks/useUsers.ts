// Hook for user CRUD operations
// Provides loading state, error handling, and data fetching

import { useState, useCallback } from 'react';
import { IUser, IClassroomHistory } from '../models';
import { UserService } from '../services/user/user.service';
import { toast } from 'react-toastify';

interface UseUsersState {
  users: IUser[];
  loading: boolean;
  error: string | null;
}

interface UseUsersReturn extends UseUsersState {
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: string) => Promise<IUser | null>;
  createUser: (userData: Partial<IUser>) => Promise<IUser | null>;
  updateUser: (id: string, updates: Partial<IUser>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  toggleUserStatus: (user: IUser) => Promise<boolean>;
  toggleTeacherStatus: (user: IUser) => Promise<boolean>;
  updateProfilePhoto: (userId: string, photo: File) => Promise<string | null>;
  addClassroomHistory: (userId: string, history: IClassroomHistory) => Promise<boolean>;
  updateClassroomHistory: (userId: string, classroomId: string, updates: Partial<IClassroomHistory>) => Promise<boolean>;
  removeClassroomHistory: (userId: string, classroomId: string) => Promise<boolean>;
  refreshUser: (id: string) => Promise<IUser | null>;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserById = useCallback(async (id: string): Promise<IUser | null> => {
    try {
      setLoading(true);
      return await UserService.getUserById(id);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuario');
      console.error('Error fetching user:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: Partial<IUser>): Promise<IUser | null> => {
    try {
      setLoading(true);
      const newUserId = await UserService.createUser(userData as any);
      // Fetch the full user object
      const newUser = await UserService.getUserById(newUserId);
      if (newUser) {
        setUsers(prev => [...prev, newUser]);
        toast.success('Usuario creado exitosamente');
      }
      return newUser;
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
      toast.error(err.message || 'Error al crear usuario');
      console.error('Error creating user:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<IUser>): Promise<boolean> => {
    try {
      setLoading(true);
      await UserService.updateUser(id, updates);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
      toast.success('Usuario actualizado exitosamente');
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar usuario');
      toast.error(err.message || 'Error al actualizar usuario');
      console.error('Error updating user:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      await UserService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Usuario eliminado exitosamente');
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
      toast.error(err.message || 'Error al eliminar usuario');
      console.error('Error deleting user:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleUserStatus = useCallback(async (user: IUser): Promise<boolean> => {
    try {
      setLoading(true);
      await UserService.updateUser(user.id, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      ));
      toast.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'} exitosamente`);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado');
      toast.error('Error al cambiar el estado del usuario');
      console.error('Error toggling user status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleTeacherStatus = useCallback(async (user: IUser): Promise<boolean> => {
    try {
      setLoading(true);
      await UserService.toggleTeacherStatus(user.id);
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, isTeacher: !u.isTeacher } : u
      ));
      toast.success(`Estado de profesor ${user.isTeacher ? 'removido' : 'asignado'}`);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado de profesor');
      toast.error('Error al cambiar el estado de profesor');
      console.error('Error toggling teacher status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfilePhoto = useCallback(async (userId: string, photo: File): Promise<string | null> => {
    try {
      setLoading(true);
      const photoUrl = await UserService.updateProfilePhoto(userId, photo);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, profilePhoto: photoUrl } : u
      ));
      toast.success('Foto de perfil actualizada');
      return photoUrl;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar foto');
      toast.error('Error al subir la foto');
      console.error('Error updating photo:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addClassroomHistory = useCallback(async (
    userId: string, 
    history: IClassroomHistory
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const user = await UserService.getUserById(userId);
      if (!user) throw new Error('Usuario no encontrado');

      const completedClassrooms = [...(user.completedClassrooms || []), history];
      await UserService.updateUser(userId, { completedClassrooms });
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, completedClassrooms } : u
      ));
      toast.success('Clase agregada al historial');
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al agregar clase');
      toast.error('Error al agregar clase al historial');
      console.error('Error adding classroom history:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClassroomHistory = useCallback(async (
    userId: string,
    classroomId: string,
    updates: Partial<IClassroomHistory>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const user = await UserService.getUserById(userId);
      if (!user) throw new Error('Usuario no encontrado');

      const completedClassrooms = (user.completedClassrooms || []).map(c =>
        c.classroomId === classroomId ? { ...c, ...updates } : c
      );
      await UserService.updateUser(userId, { completedClassrooms });
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, completedClassrooms } : u
      ));
      toast.success('Historial actualizado');
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar historial');
      toast.error('Error al actualizar el historial');
      console.error('Error updating classroom history:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeClassroomHistory = useCallback(async (
    userId: string,
    classroomId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const user = await UserService.getUserById(userId);
      if (!user) throw new Error('Usuario no encontrado');

      const completedClassrooms = (user.completedClassrooms || []).filter(
        c => c.classroomId !== classroomId
      );
      await UserService.updateUser(userId, { completedClassrooms });
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, completedClassrooms } : u
      ));
      toast.success('Clase eliminada del historial');
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar clase');
      toast.error('Error al eliminar clase del historial');
      console.error('Error removing classroom history:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async (id: string): Promise<IUser | null> => {
    try {
      const user = await UserService.getUserById(id);
      if (user) {
        setUsers(prev => prev.map(u => u.id === id ? user : u));
      }
      return user;
    } catch (err: any) {
      console.error('Error refreshing user:', err);
      return null;
    }
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    toggleTeacherStatus,
    updateProfilePhoto,
    addClassroomHistory,
    updateClassroomHistory,
    removeClassroomHistory,
    refreshUser,
  };
};
