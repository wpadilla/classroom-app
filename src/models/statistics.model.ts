// Statistics Models for Academy Dashboard

import { PaymentMethod } from './payment.model';

export interface IMonthlyCount {
  month: string; // e.g., "2024-01"
  count: number;
}

export interface IProgramCount {
  programId: string;
  programName: string;
  count: number;
}

export interface ICategoryCount {
  category: string;
  count: number;
}

// Enrollment Analytics
export interface IEnrollmentAnalytics {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  newStudentsPerMonth: IMonthlyCount[];
  retentionRate: number; // percentage
  enrollmentByProgram: IProgramCount[];
  enrollmentByCategory: ICategoryCount[];
  enrollmentByType: { type: string; count: number }[];
}

// Academic Performance
export interface IProgramGrade {
  programId: string;
  programName: string;
  averageGrade: number;
  studentCount: number;
}

export interface IGradeDistribution {
  excellent: number; // 90-100 (A)
  good: number;      // 80-89 (B)
  satisfactory: number; // 70-79 (C)
  needsImprovement: number; // 60-69 (D)
  failing: number;   // 0-59 (F)
}

export interface ITopPerformer {
  studentId: string;
  studentName: string;
  averageGrade: number;
  classroomCount: number;
}

export interface IAcademicPerformance {
  overallAverageGrade: number;
  averageByProgram: IProgramGrade[];
  passRate: number; // percentage >= 70
  failRate: number;
  gradeDistribution: IGradeDistribution;
  topPerformers: ITopPerformer[];
  totalEvaluated: number;
}

// Attendance Analytics
export interface IClassroomAttendance {
  classroomId: string;
  classroomName: string;
  subject: string;
  attendanceRate: number;
  studentCount: number;
}

export interface ILowAttendanceAlert {
  studentId: string;
  studentName: string;
  classroomName: string;
  attendanceRate: number;
}

export interface IAttendanceAnalytics {
  overallAttendanceRate: number;
  attendanceByClassroom: IClassroomAttendance[];
  lowAttendanceAlerts: ILowAttendanceAlert[];
}

// Program Analytics
export interface IProgramCompletion {
  programId: string;
  programName: string;
  totalClassrooms: number;
  activeClassrooms: number;
  completedClassrooms: number;
  completionRate: number;
  totalStudents: number;
}

export interface IProgramAnalytics {
  totalPrograms: number;
  activePrograms: number;
  completionRates: IProgramCompletion[];
  classroomUtilization: { classroomId: string; classroomName: string; utilization: number }[];
}

// Teacher Analytics
export interface ITeacherPerformance {
  teacherId: string;
  teacherName: string;
  classroomCount: number;
  totalStudents: number;
  averageGrade: number;
  passRate: number;
  attendanceRate: number;
}

export interface ITeacherAnalytics {
  totalTeachers: number;
  teacherPerformance: ITeacherPerformance[];
  averageStudentsPerTeacher: number;
  averageClassroomsPerTeacher: number;
}

// Demographic Analytics
export interface IDemographicAnalytics {
  studentsByCountry: { country: string; count: number }[];
  studentsByChurch: { church: string; count: number }[];
  studentsByAcademicLevel: { level: string; count: number }[];
  studentsByEnrollmentType: { type: string; count: number }[];
}

// Financial Overview
export interface IFinancialTotals {
  expected: number;
  collected: number;
  outstanding: number;
  collectionRate: number;
  totalEnrollments: number;
  uniqueStudents: number;
  averageExpectedPerEnrollment: number;
  averageCollectedPerEnrollment: number;
  averageOutstandingPerEnrollment: number;
  averageExpectedPerUniqueStudent: number;
  averageCollectedPerUniqueStudent: number;
  averageOutstandingPerUniqueStudent: number;
}

export interface IFinancialMethodBreakdown {
  method: PaymentMethod;
  amount: number;
  count: number;
}

export interface IFinancialCostItemSummary {
  id: string;
  amount: number;
  required: boolean;
}

export interface IFinancialPaymentEntry {
  id: string;
  amount: number;
  method: PaymentMethod;
  createdAt: Date;
  appliedItemIds: string[];
}

export interface IFinancialEnrollmentEntry {
  enrollmentId: string;
  source: 'current' | 'run';
  classroomId: string;
  classroomName: string;
  programId: string;
  programName: string;
  studentId: string;
  studentName: string;
  totalDue: number;
  requiredDue: number;
  optionalDue: number;
  costItems: IFinancialCostItemSummary[];
  payments: IFinancialPaymentEntry[];
}

export interface IFinancialRequiredOptionalTotals {
  requiredExpected: number;
  requiredCollected: number;
  requiredOutstanding: number;
  optionalExpected: number;
  optionalCollected: number;
  optionalOutstanding: number;
  unassignedCollected: number;
}

export interface IFinancialMonthlySummary {
  month: string; // e.g., "2024-01"
  expected: number;
  collected: number;
  outstanding: number;
}

export interface IFinancialProgramSummary {
  programId: string;
  programName: string;
  expected: number;
  collected: number;
  outstanding: number;
  collectionRate: number;
  enrollmentCount: number;
  uniqueStudentCount: number;
}

export interface IFinancialClassroomSummary {
  classroomId: string;
  classroomName: string;
  programId: string;
  programName: string;
  expected: number;
  collected: number;
  outstanding: number;
  collectionRate: number;
  studentCount: number;
}

export interface IFinancialStudentSummary {
  studentId: string;
  studentName: string;
  expected: number;
  collected: number;
  outstanding: number;
  collectionRate: number;
  enrollmentCount: number;
}

export interface IFinancialOverview {
  totals: IFinancialTotals;
  byProgram: IFinancialProgramSummary[];
  byClassroom: IFinancialClassroomSummary[];
  byStudent: IFinancialStudentSummary[];
  byMethod: IFinancialMethodBreakdown[];
  requiredOptional: IFinancialRequiredOptionalTotals;
  monthly: IFinancialMonthlySummary[];
  enrollments: IFinancialEnrollmentEntry[];
}

// Historical Trends
export interface IRunComparison {
  classroomId: string;
  classroomName: string;
  runs: {
    runNumber: number;
    averageGrade: number;
    passRate: number;
    attendanceRate: number;
    studentCount: number;
    startDate: Date;
    endDate: Date;
  }[];
}

export interface IHistoricalTrends {
  runComparisons: IRunComparison[];
  totalRuns: number;
  averageRunGrade: number;
  averageRunPassRate: number;
}

// Dashboard Aggregate
export interface IStatisticsDashboard {
  enrollment: IEnrollmentAnalytics;
  academic: IAcademicPerformance;
  attendance: IAttendanceAnalytics;
  programs: IProgramAnalytics;
  teachers: ITeacherAnalytics;
  demographics: IDemographicAnalytics;
  financial: IFinancialOverview;
  trends: IHistoricalTrends;
  generatedAt: Date;
}
