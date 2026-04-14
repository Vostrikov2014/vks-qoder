import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { Conference, ConferenceType, ParticipantAssignment, ParticipantAssignmentCreateRequest, ParticipantAssignmentUpdateRequest, BulkAssignRequest, AccessCheckRequest, AccessCheckResult, AssignmentAuditEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          useAuthStore.getState().clearAuth();
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken } = response.data;
        useAuthStore.getState().updateAccessToken(accessToken);
        
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
  generateToken: (id: string, data: unknown) =>
    api.post(`/conferences/${id}/token`, data),
  generateShareLink: (id: string, data: { displayName: string }) =>
    api.post<{ shareUrl: string; expiresAt: string }>(`/conferences/${id}/share`, data),
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
