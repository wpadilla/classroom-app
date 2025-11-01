# Sistema de Reinicio de Clases

## 📋 Resumen General

Sistema completo para reiniciar clases finalizadas permitiendo reutilizar la misma clase para nuevos grupos de estudiantes mientras se preserva el historial detallado de cada ejecución.

---

## 🎯 Diferencia entre Operaciones

### ❌ Revertir Finalización
- **Propósito**: Corregir errores en la finalización actual
- **Efecto**: Restaura estudiantes y profesor al estado anterior
- **Uso**: Temporal, para hacer correcciones
- **Resultado**: Los mismos estudiantes vuelven a la clase

### ✅ Reiniciar Clase  
- **Propósito**: Comenzar nuevo ciclo con nuevos estudiantes
- **Efecto**: Guarda historial completo y limpia la clase
- **Uso**: Permanente, para nuevo grupo
- **Resultado**: Clase vacía lista para nuevos estudiantes

---

## 🏗️ Arquitectura

### Modelo de Datos: `IClassroomRun`

```typescript
interface IClassroomRun {
  // Identificación
  id: string;
  classroomId: string;
  runNumber: number;            // 1, 2, 3, etc.
  
  // Información de la clase
  classroomName: string;
  classroomSubject: string;
  programId: string;
  programName: string;
  
  // Profesor
  teacherId: string;
  teacherName: string;
  
  // Configuración (snapshot en ese momento)
  evaluationCriteria: { ... };
  schedule: { ... };
  room: string;
  materialPrice: number;
  
  // Módulos
  totalModules: number;
  completedModules: number;
  moduleNames: string[];
  
  // Estudiantes (registro completo)
  students: IStudentRunRecord[];
  totalStudents: number;
  
  // Estadísticas calculadas
  statistics: {
    averageGrade: number;
    passRate: number;
    attendanceRate: number;
    highestGrade: number;
    lowestGrade: number;
    distribution: {
      excellent: number;  // 90-100
      good: number;       // 80-89
      regular: number;    // 70-79
      poor: number;       // <70
    };
  };
  
  // Fechas
  startDate: Date;
  endDate: Date;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  notes?: string;
}
```

### Registro de Estudiante: `IStudentRunRecord`

```typescript
interface IStudentRunRecord {
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  
  // Resultados
  finalGrade?: number;
  status: 'completed' | 'dropped' | 'failed';
  attendanceRate: number;
  participationPoints: number;
  
  // Fechas
  enrollmentDate: Date;
  completionDate: Date;
}
```

---

## 🔄 Flujo de Reinicio

### Proceso Completo:

```
1. Clase Finalizada
   ├─ 15 estudiantes con calificaciones
   ├─ 8/8 módulos completados
   ├─ Profesor: Juan Pérez
   └─ Estado: Inactiva
   
2. Click "Reiniciar Clase" (botón verde ↻)
   ↓
3. Modal se abre
   ├─ Valida que esté finalizada
   ├─ Muestra historial de ejecuciones anteriores
   ├─ Muestra datos de ejecución actual
   └─ Permite agregar notas
   
4. Click "Reiniciar Clase"
   ↓
5. Sistema ejecuta:
   ✓ PASO 1: Crea registro completo (ClassroomRun #2)
     ├─ Guarda info de 15 estudiantes
     ├─ Guarda todas las calificaciones
     ├─ Guarda estadísticas
     ├─ Guarda configuración
     └─ Guarda en collection: classroom_runs
     
   ✓ PASO 2: Resetea la clase
     ├─ studentIds: [] (vacío)
     ├─ isActive: true
     ├─ currentModule: Semana 1
     ├─ modules: todos marcados como no completados
     ├─ startDate: nueva fecha
     ├─ endDate: eliminado
     └─ teacherId: MANTIENE el mismo
     
   ✓ PASO 3: Confirmación
     └─ "Clase reiniciada. Historial guardado como Ejecución #2"
   
6. Clase lista para nuevos estudiantes
   ├─ 0 estudiantes
   ├─ 0/8 módulos completados
   ├─ Profesor: Juan Pérez (mismo)
   └─ Estado: Activa
```

---

## 🎨 Interfaz de Usuario

### Vista en ProgramManagement:

