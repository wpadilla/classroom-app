// WhatsApp Service - Core WhatsApp API Integration

import axios from 'axios';
import {
  IWhatsappGroup,
  IWhatsappMessage,
  IWhatsappSession,
  ICreateWhatsappGroupRequest,
  ISyncWhatsappGroupRequest,
  ISendWhatsappMessageRequest,
  IWhatsappResponse,
  IWhatsappGroupResponse,
  IWhatsappMessageResponse
} from '../../models';

const WHATSAPP_API_URL = 'https://betuel-promotions.xyz/api/whatsapp';
const DEFAULT_SESSION_ID = 'classroom-app';

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
        sessionId: this.sessionId
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
      const request: ICreateWhatsappGroupRequest = {
        sessionId: this.sessionId,
        groupName,
        participants,
        description
      };

      const response = await axios.post(`${this.apiUrl}/group/create`, request);

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
      // Get current group participants
      const participants = await this.getGroupParticipants(groupId);
      
      const currentPhones = participants.map(p => p.phone);
      const phonesToAdd = studentsPhones.filter(phone => !currentPhones.includes(phone));
      const phonesToRemove = currentPhones.filter(phone => !studentsPhones.includes(phone));

      const request: ISyncWhatsappGroupRequest = {
        sessionId: this.sessionId,
        groupId,
        classroomId,
        addParticipants: phonesToAdd,
        removeParticipants: phonesToRemove
      };

      const response = await axios.post(`${this.apiUrl}/group/sync`, request);

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
    recipients: string[],
    message: IWhatsappMessage,
    delay: number = 5
  ): Promise<IWhatsappMessageResponse> {
    try {
      const formData = new FormData();
      formData.append('sessionId', this.sessionId);
      formData.append('contacts', JSON.stringify(recipients));
      formData.append('messages', JSON.stringify([message]));
      formData.append('delay', delay.toString());

      // Add media if present
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
    message: IWhatsappMessage
  ): Promise<IWhatsappResponse[]> {
    try {
      const promises = groupIds.map(groupId =>
        this.sendMessage([groupId], message)
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
   * Format phone number for WhatsApp
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming Dominican Republic)
    if (!cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    // Check for valid phone number length (with or without country code)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}
