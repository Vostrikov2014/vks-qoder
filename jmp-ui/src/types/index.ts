export type ConferenceType = 'SCHEDULED' | 'PERMANENT';

// === Participant Assignment Types ===

export type AccessPolicy = 'PUBLIC' | 'ASSIGNED_ONLY' | 'DOMAIN_RESTRICTED';
export type AssignmentRole = 'PARTICIPANT' | 'MODERATOR' | 'PRESENTER';
export type AssignmentStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'JOINED' | 'REMOVED';

export interface ParticipantAssignment {
  id: string;
  conferenceId: string;
  userId?: string;
  email: string;
  role: AssignmentRole;
  status: AssignmentStatus;
  requireAuth: boolean;
  invitedAt?: string;
  respondedAt?: string;
  joinedAt?: string;
  leftAt?: string;
  createdAt?: string;
}

export interface ParticipantAssignmentCreateRequest {
  email: string;
  userId?: string;
  role?: AssignmentRole;
  requireAuth?: boolean;
  sendInvite?: boolean;
}

export interface ParticipantAssignmentUpdateRequest {
  role?: string;
  status?: string;
  requireAuth?: boolean;
}

export interface BulkAssignRequest {
  participants: ParticipantAssignmentCreateRequest[];
}

export interface AccessCheckRequest {
  userId?: string;
  email?: string;
  invitationToken?: string;
  authStatus?: 'authenticated' | 'guest';
}

export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
  action?: 'allow' | 'redirect_to_login' | 'redirect_to_waiting_room' | 'deny';
  participantInfo?: {
    role: string;
    displayName: string;
  };
}

export interface AssignmentAuditEntry {
  id: string;
  conferenceId: string;
  actorId: string;
  action: string;
  targetUserId?: string;
  targetEmail?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

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
  accessPolicy?: AccessPolicy;
  allowedDomain?: string;
  waitingRoomEnabled?: boolean;
  requireAuthForAssigned?: boolean;
  assignedCount?: number;
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
  accessPolicy: AccessPolicy;
  allowedDomain: string;
  waitingRoomEnabled: boolean;
  requireAuthForAssigned: boolean;
}