```
┌──────────────────────────────────────────────────────────┐
│ Teología Básica - Grupo A                                │
│ Profesor: Juan Pérez • 0 estudiantes                     │
│                                                           │
│ [🏁 Finalizada] [↻ Reiniciar] [Switch] [✏️ Editar]      │
└──────────────────────────────────────────────────────────┘
```

**Botones visibles según estado:**

| Estado | Finalizada | Reiniciar | Switch | Editar |
|--------|-----------|-----------|--------|--------|
| Activa | ❌ | ❌ | ✅ | ✅ |
| Finalizada | ✅ | ✅ | ✅ | ✅ |
| Reiniciada | ❌ | ❌ | ✅ | ✅ |

### Modal de Reinicio:

```
┌──────────────────────────────────────────────────┐
│ ↻ Reiniciar Clase                                │
├──────────────────────────────────────────────────┤
│ Teología Básica                                  │
│ Grupo A                                          │
│ [🏁 Clase Finalizada]                            │
│                                                  │
│ Historial de Ejecuciones Anteriores             │
│ ┌────────────────────────────────────────┐      │
│ │ Ejec. │ Estudiantes │ Promedio │ Fecha │      │
│ │  #1   │     15      │  82.5%   │ 01/10 │      │
│ └────────────────────────────────────────┘      │
│                                                  │
│ Datos de la Ejecución Actual:                   │
│ Estudiantes Actuales: 15                        │
│ Módulos Completados: 8/8                        │
│ Fecha Inicio: 01/09/2024                        │
│ Fecha Finalización: 15/10/2024                  │
│                                                  │
│ ℹ️ ¿Qué sucederá al reiniciar?                  │
│ • Se guardará registro completo (Ejecución #2)  │
│ • Se vaciarán todos los estudiantes             │
│ • Se resetearán todos los módulos               │
│ • Se activará la clase                          │
│ • Se mantendrá el mismo profesor                │
│ • Se mantendrán criterios de evaluación         │
│                                                  │
│ Notas (Opcional):                               │
│ [Grupo de primavera 2025________________]       │
│                                                  │
│ [Cancelar]              [Reiniciar Clase]       │
└──────────────────────────────────────────────────┘
```

---

## 📊 Datos Preservados en el Historial

### Información de la Clase:
- ✅ Nombre y materia
- ✅ Programa asociado
- ✅ Profesor asignado (con nombre)
- ✅ Criterios de evaluación (snapshot completo)
- ✅ Horario (día, hora, duración)
- ✅ Salón/ubicación
- ✅ Precio del material
- ✅ Total y completados de módulos
- ✅ Nombres de todos los módulos

### Información de cada Estudiante:
- ✅ ID y nombre completo
- ✅ Teléfono y email
- ✅ Calificación final
- ✅ Status (aprobado/reprobado)
- ✅ Tasa de asistencia
- ✅ Puntos de participación
- ✅ Fechas de inscripción y completación

### Estadísticas Calculadas:
- ✅ Promedio general de la clase
- ✅ Tasa de aprobación (%)
- ✅ Tasa de asistencia promedio
- ✅ Total de puntos de participación
- ✅ Calificación más alta
- ✅ Calificación más baja
- ✅ Distribución de calificaciones

---

## 🔄 Estados de la Clase

### Ciclo de Vida Completo:

```
CREACIÓN
   ↓
[ACTIVA] - Estudiantes inscritos, clases en progreso
   ↓
FINALIZACIÓN
   ↓
[FINALIZADA] - Estudiantes en historial, clase inactiva
   ↓
   ├─→ REVERTIR → [ACTIVA] (mismos estudiantes)
   │
   └─→ REINICIAR → [ACTIVA] (nuevos estudiantes)
                      ↓
                   Guarda Run #N
                      ↓
                   [ACTIVA] - Lista para nuevo grupo
```

### Ejemplo Real:

```
Ejecución #1 (2024-I)
├─ Estudiantes: 15
├─ Promedio: 82.5%
├─ Estado: Finalizada el 15/10/2024
└─ Guardada en historial

↓ REINICIO

Ejecución #2 (2024-II) - EN PROGRESO
├─ Estudiantes: 0 (esperando inscripciones)
├─ Promedio: N/A
├─ Estado: Activa desde 01/11/2024
└─ Mismo profesor, mismos criterios
```

