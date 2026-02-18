export * from './user.model';
export * from './program.model';
export * from './classroom.model';
export * from './evaluation.model';
export * from './whatsapp.model';
export * from './auth.model';
export * from './classroom-run.model';
export * from './resource.model';
export * from './registration.model';
export * from './statistics.model';

// Re-export commonly used types for convenience
export type { UserRole, IUser, IClassroomHistory, IUserDocument } from './user.model';
export type { IProgram } from './program.model';
export type { IClassroom, IModule, IEnrollment } from './classroom.model';
export type { IStudentEvaluation, IEvaluationCriteria, IAttendanceRecord } from './evaluation.model';
export type { IWhatsappGroup, IWhatsappMessage } from './whatsapp.model';
export type { IAuthCredentials, IAuthResponse, ISession } from './auth.model';
export type { IClassroomRun, IStudentRunRecord } from './classroom-run.model';
export type { IClassroomResource } from './resource.model';
export type {
  DocumentType,
  AcademicLevel,
  EnrollmentType,
  IContact,
  IAmorBibleInstituteRegistration,
  IAcademyInscriptionPayload
} from './registration.model';
export type { IStatisticsDashboard } from './statistics.model';
