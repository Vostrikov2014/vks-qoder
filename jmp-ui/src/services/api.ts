import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { Conference, ConferenceType, ParticipantAssignment, ParticipantAssignmentCreateRequest, ParticipantAssignmentUpdateRequest, BulkAssignRequest, AccessCheckRequest, AccessCheckResult, AssignmentAuditEntry, RecordingSummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Analytics Types
export interface DailyUsage {
  date: string;
  conferences: number;
  participants: number;
  recordings: number;
}

export interface DurationStats {
  averageDuration: number;
  totalDuration: number;
  longestConference: number;
  shortestConference: number;
}

export interface DashboardMetrics {
  activeConferences: number;
  totalParticipantsToday: number;
  recordingsThisMonth: number;
  storageUsedBytes: number;
  durationStats: DurationStats;
  weeklyUsage: DailyUsage[];
}

export interface UsageReport {
  totalConferences: number;
  totalParticipants: number;
  totalDurationMinutes: number;
  totalRecordings: number;
  totalStorageBytes: number;
  peakConcurrentConferences: number;
  peakConcurrentParticipants: number;
}

export interface ParticipantAnalytics {
  uniqueParticipants: number;
  averageParticipantsPerConference: number;
  maxConcurrentParticipants: number;
  participantTrend: Record<string, number>;
}

export interface RecordingAnalytics {
  totalRecordings: number;
  totalStorageBytes: number;
  averageDurationSeconds: number;
  recordingsByType: Record<string, number>;
}

export interface SystemHealthMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  averageResponseTime: number;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// One in-flight refresh shared by all requests that got a 401, so a page firing
// several calls at once does not request a new token per call.
let refreshRequest: Promise<string> | null = null;

const refreshAccessToken = (): Promise<string> => {
  if (!refreshRequest) {
    const { refreshToken } = useAuthStore.getState();

    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token'));
    }

    refreshRequest = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((response) => {
        const { accessToken } = response.data;
        useAuthStore.getState().updateAccessToken(accessToken);
        return accessToken as string;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

interface ApiErrorBody {
  response?: { data?: { detail?: string; message?: string } };
  message?: string;
}

/** Human-readable message of a failed request, for alerts. */
export const extractApiError = (err: unknown, fallback: string): string => {
  const error = err as ApiErrorBody;
  return error.response?.data?.detail || error.response?.data?.message || error.message || fallback;
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// User API
export const userApi = {
  getCurrentUser: () => api.get('/users/me'),
  getUsers: (params?: { page?: number; size?: number; search?: string }) =>
    api.get('/users', { params }),
  createUser: (data: unknown) => api.post('/users', data),
  updateUser: (id: string, data: unknown) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// Conference API
export interface ConferenceCreateRequest {
  roomName: string;
  displayName: string;
  description?: string;
  type: ConferenceType;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  maxParticipants?: number;
  enableLobby?: boolean;
  enableRecording: boolean;
  enableLiveStreaming: boolean;
  enableChat: boolean;
  enableScreenSharing: boolean;
  accessPolicy?: string;
  allowedDomain?: string;
  waitingRoomEnabled?: boolean;
  requireAuthForAssigned?: boolean;
}

export interface ConferenceUpdateRequest {
  displayName?: string;
  description?: string;
  type?: ConferenceType;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  maxParticipants?: number;
  enableLobby?: boolean;
  enableRecording?: boolean;
  enableLiveStreaming?: boolean;
  enableChat?: boolean;
  enableScreenSharing?: boolean;
  accessPolicy?: string;
  allowedDomain?: string;
  waitingRoomEnabled?: boolean;
  requireAuthForAssigned?: boolean;
}

export const conferenceApi = {
  getConferences: (params?: { page?: number; size?: number; search?: string }) =>
    api.get<{ content: Conference[] }>('/conferences', { params }),
  getActiveConferences: () => api.get<Conference[]>('/conferences/active'),
  getUpcomingConferences: () => api.get<Conference[]>('/conferences/upcoming'),
  getConference: (id: string) => api.get<Conference>(`/conferences/${id}`),
  createConference: (data: ConferenceCreateRequest) => api.post<Conference>('/conferences', data),
  updateConference: (id: string, data: ConferenceUpdateRequest) => api.put<Conference>(`/conferences/${id}`, data),
  deleteConference: (id: string) => api.delete(`/conferences/${id}`),
  startConference: (id: string) => api.post(`/conferences/${id}/start`),
  endConference: (id: string) => api.post(`/conferences/${id}/end`),
  // Own entry address: the conference is taken from the path, the participant and the
  // Jitsi role from the access token — there is nothing to send in the body.
  generateToken: (id: string) =>
    api.post<TokenResponse>(`/conferences/${id}/token`),
};

export interface TokenResponse {
  roomUrl: string;
  expiresAt: string;
}

// Conference join links — permanent addresses that can be shared and revoked
export type ConferenceLinkRole = 'PARTICIPANT' | 'MODERATOR';

export interface ConferenceLink {
  id: string;
  slug: string;
  joinUrl: string;
  label?: string;
  role: ConferenceLinkRole;
  expiresAt?: string;
  revokedAt?: string;
  visitCount: number;
  lastVisitedAt?: string;
  createdByName?: string;
  createdAt: string;
}

export interface ConferenceLinkCreateRequest {
  label?: string;
  role?: ConferenceLinkRole;
  expiresAt?: string;
}

export const conferenceLinkApi = {
  /** Oldest link first; the primary link is created on the first call. */
  getLinks: (conferenceId: string) =>
    api.get<ConferenceLink[]>(`/conferences/${conferenceId}/links`),
  createLink: (conferenceId: string, data: ConferenceLinkCreateRequest) =>
    api.post<ConferenceLink>(`/conferences/${conferenceId}/links`, data),
  revokeLink: (conferenceId: string, linkId: string) =>
    api.delete(`/conferences/${conferenceId}/links/${linkId}`),
};

/**
 * What to do with a visitor that opened a join link. Values are the serialized names of
 * the backend ConferenceLinkDto.Decision enum.
 */
export type JoinDecision = 'REDIRECT' | 'LOGIN' | 'ENDED' | 'DENIED' | 'NOT_FOUND';

export interface JoinResult {
  decision: JoinDecision;
  reason: string;
  roomUrl?: string;
  expiresAt?: string;
  displayName?: string;
  conferenceName?: string;
}

// Public: resolves a shared join link into a freshly signed Jitsi address
export const joinApi = {
  resolve: (slug: string, displayName?: string) =>
    api.get<JoinResult>(`/join/${slug}`, { params: displayName ? { displayName } : undefined }),
};

// Participant Assignment API
export const participantAssignmentApi = {
  getAssignments: (conferenceId: string) =>
    api.get<ParticipantAssignment[]>(`/conferences/${conferenceId}/participants`),

  assignParticipant: (conferenceId: string, data: ParticipantAssignmentCreateRequest) =>
    api.post<ParticipantAssignment>(`/conferences/${conferenceId}/participants`, data),

  bulkAssign: (conferenceId: string, data: BulkAssignRequest) =>
    api.post<ParticipantAssignment[]>(`/conferences/${conferenceId}/participants/bulk`, data),

  getAssignment: (conferenceId: string, assignmentId: string) =>
    api.get<ParticipantAssignment>(`/conferences/${conferenceId}/participants/${assignmentId}`),

  updateAssignment: (conferenceId: string, assignmentId: string, data: ParticipantAssignmentUpdateRequest) =>
    api.patch<ParticipantAssignment>(`/conferences/${conferenceId}/participants/${assignmentId}`, data),

  removeAssignment: (conferenceId: string, assignmentId: string) =>
    api.delete(`/conferences/${conferenceId}/participants/${assignmentId}`),

  acceptInvitation: (conferenceId: string, assignmentId: string) =>
    api.post(`/conferences/${conferenceId}/participants/${assignmentId}/accept`),

  declineInvitation: (conferenceId: string, assignmentId: string) =>
    api.post(`/conferences/${conferenceId}/participants/${assignmentId}/decline`),

  checkAccess: (conferenceId: string, data: AccessCheckRequest) =>
    api.post<AccessCheckResult>(`/conferences/${conferenceId}/participants/access-check`, data),

  getAuditLog: (conferenceId: string) =>
    api.get<AssignmentAuditEntry[]>(`/conferences/${conferenceId}/participants/audit-log`),
};

// Tenant API
export interface TenantQuotas {
  maxConcurrentConferences?: number;
  maxParticipantsPerConference?: number;
  maxRecordingStorageMb?: number;
  maxConferenceDurationMinutes?: number;
  allowedFeatures?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  domain?: string;
  jitsiDomain?: string;
  quotas?: TenantQuotas;
  settings?: Record<string, unknown>;
  jitsiConfig?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  suspendedAt?: string;
  suspensionReason?: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  domain?: string;
  jitsiDomain?: string;
  createdAt?: string;
}

export interface TenantCreateRequest {
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  jitsiDomain?: string;
  quotas?: TenantQuotas;
}

export interface TenantUpdateRequest {
  name?: string;
  description?: string;
  domain?: string;
  jitsiDomain?: string;
  quotas?: TenantQuotas;
}

export const tenantApi = {
  getTenants: (params?: { page?: number; size?: number; search?: string }) =>
    api.get<{ content: TenantSummary[] }>('/tenants', { params }),
  getTenant: (id: string) => api.get<Tenant>(`/tenants/${id}`),
  createTenant: (data: TenantCreateRequest) => api.post<Tenant>('/tenants', data),
  updateTenant: (id: string, data: TenantUpdateRequest) => api.put<Tenant>(`/tenants/${id}`, data),
  suspendTenant: (id: string, reason?: string) =>
    api.post<Tenant>(`/tenants/${id}/suspend`, reason ? { reason } : {}),
  activateTenant: (id: string) => api.post<Tenant>(`/tenants/${id}/activate`),
  deleteTenant: (id: string) => api.delete(`/tenants/${id}`),
};

// Analytics API
export const analyticsApi = {
  getDashboardMetrics: () => api.get<DashboardMetrics>('/analytics/dashboard'),
  getUsageReport: (startDate: string, endDate: string) =>
    api.get<UsageReport>('/analytics/usage-report', { params: { startDate, endDate } }),
  getParticipantAnalytics: (startDate: string, endDate: string) =>
    api.get<ParticipantAnalytics>('/analytics/participants', { params: { startDate, endDate } }),
  getRecordingAnalytics: (startDate: string, endDate: string) =>
    api.get<RecordingAnalytics>('/analytics/recordings', { params: { startDate, endDate } }),
  getSystemHealth: () => api.get<SystemHealthMetrics>('/analytics/system-health'),
};

// Recording API
export const recordingApi = {
  getRecordings: (params?: { page?: number; size?: number; search?: string }) =>
    api.get<{ content: RecordingSummary[]; totalElements: number }>('/recordings', { params }),
  getRecording: (id: string) => api.get<RecordingSummary>(`/recordings/${id}`),
  getDownloadUrl: (id: string, expirationMinutes?: number) =>
    api.get<{ downloadUrl: string; expiresAt: string }>(`/recordings/${id}/download`, { params: { expirationMinutes } }),
  deleteRecording: (id: string) => api.delete(`/recordings/${id}`),
  getStorageStats: () =>
    api.get<{ totalStorageBytes: number; totalRecordings: number; recordingsThisMonth: number }>('/recordings/stats/storage'),
};
