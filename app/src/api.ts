import type { AppEvent, EventType, Walk } from "@pedgehog/shared";

export type { AppEvent };

const API_URL = import.meta.env.VITE_API_URL;
class ApiError extends Error {}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	let res: Response;
	try {
		res = await fetch(`${API_URL}${path}`, {
			...options,
			headers: options?.body
				? { "Content-Type": "application/json", ...options?.headers }
				: options?.headers,
		});
	} catch (e) {
		throw new ApiError(`Network error: ${(e as Error).message}`);
	}

	if (!res.ok) {
		throw new ApiError(`Request failed: ${res.status}`);
	}

	if (res.status === 204) return undefined as T;
	return res.json() as Promise<T>;
}

// ------ walks
export function startWalk(dogId: number): Promise<Walk> {
	return request<Walk>("/walks", {
		method: "POST",
		body: JSON.stringify({ dog_id: dogId }),
	});
}

export function endWalk(walkId: number, opts?: { stressScore?: number; notes?: string }): Promise<Walk> {
	return request<Walk>(`/walks/${walkId}`, {
		method: "PATCH",
		body: JSON.stringify({ stress_score: opts?.stressScore, notes: opts?.notes }),
	});
}

export function getWalks() {
	return request<Walk[]>("/walks");
}

export function updateWalkNotes(walkId: number, notes: string) {
	return request<Walk>(`/walks/${walkId}/notes`, {
		method: "PATCH",
		body: JSON.stringify({ notes }),
	});
}

export function deleteWalk(walkId: number) {
	return request<void>(`/walks/${walkId}`, { method: "DELETE" });
}

export function getWalkRoute(walkId: number) {
	return request<{ type: string; coordinates: [number, number][] }>(
		`/walks/${walkId}/geojson`,
	);
}

// ------- walk gps points
export function logPoint(
	walkId: number,
	lat: number,
	lng: number,
): Promise<void> {
	return request<void>(`/walks/${walkId}/points`, {
		method: "POST",
		body: JSON.stringify({ lat, lng }),
	});
}

export function getEvents(walkId: number) {
	return request<AppEvent[]>(`/events?walk_id=${walkId}`);
}

export function getAllEvents(dogId = 1) {
	return request<AppEvent[]>(`/events?dog_id=${dogId}`);
}

export function getEventTypes(): Promise<EventType[]> {
	return request<EventType[]>("/event-types");
}

export function logEvent(params: {
	dog_id: number;
	event_type_id: number;
	walk_id?: number;
	intensity?: number;
	notes?: string;
	lat?: number;
	lng?: number;
}): Promise<void> {
	return request<void>("/events", {
		method: "POST",
		body: JSON.stringify(params),
	});
}

export function updateEvent(
	id: number,
	params: { event_type_id?: number; intensity?: number; notes?: string },
) {
	return request<void>(`/events/${id}`, {
		method: "PATCH",
		body: JSON.stringify(params),
	});
}

export function deleteEvent(id: number) {
	return request<void>(`/events/${id}`, { method: "DELETE" });
}
