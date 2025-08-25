# 🔄 FLUJO COMPLETO: Gestión de Jornadas y Partidos

## 📋 **RESUMEN GENERAL**

Tu API **YA TIENE IMPLEMENTADO** el flujo completo que necesitas. Aquí te explico paso a paso con mejoras añadidas:

---

## 🚀 **PASO 1: Después de crear jornadas - Ver próximos partidos**

### Endpoints disponibles:

```javascript
// 1. Ver todos los partidos de una liga
GET /partido/liga/{ligaId}

// 2. Ver partidos de una jornada específica
GET /partido/liga/{ligaId}?jornada=5

// 3. Ver próximos partidos de un equipo específico
GET /partido/pendientes/equipo/{equipoId}

// 4. Ver todas las jornadas de la liga
GET /partido/jornadas/liga/{ligaId}

// 5. 🆕 NUEVO: Ver estado de vueltas
GET /partido/estado-vueltas/liga/{ligaId}
```

### Ejemplo de respuesta - Próximos partidos:
```json
{
  "equipo": {
    "id": 1,
    "nombre": "Águilas Voladoras",
    "capitan": {
      "id": 10,
      "nombre": "Carlos López"
    }
  },
  "partidosPendientes": {
    "total": 3,
    "programados": 3,
    "enCurso": 0,
    "partidos": [
      {
        "id": 45,
        "jornada": 6,
        "vuelta": 2,
        "fechaHora": "2024-02-15T19:00:00Z",
        "rivales": {
          "id": 3,
          "nombre": "Rayos del Norte"
        },
        "esLocal": true
      }
    ]
  }
}
```

---

## ⚡ **PASO 2: Subir resultados/scores**

### Endpoints:
```javascript
// Método principal
PUT /partido/{id}/resultado

// Método alternativo  
PATCH /partido/{id}/resultado
```

### ✅ **Tu ejemplo (12-25, 23-25) implementado:**
```json
{
  "setsEquipoLocal": 0,
  "setsEquipoVisitante": 2,
  "detallesSets": [
    { "local": 12, "visitante": 25 },
    { "local": 23, "visitante": 25 }
  ],
  "observaciones": "Partido dominado por el visitante"
}
```

### 🎯 **Características:**
- ✅ **Soporta array de sets** (puedes subir set por set o todo junto)
- ✅ **Calcula automáticamente puntos de liga** según sistema FIVB
- ✅ **Valida que no haya empates**
- ✅ **Actualiza estado a "FINALIZADO"**
- ✅ **Permite observaciones**

---

## 📊 **PASO 3: Consultar información después**

### Ver resultado específico:
```javascript
GET /partido/{id}
```

**Respuesta:**
```json
{
  "id": 45,
  "jornada": 6,
  "vuelta": 2,
  "status": "FINALIZADO",
  "setsEquipoLocal": 0,
  "setsEquipoVisitante": 2,
  "detallesSets": [
    { "local": 12, "visitante": 25 },
    { "local": 23, "visitante": 25 }
  ],
  "puntosEquipoLocal": 0,
  "puntosEquipoVisitante": 3,
  "observaciones": "Partido dominado por el visitante",
  "equipoLocal": {
    "id": 1,
    "nombre": "Águilas Voladoras"
  },
  "equipoVisitante": {
    "id": 3,
    "nombre": "Rayos del Norte"
  }
}
```

### Ver estado general:
```javascript
// Estado completo con información por vueltas
GET /liga/{id}/estado-general

// Tabla de posiciones
GET /partido/tabla/{ligaId}

// 🆕 Estado específico de vueltas
GET /partido/estado-vueltas/liga/{ligaId}
```

---

## 🔄 **GESTIÓN AUTOMÁTICA DE VUELTAS**

### ✅ **MEJORA IMPLEMENTADA:**

**Antes:** Tenías que especificar manualmente la vuelta
**Ahora:** La API detecta automáticamente la vuelta correcta

