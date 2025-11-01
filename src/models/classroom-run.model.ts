/**
 * Classroom Run Model
 * 
 * Represents a complete historical record of a classroom execution
 * Used when restarting a class for a new group of students
 * 
 * Each time a classroom is finalized and restarted, a new run is created
 */

export interface IStudentRunRecord {
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  finalGrade?: number;
  status: 'completed' | 'dropped' | 'failed';
  attendanceRate: number;
  participationPoints: number;
  enrollmentDate: Date;
  completionDate: Date;
}

export interface IClassroomRun {
  id: string;
  
  // Reference to original classroom
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  
  // Program information
  programId: string;
  programName: string;
  
  // Teacher information at time of run
  teacherId: string;
  teacherName: string;
  
  // Class configuration at time of run
  evaluationCriteria: {
    questionnaires: number;
    attendance: number;
    participation: number;
    finalExam: number;
    customCriteria: Array<{
      name: string;
      points: number;
    }>;
  };
  
  // Schedule information
  schedule?: {
    dayOfWeek: string;
    time: string;
    duration: number;
  };
  
  room?: string;
  location?: string;
  materialPrice: number;
  
  // Module/Week completion
  totalModules: number;
  completedModules: number;
  moduleNames: string[];
  
  // Student records
  students: IStudentRunRecord[];
  totalStudents: number;
  
  // Statistics
  statistics: {
    averageGrade: number;
    passRate: number; // Percentage of students who passed
    attendanceRate: number;
    totalParticipationPoints: number;
    highestGrade: number;
    lowestGrade: number;
    distribution: {
      excellent: number; // 90-100
      good: number; // 80-89
      regular: number; // 70-79
      poor: number; // <70
    };
  };
  
  // Dates
  startDate: Date;
  endDate: Date;
  
  // Metadata
  runNumber: number; // 1st run, 2nd run, etc.
  createdAt: Date;
  createdBy: string; // User ID who finalized/restarted
  notes?: string; // Optional notes about this run
}

// Helper type for creating a new run
export type IClassroomRunCreate = Omit<IClassroomRun, 'id' | 'createdAt'>;