---

## 💾 Persistencia en Firebase

### Colección: `classroom_runs`

```typescript
{
  id: "run_xyz123",
  classroomId: "class_abc456",
  runNumber: 2,
  
  classroomName: "Grupo A",
  classroomSubject: "Teología Básica",
  programName: "Programa Básico",
  
  teacherId: "teacher_123",
  teacherName: "Juan Pérez",
  
  students: [
    {
      studentId: "student_1",
      studentName: "María García",
      studentPhone: "8091234567",
      finalGrade: 95.5,
      status: "completed",
      attendanceRate: 100,
      participationPoints: 8,
      // ...
    },
    // ... 14 estudiantes más
  ],
  
  statistics: {
    averageGrade: 82.5,
    passRate: 93.3,  // 14/15 aprobaron
    attendanceRate: 87.5,
    highestGrade: 98.0,
    lowestGrade: 65.0,
    distribution: {
      excellent: 5,  // 90-100
      good: 6,       // 80-89
      regular: 3,    // 70-79
      poor: 1        // <70
    }
  },
  
  startDate: "2024-09-01",
  endDate: "2024-10-15",
  createdAt: "2024-10-15",
  createdBy: "admin_id",
  notes: "Grupo de otoño 2024"
}
```

### Colección: `classrooms` (Después del reinicio)

```typescript
{
  id: "class_abc456",
  // ... info básica se mantiene
  teacherId: "teacher_123",        // ✅ MANTIENE
  evaluationCriteria: { ... },     // ✅ MANTIENE
  schedule: { ... },               // ✅ MANTIENE
  room: "Aula 101",                // ✅ MANTIENE
  
  studentIds: [],                  // ✅ VACIA
  isActive: true,                  // ✅ ACTIVA
  startDate: "2024-11-01",         // ✅ NUEVA FECHA
  endDate: undefined,              // ✅ ELIMINADA
  currentModule: { weekNumber: 1 },// ✅ RESETEA A SEMANA 1
  modules: [                       // ✅ TODOS PENDIENTES
    { weekNumber: 1, isCompleted: false },
    { weekNumber: 2, isCompleted: false },
    // ...
  ]
}
```

---

## 🎯 Casos de Uso

### Caso 1: Clase Semestral Regular

```
Semestre I (Enero-Mayo 2024)
├─ 20 estudiantes inscritos
├─ Clase finalizada en Mayo
├─ Promedio: 85%
└─ Guardado como Ejecución #1

↓ REINICIO (Junio 2024)

Semestre II (Junio-Octubre 2024)
├─ Clase reiniciada
├─ Inscribir nuevos 18 estudiantes
├─ Mismo profesor, mismo contenido
└─ Nueva ejecución independiente

↓ FINALIZAR (Octubre 2024)

Guardado como Ejecución #2
```

### Caso 2: Clase de Verano

```
Ejecución #1 (Grupo Regular)
└─ 25 estudiantes, promedio 78%

↓ REINICIO

Ejecución #2 (Grupo Intensivo Verano)
├─ Notas: "Grupo de verano - horario intensivo"
├─ 12 estudiantes
└─ Mismo profesor con nuevo grupo pequeño
```

### Caso 3: Múltiples Reinicios

```
Ejecución #1 → 15 estudiantes → Prom: 82% → Finalizada
↓ REINICIO

Ejecución #2 → 18 estudiantes → Prom: 88% → Finalizada
↓ REINICIO

Ejecución #3 → 20 estudiantes → En progreso...
```

---

## 📈 Estadísticas y Reportes

### Vista del Historial:

```
┌────────────────────────────────────────────────────────┐
│ Historial: Teología Básica                            │
├────────────────────────────────────────────────────────┤
│ Ejecución │ Estudiantes │ Promedio │ Aprobados │ Fecha│
│    #3     │     20      │  85.5%   │   18/20   │ Actual│
│    #2     │     18      │  88.0%   │   17/18   │ 10/24│
│    #1     │     15      │  82.5%   │   14/15   │ 05/24│
├────────────────────────────────────────────────────────┤
│ TOTALES                                                │
│ Total Ejecuciones: 3                                   │
│ Estudiantes Totales Enseñados: 53                     │
│ Promedio General Histórico: 85.3%                     │
│ Tasa de Aprobación Promedio: 92.5%                    │
│                                                        │
│ Mejor Ejecución: #2 (88.0%)                           │
│ Peor Ejecución: #1 (82.5%)                            │
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Servicios Implementados

### ClassroomRestartService

#### Métodos Principales:

```typescript
// Validar si puede reiniciarse
validateRestart(classroomId) 
  → { isValid, errors, warnings }

