# Sistema de Operaciones Offline para Gestión de Estudiantes

## Descripción General

Se ha implementado un sistema completo de soporte offline que permite a los profesores y administradores agregar, crear y remover estudiantes de sus clases incluso cuando no tienen conexión a internet. Las operaciones se guardan localmente y se sincronizan automáticamente cuando la conexión se restablece.

## Características Principales

### 1. **Agregar Estudiantes Existentes (Offline)**
- Los profesores pueden seleccionar estudiantes existentes y agregarlos a su clase
- En modo offline, la operación se guarda localmente
- Los estudiantes se muestran inmediatamente en la lista de la clase
- Se sincroniza automáticamente con Firebase al recuperar conexión

### 2. **Crear Nuevos Estudiantes (Offline)**
- Permite crear nuevos estudiantes con sus datos básicos:
  - Nombre
  - Apellido
  - Teléfono
  - Email (opcional)
  - Contraseña
- El estudiante se crea con un ID temporal en modo offline
- Se muestra inmediatamente en la lista de la clase
- Al sincronizar, se crea el estudiante real en Firebase y se actualiza el ID

### 3. **Remover Estudiantes (Offline)**
- Permite remover estudiantes de la clase incluso sin conexión
- La operación se guarda para sincronizar después
- Se actualiza la lista inmediatamente

### 4. **Sincronización Automática**
- Al detectar conexión a internet, se sincronizan automáticamente todas las operaciones pendientes
- Se procesan en orden cronológico para mantener la integridad de datos
- Notificaciones de éxito/error al usuario

### 5. **Indicadores Visuales**
- Badge "Offline" cuando no hay conexión
- Contador de operaciones pendientes
- Alertas informativas sobre el estado de sincronización
- Indicador en el menú lateral con el número de operaciones pendientes

## Arquitectura de Componentes

### Servicios Creados

#### 1. `OfflineStorageService`
**Ubicación:** `/src/services/offline/offline-storage.service.ts`

Maneja el almacenamiento local de operaciones y datos:

```typescript
// Guardar una operación offline
await OfflineStorageService.saveOperation({
  type: 'createStudent',
  data: { studentData, classroomId }
});

// Obtener operaciones pendientes
const pending = OfflineStorageService.getPendingOperations();

// Marcar operación como sincronizada
OfflineStorageService.markOperationSynced(operationId);
```

**Métodos principales:**
- `saveOperation()` - Guarda una operación pendiente
- `getOperations()` - Obtiene todas las operaciones
- `getPendingOperations()` - Obtiene solo las pendientes
- `markOperationSynced()` - Marca una operación como sincronizada
- `saveStudentLocally()` - Guarda un estudiante en localStorage
- `saveClassroomLocally()` - Guarda una clase en localStorage
- `updateClassroomStudentsLocally()` - Actualiza lista de estudiantes local

#### 2. `SyncService`
**Ubicación:** `/src/services/offline/sync.service.ts`

Maneja la sincronización de operaciones pendientes:

```typescript
// Sincronizar todas las operaciones pendientes
const result = await SyncService.syncPendingOperations();
// { success: 5, failed: 0 }

// Verificar si hay operaciones pendientes
const hasPending = SyncService.hasPendingOperations();
```

**Métodos principales:**
- `syncPendingOperations()` - Sincroniza todas las operaciones pendientes
- `hasPendingOperations()` - Verifica si hay operaciones pendientes
- `getPendingCount()` - Obtiene el número de operaciones pendientes

### Contexto Actualizado

#### `OfflineContext`
**Ubicación:** `/src/contexts/OfflineContext.tsx`

Provee el estado offline y funciones de sincronización a toda la aplicación:

```typescript
const { isOffline, pendingOperations, syncPending } = useOffline();
```

**Propiedades:**
- `isOffline: boolean` - Indica si hay conexión a internet
- `pendingOperations: number` - Número de operaciones pendientes
- `syncPending: () => Promise<void>` - Función para sincronizar manualmente

### Componentes Actualizados

#### 1. `StudentEnrollment`
**Ubicación:** `/src/modules/shared/StudentEnrollment.tsx`

**Cambios implementados:**
- Soporte completo para operaciones offline
- Indicador visual de modo offline
- Alerta de operaciones pendientes
- Manejo de estudiantes creados localmente
- Merge de estudiantes locales y remotos al cargar datos

#### 2. `ClassroomManagement`
**Ubicación:** `/src/modules/shared/ClassroomManagement.tsx`

**Cambios implementados:**
- Badge de estado offline en el título
- Alerta de operaciones pendientes
- Integración con el sistema de sincronización

#### 3. `MobileLayout`
**Ubicación:** `/src/components/layout/MobileLayout.tsx`

**Cambios implementados:**
- Indicador de estado offline en el navbar
- Badge con número de operaciones pendientes
- Botón de sincronización en el menú lateral
- Estado de conexión en el perfil del usuario

### Nuevo Componente

#### `OfflineSyncBadge`
**Ubicación:** `/src/components/common/OfflineSyncBadge.tsx`

Componente reutilizable que muestra:
- Badge con el número de operaciones pendientes
- Botón de sincronización manual (cuando hay conexión)
- Estado de sincronización en progreso

```tsx
<OfflineSyncBadge showButton={true} className="my-3" />
```

## Flujo de Operaciones

### Crear Estudiante Offline

1. **Usuario crea estudiante sin conexión**
   ```
   handleCreateStudent() detecta isOffline === true
   ```

2. **Se genera ID temporal**
   ```typescript
   const tempStudentId = `temp_${Date.now()}_${Math.random()...}`;
   ```

3. **Se guarda operación pendiente**
   ```typescript
   OfflineStorageService.saveOperation({
     type: 'createStudent',
     data: { studentData, classroomId }
   });
   ```

