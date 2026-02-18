// Registration Validation Schemas using Zod v3
// Form validation for student registration

import * as z from 'zod';
import { VALIDATION_PATTERNS } from '../constants/registration.constants';

/**
 * Document type enum (Zod v3 compatible)
 */
export const documentTypeSchema = z.enum(['NationalId', 'Passport']);
export type DocumentTypeValue = z.infer<typeof documentTypeSchema>;

/**
 * Academic level enum (Zod v3 compatible)
 */
export const academicLevelSchema = z.enum(['Basic', 'HighSchool', 'Bachelor', 'Postgraduate', 'Doctorate']);
export type AcademicLevelValue = z.infer<typeof academicLevelSchema>;

/**
 * Enrollment type enum (Zod v3 compatible)
 */
export const enrollmentTypeSchema = z.enum(['TheologyDegree', 'SingleCourse', 'InternalFormation']);
export type EnrollmentTypeValue = z.infer<typeof enrollmentTypeSchema>;

/**
 * Contact schema for pastor information
 */
export const contactSchema = z.object({
  fullName: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(VALIDATION_PATTERNS.NAME, 'El nombre contiene caracteres inválidos'),
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .refine(
      (val) => VALIDATION_PATTERNS.PHONE_DIGITS.test(val.replace(/\D/g, '')),
      'Ingrese un número de teléfono válido'
    ),
});

/**
 * Optional email that allows empty string
 */
const optionalEmailSchema = z
  .string()
  .refine((val) => val === '' || z.string().email().safeParse(val).success, {
    message: 'Ingrese un correo electrónico válido',
  })
  .optional();

/**
 * Complete registration form schema
 */
export const registrationSchema = z
  .object({
    // Personal Information
    firstName: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .regex(VALIDATION_PATTERNS.NAME, 'El nombre contiene caracteres inválidos'),

    lastName: z
      .string()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(50, 'El apellido no puede exceder 50 caracteres')
      .regex(VALIDATION_PATTERNS.NAME, 'El apellido contiene caracteres inválidos'),

    documentType: documentTypeSchema,

    documentNumber: z
      .string()
      .min(6, 'El documento debe tener al menos 6 caracteres'),

    email: optionalEmailSchema,

    phone: z
      .string()
      .min(10, 'El teléfono debe tener al menos 10 dígitos')
      .refine(
        (val) => VALIDATION_PATTERNS.PHONE_DIGITS.test(val.replace(/\D/g, '')),
        'Ingrese un número de teléfono válido'
      ),

    country: z.string().min(1, 'Seleccione un país'),

    // Church Information
    churchName: z
      .string()
      .min(3, 'El nombre de la iglesia debe tener al menos 3 caracteres')
      .max(100, 'El nombre de la iglesia no puede exceder 100 caracteres'),

    pastor: contactSchema,

    // Academic Information
    academicLevel: academicLevelSchema,
    enrollmentType: enrollmentTypeSchema,

    // Authentication
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .max(50, 'La contraseña no puede exceder 50 caracteres'),

    confirmPassword: z.string(),

    // Optional
    profilePhoto: z.any().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    // Validate document number based on type
    if (data.documentType === 'NationalId') {
      const cleanDoc = data.documentNumber.replaceAll('-', '');
      if (!VALIDATION_PATTERNS.CEDULA.test(data.documentNumber) || cleanDoc.length !== 11) {
        ctx.addIssue({
          code: 'custom',
          message: 'La cédula debe tener el formato XXX-XXXXXXX-X (11 dígitos)',
          path: ['documentNumber'],
        });
      }
    } else if (data.documentType === 'Passport') {
      if (!VALIDATION_PATTERNS.PASSPORT.test(data.documentNumber)) {
        ctx.addIssue({
          code: 'custom',
          message: 'El pasaporte debe tener entre 6 y 20 caracteres alfanuméricos',
          path: ['documentNumber'],
        });
      }
    }
  });

/**
 * Type inferred from registration schema
 */
export type RegistrationFormData = z.infer<typeof registrationSchema>;

/**
 * Quick registration schema (simplified for bulk import)
 */
export const quickRegistrationSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos'),
  email: optionalEmailSchema,
});

export type QuickRegistrationData = z.infer<typeof quickRegistrationSchema>;