// Reiniciar clase
restartClassroom(classroomId, userId, notes?)
  → IRestartResult

// Obtener historial de ejecuciones
getClassroomRuns(classroomId)
  → IClassroomRun[]

// Estadísticas agregadas
getAggregatedStats(classroomId)
  → { totalRuns, totalStudents, averageGrade, ... }
```

#### Métodos de Consulta:

```typescript
// Por profesor
getTeacherRuns(teacherId)

// Por programa
getProgramRuns(programId)

// Por ID específico
getRunById(runId)
```

---

## 🛡️ Validaciones

### Pre-Reinicio:

| Validación | Tipo | Acción |
|------------|------|--------|
| Clase existe | Error | Bloquea |
| Clase finalizada | Error | Bloquea |
| Tiene endDate | Error | Bloquea |
| Profesor existe | Warning | Permite |
| Profesor activo | Warning | Permite |

### Durante Reinicio:

- ✅ Verifica permisos (solo admin)
- ✅ Crea backup completo
- ✅ Valida integridad de datos
- ✅ Operaciones atómicas

---

## 💡 Características Clave

### 1. **Historial Completo** 📚

Cada ejecución guarda:
- Todos los datos de configuración
- Todos los estudiantes con sus resultados
- Todas las estadísticas calculadas
- Snapshots en el tiempo

### 2. **Reutilización Inteligente** ♻️

Reinicia:
- ✅ Lista de estudiantes
- ✅ Módulos completados
- ✅ Fechas

Mantiene:
- ✅ Profesor
- ✅ Criterios de evaluación
- ✅ Horario
- ✅ Configuración general

### 3. **Reportes Históricos** 📊

Permite analizar:
- Evolución de promedios entre grupos
- Comparación de tasas de aprobación
- Identificación de mejores prácticas
- Tendencias a lo largo del tiempo

### 4. **Auditoría Completa** 🔍

Registra:
- Quién reinició la clase
- Cuándo se reinició
- Notas contextuales
- Estado completo en ese momento

---

## 🚀 Ventajas del Sistema

### Para Administradores:
✅ **Reutilizar clases** eficientemente  
✅ **Historial detallado** de todas las ejecuciones  
✅ **Reportes completos** por programa/profesor  
✅ **Comparativas** entre diferentes grupos  
✅ **Auditoría** de rendimiento histórico  

### Para Profesores:
✅ **Mismo setup** para cada nuevo grupo  
✅ **No recrear** la clase desde cero  
✅ **Historial** de grupos anteriores  
✅ **Comparar** rendimiento entre grupos  
✅ **Mejorar** basado en resultados previos  

### Para el Sistema:
✅ **Data analytics** robustos  
✅ **Machine learning** potencial  
✅ **Métricas** de calidad educativa  
✅ **Trending** y predicciones  

---

## 📱 Integración UI

### En ProgramManagement:

```typescript
// Botón solo visible si está finalizada
{!classroom.isActive && classroom.endDate && (
  <Button
    color="success"
    size="sm"
    outline
    onClick={() => handleOpenRestartModal(classroom)}
    title="Reiniciar clase para nuevo grupo"
  >
    <i className="bi bi-arrow-clockwise"></i>
  </Button>
)}
```

### Estado del Botón:

```
Clase Activa:          [No visible]
Clase Finalizada:      [🟢 ↻ Reiniciar]
Durante Reinicio:      [Spinner...]
Después de Reinicio:   [No visible] (ya está activa)
```

---

## 🎓 Escenario Completo

### Año Académico 2024:

```
📅 ENERO-MAYO (Semestre I)
─────────────────────────
Teología Básica - Grupo A
Profesor: Juan Pérez
Estudiantes: 20

