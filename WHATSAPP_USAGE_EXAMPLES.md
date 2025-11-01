# WhatsApp Integration - Code Examples

## Ejemplos de Uso del Sistema de WhatsApp

### 1. Crear un Grupo de WhatsApp para una Clase

```typescript
import { ClassroomService } from '@/services/classroom/classroom.service';

// En un componente o servicio
async function createGroupForClassroom(classroomId: string) {
  try {
    const whatsappGroup = await ClassroomService.createWhatsappGroup(classroomId);
    console.log('Grupo creado:', whatsappGroup);
    // El grupo ahora está asociado a la clase
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### 2. Sincronizar Participantes del Grupo

```typescript
import { ClassroomService } from '@/services/classroom/classroom.service';

// Después de agregar estudiantes a una clase
async function syncGroup(classroomId: string) {
  try {
    await ClassroomService.syncWhatsappGroup(classroomId);
    console.log('Grupo sincronizado exitosamente');
  } catch (error) {
    console.error('Error al sincronizar:', error);
  }
}
```

### 3. Enviar Mensaje a un Grupo

```typescript
import { ClassroomService } from '@/services/classroom/classroom.service';

async function sendMessageToClass(classroomId: string, message: string) {
  try {
    await ClassroomService.sendWhatsappMessage(classroomId, message);
    console.log('Mensaje enviado');
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
  }
}

// Uso
sendMessageToClass(
  'classroom-123',
  'Recordatorio: Clase mañana a las 6:00 PM'
);
```

### 4. Enviar Mensaje Masivo a Múltiples Grupos

```typescript
import { WhatsappService } from '@/services/whatsapp/whatsapp.service';
import { IWhatsappMessage } from '@/models';

async function sendBulkMessage(groupIds: string[], messageContent: string) {
  try {
    const message: IWhatsappMessage = {
      type: 'text',
      content: messageContent
    };
    
    const results = await WhatsappService.sendBulkMessages(groupIds, message);
    
    console.log('Resultados:', results);
    // results es un array con el status de cada envío
  } catch (error) {
    console.error('Error en envío masivo:', error);
  }
}
```

### 5. Usar Plantillas de Mensajes

```typescript
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';
import { IClassroom } from '@/models';

// Crear anuncio para clase
function createAnnouncement(classroom: IClassroom) {
  const message = WhatsAppUtilsService.createClassroomAnnouncement(
    classroom,
    'La clase de hoy ha sido cancelada debido a condiciones climáticas. ' +
    'Nos vemos la próxima semana.',
    true // incluir header
  );
  
  return message;
  // Output:
  // 📢 *Materia de la clase*
  // Nombre de la clase
  //
  // La clase de hoy ha sido cancelada...
  //
  // _Enviado desde el sistema de gestión de clases_
}

// Crear recordatorio de asistencia
function createReminder(classroom: IClassroom) {
  const classDate = new Date('2024-11-15T18:00:00');
  const location = 'Salón 301, Edificio Principal';
  
  const reminder = WhatsAppUtilsService.createAttendanceReminder(
    classroom,
    classDate,
    location
  );
  
  return reminder;
}

// Actualización de módulo
function createModuleUpdate(classroom: IClassroom) {
  const message = WhatsAppUtilsService.createModuleUpdateMessage(
    classroom,
    5, // número de módulo
    'Programación Avanzada',
    'Material disponible en el portal. Por favor revisen los videos antes de la clase.'
  );
  
  return message;
}
```

### 6. Validar Conexión antes de Operar

```typescript
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';

async function safeWhatsAppOperation() {
  // Verificar si WhatsApp está conectado
  const isConnected = await WhatsAppUtilsService.ensureConnected();
  
  if (!isConnected) {
    console.error('WhatsApp no está conectado');
    return;
  }
  
  // Proceder con la operación
  console.log('WhatsApp está conectado, procediendo...');
}
```

### 7. Obtener Estado de Conexión con Mensaje Amigable

```typescript
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';

async function displayConnectionStatus() {
  const status = await WhatsAppUtilsService.getConnectionStatusMessage();
  
  console.log('Conectado:', status.connected);
  console.log('Mensaje:', status.message);
  console.log('Color:', status.color); // 'success', 'warning', 'danger'
  
  // En un componente React:
  // <Alert color={status.color}>{status.message}</Alert>
}
```

### 8. Formatear Números de Teléfono

```typescript
import { WhatsappService } from '@/services/whatsapp/whatsapp.service';

// Formatear un solo número
const formattedNumber = WhatsappService.formatPhoneNumber('(809) 555-1234');
console.log(formattedNumber); // '18095551234'

