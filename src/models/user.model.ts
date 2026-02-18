// Unified User Model for Students, Teachers, and Admins

import { 
  DocumentType, 
  AcademicLevel, 
  EnrollmentType, 
  IContact 
} from './registration.model';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface IClassroomHistory {
  classroomId: string;
  classroomName: string;
  programId: string;
  programName: string;
  role: 'student' | 'teacher'; // Role in the classroom
  enrollmentDate: Date;
  completionDate: Date;
  finalGrade?: number; // Optional as teachers may not have grades
  status: 'completed' | 'dropped' | 'failed';
}

export interface IUserDocument {
  id: string;
  name: string;
  url: string;
  type: string; // MIME type (e.g., 'application/pdf')
  size: number; // in bytes
  uploadedBy: string; // userId
  uploadedAt: Date;
  updatedAt?: Date;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  password: string; // Plain text initially as requested
  profilePhoto?: string;
  role: UserRole;
  isTeacher: boolean; // Can be both student and teacher
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Student-specific data
  enrolledClassrooms?: string[]; // Current classrooms as student
  completedClassrooms?: IClassroomHistory[]; // Historical record
  
  // Teacher-specific data
  teachingClassrooms?: string[]; // Current classrooms as teacher
  taughtClassrooms?: IClassroomHistory[]; // Historical record of taught classrooms (uses role: 'teacher')
  
  // Additional metadata
  lastLogin?: Date;
  preferences?: {
    language?: 'es' | 'en';
    notifications?: boolean;
  };

  // Extended registration data (from Amor Bible Institute registration)
  documentType?: DocumentType;
  documentNumber?: string;
  country?: string;
  churchName?: string;
  pastor?: IContact;
  academicLevel?: AcademicLevel;
  enrollmentType?: EnrollmentType;

  // User documents (uploaded files)
  documents?: IUserDocument[];
}

// Helper type for user creation
export type IUserCreate = Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>;

// Helper type for user update
export type IUserUpdate = Partial<Omit<IUser, 'id' | 'createdAt'>>;

// User session type
export interface IUserSession {
  userId: string;
  role: UserRole;
  loginTime: Date;
  expiresAt: Date;
  deviceInfo?: string;
}
