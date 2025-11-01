# WhatsApp Integration Guide

## Overview

This application includes a complete WhatsApp integration for classroom management. The integration allows administrators to:

- Connect/disconnect WhatsApp sessions
- Create WhatsApp groups for classrooms
- Sync group participants with enrolled students
- Send messages to individual groups
- Send bulk messages to multiple groups
- Manage group membership

## Architecture

### Services

#### `WhatsappService`
Core service for WhatsApp API integration. Located at `src/services/whatsapp/whatsapp.service.ts`.

**Key Methods:**
- `initializeSession()` - Initialize WhatsApp connection
- `getSessionStatus()` - Check current session status
- `createGroup()` - Create a new WhatsApp group
- `syncGroupParticipants()` - Sync group members with classroom students
- `sendMessage()` - Send message to group or individual
- `sendBulkMessages()` - Send messages to multiple groups
- `getAllGroups()` - Get all WhatsApp groups
- `formatPhoneNumber()` - Format phone numbers for WhatsApp

#### `WhatsAppUtilsService`
Helper service with utility functions. Located at `src/services/whatsapp/whatsapp-utils.service.ts`.

**Key Methods:**
- `ensureConnected()` - Validate WhatsApp connection
- `validateMessage()` - Validate message content
- `createClassroomAnnouncement()` - Create formatted announcement
- `createAttendanceReminder()` - Create attendance reminder message
- `sendBatchMessages()` - Send messages with progress tracking
- `calculateBulkSendingTime()` - Estimate bulk sending time
- `extractPhoneNumbers()` - Extract phone numbers from text

#### `ClassroomService`
Integrates WhatsApp functionality with classrooms. Located at `src/services/classroom/classroom.service.ts`.

**WhatsApp Methods:**
- `createWhatsappGroup()` - Create group for a classroom
- `syncWhatsappGroup()` - Sync classroom students with group
- `sendWhatsappMessage()` - Send message to classroom group

### Components

#### Admin-Only Components

All WhatsApp management components are restricted to **admin users only**.

##### `WhatsAppManager`
Main WhatsApp management dashboard.
- **Route:** `/admin/whatsapp`
- **Features:**
  - View connection status
  - Connect/disconnect WhatsApp
  - Display QR code for connection
  - View recent groups
  - Quick stats
  - Navigate to other WhatsApp features

##### `WhatsAppGroupManager`
Manage all classroom WhatsApp groups.
- **Route:** `/admin/whatsapp/groups`
- **Features:**
  - List all classrooms
  - Filter classrooms (with/without groups)
  - Create WhatsApp groups for classrooms
  - Sync group participants
  - View group statistics
  - Progress tracking for setup

##### `BulkMessaging`
Send messages to multiple groups at once.
- **Route:** `/admin/whatsapp/bulk-messaging`
- **Features:**
  - Select multiple classrooms
  - Compose text or image messages
  - Set delay between messages
  - View recipient count
  - Progress tracking during sending
  - Success/failure reporting

##### Classroom Management (WhatsApp Dropdown)
Each classroom has WhatsApp functionality integrated.
- **Location:** Classroom details page
- **Features:**
  - Create group button (if no group exists)
  - Sync group button (if group exists)
  - Send message to group
  - WhatsApp group status indicator

## Usage Guide

### 1. Initial Setup

1. Navigate to `/admin/whatsapp`
2. Click "Conectar WhatsApp"
3. Scan the QR code with your WhatsApp mobile app
4. Wait for connection to establish

### 2. Creating Classroom Groups

**Option A: From WhatsApp Group Manager**
1. Navigate to `/admin/whatsapp/groups`
2. Find the classroom without a group
3. Click "Crear Grupo de WhatsApp"
4. Confirm creation

**Option B: From Classroom Page**
1. Navigate to classroom details
2. Click WhatsApp dropdown
3. Click "Crear Grupo"
4. Wait for confirmation

### 3. Syncing Group Participants

When students are added or removed from a classroom:

1. Go to classroom details
2. Click WhatsApp dropdown
3. Click "Sincronizar"
4. The system will:
   - Add new students to WhatsApp group
   - Mark removed students (doesn't remove from WhatsApp)
   - Create new user accounts for unknown WhatsApp participants

### 4. Sending Messages

**Single Group:**
1. Go to classroom details
2. Click WhatsApp dropdown
3. Click "Enviar Mensaje"
4. Type your message
5. Click "Enviar"

**Multiple Groups (Bulk):**
1. Navigate to `/admin/whatsapp/bulk-messaging`
2. Select classrooms using checkboxes
3. Choose message type (text/image)
4. Compose your message
5. Set delay between messages
6. Click "Enviar a X Grupos"
7. Monitor progress in modal

### 5. Message Templates

Use `WhatsAppUtilsService` for formatted messages:

```typescript
import { WhatsAppUtilsService } from '@/services/whatsapp';

// Classroom announcement
const announcement = WhatsAppUtilsService.createClassroomAnnouncement(
  classroom,
  'Clase cancelada el próximo viernes'
);

// Module update
const moduleUpdate = WhatsAppUtilsService.createModuleUpdateMessage(
  classroom,
  5,
  'Funciones Avanzadas',
  'Material disponible en el portal'
);

// Attendance reminder
const reminder = WhatsAppUtilsService.createAttendanceReminder(
  classroom,
  new Date('2024-03-15T18:00:00'),
  'Salón 301'
);
```

## Phone Number Formatting

Phone numbers are automatically formatted for WhatsApp:
- Removes all non-numeric characters
- Adds country code if missing (defaults to +1 for Dominican Republic)
- Validates format before sending

Example:
- Input: `(809) 555-1234`
- Formatted: `18095551234`

## Best Practices

### Security
1. **Admin Only:** All WhatsApp features are restricted to admin role
2. **Validation:** Always validate phone numbers before adding to groups
3. **Confirmation:** Require user confirmation for bulk operations

### Performance
1. **Delay Between Messages:** Use at least 5 seconds delay for bulk messages
2. **Batch Size:** Limit bulk messages to reasonable sizes
3. **Error Handling:** Always handle errors gracefully

### User Experience
1. **Progress Feedback:** Show progress for long operations
2. **Status Indicators:** Display connection status prominently
3. **Error Messages:** Provide clear, actionable error messages

## Error Handling

Common errors and solutions:

### "WhatsApp desconectado"
- **Cause:** Session not initialized or disconnected
- **Solution:** Navigate to `/admin/whatsapp` and connect

### "Error al crear grupo"
- **Cause:** WhatsApp not connected, invalid participants
- **Solution:** Check connection, validate student phone numbers

### "Error al enviar mensaje"
- **Cause:** Invalid group ID, message too long, connection issue
- **Solution:** Verify group exists, check message length, reconnect if needed

## Data Models

### IWhatsappGroup
```typescript
interface IWhatsappGroup {
  id: string;
  name: string;
  description?: string;
  photo?: string;
  participantCount: number;
  participants: IWhatsappParticipant[];
  admins: string[];
  createdAt: Date;
  createdBy: string;
  inviteLink?: string;
  isActive: boolean;
}
```

### IWhatsappMessage
```typescript
interface IWhatsappMessage {
  id?: string;
  to?: string | string[];
  type: 'text' | 'image' | 'document' | 'audio';
  content: string;
  media?: {
    url?: string;
    caption?: string;
    filename?: string;
    mimetype?: string;
  };
  sentAt?: Date;
  sentBy?: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}
```

### IWhatsappSession
```typescript
interface IWhatsappSession {
  sessionId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'qr' | 'authenticated';
  qrCode?: string;
  connectedAt?: Date;
  disconnectedAt?: Date;
  phoneNumber?: string;
}
```

## API Endpoints

The integration uses the following API endpoints:

- `POST /api/whatsapp/start` - Initialize session
- `POST /api/whatsapp/status` - Get session status
- `POST /api/whatsapp/group/create` - Create group
- `POST /api/whatsapp/group/sync` - Sync group
- `GET /api/whatsapp/group/participants/:sessionId/:groupId` - Get participants
- `POST /api/whatsapp/message` - Send message
- `POST /api/whatsapp/close` - Close session
- `POST /api/whatsapp/restart` - Restart session
- `GET /api/whatsapp/seed/:sessionId/groups` - Get all groups
- `GET /api/whatsapp/seed/:sessionId/users` - Get all contacts

## Limitations

1. **WhatsApp Limits:**
   - Maximum 256 participants per group
   - Rate limiting on message sending
   - QR code expires after ~30 seconds

2. **Application Limits:**
   - One WhatsApp session per application
   - Text messages limited to 4096 characters
   - Images must be under 5MB

3. **Permission Restrictions:**
   - Only administrators can access WhatsApp features
   - Teachers can only send messages to their classrooms
   - Students have no WhatsApp access

## Troubleshooting

### Connection Issues
1. Check network connectivity
2. Verify API endpoint is accessible
3. Try restarting the session
4. Re-scan QR code

### Group Sync Issues
1. Verify all students have valid phone numbers
2. Check WhatsApp connection status
3. Ensure group still exists in WhatsApp
4. Try manual sync from group manager

### Message Sending Failures
1. Verify recipient group/number is valid
2. Check message content and length
3. Ensure sufficient delay between messages
4. Verify WhatsApp connection is active

## Future Enhancements

Potential future features:
- Message scheduling
- Message templates library
- Analytics and reporting
- Read receipts tracking
- Media message support (videos, documents)
- Automated reminders
- Group chat archiving
- Multi-language support

## Support

For issues or questions:
1. Check this guide first
2. Review error logs in browser console
3. Check WhatsApp session status
4. Contact system administrator

---

**Last Updated:** November 2025
**Version:** 1.0.0

