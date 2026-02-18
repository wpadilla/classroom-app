// Registration Models for Amor Bible Institute
// Extended registration data for student inscriptions

/**
 * Document type for identification
 */
export type DocumentType = 'NationalId' | 'Passport';

/**
 * Academic level of the student
 */
export type AcademicLevel =
  | 'Basic'
  | 'HighSchool'
  | 'Bachelor'
  | 'Postgraduate'
  | 'Doctorate';

/**
 * Enrollment type - what program the student is enrolling in
 */
export type EnrollmentType =
  | 'TheologyDegree'
  | 'SingleCourse'
  | 'InternalFormation';

/**
 * Contact information for a person (e.g., pastor)
 */
export interface IContact {
  fullName: string;
  phone?: string; // Optional phone number
}

/**
 * Complete registration data for Amor Bible Institute
 */
export interface IAmorBibleInstituteRegistration {
  // Personal Information
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone: string;
  country: string;

  // Church Information
  churchName: string;
  pastor: IContact;

  // Academic Information
  academicLevel: AcademicLevel;
  enrollmentType: EnrollmentType;

  // Authentication
  password: string;
  confirmPassword: string;

  // Optional
  profilePhoto?: File | string;
}

/**
 * Payload for WhatsApp academy inscription API
 * Based on the Google Forms script
 */
export interface IAcademyInscriptionPayload {
  names: string;           // First and second name
  lastNames: string;       // Last names
  id: string;              // Document number (cédula or passport)
  email: string;           // Email
  phone: string;           // WhatsApp number
  country: string;         // Country
  church: string;          // Church name
  pastor: string;          // Pastor name
  pastorContact: string;   // Pastor contact
  academyLevel: string;    // Academic level
  enrollment: string;      // Enrollment type
}

/**
 * Extended user data for registered students
 * These fields are added to the base IUser interface
 */
export interface IUserRegistrationData {
  documentType?: DocumentType;
  documentNumber?: string;
  country?: string;
  churchName?: string;
  pastor?: IContact;
  academicLevel?: AcademicLevel;
  enrollmentType?: EnrollmentType;
}