Semana 1-8: Clases normales
Evaluaciones finales
Promedio: 85.5%
Aprobados: 19/20

✅ FINALIZADO → Guardado como Ejecución #1

📅 JUNIO (Verano)
─────────────────
↻ REINICIO
Teología Básica - Grupo A
Profesor: Juan Pérez (mismo)
Estudiantes: 0 → Inscribir nuevos

📅 JUNIO-AGOSTO (Intensivo)
───────────────────────────
Estudiantes: 12 (grupo pequeño)
Notas: "Grupo intensivo de verano"

Semana 1-8: Clases aceleradas
Evaluaciones finales
Promedio: 88.0%
Aprobados: 12/12

✅ FINALIZADO → Guardado como Ejecución #2

📅 SEPTIEMBRE-DICIEMBRE (Semestre II)
─────────────────────────────────────
↻ REINICIO
Teología Básica - Grupo A
Profesor: Juan Pérez (mismo)
Estudiantes: 0 → Inscribir nuevos

Actualmente en progreso...
Estudiantes: 25
Ejecución #3 (activa)
```

---

## 🗂️ Queries Útiles

### Obtener todas las ejecuciones de una clase:

```typescript
const runs = await ClassroomService.getClassroomRuns(classroomId);
// Ordenadas por runNumber descendente
```

### Obtener ejecuciones de un profesor:

```typescript
const runs = await ClassroomRestartService.getTeacherRuns(teacherId);
// Todas las clases que ha impartido
```

### Obtener ejecuciones de un programa:

```typescript
const runs = await ClassroomRestartService.getProgramRuns(programId);
// Todas las ejecuciones del programa
```

### Estadísticas agregadas:

```typescript
const stats = await ClassroomService.getAggregatedRunStats(classroomId);
// {
//   totalRuns: 3,
//   totalStudentsTaught: 53,
//   averageGradeAcrossRuns: 85.3,
//   averagePassRate: 92.5,
//   bestRun: { runNumber: 2, averageGrade: 88.0 },
//   worstRun: { runNumber: 1, averageGrade: 82.5 }
// }
```

---

## 🔒 Seguridad y Permisos

### Quién Puede Reiniciar:
- ✅ **Administradores**: Cualquier clase
- ❌ **Profesores**: No pueden reiniciar (solo admin)
- ❌ **Estudiantes**: Sin acceso

### Validaciones:
- Clase debe estar finalizada (`!isActive && endDate`)
- Usuario debe ser admin
- Clase debe existir

---

## 📊 Diferencias Resumidas

| Aspecto | Revertir | Reiniciar |
|---------|----------|-----------|
| **Estudiantes** | Vuelven a la clase | Se vacían |
| **Historial** | Temporal | Permanente |
| **Propósito** | Correcciones | Nuevo grupo |
| **Profesor** | Restaurado | Mantenido |
| **Módulos** | Restaurados | Reseteados |
| **Fechas** | Restauradas | Nuevas |
| **Registro** | Snapshot | ClassroomRun |
| **Reversible** | Sí (re-finalizar) | No |

---

## 🎉 Beneficios del Sistema

### Eficiencia:
- ✅ No recrear clases manualmente
- ✅ Configuración preserved
- ✅ Un click para reiniciar

### Trazabilidad:
- ✅ Historial completo de todas las ejecuciones
- ✅ Comparativas entre grupos
- ✅ Auditoría total

### Reportes:
- ✅ Estadísticas por ejecución
- ✅ Tendencias históricas
- ✅ Análisis comparativo

### Escalabilidad:
- ✅ Soporta infinitas ejecuciones
- ✅ Queries eficientes
- ✅ Datos estructurados para analytics

---

## 🎊 Resultado Final

Un sistema **enterprise-grade** que permite:

1. ✅ **Reutilizar clases** para múltiples grupos
2. ✅ **Preservar historial completo** de cada ejecución
3. ✅ **Analizar tendencias** a lo largo del tiempo
4. ✅ **Optimizar procesos** basado en datos históricos
5. ✅ **Reportes detallados** para cada grupo
6. ✅ **Comparar rendimiento** entre diferentes ejecuciones

**¡El sistema está completo, probado y listo para usar!** 🚀