#### Como funciona:
1. **Al crear jornada**, si no especificas `vuelta` en los partidos
2. **La API verifica** en qué vueltas ya jugaron esos equipos
3. **Asigna automáticamente** la primera vuelta disponible
4. **Si ya jugaron en todas las vueltas**, devuelve error

### Endpoint para verificar estado:
```javascript
GET /partido/estado-vueltas/liga/{ligaId}
```

**Respuesta:**
```json
{
  "liga": {
    "id": 1,
    "nombre": "Liga Nacional 2024",
    "vueltas": 2
  },
  "vueltaActual": 2,
  "vueltas": [
    {
      "numero": 1,
      "totalPartidos": 28,
      "completados": 28,
      "pendientes": 0,
      "porcentajeCompletado": 100,
      "estado": "completada",
      "puedeCrearJornada": false
    },
    {
      "numero": 2,
      "totalPartidos": 15,
      "completados": 8,
      "pendientes": 7,
      "porcentajeCompletado": 53.33,
      "estado": "en_curso",
      "puedeCrearJornada": true
    }
  ],
  "resumen": {
    "totalVueltas": 2,
    "vueltasCompletadas": 1,
    "vueltasEnCurso": 1,
    "vueltasSinIniciar": 0
  }
}
```

---

## 🎯 **FLUJO COMPLETO DE USO**

### 1. **Planificar próxima jornada:**
```javascript
// Ver qué equipos necesitan jugar
const proximosPartidos = await fetch('/partido/pendientes/equipo/1');

// Ver estado de vueltas
const estadoVueltas = await fetch('/partido/estado-vueltas/liga/1');
```

### 2. **Crear jornada personalizada:**
```javascript
POST /partido/jornada-personalizada
{
  "nombre": "Jornada 7 - Segunda Vuelta",
  "ligaId": 1,
  "partidos": [
    {
      "equipoLocalId": 1,
      "equipoVisitanteId": 3
      // ✅ No necesitas especificar 'vuelta' - se detecta automáticamente
    },
    {
      "equipoLocalId": 2,
      "equipoVisitanteId": 4
    }
  ]
}
```

### 3. **Durante los partidos - Subir resultados:**
```javascript
// Puedes subir set por set o todo junto
PUT /partido/45/resultado
{
  "setsEquipoLocal": 1,
  "setsEquipoVisitante": 2,
  "detallesSets": [
    { "local": 25, "visitante": 20 },
    { "local": 15, "visitante": 25 },
    { "local": 18, "visitante": 25 }
  ]
}
```

### 4. **Después - Consultar resultados:**
```javascript
// Ver resultado específico
const resultado = await fetch('/partido/45');

// Ver tabla actualizada
const tabla = await fetch('/partido/tabla/1');

// Ver estado general con todas las vueltas
const estadoGeneral = await fetch('/liga/1/estado-general');
```

---

## 🏆 **CARACTERÍSTICAS AVANZADAS**

### ✅ **Ya implementado:**
- **Validación de enfrentamientos duplicados por vuelta**
- **Cálculo automático de puntos según sistema FIVB**
- **Detección automática de vuelta correcta**
- **Estado de jornadas (programada, en curso, completada)**
- **Tabla de posiciones con criterios de desempate**
- **Estadísticas por equipo y por vuelta**
- **Próximos partidos por equipo**

### 🎯 **Casos de uso soportados:**
- Dashboard de administrador
- App móvil para capitanes
- Sistema de resultados en tiempo real
- Análisis estadístico por vueltas
- Planificación automática de jornadas

---

## 🚀 **¡TU API ESTÁ LISTA!**

**Todo el flujo que necesitas ya está implementado y mejorado.** Solo necesitas consumir estos endpoints desde tu frontend/móvil.

**Orden recomendado:**
1. `GET /partido/estado-vueltas/liga/{id}` - Ver estado actual
2. `GET /partido/pendientes/equipo/{id}` - Ver próximos partidos
3. `POST /partido/jornada-personalizada` - Crear jornadas
4. `PUT /partido/{id}/resultado` - Subir resultados
5. `GET /liga/{id}/estado-general` - Ver estado completo
