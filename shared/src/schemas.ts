import { z } from 'zod';

export const DogSchema = z.object({
  id: z.number(),
  name: z.string(),
  breed: z.string().nullable(),
  image_url: z.string().nullable(),
});
export type Dog = z.infer<typeof DogSchema>;

export const WalkSchema = z.object({
  id: z.number(),
  dog_id: z.number(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  distance: z.number().nullable(),
  stress_score: z.number().min(1).max(5).nullable(),
});
export type Walk = z.infer<typeof WalkSchema>;

export const StartWalkInput = z.object({
  dog_id: z.number(),
});

export const EndWalkInput = z.object({
  stress_score: z.number().min(1).max(5).optional(),
});

export const StressorTypeSchema = z.object({
  id: z.number(),
  type: z.string(),
  category: z.string(),
  label: z.string(),
  direction: z.number(),
});
export type StressorType = z.infer<typeof StressorTypeSchema>;

export const LogStressorEventInput = z.object({
  dog_id: z.number(),
  stressor_type_id: z.number(),
  walk_id: z.number().optional(),
  occurred_at: z.string().optional(),
  duration_minutes: z.number().optional(),
  intensity: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
