# API de Jornadas Personalizadas y Gestión de Partidos

## 📋 **Introducción**

Esta documentación describe los endpoints para gestionar jornadas personalizadas en el sistema de ligas de voleibol, permitiendo que los administradores creen fechas especiales, manejen descansos de equipos y registren resultados de partidos.

## 🔧 **Conceptos Clave**

### **Jornada vs Jornada Personalizada**
- **Jornada normal**: Generada automáticamente por el sistema round-robin
- **Jornada personalizada**: Creada manualmente por el administrador con partidos específicos

### **Estados de Jornada**
- `PROGRAMADA`: Creada pero no iniciada
- `EN_CURSO`: Al menos un partido ha comenzado
- `COMPLETADA`: Todos los partidos finalizados
- `CANCELADA`: Jornada cancelada

### **Estados de Partido**
- `PROGRAMADO`: Partido creado, esperando a jugarse
- `EN_CURSO`: Partido iniciado
- `FINALIZADO`: Partido completado con resultado
- `CANCELADO`: Partido cancelado
- `SUSPENDIDO`: Partido pausado temporalmente

---

## 🏐 **ENDPOINTS PRINCIPALES**

### 1. **Crear Jornada Personalizada**

**POST** `/api/partido/jornada-personalizada`

**Permisos**: ADMINISTRADOR, ADMIN_LIGA

**Descripción**: Crea una jornada personalizada con partidos específicos. Útil para fechas de recuperación, descansos de equipos, o reorganización del fixture.

**Body**:
```json
{
  "nombre": "Jornada de Recuperación - Fecha 15",
  "descripcion": "Partidos aplazados por lluvia del 10 de agosto",
  "ligaId": 5,
  "fechaProgramada": "2025-08-25",
  "horaProgramada": "19:00",
  "partidos": [
    {
      "equipoLocalId": 12,
      "equipoVisitanteId": 15,
      "vuelta": 1,
      "fechaHora": "2025-08-25T19:00:00"
    },
    {
      "equipoLocalId": 8,
      "equipoVisitanteId": 22,
      "vuelta": 1,
      "fechaHora": "2025-08-25T20:30:00"
    }
  ]
}
```

**Respuesta Exitosa**:
```json
{
  "message": "Jornada personalizada creada exitosamente",
  "jornada": {
    "id": 45,
    "numero": 16,
    "nombre": "Jornada de Recuperación - Fecha 15",
    "descripcion": "Partidos aplazados por lluvia del 10 de agosto",
    "tipo": "PERSONALIZADA",
    "status": "PROGRAMADA",
    "fechaProgramada": "2025-08-25",
    "horaProgramada": "19:00",
    "partidosCompletados": 0,
    "partidosTotales": 2,
    "liga": {
      "id": 5,
      "nombre": "Liga Metropolitana 2025"
    },
    "partidos": [
      {
        "id": 187,
        "jornada": 16,
        "vuelta": 1,
        "fechaHora": "2025-08-25T19:00:00.000Z",
        "status": "PROGRAMADO",
        "equipoLocal": {
          "id": 12,
          "nombre": "Tigres FC"
        },
        "equipoVisitante": {
          "id": 15,
          "nombre": "Águilas United"
        }
      },
      {
        "id": 188,
        "jornada": 16,
        "vuelta": 1,
        "fechaHora": "2025-08-25T20:30:00.000Z",
        "status": "PROGRAMADO",
        "equipoLocal": {
          "id": 8,
          "nombre": "Leones FC"
        },
        "equipoVisitante": {
          "id": 22,
          "nombre": "Halcones United"
        }
      }
    ],
    "createdAt": "2025-08-18T15:30:00.000Z"
  }
}
```

### 2. **Registrar Resultado de Partido**

**PATCH** `/api/partido/{partidoId}/resultado`

**Permisos**: ADMINISTRADOR, ADMIN_LIGA, CAPITAN (solo sus partidos)

**Descripción**: Registra el resultado final de un partido y calcula automáticamente los puntos según el sistema de la liga.

**Body**:
```json
{
  "setsEquipoLocal": 3,
  "setsEquipoVisitante": 1,
  "detallesSets": [
    { "local": 25, "visitante": 20 },
    { "local": 23, "visitante": 25 },
    { "local": 25, "visitante": 18 },
    { "local": 25, "visitante": 22 }
  ],
  "observaciones": "Partido muy reñido, excelente nivel de ambos equipos"
}
```

**Respuesta Exitosa**:
```json
{
  "message": "Resultado registrado exitosamente",
  "partido": {
    "id": 187,
    "jornada": 16,
    "vuelta": 1,
    "fechaHora": "2025-08-25T19:00:00.000Z",
    "status": "FINALIZADO",
    "setsEquipoLocal": 3,
    "setsEquipoVisitante": 1,
    "detallesSets": [
      { "local": 25, "visitante": 20 },
      { "local": 23, "visitante": 25 },
      { "local": 25, "visitante": 18 },
      { "local": 25, "visitante": 22 }
    ],
    "puntosEquipoLocal": 3,
    "puntosEquipoVisitante": 0,
    "observaciones": "Partido muy reñido, excelente nivel de ambos equipos",
    "equipoLocal": {
      "id": 12,
      "nombre": "Tigres FC"
    },
    "equipoVisitante": {
      "id": 15,
      "nombre": "Águilas United"
    },
    "sistemaPuntos": "FIVB"
  }
}
```