// Validar número
const isValid = WhatsappService.isValidPhoneNumber('809-555-1234');
console.log(isValid); // true

// Formatear múltiples números
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';

const phones = ['(809) 555-1234', '829-555-5678', '849.555.9012'];
const formatted = WhatsAppUtilsService.formatPhoneNumbers(phones);
console.log(formatted); // ['18095551234', '18295555678', '18495559012']
```

### 9. Extraer Números de Teléfono de Texto

```typescript
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';

const text = `
  Contactos:
  Juan Pérez: (809) 555-1234
  María García: 829-555-5678
  Pedro López: 849.555.9012
`;

const phones = WhatsAppUtilsService.extractPhoneNumbers(text);
console.log(phones);
// ['18095551234', '18295555678', '18495559012']
```

### 10. Calcular Tiempo de Envío Masivo

```typescript
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';

const messageCount = 25;
const delaySeconds = 5;

const estimate = WhatsAppUtilsService.calculateBulkSendingTime(
  messageCount,
  delaySeconds
);

console.log(`Total segundos: ${estimate.seconds}`);
console.log(`Minutos: ${estimate.minutes}`);
console.log(`Formato legible: ${estimate.formatted}`);
// Output: "2 minutos y 5 segundos"
```

### 11. Validar Tamaño de Grupo

```typescript
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';

const validation = WhatsAppUtilsService.validateGroupSize(150);

if (validation.valid) {
  console.log('Tamaño de grupo válido');
} else {
  console.error('Error:', validation.error);
}
```

### 12. Validar Mensaje antes de Enviar

```typescript
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';
import { IWhatsappMessage } from '@/models';

const message: IWhatsappMessage = {
  type: 'text',
  content: 'Este es mi mensaje'
};

const validation = WhatsAppUtilsService.validateMessage(message);

if (validation.valid) {
  // Enviar mensaje
  console.log('Mensaje válido, enviando...');
} else {
  console.error('Mensaje inválido:', validation.error);
}
```

### 13. Envío por Lotes con Seguimiento de Progreso

```typescript
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';
import { IWhatsappMessage } from '@/models';

async function sendWithProgress(recipients: string[], messageContent: string) {
  const message: IWhatsappMessage = {
    type: 'text',
    content: messageContent
  };
  
  const results = await WhatsAppUtilsService.sendBatchMessages(
    recipients,
    message,
    5, // delay
    (sent, total) => {
      // Callback de progreso
      console.log(`Enviados: ${sent}/${total}`);
      // Actualizar UI aquí
    }
  );
  
  console.log(`Exitosos: ${results.success}`);
  console.log(`Fallidos: ${results.failed}`);
  if (results.errors.length > 0) {
    console.log('Errores:', results.errors);
  }
}
```

### 14. Sugerir Nombre y Descripción de Grupo

```typescript
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';
import { IClassroom } from '@/models';

function suggestGroupInfo(classroom: IClassroom) {
  const name = WhatsAppUtilsService.suggestGroupName(classroom);
  const description = WhatsAppUtilsService.suggestGroupDescription(classroom);
  
  console.log('Nombre sugerido:', name);
  // Output: "Matemáticas Avanzadas - Clase 2024 (2024)"
  
  console.log('Descripción sugerida:', description);
  // Output: "Grupo oficial de la clase Matemáticas Avanzadas..."
  
  return { name, description };
}
```

### 15. Uso en un Componente React Completo

```typescript
import React, { useState } from 'react';
import { Button, Alert, Spinner } from 'reactstrap';
import { ClassroomService } from '@/services/classroom/classroom.service';
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';
import { toast } from 'react-toastify';

