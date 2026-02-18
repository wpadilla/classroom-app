// User Validation Schemas using Zod v4
// Form validation for user management

import * as z from 'zod';
import { VALIDATION_PATTERNS } from '../constants/registration.constants';

// Type constants for Zod v4 compatibility
export const USER_ROLES = ['student', 'teacher', 'admin'] as const;
export const CLASSROOM_HISTORY_ROLES = ['student', 'teacher'] as const;
export const HISTORY_STATUSES = ['completed', 'dropped', 'failed'] as const;

export type UserRoleValue = typeof USER_ROLES[number];
export type ClassroomHistoryRoleValue = typeof CLASSROOM_HISTORY_ROLES[number];
export type HistoryStatusValue = typeof HISTORY_STATUSES[number];

/**
 * User role schema - Zod v4 compatible
 */
export const userRoleSchema = z
  .string()
  .refine((val): val is UserRoleValue => USER_ROLES.includes(val as UserRoleValue), {
    message: 'Rol inválido',
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
 * Optional password that allows empty string
 */
const optionalPasswordSchema = z
  .string()
  .refine((val) => val === '' || val.length >= 6, {
    message: 'La contraseña debe tener al menos 6 caracteres',
  })
  .optional();

/**
 * Optional phone that allows empty string
 */
const optionalPhoneSchema = z
  .string()
  .refine(
    (val) => val === '' || VALIDATION_PATTERNS.PHONE_DIGITS.test(val.replace(/\D/g, '')),
    'Ingrese un número de teléfono válido'
  )
  .optional();

/**
 * Classroom history entry schema
 */
export const classroomHistorySchema = z.object({
  classroomId: z.string(),
  classroomName: z.string(),
  programId: z.string(),
  programName: z.string(),
  role: z.string().refine((val): val is ClassroomHistoryRoleValue => CLASSROOM_HISTORY_ROLES.includes(val as ClassroomHistoryRoleValue)),
  enrollmentDate: z.date(),
  completionDate: z.date(),
  finalGrade: z.number().min(0).max(100).optional(),
  status: z.string().refine((val): val is HistoryStatusValue => HISTORY_STATUSES.includes(val as HistoryStatusValue)),
});

// Document type schema
export const DOCUMENT_TYPES = ['NationalId', 'Passport'] as const;
export type DocumentTypeValue = typeof DOCUMENT_TYPES[number];

// Academic level schema
export const ACADEMIC_LEVELS = ['Basic', 'HighSchool', 'Bachelor', 'Postgraduate', 'Doctorate'] as const;
export type AcademicLevelValue = typeof ACADEMIC_LEVELS[number];

/**
 * User edit form schema (for admin editing users)
 */
export const userEditSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  email: optionalEmailSchema,
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .refine(
      (val) => VALIDATION_PATTERNS.PHONE_DIGITS.test(val.replace(/\D/g, '')),
      'Ingrese un número de teléfono válido'
    ),
  role: userRoleSchema,
  isTeacher: z.boolean(),
  isActive: z.boolean(),
  password: optionalPasswordSchema,
  // Extended registration fields
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  country: z.string().optional(),
  churchName: z.string().optional(),
  academicLevel: z.string().optional(),
  pastorName: z.string().optional(),
  pastorPhone: optionalPhoneSchema,
});

export type UserEditFormData = z.infer<typeof userEditSchema>;

/**
 * User self-edit schema (no role or teacher fields)
 */
export const userSelfEditSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  email: optionalEmailSchema,
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .refine(
      (val) => VALIDATION_PATTERNS.PHONE_DIGITS.test(val.replace(/\D/g, '')),
      'Ingrese un número de teléfono válido'
    ),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  country: z.string().optional(),
  churchName: z.string().optional(),
  academicLevel: z.string().optional(),
  pastorName: z.string().optional(),
  pastorPhone: optionalPhoneSchema,
});

export type UserSelfEditFormData = z.infer<typeof userSelfEditSchema>;

/**
 * User creation schema (requires password)
 */
export const userCreateSchema = userEditSchema.extend({
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type UserCreateFormData = z.infer<typeof userCreateSchema>;

/**
 * Add classroom to history schema
 */
export const addClassroomHistorySchema = z.object({
  classroomId: z.string().min(1, 'Seleccione una clase'),
  enrollmentDate: z.string().min(1, 'La fecha de inscripción es requerida'),
  completionDate: z.string().min(1, 'La fecha de finalización es requerida'),
  finalGrade: z
    .number()
    .min(0, 'La calificación mínima es 0')
    .max(100, 'La calificación máxima es 100')
    .optional(),
  status: z.string().refine((val): val is HistoryStatusValue => HISTORY_STATUSES.includes(val as HistoryStatusValue)),
});

export type AddClassroomHistoryFormData = z.infer<typeof addClassroomHistorySchema>;

/**
 * Bulk enrollment schema
 */
export const bulkEnrollmentSchema = z.object({
  userIds: z.array(z.string()).min(1, 'Seleccione al menos un usuario'),
  classroomIds: z.array(z.string()).min(1, 'Seleccione al menos una clase'),
});

export type BulkEnrollmentData = z.infer<typeof bulkEnrollmentSchema>;

/**
 * Excel import row schema
 */
export const excelImportRowSchema = z.object({
  fullName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  email: optionalEmailSchema,
  classroomName: z.string().optional(),
});

export type ExcelImportRow = z.infer<typeof excelImportRowSchema>;
