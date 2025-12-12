import type { RoutePolyline, RoutePolylineInsert, RoutePolylineUpdate } from '@/types/database';
import { safeFetch } from '@/lib/fetch-utils';

const API_BASE = '/api/routes';

export interface SaveRoutesResponse {
  data: RoutePolyline[];
}

export interface FetchRoutesResponse {
  data: RoutePolyline[];
}

export interface DeleteRoutesResponse {
  data: RoutePolyline[];
  message: string;
}

/** Fetch all route polylines from the database */
export async function fetchRoutes(params?: {
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params?.isPublic !== undefined) {
    searchParams.set('is_public', params.isPublic.toString());
  }
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params?.offset) {
    searchParams.set('offset', params.offset.toString());
  }

  const url = searchParams.toString() 
    ? `${API_BASE}?${searchParams.toString()}`
    : API_BASE;

  return safeFetch<FetchRoutesResponse>(url);
}

/** Save new route polylines to the database */
export async function saveRoutes(
  polylines: Array<Omit<RoutePolylineInsert, 'created_by'> & { id?: string }>
) {
  return safeFetch<SaveRoutesResponse>(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ polylines }),
  });
}

/** Update existing route polylines */
export async function updateRoutes(updates: Array<{ id: string } & RoutePolylineUpdate>) {
  return safeFetch<SaveRoutesResponse>(API_BASE, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ updates }),
  });
}

/** Delete route polylines (soft delete) */
export async function deleteRoutes(ids: string[]) {
  const searchParams = new URLSearchParams({
    ids: ids.join(','),
  });

  return safeFetch<DeleteRoutesResponse>(`${API_BASE}?${searchParams.toString()}`, {
    method: 'DELETE',
  });
}
