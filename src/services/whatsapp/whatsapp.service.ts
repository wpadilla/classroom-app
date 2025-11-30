// WhatsApp Service - Core WhatsApp API Integration

import axios from 'axios';
import {
  IWhatsappGroup,
  IWhatsappMessage,
  IWhatsappSession,
  IWhatsappResponse,
  IWhatsappGroupResponse,
  IWhatsappMessageResponse
} from '../../models';

const WHATSAPP_API_URL = 'https://betuel-promotions.xyz/api/whatsapp';
const DEFAULT_SESSION_ID = 'bibleAssistant';

export class WhatsappService {
  private static sessionId: string = DEFAULT_SESSION_ID;
  private static apiUrl: string = WHATSAPP_API_URL;

  /**
   * Initialize WhatsApp session
   */
  static async initializeSession(sessionId?: string): Promise<IWhatsappSession> {
    try {
      if (sessionId) {
        this.sessionId = sessionId;
      }

      const response = await axios.post(`${this.apiUrl}/start`, {
        sessionId: this.sessionId
      });

      return response.data;
    } catch (error) {
      console.error('Error initializing WhatsApp session:', error);
      throw error;
    }
  }

  /**
   * Get session status
   */
  static async getSessionStatus(): Promise<IWhatsappSession> {
    try {
      const response = await axios.post(`${this.apiUrl}/status`, {
        sessionId: this.sessionId,
      });

      return response.data;
    } catch (error) {
      console.error('Error getting session status:', error);
      throw error;
    }
  }

  /**
   * Create a new WhatsApp group
   */
  static async createGroup(
    groupName: string,
    participants: string[],
    description?: string
  ): Promise<IWhatsappGroupResponse> {
    try {
      // Filter and format participants
      const validParticipants = participants
        .map(p => this.processPhoneNumber(p))
        .filter((p): p is string => p !== null);

      if (validParticipants.length === 0) {
        return {
          success: false,
          error: 'No hay participantes válidos para crear el grupo'
        };
      }

      // Format payload according to ICreateWhatsappGroupPayload
      const payload = {
        sessionId: this.sessionId,
        groupDetails: {
          title: groupName,
          description: description || '',
          participants: validParticipants
        },
        clients: validParticipants.map(phone => ({
          phone: phone,
          name: '' // Optional, can be filled if we have the name
        }))
      };

      const response = await axios.post(`${this.apiUrl}/group/create`, payload);

      return {
        success: true,
        data: response.data,
        message: 'Grupo creado exitosamente'
      };
    } catch (error: any) {
      console.error('Error creating WhatsApp group:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al crear el grupo'
      };
    }
  }

  /**
   * Sync WhatsApp group participants with classroom students
   */
  static async syncGroupParticipants(
    groupId: string,
    classroomId: string,
    studentsPhones: string[]
  ): Promise<IWhatsappResponse> {
    try {
      // Filter and format phones
      const validPhones = studentsPhones
        .map(p => this.processPhoneNumber(p))
        .filter((p): p is string => p !== null);

      if (validPhones.length === 0) {
        return {
          success: false,
          error: 'No hay números de teléfono válidos para sincronizar'
        };
      }

      // Format payload according to ISyncWhatsappGroupPayload
      const payload = {
        sessionId: this.sessionId,
        whatsappGroupID: groupId,
        clients: validPhones.map(phone => ({
          phone: phone,
          name: '' // Optional, can be filled if we have the name
        }))
      };

      const response = await axios.post(`${this.apiUrl}/group/sync`, payload);

      return {
        success: true,
        data: response.data,
        message: 'Grupo sincronizado exitosamente'
      };
    } catch (error: any) {
      console.error('Error syncing WhatsApp group:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al sincronizar el grupo'
      };
    }
  }

