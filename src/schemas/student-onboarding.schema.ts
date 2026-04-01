import * as z from 'zod';
import { studentProfileSchema } from './registration.schema';

export const studentOnboardingSchema = studentProfileSchema.and(
  z.object({
    completedInternalClassroomIds: z.array(z.string()).default([]),
    currentInternalClassroomId: z.string().optional(),
  })
);

export type StudentOnboardingFormData = z.infer<typeof studentOnboardingSchema>;
