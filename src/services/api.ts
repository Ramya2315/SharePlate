/**
 * SharePlate API Client
 * Consistent fetch client communicating with /api/v1 endpoints with token management.
 */

const BASE_URL = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('shareplate_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('shareplate_token', token);
  } else {
    localStorage.removeItem('shareplate_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload: any) =>
    request<{ token: string; user: any; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  demoLogin: (role: string) =>
    request<{ token: string; user: any; message: string }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getMe: () => request<{ user: any }>('/auth/me'),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  // Listings
  getListings: (params: { category?: string; dietary?: string; search?: string; status?: string; providerId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.dietary) query.append('dietary', params.dietary);
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.providerId) query.append('providerId', params.providerId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ listings: any[]; count: number }>(`/listings${qs}`);
  },

  getListingById: (id: string) => request<{ listing: any }>(`/listings/${id}`),

  createListing: (payload: any) =>
    request<{ message: string; listing: any }>('/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateListing: (id: string, payload: any) =>
    request<{ message: string; listing: any }>(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  cancelListing: (id: string) =>
    request<{ message: string }>(`/listings/${id}`, {
      method: 'DELETE',
    }),

  // Requests
  getRequests: () => request<{ requests: any[] }>('/requests'),

  createRequest: (payload: { listingId: string; requestedQuantity: number; requestedServings?: number; pickupNotes?: string }) =>
    request<{ message: string; request: any }>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  approveRequest: (id: string) =>
    request<{ message: string; request: any; listing: any; pickupTask: any }>(`/requests/${id}/approve`, {
      method: 'PUT',
    }),

  rejectRequest: (id: string, rejectionReason?: string) =>
    request<{ message: string; request: any }>(`/requests/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejectionReason }),
    }),

  cancelRequest: (id: string) =>
    request<{ message: string; request: any }>(`/requests/${id}/cancel`, {
      method: 'PUT',
    }),

  // Pickups
  getPickups: () => request<{ tasks: any[] }>('/pickups'),

  getPickupById: (id: string) => request<{ task: any }>(`/pickups/${id}`),

  getPickupQr: (id: string) =>
    request<{ taskId: string; code: string; status: string; qrDataUrl: string; instructions: string }>(
      `/pickups/${id}/qr`
    ),

  claimPickup: (id: string) =>
    request<{ message: string; task: any }>(`/pickups/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  verifyPickupCode: (id: string, code: string, targetStatus: 'picked_up' | 'delivered') =>
    request<{ message: string; task: any }>(`/pickups/${id}/verify-code`, {
      method: 'POST',
      body: JSON.stringify({ code, targetStatus }),
    }),

  updatePickupStatus: (id: string, status: string, notes?: string) =>
    request<{ message: string; task: any }>(`/pickups/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  // Intelligence
  getMatchRecommendations: (listingId: string) =>
    request<any>('/intelligence/recommend-recipients', {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    }),

  getSurplusSummary: () => request<any>('/intelligence/surplus-summary'),

  // Analytics
  getDashboardAnalytics: () => request<any>('/analytics/dashboard'),

  // Verifications
  getVerifications: () => request<{ verifications: any[] }>('/verifications'),

  getMyVerificationStatus: () => request<{ verification: any; isVerified: boolean }>('/verifications/my-status'),

  submitVerification: (payload: any) =>
    request<{ message: string; verification: any }>('/verifications/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewVerification: (id: string, status: 'approved' | 'rejected', reviewNotes?: string) =>
    request<{ message: string; verification: any }>(`/verifications/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewNotes }),
    }),

  // Notifications
  getNotifications: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),

  markNotificationRead: (id: string) => request<{ notification: any }>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllNotificationsRead: () => request<{ message: string }>('/notifications/read-all', { method: 'PUT' }),

  // Safety Reports
  getSafetyReports: () => request<{ reports: any[] }>('/safety-reports'),

  submitSafetyReport: (payload: any) =>
    request<{ message: string; report: any }>('/safety-reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resolveSafetyReport: (id: string, status: string, resolutionNotes?: string) =>
    request<{ message: string; report: any }>(`/safety-reports/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolutionNotes }),
    }),

  // Audit Logs
  getAuditLogs: () => request<{ auditLogs: any[] }>('/audit-logs'),

  // User Role Management
  getUsers: (params: { role?: string; isVerified?: boolean; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.role) q.append('role', params.role);
    if (params.isVerified !== undefined) q.append('isVerified', String(params.isVerified));
    if (params.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<{ users: any[]; count: number }>(`/users${qs}`);
  },

  updateUserRole: (id: string, role: string) =>
    request<{ message: string; user: any }>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  updateUserVerification: (id: string, isVerified: boolean) =>
    request<{ message: string; user: any }>(`/users/${id}/verification`, {
      method: 'PUT',
      body: JSON.stringify({ isVerified }),
    }),

  getRolePermissions: () => request<any>('/users/permissions'),

  // Real-time Google Maps & Dispatch Agent
  searchPlaces: (query: string, includedType?: string) =>
    request<{ places: any[] }>('/maps/places/search', {
      method: 'POST',
      body: JSON.stringify({ query, includedType }),
    }),

  computeRoute: (origin: any, destination: any, travelMode: string = 'DRIVE', avoidTolls: boolean = false) =>
    request<{ route: any; message?: string }>('/maps/routes/compute', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, travelMode, avoidTolls }),
    }),

  geocodeAddress: (address: string) =>
    request<{ location: { lat: number; lng: number }; formattedAddress: string; placeId: string }>('/maps/geocode', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  queryLogisticsAgent: (query?: string, taskId?: string) =>
    request<any>('/maps/agent/query', {
      method: 'POST',
      body: JSON.stringify({ query, taskId }),
    }),

  // Restaurants & Food Donors
  getRestaurants: (params?: { search?: string; cuisine?: string; verifiedOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.cuisine) q.append('cuisine', params.cuisine);
    if (params?.verifiedOnly) q.append('verifiedOnly', 'true');
    const qs = q.toString();
    return request<{ success: boolean; count: number; restaurants: any[] }>(`/restaurants${qs ? `?${qs}` : ''}`);
  },

  getRestaurantById: (id: string) =>
    request<{ success: boolean; restaurant: any }>(`/restaurants/${id}`),

  createRestaurant: (data: any) =>
    request<{ success: boolean; message: string; restaurant: any }>('/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRestaurant: (id: string, data: any) =>
    request<{ success: boolean; message: string; restaurant: any }>(`/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