4. **Se guarda estudiante localmente**
   ```typescript
   OfflineStorageService.saveStudentLocally(tempStudent);
   ```

5. **Se actualiza UI inmediatamente**
   - El estudiante aparece en la lista con ID temporal

6. **Al recuperar conexión**
   ```
   OfflineContext detecta 'online' event
   → SyncService.syncPendingOperations()
   → Se crea estudiante real en Firebase
   → Se obtiene ID real de Firebase
   → Se actualiza la clase con el ID real
   ```

### Agregar Estudiante Existente Offline

1. **Usuario selecciona estudiantes existentes**

2. **Se guardan operaciones para cada estudiante**
   ```typescript
   OfflineStorageService.saveOperation({
     type: 'addStudentToClassroom',
     data: { classroomId, studentId }
   });
   ```

3. **Se actualiza lista local de estudiantes de la clase**
   ```typescript
   OfflineStorageService.updateClassroomStudentsLocally(
     classroomId, 
     updatedStudentIds
   );
   ```

4. **UI se actualiza inmediatamente**

5. **Al recuperar conexión**
   ```
   → Se ejecutan las operaciones en Firebase
   → ClassroomService.addStudentToClassroom()
   → Se marcan como sincronizadas
   ```

## Almacenamiento Local

### Estructura de localStorage

```javascript
// Operaciones pendientes
{
  "offline_operations": [
    {
      "id": "offline_1234567890_abc123",
      "type": "createStudent",
      "timestamp": 1234567890000,
      "status": "pending",
      "data": {
        "studentData": { ... },
        "classroomId": "classroom123"
      }
    }
  ],
  
  // Estudiantes locales (incluyendo temporales)
  "offline_students": [
    {
      "id": "temp_1234567890_xyz789",
      "firstName": "Juan",
      "lastName": "Pérez",
      ...
    }
  ],
  
  // Clases locales (con cambios offline)
  "offline_classrooms": [
    {
      "id": "classroom123",
      "studentIds": ["student1", "temp_1234567890_xyz789"],
      ...
    }
  ]
}
```

## Manejo de Errores

### Errores de Sincronización
- Las operaciones que fallan se marcan como 'failed'
- Se muestra notificación de error al usuario
- Las operaciones fallidas se mantienen para reintento manual
- No se eliminan automáticamente para evitar pérdida de datos

### Validación de Datos
- Se valida localmente antes de guardar operación
- Se mantienen las mismas validaciones que en modo online
- Teléfonos únicos, emails válidos, campos requeridos, etc.

## Limitaciones y Consideraciones

### Limitaciones Actuales
1. **Conflictos de Datos:**
   - Si dos usuarios modifican la misma clase offline, el último en sincronizar sobrescribe
   - No hay resolución de conflictos automática

2. **Tamaño de localStorage:**
   - Limitado a ~5-10MB dependiendo del navegador
   - Se recomienda sincronizar frecuentemente

3. **IDs Temporales:**
   - Los IDs temporales pueden causar problemas si se usan en otras operaciones antes de sincronizar
   - Se recomienda sincronizar antes de realizar operaciones dependientes

### Mejores Prácticas

1. **Sincronización Frecuente:**
   - Sincronizar tan pronto como haya conexión
   - No acumular demasiadas operaciones pendientes

2. **Feedback al Usuario:**
   - Siempre mostrar el estado de conexión
   - Indicar claramente qué operaciones están pendientes
   - Confirmar cuando las operaciones se sincronizan exitosamente

3. **Manejo de Errores:**
   - Capturar y loguear errores de sincronización
   - Permitir reintento manual de operaciones fallidas
   - No eliminar datos sin confirmación del usuario

## Testing

### Casos de Prueba Recomendados

1. **Crear estudiante offline y sincronizar**
   - Verificar que se crea con ID temporal
   - Verificar que aparece en la lista
   - Verificar que se sincroniza correctamente
   - Verificar que el ID se actualiza al real

2. **Agregar múltiples estudiantes offline**
   - Verificar que todas las operaciones se guardan
   - Verificar el orden de sincronización
   - Verificar que todas se ejecutan correctamente

3. **Trabajar offline por período extendido**
   - Realizar múltiples operaciones
   - Verificar almacenamiento local
   - Sincronizar y verificar integridad

4. **Perder conexión durante operación**
   - Iniciar operación online
   - Perder conexión a mitad
   - Verificar que se guarda como pendiente

5. **Conflictos de sincronización**
   - Dos usuarios modifican misma clase
   - Verificar comportamiento de último escritor gana

## Uso para Desarrolladores

### Ejemplo: Agregar nueva operación offline

```typescript
// 1. Definir el tipo de operación en OfflineOperation
type OperationType = 'addStudent' | 'removeStudent' | 'newOperation';

// 2. Guardar operación
if (isOffline) {
  await OfflineStorageService.saveOperation({
    type: 'newOperation',
    data: { ...datos }
  });
  
  // Actualizar UI localmente
  updateUILocally(datos);
  
  toast.info('Operación guardada. Se sincronizará cuando haya conexión.');
} else {
  // Operación normal online
  await ServiceAPI.doOperation(datos);
}

// 3. Agregar sincronización en SyncService
private static async syncNewOperation(operation: OfflineOperation): Promise<void> {
  const { datos } = operation.data;
  await ServiceAPI.doOperation(datos);
}

// 4. Agregar al switch en syncOperation()
case 'newOperation':
  await this.syncNewOperation(operation);
  break;
```

## Conclusión

El sistema de operaciones offline proporciona una experiencia fluida para los usuarios que necesitan trabajar sin conexión constante a internet. Todas las operaciones críticas relacionadas con la gestión de estudiantes están soportadas, con sincronización automática y manejo robusto de errores.
