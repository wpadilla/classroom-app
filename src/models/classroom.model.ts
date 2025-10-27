// Updated Classroom Model with WhatsApp Integration and Program Association

import { IWhatsappGroup } from './whatsapp.model';
import { IEvaluationCriteria } from './evaluation.model';

export interface IModule {
  id: string;
  name: string;
  weekNumber: number;
  date: Date;
  topics?: string[];
  materials?: string[];
  videoUrl?: string;
  isCompleted: boolean;
  description?: string;
}

export interface IClassroom {
  id: string;
  programId: string; // Reference to parent program
  name: string;
  subject: string;
  description?: string;
  teacherId: string; // Reference to user with teacher role
  studentIds: string[]; // Array of user IDs enrolled as students
  modules: IModule[]; // Replaces 'classes' - represents weeks/modules
  currentModule?: IModule;
  isActive: boolean; // Whether classroom is currently being taught
  
  // WhatsApp Integration
  whatsappGroup?: IWhatsappGroup;
  
  // Evaluation Configuration
  evaluationCriteria: IEvaluationCriteria;
  
  // Classroom metadata
  startDate: Date;
  endDate?: Date;
  schedule?: {
    dayOfWeek: string; // e.g., "Monday"
    time: string; // e.g., "18:00"
    duration: number; // in minutes
  };
  location?: string;
  maxStudents?: number;
  materialPrice: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Helper types
export type IClassroomCreate = Omit<IClassroom, 'id' | 'createdAt' | 'updatedAt'>;
export type IClassroomUpdate = Partial<Omit<IClassroom, 'id' | 'createdAt'>>;

// Classroom status
export type ClassroomStatus = 'planned' | 'active' | 'completed' | 'cancelled';

// Student enrollment in classroom
export interface IEnrollment {
  id: string;
  userId: string;
  classroomId: string;
  enrollmentDate: Date;
  status: 'active' | 'completed' | 'dropped' | 'failed';
  finalGrade?: number;
  completionDate?: Date;
}