### 3. **Obtener Partidos Pendientes por Equipo**

**GET** `/api/partido/pendientes/equipo/{equipoId}`

**Permisos**: ADMINISTRADOR, ADMIN_LIGA, CAPITAN (solo su equipo)

**Descripción**: Obtiene todos los partidos pendientes de un equipo específico, útil para planificación y seguimiento.

**Respuesta**:
```json
{
  "equipo": {
    "id": 12,
    "nombre": "Tigres FC",
    "capitan": {
      "id": 25,
      "nombre": "Carlos Mendoza"
    }
  },
  "partidosPendientes": {
    "total": 8,
    "programados": 6,
    "enCurso": 2,
    "partidos": [
      {
        "id": 189,
        "jornada": 17,
        "vuelta": 1,
        "fechaHora": "2025-08-30T19:00:00.000Z",
        "status": "PROGRAMADO",
        "rivales": {
          "id": 18,
          "nombre": "Pumas FC"
        },
        "esLocal": true,
        "jornadaPersonalizada": null
      },
      {
        "id": 190,
        "jornada": 18,
        "vuelta": 1,
        "fechaHora": null,
        "status": "PROGRAMADO",
        "rivales": {
          "id": 9,
          "nombre": "Lobos United"
        },
        "esLocal": false,
        "jornadaPersonalizada": {
          "id": 46,
          "nombre": "Jornada Especial Septiembre"
        }
      }
    ]
  },
  "estatisticas": {
    "partidosJugados": 12,
    "partidosGanados": 8,
    "partidosPerdidos": 4,
    "setsAFavor": 28,
    "setsEnContra": 18,
    "puntosLiga": 22
  }
}
```

### 4. **Obtener Estado de Liga - Resumen General**

**GET** `/api/liga/{ligaId}/estado-general`

**Permisos**: ADMINISTRADOR, ADMIN_LIGA

**Descripción**: Proporciona un resumen completo del estado actual de la liga, incluyendo partidos pendientes, jornadas y estadísticas.

**Respuesta**:
```json
{
  "liga": {
    "id": 5,
    "nombre": "Liga Metropolitana 2025",
    "status": "EN_CURSO",
    "vueltas": 2,
    "numeroGrupos": 1,
    "sistemaPuntos": "FIVB"
  },
  "resumen": {
    "equiposTotal": 10,
    "partidosTotales": 90,
    "partidosCompletados": 45,
    "partidosPendientes": 45,
    "jornadaActual": 16,
    "porcentajeCompletado": 50.0
  },
  "equipos": [
    {
      "id": 12,
      "nombre": "Tigres FC",
      "partidosJugados": 9,
      "partidosPendientes": 9,
      "puntos": 25,
      "posicion": 1
    },
    {
      "id": 15,
      "nombre": "Águilas United", 
      "partidosJugados": 8,
      "partidosPendientes": 10,
      "puntos": 22,
      "posicion": 2
    }
  ],
  "proximasJornadas": [
    {
      "id": 45,
      "numero": 16,
      "nombre": "Jornada de Recuperación - Fecha 15",
      "tipo": "PERSONALIZADA",
      "fechaProgramada": "2025-08-25",
      "partidosPendientes": 1,
      "partidosTotales": 2
    }
  ]
}
```

### 5. **Listar Jornadas de una Liga**

**GET** `/api/partido/jornadas/liga/{ligaId}`

**Permisos**: ADMINISTRADOR, ADMIN_LIGA

**Query Parameters**:
- `tipo`: `AUTOMATICA` | `PERSONALIZADA` | `ALL` (default: ALL)
- `status`: `PROGRAMADA` | `EN_CURSO` | `COMPLETADA` | `ALL` (default: ALL)
- `page`: número de página (opcional)
- `limit`: elementos por página (opcional)

**Ejemplo**: `GET /api/partido/jornadas/liga/5?tipo=PERSONALIZADA&status=PROGRAMADA`