  /**
   * Get group participants
   */
  static async getGroupParticipants(groupId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/group/participants/${this.sessionId}/${groupId}`
      );

      return response.data.participants || [];
    } catch (error) {
      console.error('Error getting group participants:', error);
      return [];
    }
  }

  /**
   * Send message to WhatsApp group or individual
   */
  static async sendMessage(
    recipients: string[] | any[],
    message: IWhatsappMessage,
    delay: number = 5,
    groupTitle?: string,
    isGroup?: boolean
  ): Promise<IWhatsappMessageResponse> {
    try {
      const formData = new FormData();

      // Filter and format contacts
      const contacts = recipients.map(recipient => {
        // If recipient is already an object with contact info, use it
        if (typeof recipient === 'object') {
          // Check if it's a group
          const isGroupRecipient = recipient.id?.includes('@g.us') || isGroup;
          
          // Build the contact object with all properties
          const contact: any = {
            phone: isGroupRecipient ? '' : (this.processPhoneNumber(recipient.phone) || ''),
            id: recipient.id || (isGroupRecipient ? '' : `${this.processPhoneNumber(recipient.phone)}@s.whatsapp.net`),
            ...(recipient.firstName && { firstName: recipient.firstName }),
            ...(recipient.lastName && { lastName: recipient.lastName }),
            ...(recipient.fullName && { fullName: recipient.fullName }),
            ...(recipient.score !== undefined && { score: recipient.score }),
            ...(recipient.absentTimes !== undefined && { absentTimes: recipient.absentTimes }),
            ...(recipient.teacherName && { teacherName: recipient.teacherName }),
            ...(recipient.subject && { subject: recipient.subject }),
            ...(recipient.schedule && { schedule: recipient.schedule }),
            ...(recipient.materialPrice !== undefined && { materialPrice: recipient.materialPrice }),
            ...(recipient.classroom && { classroom: recipient.classroom }),
            ...(recipient.title && { title: recipient.title }),
            ...(groupTitle && isGroupRecipient && { title: groupTitle })
          };
          
          // Validate: groups need valid id, individuals need valid phone
          if (isGroupRecipient && !contact.id) return null;
          if (!isGroupRecipient && !contact.phone) return null;
          
          return contact;
        }

        // If recipient is just a string (phone number or group ID)
        const recipientStr = String(recipient);

        // Check if it's a group ID (contains @g.us) or isGroup flag is true
        if (recipientStr.includes('@g.us') || isGroup) {
          const contact: any = {
            phone: '', // Empty phone for groups
            id: recipientStr
          };
          if (groupTitle) {
            contact.title = groupTitle;
          }
          return contact;
        }

        // It's a phone number
        const processedPhone = this.processPhoneNumber(recipientStr);
        if (!processedPhone) return null;

        return {
          phone: processedPhone,
          id: `${processedPhone}@s.whatsapp.net`
        };
      }).filter(contact => contact !== null);

      if (contacts.length === 0) {
        return {
          success: false,
          error: 'No hay destinatarios válidos'
        };
      }

      // Format messages according to the correct structure
      const messages = [{
        text: message.content,
        ...(message.media && {
          media: message.media
        })
      }];

      formData.append('sessionId', this.sessionId);
      formData.append('contacts', JSON.stringify(contacts));
      formData.append('messages', JSON.stringify(messages));
      formData.append('delay', delay.toString());

      // Add media file if present
      if (message.media && message.type !== 'text') {
        // Handle file upload if needed
        // This would require converting media URL to blob/file
      }

      const response = await axios.post(`${this.apiUrl}/message`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        data: { messageId: response.data.stopMessagesId },
        message: 'Mensaje enviado exitosamente'
      };
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al enviar el mensaje'
      };
    }
  }

  /**
   * Send bulk messages to multiple groups
   */
  static async sendBulkMessages(
    groupIds: string[],
    message: IWhatsappMessage,
    groupTitles?: { [groupId: string]: string }
  ): Promise<IWhatsappResponse[]> {
    try {
      const promises = groupIds.map(groupId =>
        this.sendMessage(
          [groupId],
          message,
          5, // delay
          groupTitles?.[groupId] // group title if provided
        )
      );

      const results = await Promise.allSettled(promises);

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            success: false,
            error: `Error al enviar mensaje al grupo ${groupIds[index]}`
          };
        }
      });
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      return groupIds.map(() => ({
        success: false,
        error: 'Error al enviar mensajes masivos'
      }));
    }
  }

  /**
   * Get all WhatsApp groups
   */
  static async getAllGroups(): Promise<IWhatsappGroup[]> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/seed/${this.sessionId}/groups`
      );

      return response.data.groups || [];
    } catch (error) {
      console.error('Error getting WhatsApp groups:', error);
      return [];
    }
  }

  /**
   * Get all WhatsApp contacts
   */
  static async getAllContacts(): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/seed/${this.sessionId}/users`
      );

      return response.data.users || [];
    } catch (error) {
      console.error('Error getting WhatsApp contacts:', error);
      return [];
    }
  }

  /**
   * Check if a phone number has WhatsApp
   */
  static async checkWhatsappNumber(phone: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/check/whatsapp-number/${phone}`
      );

      return response.data === true;
    } catch (error) {
      console.error('Error checking WhatsApp number:', error);
      return false;
    }
  }

  /**
   * Close WhatsApp session
   */
  static async closeSession(destroy: boolean = false): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/close`, {
        sessionId: this.sessionId,
        destroy
      });
    } catch (error) {
      console.error('Error closing WhatsApp session:', error);
    }
  }

  /**
   * Restart WhatsApp session
   */
  static async restartSession(forceReconnect: boolean = false): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/restart`, {
        sessionId: this.sessionId,
        forceReconnect
      });
    } catch (error) {
      console.error('Error restarting WhatsApp session:', error);
    }
  }

  /**
   * Stop message execution
   */
  static async stopMessages(cancelId: string, stopType: 'pause' | 'cancel' = 'cancel'): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/stop-messages`, {
        cancelId,
        sessionId: this.sessionId,
        stopType
      });
    } catch (error) {
      console.error('Error stopping messages:', error);
    }
  }

  /**
   * Process phone number: remove non-numeric, validate length, format
   * Returns formatted number or null if invalid
   */
  static processPhoneNumber(phone: string): string | null {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Check length requirements
    if (cleaned.length < 10) {
      return null;
    }

    // If length is exactly 10, prepend '1'
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }

    return cleaned;
  }

  /**
   * Format phone number for WhatsApp
   * @deprecated Use processPhoneNumber instead
   */
  static formatPhoneNumber(phone: string): string {
    const processed = this.processPhoneNumber(phone);
    return processed || phone.replace(/\D/g, '');
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    return this.processPhoneNumber(phone) !== null;
  }
}
