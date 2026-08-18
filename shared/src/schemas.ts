import { z } from "zod";

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
	suburb: z.string().nullable(),
});
export type Walk = z.infer<typeof WalkSchema>;

export const StartWalkInput = z.object({
	dog_id: z.number(),
});

export const EndWalkInput = z.object({
	stress_score: z.number().min(1).max(5).optional(),
});

export const EventTypeSchema = z.object({
	id: z.number(),
	type: z.string(),
	category: z.string(),
	label: z.string(),
	direction: z.number(),
});
export type EventType = z.infer<typeof EventTypeSchema>;

export const EventSchema = z.object({
	id: z.number(),
	dog_id: z.number(),
	event_type_id: z.number(),
	walk_id: z.number().nullable(),
	occurred_at: z.string(),
	intensity: z.number().min(0).max(5).nullable(),
	lat: z.number().nullable(),
	lng: z.number().nullable(),
	label: z.string(),
	category: z.string(),
	direction: z.number(),
	type: z.string(),
	notes: z.string().nullable().optional(),
});
export type AppEvent = z.infer<typeof EventSchema>;

export const LogEventInput = z.object({
	dog_id: z.number(),
	event_type_id: z.number(),
	walk_id: z.number().optional(),
	occurred_at: z.string().optional(),
	duration_minutes: z.number().optional(),
	intensity: z.number().min(0).max(5).optional(),
	notes: z.string().optional(),
	lat: z.number().optional(),
	lng: z.number().optional(),
});
