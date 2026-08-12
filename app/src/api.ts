const API_URL = import.meta.env.VITE_API_URL;

class ApiError extends Error {}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (e) {
    throw new ApiError(`Network error: ${(e as Error).message}`);
  }

  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export type Walk = {
  id: number;
  dog_id: number;
  started_at: string;
  ended_at: string | null;
  distance: number | null;
  stress_score: number | null;
};

// ------ walks
export function startWalk(dogId: number) {
  return request<Walk>('/walks', {
    method: 'POST',
    body: JSON.stringify({ dog_id: dogId }),
  });
}

export function endWalk(walkId: number, stressScore?: number) {
  return request<Walk>(`/walks/${walkId}`, {
    method: 'PATCH',
    body: JSON.stringify({ stress_score: stressScore }),
  });
}

// ------- walk gps points
export function logPoint(walkId: number, lat: number, lng: number) {
  return request<void>(`/walks/${walkId}/points`, {
    method: 'POST',
    body: JSON.stringify({ lat, lng }),
  });
}
