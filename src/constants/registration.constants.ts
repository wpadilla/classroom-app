// Registration Constants
// Labels, options, and utilities for registration forms

import { DocumentType, AcademicLevel, EnrollmentType } from '../models/registration.model';

/**
 * Document type options with Spanish labels
 */
export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'NationalId', label: 'Cédula' },
  { value: 'Passport', label: 'Pasaporte' },
];

/**
 * Academic level options with Spanish labels
 */
export const ACADEMIC_LEVEL_OPTIONS: { value: AcademicLevel; label: string }[] = [
  { value: 'Basic', label: 'Educación Básica' },
  { value: 'HighSchool', label: 'Bachillerato' },
  { value: 'Bachelor', label: 'Licenciatura / Universitario' },
  { value: 'Postgraduate', label: 'Postgrado / Maestría' },
  { value: 'Doctorate', label: 'Doctorado' },
];

/**
 * Enrollment type options with Spanish labels
 */
export const ENROLLMENT_TYPE_OPTIONS: { value: EnrollmentType; label: string }[] = [
  { value: 'TheologyDegree', label: 'Licenciatura en Teología' },
  { value: 'SingleCourse', label: 'Curso Individual' },
  { value: 'InternalFormation', label: 'Formación Interna' },
];

/**
 * Latin American countries with phone codes
 */
export const COUNTRIES: { value: string; label: string; phoneCode: string }[] = [
  { value: 'DO', label: 'República Dominicana', phoneCode: '+1' },
  { value: 'US', label: 'Estados Unidos', phoneCode: '+1' },
  { value: 'PR', label: 'Puerto Rico', phoneCode: '+1' },
  { value: 'MX', label: 'México', phoneCode: '+52' },
  { value: 'GT', label: 'Guatemala', phoneCode: '+502' },
  { value: 'SV', label: 'El Salvador', phoneCode: '+503' },
  { value: 'HN', label: 'Honduras', phoneCode: '+504' },
  { value: 'NI', label: 'Nicaragua', phoneCode: '+505' },
  { value: 'CR', label: 'Costa Rica', phoneCode: '+506' },
  { value: 'PA', label: 'Panamá', phoneCode: '+507' },
  { value: 'CO', label: 'Colombia', phoneCode: '+57' },
  { value: 'VE', label: 'Venezuela', phoneCode: '+58' },
  { value: 'EC', label: 'Ecuador', phoneCode: '+593' },
  { value: 'PE', label: 'Perú', phoneCode: '+51' },
  { value: 'BO', label: 'Bolivia', phoneCode: '+591' },
  { value: 'CL', label: 'Chile', phoneCode: '+56' },
  { value: 'AR', label: 'Argentina', phoneCode: '+54' },
  { value: 'UY', label: 'Uruguay', phoneCode: '+598' },
  { value: 'PY', label: 'Paraguay', phoneCode: '+595' },
  { value: 'BR', label: 'Brasil', phoneCode: '+55' },
  { value: 'CU', label: 'Cuba', phoneCode: '+53' },
  { value: 'HT', label: 'Haití', phoneCode: '+509' },
  { value: 'ES', label: 'España', phoneCode: '+34' },
  { value: 'OTHER', label: 'Otro', phoneCode: '' },
];

/**
 * Regex patterns for validation
 */
export const VALIDATION_PATTERNS = {
  // Dominican cedula: XXX-XXXXXXX-X or 11 digits
  CEDULA: /^(\d{3}-?\d{7}-?\d{1}|\d{11})$/,
  
  // Passport: alphanumeric, 6-20 characters
  PASSPORT: /^[A-Za-z0-9]{6,20}$/,
  
  // Phone: minimum 10 digits (can include spaces, dashes, parentheses)
  PHONE: /^[\d\s\-()+]{10,}$/,
  
  // Phone digits only: minimum 10 digits
  PHONE_DIGITS: /^\d{10,}$/,
  
  // Email: standard email format
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Name: letters, spaces, accents
  NAME: /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
};

/**
 * Get label for document type
 */
export const getDocumentTypeLabel = (type: DocumentType): string => {
  const option = DOCUMENT_TYPE_OPTIONS.find(o => o.value === type);
  return option?.label ?? type;
};

/**
 * Get label for academic level
 */
export const getAcademicLevelLabel = (level: AcademicLevel): string => {
  const option = ACADEMIC_LEVEL_OPTIONS.find(o => o.value === level);
  return option?.label ?? level;
};

/**
 * Get label for enrollment type
 */
export const getEnrollmentTypeLabel = (type: EnrollmentType): string => {
  const option = ENROLLMENT_TYPE_OPTIONS.find(o => o.value === type);
  return option?.label ?? type;
};

/**
 * Get country label by code
 */
export const getCountryLabel = (code: string): string => {
  const country = COUNTRIES.find(c => c.value === code);
  return country?.label ?? code;
};

/**
 * Validate Dominican cedula format
 */
export const validateCedula = (cedula: string): boolean => {
  const cleanCedula = cedula.replace(/-/g, '');
  return VALIDATION_PATTERNS.CEDULA.test(cedula) && cleanCedula.length === 11;
};

/**
 * Format cedula with dashes (XXX-XXXXXXX-X)
 */
export const formatCedula = (cedula: string): string => {
  const clean = cedula.replace(/\D/g, '');
  if (clean.length !== 11) return cedula;
  return `${clean.slice(0, 3)}-${clean.slice(3, 10)}-${clean.slice(10)}`;
};

/**
 * Get enrollment type from query parameter
 */
export const getEnrollmentFromQueryParam = (param: string | null): EnrollmentType => {
  if (!param) return 'InternalFormation';
  
  const normalizedParam = param.toLowerCase();
  
  if (normalizedParam === 'theologydegree' || normalizedParam === 'theology') {
    return 'TheologyDegree';
  }
  if (normalizedParam === 'singlecourse' || normalizedParam === 'course') {
    return 'SingleCourse';
  }
  if (normalizedParam === 'internalformation' || normalizedParam === 'internal') {
    return 'InternalFormation';
  }
  
  return 'InternalFormation';
};

/**
 * Default registration values
 */
export const DEFAULT_REGISTRATION_VALUES = {
  documentType: 'NationalId' as DocumentType,
  country: 'DO',
  academicLevel: 'HighSchool' as AcademicLevel,
  enrollmentType: 'InternalFormation' as EnrollmentType,
};
