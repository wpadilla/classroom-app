// WhatsApp Utilities Service - Helper functions for WhatsApp operations

import { WhatsappService } from './whatsapp.service';
import { IClassroom, IUser, IWhatsappMessage } from '../../models';

/**
 * Utility class for common WhatsApp operations
 */
export class WhatsAppUtilsService {
  /**
   * Validate if WhatsApp is connected before performing operations
   */
  static async ensureConnected(): Promise<boolean> {
    try {
      const session = await WhatsappService.getSessionStatus();
      return session.status === 'connected' || session.status === 'authenticated';
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error);
      return false;
    }
  }

  /**
   * Format multiple phone numbers for WhatsApp
   */
  static formatPhoneNumbers(phones: string[]): string[] {
    return phones
      .filter(phone => WhatsappService.isValidPhoneNumber(phone))
      .map(phone => WhatsappService.formatPhoneNumber(phone));
  }

  /**
   * Get students from classroom and format their phone numbers
   */
  static getClassroomPhoneNumbers(classroom: IClassroom, students: IUser[]): string[] {
    return students
      .filter(student => student.phone && classroom.studentIds?.includes(student.id))
      .map(student => WhatsappService.formatPhoneNumber(student.phone));
  }

  /**
   * Validate message content
   */
  static validateMessage(message: IWhatsappMessage): { valid: boolean; error?: string } {
    if (message.type === 'text' && !message.content.trim()) {
      return { valid: false, error: 'El mensaje de texto no puede estar vacío' };
    }

    if (message.type === 'image' && !message.media?.url) {
      return { valid: false, error: 'La imagen debe tener una URL' };
    }

    if (message.content.length > 4096) {
      return { valid: false, error: 'El mensaje es demasiado largo (máximo 4096 caracteres)' };
    }

    return { valid: true };
  }

  /**
   * Create a formatted message for classroom announcements
   */
  static createClassroomAnnouncement(
    classroom: IClassroom,
    message: string,
    includeHeader: boolean = true
  ): string {
    if (!includeHeader) {
      return message;
    }

    return `📢 *${classroom.subject}*\n` +
           `${classroom.name}\n\n` +
           `${message}\n\n` +
           `_Enviado desde el sistema de gestión de clases_`;
  }

  /**
   * Create a formatted message for module updates
   */
  static createModuleUpdateMessage(
    classroom: IClassroom,
    moduleNumber: number,
    moduleName: string,
    additionalInfo?: string
  ): string {
    return `📚 *Actualización de Módulo*\n\n` +
           `*Clase:* ${classroom.subject}\n` +
           `*Módulo:* Semana ${moduleNumber} - ${moduleName}\n\n` +
           `${additionalInfo || 'Nueva información disponible'}\n\n` +
           `_Enviado desde el sistema de gestión de clases_`;
  }

  /**
   * Create a formatted message for attendance reminders
   */
  static createAttendanceReminder(
    classroom: IClassroom,
    date: Date,
    location?: string
  ): string {
    const dateStr = date.toLocaleDateString('es-DO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeStr = date.toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `⏰ *Recordatorio de Clase*\n\n` +
           `*Materia:* ${classroom.subject}\n` +
           `*Fecha:* ${dateStr}\n` +
           `*Hora:* ${timeStr}\n` +
           (location ? `*Lugar:* ${location}\n` : '') +
           `\n¡No olvides asistir a tu clase!\n\n` +
           `_Enviado desde el sistema de gestión de clases_`;
  }

  /**
   * Create a formatted message for evaluation results
   */
  static createEvaluationMessage(
    classroom: IClassroom,
    studentName: string,
    grade: number,
    feedback?: string
  ): string {
    return `📊 *Resultado de Evaluación*\n\n` +
           `*Estudiante:* ${studentName}\n` +
           `*Clase:* ${classroom.subject}\n` +
           `*Calificación:* ${grade}/100\n\n` +
           (feedback ? `*Retroalimentación:*\n${feedback}\n\n` : '') +
           `_Enviado desde el sistema de gestión de clases_`;
  }

  /**
   * Batch send messages with delay and error handling
   */
  static async sendBatchMessages(
    recipients: string[] | any[],
    message: IWhatsappMessage,
    delaySeconds: number = 5,
    onProgress?: (sent: number, total: number) => void,
    recipientTitles?: { [recipient: string]: string }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < recipients.length; i++) {
      try {
        const recipient = recipients[i];
        
        // If recipient is an object, pass it as is. If string, add title if available
        const recipientData = typeof recipient === 'string' 
          ? (recipientTitles?.[recipient] ? [{ phone: recipient, title: recipientTitles[recipient] }] : [recipient])
          : [recipient];
        
        const response = await WhatsappService.sendMessage(
          recipientData, 
          message, 
          delaySeconds
        );
        
        if (response.success) {
          results.success++;
        } else {
          results.failed++;
          const identifier = typeof recipient === 'object' ? recipient.phone : recipient;
          results.errors.push(`${identifier}: ${response.error || 'Error desconocido'}`);
        }

        if (onProgress) {
          onProgress(i + 1, recipients.length);
        }

        // Add delay between messages
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }
      } catch (error: any) {
        results.failed++;
        const identifier = typeof recipients[i] === 'object' ? recipients[i].phone : recipients[i];
        results.errors.push(`${identifier}: ${error.message || 'Error desconocido'}`);
      }
    }

    return results;
  }

  /**
   * Get WhatsApp connection status with user-friendly message
   */
  static async getConnectionStatusMessage(): Promise<{
    connected: boolean;
    message: string;
    color: 'success' | 'warning' | 'danger';
  }> {
    try {
      const session = await WhatsappService.getSessionStatus();
      
      switch (session.status) {
        case 'connected':
        case 'authenticated':
          return {
            connected: true,
            message: 'WhatsApp conectado correctamente',
            color: 'success'
          };
        case 'connecting':
        case 'qr':
          return {
            connected: false,
            message: 'Esperando conexión de WhatsApp',
            color: 'warning'
          };
        case 'disconnected':
        default:
          return {
            connected: false,
            message: 'WhatsApp desconectado. Por favor, conecte primero.',
            color: 'danger'
          };
      }
    } catch (error) {
      return {
        connected: false,
        message: 'Error al verificar estado de WhatsApp',
        color: 'danger'
      };
    }
  }

  /**
   * Extract phone numbers from text (useful for imports)
   */
  static extractPhoneNumbers(text: string): string[] {
    // Match phone numbers in various formats
    const phoneRegex = /(\+?1?\s*[-.]?\s*)?(\(?\d{3}\)?)\s*[-.]?\s*(\d{3})\s*[-.]?\s*(\d{4})/g;
    const matches = text.match(phoneRegex) || [];
    
    return matches
      .map(phone => WhatsappService.formatPhoneNumber(phone))
      .filter((phone, index, self) => self.indexOf(phone) === index); // Remove duplicates
  }

  /**
   * Validate group size (WhatsApp has limits)
   */
  static validateGroupSize(participantCount: number): { valid: boolean; error?: string } {
    const MAX_GROUP_SIZE = 256; // WhatsApp group size limit
    
    if (participantCount < 1) {
      return { valid: false, error: 'El grupo debe tener al menos 1 participante' };
    }
    
    if (participantCount > MAX_GROUP_SIZE) {
      return { 
        valid: false, 
        error: `El grupo no puede tener más de ${MAX_GROUP_SIZE} participantes` 
      };
    }
    
    return { valid: true };
  }

  /**
   * Calculate estimated time for sending bulk messages
   */
  static calculateBulkSendingTime(
    messageCount: number,
    delaySeconds: number
  ): {
    seconds: number;
    minutes: number;
    formatted: string;
  } {
    const totalSeconds = messageCount * delaySeconds;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    let formatted = '';
    if (minutes > 0) {
      formatted = `${minutes} minuto${minutes > 1 ? 's' : ''}`;
      if (seconds > 0) {
        formatted += ` y ${seconds} segundo${seconds > 1 ? 's' : ''}`;
      }
    } else {
      formatted = `${seconds} segundo${seconds > 1 ? 's' : ''}`;
    }
    
    return {
      seconds: totalSeconds,
      minutes,
      formatted
    };
  }

  /**
   * Generate group name suggestion based on classroom
   */
  static suggestGroupName(classroom: IClassroom): string {
    const year = new Date().getFullYear();
    return `${classroom.subject} - ${classroom.name} (${year})`;
  }

  /**
   * Generate group description suggestion
   */
  static suggestGroupDescription(classroom: IClassroom): string {
    return `Grupo oficial de la clase ${classroom.subject}. ` +
           `Profesor: [Nombre del profesor]. ` +
           `Inicio: ${classroom.startDate ? new Date(classroom.startDate).toLocaleDateString('es-DO') : 'Por definir'}`;
  }
}

