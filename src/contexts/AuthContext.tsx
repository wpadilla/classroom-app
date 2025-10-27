// Authentication Context Provider

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/auth/auth.service';
import { IAuthUser, IAuthCredentials, IRegistrationData, UserRole } from '../models';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: IAuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: IAuthCredentials) => Promise<boolean>;
  register: (data: IRegistrationData) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: IAuthCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await AuthService.login(credentials);
      
      if (response.success && response.user) {
        setUser(response.user);
        toast.success(response.message || 'Inicio de sesión exitoso');
        
        // Navigate based on role
        switch (response.user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'teacher':
            navigate('/teacher/dashboard');
            break;
          case 'student':
            navigate('/student/dashboard');
            break;
          default:
            navigate('/');
        }
        return true;
      } else {
        toast.error(response.error || 'Error al iniciar sesión');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: IRegistrationData): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await AuthService.register(data);
      
      if (response.success && response.user) {
        setUser(response.user);
        toast.success(response.message || 'Registro exitoso');
        
        // Navigate to appropriate dashboard
        if (response.user.role === 'student') {
          navigate('/student/dashboard');
        } else {
          navigate('/');
        }
        return true;
      } else {
        toast.error(response.error || 'Error al registrar');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Error al registrar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AuthService.logout();
      setUser(null);
      toast.success('Sesión cerrada exitosamente');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await AuthService.updatePassword(user.id, newPassword);
      if (success) {
        toast.success('Contraseña actualizada exitosamente');
      } else {
        toast.error('Error al actualizar contraseña');
      }
      return success;
    } catch (error) {
      console.error('Update password error:', error);
      toast.error('Error al actualizar contraseña');
      return false;
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    return AuthService.hasPermission(resource, action);
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updatePassword,
    hasRole,
    hasPermission,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
