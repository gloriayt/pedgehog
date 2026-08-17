import type { StressorEvent, StressorType, Walk } from "@pedgehog/shared";

export type { StressorEvent };

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

export function endWalk(walkId: number, stressScore?: number): Promise<Walk> {
	return request<Walk>(`/walks/${walkId}`, {
		method: "PATCH",
		body: JSON.stringify({ stress_score: stressScore }),
	});
}

export function getWalks() {
	return request<Walk[]>("/walks");
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

export function getStressorEvents(walkId: number) {
	return request<StressorEvent[]>(`/stressor-events?walk_id=${walkId}`);
}

export function getAllStressorEvents(dogId = 1) {
	return request<StressorEvent[]>(`/stressor-events?dog_id=${dogId}`);
}

export function getStressorTypes(): Promise<StressorType[]> {
	return request<StressorType[]>("/stressor-types");
}

export function logStressorEvent(params: {
	dog_id: number;
	stressor_type_id: number;
	walk_id?: number;
	intensity?: number;
	notes?: string;
	lat?: number;
	lng?: number;
}): Promise<void> {
	return request<void>("/stressor-events", {
		method: "POST",
		body: JSON.stringify(params),
	});
}
