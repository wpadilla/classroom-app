// Flexible Evaluation System Model


export interface ICustomCriterion {
  id: string;
  name: string;
  points: number;
  description?: string;
}

export interface IEvaluationCriteria {
  questionnaires: number; // Points for book/material questionnaires
  attendance: number; // Points for attendance (auto-calculated)
  participation: number; // Points for participation
  participationPointsPerModule: number; // Points required per module (1-3, default: 1)
  finalExam: number; // Points for final exam/practice
  customCriteria: ICustomCriterion[]; // Teacher-defined criteria
  participationRecords: any;
  // Validation: Total must equal 100
}

// Student evaluation for a specific classroom
export interface IStudentEvaluation {
  id: string;
  studentId: string;
  classroomId: string;
  moduleId: string;
  participationRecords: any[];
  // Points achieved by criterion
  scores: {
    questionnaires: number;
    attendance: number; // Auto-calculated based on attendance records
    participation: number; // Simple counter - total participation points
    finalExam: number;
    customScores: { criterionId: string; score: number }[];
  };
  
  // Attendance tracking per module
  attendanceRecords: IAttendanceRecord[];
  
  // Participation: Simple total points (no per-module tracking needed)
  participationPoints: number; // Total accumulated participation points
  
  // Final calculation
  totalScore: number; // Sum of all scores
  percentage: number; // totalScore as percentage
  letterGrade?: string; // A, B, C, D, F
  status: 'in-progress' | 'completed' | 'evaluated';
  
  // Metadata
  evaluatedBy?: string; // Teacher ID who evaluated
  evaluatedAt?: Date;
  comments?: string;
  isActive?: boolean; // Active status in the classroom
  createdAt: Date;
  updatedAt: Date;
}

// Attendance record for a module
export interface IAttendanceRecord {
  moduleId: string;
  studentId: string;
  isPresent: boolean;
  date: Date;
  markedBy: string; // Teacher ID
  markedAt: Date;
  notes?: string;
}

// Grade calculation helpers
export interface IGradeScale {
  min: number;
  max: number;
  letter: string;
  status: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement' | 'failing';
}

export const DEFAULT_GRADE_SCALE: IGradeScale[] = [
  { min: 90, max: 100, letter: 'A', status: 'excellent' },
  { min: 80, max: 89, letter: 'B', status: 'good' },
  { min: 70, max: 79, letter: 'C', status: 'satisfactory' },
  { min: 60, max: 69, letter: 'D', status: 'needs-improvement' },
  { min: 0, max: 59, letter: 'F', status: 'failing' }
];

// Helper types
export type IEvaluationCreate = Omit<IStudentEvaluation, 'id' | 'createdAt' | 'updatedAt'> & { isActive?: boolean };
export type IEvaluationUpdate = Partial<Omit<IStudentEvaluation, 'id' | 'createdAt'>>;

// Summary type for displaying evaluations
export interface IEvaluationSummary {
  studentName: string;
  classroomName: string;
  totalScore: number;
  percentage: number;
  letterGrade: string;
  status: string;
  strengths: string[];
  improvements: string[];
}
