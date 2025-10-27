// Authentication and Session Models

import { UserRole } from './user.model';

export interface IAuthCredentials {
  identifier: string; // Phone or email
  password: string;
}

export interface IAuthResponse {
  success: boolean;
  user?: IAuthUser;
  token?: string;
  message?: string;
  error?: string;
}

export interface IAuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  role: UserRole;
  isTeacher: boolean;
  profilePhoto?: string;
  lastLogin: Date;
}

export interface ISession {
  id: string;
  userId: string;
  token: string;
  role: UserRole;
  createdAt: Date;
  expiresAt: Date;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    platform?: string;
  };
  isActive: boolean;
}

export interface IRegistrationData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role?: UserRole; // Default to 'student' if not specified
  profilePhoto?: File | string;
  classroomToEnroll?: string; // Optional classroom ID for initial enrollment
}

export interface IPasswordReset {
  userId: string;
  resetToken: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface IPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface IRolePermissions {
  role: UserRole;
  permissions: IPermission[];
}

// Default permissions by role
export const DEFAULT_PERMISSIONS: IRolePermissions[] = [
  {
    role: 'admin',
    permissions: [
      { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'programs', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'classrooms', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'evaluations', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'whatsapp', actions: ['create', 'read', 'update', 'delete'] }
    ]
  },
  {
    role: 'teacher',
    permissions: [
      { resource: 'users', actions: ['read'] }, // Can read student profiles
      { resource: 'programs', actions: ['read'] },
      { resource: 'classrooms', actions: ['read', 'update'] }, // Can update their own classrooms
      { resource: 'evaluations', actions: ['create', 'read', 'update'] },
      { resource: 'whatsapp', actions: ['create', 'read'] } // Can create and send messages
    ]
  },
  {
    role: 'student',
    permissions: [
      { resource: 'users', actions: ['read'] }, // Can read own profile
      { resource: 'programs', actions: ['read'] },
      { resource: 'classrooms', actions: ['read'] }, // Can read enrolled classrooms
      { resource: 'evaluations', actions: ['read'] }, // Can read own evaluations
      { resource: 'whatsapp', actions: [] } // No WhatsApp permissions
    ]
  }
];

// Auth validation types
export interface IAuthValidation {
  isValid: boolean;
  errors?: {
    field: string;
    message: string;
  }[];
}

// Token payload
export interface ITokenPayload {
  userId: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
}