**Respuesta**:
```json
{
  "data": [
    {
      "id": 45,
      "numero": 16,
      "nombre": "Jornada de Recuperación - Fecha 15",
      "tipo": "PERSONALIZADA",
      "status": "PROGRAMADA",
      "fechaProgramada": "2025-08-25",
      "horaProgramada": "19:00",
      "partidosCompletados": 0,
      "partidosTotales": 2,
      "creadoPor": {
        "id": 3,
        "nombre": "Admin Liga"
      },
      "createdAt": "2025-08-18T15:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 6. **Actualizar Jornada Personalizada**

**PATCH** `/api/partido/jornada-personalizada/{jornadaId}`

**Permisos**: ADMINISTRADOR, ADMIN_LIGA

**Body**:
```json
{
  "nombre": "Jornada de Recuperación - Nueva Fecha",
  "fechaProgramada": "2025-08-28",
  "horaProgramada": "20:00",
  "descripcion": "Fecha reprogramada por disponibilidad de cancha"
}
```

### 7. **Agregar Partido a Jornada Existente**

**POST** `/api/partido/jornada-personalizada/{jornadaId}/partido`

**Permisos**: ADMINISTRADOR, ADMIN_LIGA

**Body**:
```json
{
  "equipoLocalId": 7,
  "equipoVisitanteId": 14,
  "vuelta": 1,
  "fechaHora": "2025-08-25T21:00:00"
}
```

---

## ⚠️ **Casos de Error Comunes**

### **Error 409 - Conflicto de Equipos**
```json
{
  "statusCode": 409,
  "message": "El equipo 'Tigres FC' ya tiene un partido programado en esa fecha/hora",
  "error": "Conflict",
  "details": {
    "equipoId": 12,
    "fechaConflicto": "2025-08-25T19:00:00",
    "partidoExistente": 186
  }
}
```

### **Error 400 - Partido ya Finalizado**
```json
{
  "statusCode": 400,
  "message": "No se puede modificar un partido que ya está finalizado",
  "error": "Bad Request"
}
```

### **Error 422 - Sets Inválidos**
```json
{
  "statusCode": 422,
  "message": "Los sets del partido no son válidos para voleibol",
  "error": "Unprocessable Entity",
  "details": {
    "regla": "Un partido debe terminar en sets de 3-0, 3-1 o 3-2",
    "recibido": "2-2"
  }
}
```

---

## 🔍 **Validaciones Automáticas**

### **Al Crear Jornada Personalizada**:
1. ✅ Verificar que los equipos pertenezcan a la liga
2. ✅ Validar que no haya conflictos de horarios
3. ✅ Confirmar que el partido no se haya jugado ya
4. ✅ Verificar permisos del usuario (ADMIN_LIGA solo su liga)

### **Al Registrar Resultado**:
1. ✅ Validar sets según reglas de voleibol (3-0, 3-1, 3-2)
2. ✅ Calcular puntos según sistema de la liga
3. ✅ Actualizar contadores de jornada automáticamente
4. ✅ Verificar que el usuario tenga permisos sobre el partido

### **Integridad de Datos**:
1. ✅ No permitir equipos duplicados en misma jornada/horario
2. ✅ Mantener consistencia entre números de jornada
3. ✅ Actualizar estadísticas de liga automáticamente
4. ✅ Validar fechas no retroactivas (configurable)

---

## 📱 **Ejemplos de Uso Frontend**

### **Crear Jornada de Descanso para un Equipo**:
```javascript
// Crear jornada excluyendo equipo que descansa
const jornadaDescanso = {
  nombre: "Jornada 12 - Tigres FC descansa",
  descripcion: "Tigres FC tiene fecha libre",
  ligaId: 5,
  fechaProgramada: "2025-09-01",
  partidos: [
    // Solo incluir partidos que NO involucren a Tigres FC
    { equipoLocalId: 8, equipoVisitanteId: 15, vuelta: 1 },
    { equipoLocalId: 9, equipoVisitanteId: 22, vuelta: 1 }
  ]
};
```

### **Dashboard de Control para Admin**:
```javascript
// Obtener resumen general de la liga
const resumenLiga = await fetch('/api/liga/5/estado-general');

// Mostrar partidos pendientes por equipo
const partidosPendientes = await fetch('/api/partido/pendientes/equipo/12');

// Listar jornadas personalizadas
const jornadasPersonalizadas = await fetch('/api/partido/jornadas/liga/5?tipo=PERSONALIZADA');
```

### **Registro de Resultado**:
```javascript
const resultado = {
  setsEquipoLocal: 3,
  setsEquipoVisitante: 2,
  detallesSets: [
    { local: 25, visitante: 23 },
    { local: 22, visitante: 25 },
    { local: 25, visitante: 19 },
    { local: 20, visitante: 25 },
    { local: 15, visitante: 12 }
  ],
  observaciones: "Partido emocionante hasta el final"
};

await fetch('/api/partido/187/resultado', {
  method: 'PATCH',
  body: JSON.stringify(resultado)
});
```

---

## 🚀 **Flujo Completo de Trabajo**

### **Escenario: Equipo necesita descansar en Jornada 10**

1. **Admin revisa estado actual**:
   ```
   GET /api/liga/5/estado-general
   ```

2. **Admin crea jornada personalizada sin el equipo que descansa**:
   ```
   POST /api/partido/jornada-personalizada
   ```

3. **Durante los partidos, se registran resultados**:
   ```
   PATCH /api/partido/{partidoId}/resultado
   ```

4. **Admin verifica partidos pendientes**:
   ```
   GET /api/partido/pendientes/equipo/{equipoId}
   ```

5. **Se programa fecha de recuperación más adelante**:
   ```
   POST /api/partido/jornada-personalizada
   (incluye partidos del equipo que descansó)
   ```

Este sistema te permite tener **control total** sobre el fixture, adaptándose a las necesidades reales de torneos de voleibol. 🏐
