import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const goalSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title must not exceed 100 characters'),
  description: z.string().trim().max(500, 'Description must not exceed 500 characters').optional().or(z.literal('')),
});

export const topicFormSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(100, 'Title must not exceed 100 characters'),
  description: z.string().trim().max(500, 'Description must not exceed 500 characters').optional().or(z.literal('')),
  position: z.number().min(0).optional(),
});

export const topicSchema = topicFormSchema.extend({
  prerequisiteIds: z.array(z.string()).default([]),
});

export const createSessionSchema = (minMinutes = 15, maxMinutes = 480, todayStr = new Date().toISOString().split('T')[0]) => {
  return z.object({
    topicId: z.string().min(1, 'Please select a topic'),
    studyDate: z
      .string()
      .min(1, 'Date is required')
      .refine(
        (date) => date <= todayStr,
        'Study session date cannot be in the future',
      ),
    minutes: z
      .number()
      .min(minMinutes, `Session must be at least ${minMinutes} minutes`)
      .max(maxMinutes, `Session cannot exceed ${maxMinutes} minutes`),
    note: z.string().optional(),
  });
};

export const settingsSchema = z
  .object({
    minSessionMinutes: z
      .number()
      .min(1, 'Minimum session minutes must be at least 1')
      .max(60, 'Minimum session minutes cannot exceed 60'),
    maxSessionMinutes: z
      .number()
      .min(60, 'Maximum session minutes must be at least 60')
      .max(1440, 'Maximum session minutes cannot exceed 1440 (24 hours)'),
    maxPrerequisitesPerTopic: z
      .number()
      .min(1, 'At least 1 prerequisite must be permitted')
      .max(20, 'Maximum prerequisites per topic cannot exceed 20'),
  })
  .refine(
    (data) => data.minSessionMinutes < data.maxSessionMinutes,
    {
      message: 'Minimum session duration must be strictly less than maximum session duration',
      path: ['minSessionMinutes'],
    },
  );

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type GoalFormData = z.infer<typeof goalSchema>;
export type TopicFormData = z.infer<typeof topicFormSchema>;
export type TopicPayloadData = z.infer<typeof topicSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
