export type ConferenceType = 'SCHEDULED' | 'PERMANENT';

export interface Conference {
  id: string;
  roomName: string;
  displayName: string;
  description?: string;
  status: string;
  type: ConferenceType;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  actualStartedAt?: string;
  actualEndedAt?: string;
  currentParticipants?: number;
  maxParticipants?: number;
  enableRecording: boolean;
  enableLiveStreaming: boolean;
  enableChat: boolean;
  enableScreenSharing: boolean;
  enableLobby?: boolean;
  isRecurring?: boolean;
  recurrenceRule?: string;
  createdById?: string;
  createdByName?: string;
  createdAt?: string;
  tenantId?: string;
}

export interface ConferenceFormData {
  roomName: string;
  displayName: string;
  description: string;
  type: ConferenceType;
  scheduledStartAt: string;
  scheduledEndAt: string;
  enableRecording: boolean;
  enableLiveStreaming: boolean;
  enableChat: boolean;
  enableScreenSharing: boolean;
  enableLobby: boolean;
  maxParticipants?: number;
}
