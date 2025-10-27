// Program Model - Hierarchy above Classrooms

export interface IProgram {
  id: string;
  name: string;
  description: string;
  code: string; // Unique program code
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  coordinatorId?: string; // User ID of program coordinator
  classrooms: string[]; // Array of classroom IDs
  totalCredits?: number;
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Program metadata
  category?: 'theology' | 'leadership' | 'discipleship' | 'general' | 'other';
  level?: 'basic' | 'intermediate' | 'advanced';
  duration?: string; // e.g., "6 months", "1 year"
  maxStudents?: number;
  minStudents?: number;
  
  // Program materials
  materials?: {
    books?: string[];
    resources?: string[];
    cost?: number;
  };
}

// Helper types
export type IProgramCreate = Omit<IProgram, 'id' | 'createdAt' | 'updatedAt'>;
export type IProgramUpdate = Partial<Omit<IProgram, 'id' | 'createdAt'>>;

// Program status
export type ProgramStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export interface IProgramStats {
  programId: string;
  totalStudents: number;
  totalTeachers: number;
  totalClassrooms: number;
  averageGrade: number;
  completionRate: number;
}
