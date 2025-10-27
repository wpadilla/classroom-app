// WhatsApp Integration Models

export interface IWhatsappGroup {
  id: string; // WhatsApp group ID
  name: string;
  description?: string;
  photo?: string; // Group photo URL
  participantCount: number;
  participants: IWhatsappParticipant[];
  admins: string[]; // Phone numbers of admins
  createdAt: Date;
  createdBy: string; // User ID who created the group
  inviteLink?: string;
  isActive: boolean;
}

export interface IWhatsappParticipant {
  phone: string;
  name?: string;
  isAdmin: boolean;
  joinedAt: Date;
  userId?: string; // Reference to user in our system
}

export interface IWhatsappMessage {
  id?: string;
  to?: string | string[]; // Phone number(s) or group ID
  type: 'text' | 'image' | 'document' | 'audio';
  content: string;
  media?: {
    url?: string;
    caption?: string;
    filename?: string;
    mimetype?: string;
  };
  sentAt?: Date;
  sentBy?: string; // User ID who sent the message
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface IWhatsappBulkMessage {
  id: string;
  groupIds: string[]; // WhatsApp group IDs to send to
  message: IWhatsappMessage;
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'scheduled' | 'sending' | 'sent' | 'failed';
  results?: {
    groupId: string;
    status: 'sent' | 'failed';
    error?: string;
  }[];
}

export interface IWhatsappSession {
  sessionId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'qr' | 'authenticated';
  qrCode?: string;
  connectedAt?: Date;
  disconnectedAt?: Date;
  phoneNumber?: string;
}

// WhatsApp API request/response types
export interface ICreateWhatsappGroupRequest {
  sessionId: string;
  groupName: string;
  participants: string[]; // Phone numbers
  description?: string;
}

export interface ISyncWhatsappGroupRequest {
  sessionId: string;
  groupId: string;
  classroomId: string;
  addParticipants?: string[]; // Phone numbers to add
  removeParticipants?: string[]; // Phone numbers to remove
}

export interface ISendWhatsappMessageRequest {
  sessionId: string;
  recipients: string[]; // Phone numbers or group IDs
  message: IWhatsappMessage;
  delay?: number; // Delay between messages in seconds
}

// WhatsApp service response types
export interface IWhatsappResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IWhatsappGroupResponse extends IWhatsappResponse<IWhatsappGroup> {}
export interface IWhatsappMessageResponse extends IWhatsappResponse<{ messageId: string }> {}

// WhatsApp event types for real-time updates
export type WhatsappEventType = 
  | 'qr'
  | 'authenticated'
  | 'ready'
  | 'disconnected'
  | 'message'
  | 'group_join'
  | 'group_leave';

export interface IWhatsappEvent {
  type: WhatsappEventType;
  sessionId: string;
  data: any;
  timestamp: Date;
}