const SendMessageComponent: React.FC<{ classroomId: string }> = ({ classroomId }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  
  // Verificar conexión al montar
  React.useEffect(() => {
    checkConnection();
  }, []);
  
  const checkConnection = async () => {
    const status = await WhatsAppUtilsService.getConnectionStatusMessage();
    setConnectionStatus(status);
  };
  
  const handleSend = async () => {
    // Validar conexión
    if (!connectionStatus?.connected) {
      toast.error('WhatsApp no está conectado');
      return;
    }
    
    // Validar mensaje
    if (!message.trim()) {
      toast.error('Por favor ingrese un mensaje');
      return;
    }
    
    try {
      setSending(true);
      await ClassroomService.sendWhatsappMessage(classroomId, message);
      toast.success('Mensaje enviado exitosamente');
      setMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div>
      {connectionStatus && (
        <Alert color={connectionStatus.color} className="mb-3">
          {connectionStatus.message}
        </Alert>
      )}
      
      <textarea
        className="form-control mb-3"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe tu mensaje..."
        disabled={!connectionStatus?.connected}
      />
      
      <Button
        color="success"
        onClick={handleSend}
        disabled={sending || !connectionStatus?.connected || !message.trim()}
      >
        {sending ? (
          <>
            <Spinner size="sm" className="me-2" />
            Enviando...
          </>
        ) : (
          'Enviar Mensaje'
        )}
      </Button>
    </div>
  );
};

export default SendMessageComponent;
```

### 16. Hook Personalizado para WhatsApp

```typescript
import { useState, useEffect } from 'react';
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';

export function useWhatsAppConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  
  useEffect(() => {
    checkConnection();
    // Verificar cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const checkConnection = async () => {
    setLoading(true);
    const connected = await WhatsAppUtilsService.ensureConnected();
    const statusMsg = await WhatsAppUtilsService.getConnectionStatusMessage();
    setIsConnected(connected);
    setStatus(statusMsg);
    setLoading(false);
  };
  
  return {
    isConnected,
    loading,
    status,
    refresh: checkConnection
  };
}

// Uso del hook
function MyComponent() {
  const { isConnected, loading, status, refresh } = useWhatsAppConnection();
  
  if (loading) return <div>Verificando conexión...</div>;
  
  return (
    <div>
      <Alert color={status.color}>{status.message}</Alert>
      {isConnected && <p>Puedes enviar mensajes</p>}
      <Button onClick={refresh}>Actualizar Estado</Button>
    </div>
  );
}
```

## Integración con el Flujo de la Aplicación

### Flujo Completo: Crear Clase → Crear Grupo → Enviar Mensaje

```typescript
import { ClassroomService } from '@/services/classroom/classroom.service';
import { ProgramService } from '@/services/program/program.service';
import { WhatsAppUtilsService } from '@/services/whatsapp/whatsapp-utils.service';

async function completeWorkflow() {
  try {
    // 1. Verificar conexión WhatsApp
    const isConnected = await WhatsAppUtilsService.ensureConnected();
    if (!isConnected) {
      throw new Error('Por favor conecte WhatsApp primero');
    }
    
    // 2. Crear clase
    const classroomId = await ClassroomService.createClassroom({
      programId: 'program-123',
      name: 'Clase A',
      subject: 'Matemáticas',
      teacherId: 'teacher-123',
      studentIds: ['student-1', 'student-2', 'student-3'],
      modules: [],
      isActive: true,
      // ... otros campos
    });
    
    console.log('Clase creada:', classroomId);
    
    // 3. Crear grupo de WhatsApp para la clase
    const whatsappGroup = await ClassroomService.createWhatsappGroup(classroomId);
    console.log('Grupo creado:', whatsappGroup.name);
    
    // 4. Enviar mensaje de bienvenida
    const classroom = await ClassroomService.getClassroomById(classroomId);
    if (classroom) {
      const welcomeMessage = WhatsAppUtilsService.createClassroomAnnouncement(
        classroom,
        '¡Bienvenidos a la clase! Este es nuestro grupo oficial de WhatsApp. ' +
        'Aquí recibirán todas las actualizaciones importantes.'
      );
      
      await ClassroomService.sendWhatsappMessage(classroomId, welcomeMessage);
      console.log('Mensaje de bienvenida enviado');
    }
    
    return classroomId;
  } catch (error) {
    console.error('Error en flujo completo:', error);
    throw error;
  }
}
```

---

## Tips y Mejores Prácticas

### 1. Siempre Verificar Conexión
```typescript
const isConnected = await WhatsAppUtilsService.ensureConnected();
if (!isConnected) {
  // Mostrar error y redirigir a /admin/whatsapp
  return;
}
```

### 2. Usar Try-Catch
```typescript
try {
  await sendOperation();
} catch (error) {
  toast.error('Error específico');
  console.error(error);
}
```

### 3. Proporcionar Feedback al Usuario
```typescript
setSending(true);
try {
  await operation();
  toast.success('Operación exitosa');
} finally {
  setSending(false);
}
```

### 4. Validar Antes de Enviar
```typescript
const validation = WhatsAppUtilsService.validateMessage(message);
if (!validation.valid) {
  toast.error(validation.error);
  return;
}
```

### 5. Usar Delays Apropiados
```typescript
// Mínimo 5 segundos para evitar rate limiting
const SAFE_DELAY = 5;
await WhatsappService.sendBulkMessages(groups, message);
```

---

**Última Actualización:** Noviembre 2025

