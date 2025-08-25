# Flujo de Equipos y Jugadores - API Voleibol

## 📋 Resumen del Flujo

Este documento explica el flujo específico para la gestión de equipos y jugadores dentro de una liga de voleibol.

## 🔄 Flujo Completo

### 1. Prerequisitos
- Liga creada por `ADMIN_LIGA`
- Capitanes asignados a la liga
- Usuarios con rol `CAPITAN` y `JUGADOR` registrados

### 2. Secuencia de Eventos

```
1. ADMIN_LIGA crea liga
   ↓
2. ADMIN_LIGA asigna capitanes a la liga
   ↓
3. CAPITAN crea su equipo (automáticamente se agrega como jugador)
   ↓ (alternativo)
3b. ADMINISTRADOR crea equipo especificando capitán
   ↓
4. CAPITAN agrega jugadores a su equipo
   ↓
5. Liga lista para generar partidos round-robin
```

## 🏆 Gestión de Equipos

### Creación de Equipo por Capitán

**Endpoint:** `POST /equipo`  
**Roles permitidos:** `CAPITAN`, `ADMIN_LIGA`, `ADMINISTRADOR`

#### Flujo para CAPITAN:
```json
{
  "nombre": "Los Tigres",
  "ligaId": 1,
  "capitanId": 5,  // ID del capitán que crea el equipo
  "color": "#FF5733",
  "descripcion": "Equipo de la zona norte"
}
```

**Comportamiento automático:**
- El capitán se agrega automáticamente como jugador del equipo
- Se le asigna número "1" y posición "Capitán"
- Si el usuario no tiene QR, se genera automáticamente

#### Flujo para ADMINISTRADOR:
```json
{
  "nombre": "Los Leones", 
  "ligaId": 1,
  "capitanId": 7,  // Debe especificar quién será el capitán
  "color": "#3498DB"
}
```

### Validaciones en Creación:
- ✅ El `capitanId` debe existir y estar activo
- ✅ El usuario debe tener rol `CAPITAN`
- ✅ La `ligaId` debe existir y estar activa
- ✅ El nombre del equipo debe ser único por liga

### Respuesta Exitosa:
```json
{
  "id": 1,
  "nombre": "Los Tigres",
  "color": "#FF5733",
  "descripcion": "Equipo de la zona norte",
  "grupoNumero": 0,
  "active": true,
  "capitan": {
    "id": 5,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com"
  },
  "liga": {
    "id": 1,
    "nombre": "Liga Juvenil 2024"
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## 👥 Gestión de Jugadores

### Agregar Jugador al Equipo

**Endpoint:** `POST /equipo/{id}/jugadores`  
**Roles permitidos:** `CAPITAN` (del equipo), `ADMIN_LIGA`, `ADMINISTRADOR`

```json
{
  "jugadorId": 12,
  "numeroJugador": "7",     // Opcional
  "posicion": "Atacante"    // Opcional
}
```

### Validaciones:
- ✅ El jugador debe existir y estar activo
- ✅ El jugador no debe estar ya en este equipo
- ✅ Si el jugador no tiene QR, se genera automáticamente

### Ver Jugadores del Equipo

**Endpoint:** `GET /equipo/{id}/jugadores`

**Respuesta:**
```json
[
  {
    "id": 1,
    "numeroJugador": "1",
    "posicion": "Capitán",
    "active": true,
    "jugador": {
      "id": 5,
      "nombre": "Juan Pérez",
      "correo": "juan@example.com",
      "qrCode": "ABC123DEF456"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "numeroJugador": "7",
    "posicion": "Atacante",
    "active": true,
    "jugador": {
      "id": 12,
      "nombre": "María González",
      "correo": "maria@example.com",
      "qrCode": "XYZ789ABC123"
    },
    "createdAt": "2024-01-15T11:15:00Z"
  }
]
```

### Remover Jugador del Equipo

**Endpoint:** `DELETE /equipo/{id}/jugadores/{jugadorId}`

```json
{
  "message": "Jugador \"Pedro Sánchez\" removido del equipo correctamente"
}
```

**Validaciones:**
- ❌ No se puede remover al capitán del equipo
- ✅ El jugador debe existir en el equipo

### Actualizar Datos del Jugador en el Equipo

**Endpoint:** `PATCH /equipo/{id}/jugadores/{jugadorId}`  
**Roles permitidos:** `CAPITAN` (del equipo), `ADMIN_LIGA`, `ADMINISTRADOR`

```json
{
  "numeroJugador": "10",    // Opcional - número de playera
  "posicion": "Libero"      // Opcional - posición del jugador
}
```

**Funcionalidades:**
- 🔢 **Cambiar número de playera**: Actualiza el número del jugador
- 📍 **Cambiar posición**: Actualiza la posición del jugador  
- 🔄 **Actualización flexible**: Puedes cambiar solo número, solo posición, o ambos

**Validaciones:**
- ✅ El jugador debe existir en el equipo
- ✅ El número debe ser único en el equipo
- ✅ Mensajes informativos con nombres

**Ejemplos de uso:**

#### Cambiar solo el número:
```json
PATCH /equipo/1/jugadores/5
{
  "numeroJugador": "7"
}
```

#### Cambiar solo la posición:
```json
PATCH /equipo/1/jugadores/5
{
  "posicion": "Central"
}
```

#### Cambiar ambos:
```json
PATCH /equipo/1/jugadores/5
{
  "numeroJugador": "9",
  "posicion": "Atacante"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Datos de \"María González\" actualizados correctamente",
  "jugador": {
    "id": 5,
    "nombre": "María González",
    "numeroJugador": "10",
    "posicion": "Libero"
  }
}
```

## 📊 Consultas de Equipos

### Listar Equipos de una Liga

**Endpoint:** `GET /equipo?ligaId={ligaId}`

```json
[
  {
    "id": 1,
    "nombre": "Los Tigres",
    "color": "#FF5733",
    "grupoNumero": 1,
    "capitan": {
      "id": 5,
      "nombre": "Juan Pérez"
    },
    "liga": {
      "id": 1,
      "nombre": "Liga Juvenil 2024"
    }
  }
]
```

### Obtener Equipo Específico

**Endpoint:** `GET /equipo/{id}`

## 🔧 Funciones Adicionales

### Asignar Grupo a Equipo

**Endpoint:** `PUT /equipo/{id}/grupo`  
**Roles:** `ADMIN_LIGA`, `ADMINISTRADOR`

```json
{
  "grupoNumero": 2
}
```

### Actualizar Equipo

**Endpoint:** `PATCH /equipo/{id}`

```json
{
  "nombre": "Los Tigres Renovados",
  "color": "#E74C3C",
  "capitanId": 8  // Cambiar capitán (opcional)
}
```

## 🚨 Casos de Error Comunes

### Error 400 - Bad Request
```json
{
  "message": "El usuario debe tener rol de capitán",
  "statusCode": 400
}
```

### Error 404 - Not Found
```json
{
  "message": "Liga no encontrada",
  "statusCode": 404
}
```

### Error 400 - Jugador Duplicado
```json
{
  "message": "El jugador \"Juan Pérez\" ya pertenece a este equipo",
  "statusCode": 400
}
```

### Error 400 - Jugador en Otro Equipo
```json
{
  "message": "El jugador \"María González\" ya pertenece al equipo \"Los Leones\" en esta liga",
  "statusCode": 400
}
```

### Error 400 - Capitán No Puede Ser Agregado
```json
{
  "message": "No se puede agregar a \"Carlos López\" porque es capitán asignado a esta liga y debe crear su propio equipo",
  "statusCode": 400
}
```

### Error 400 - No Remover Capitán
```json
{
  "message": "No se puede remover a \"Ana Martínez\" porque es el capitán del equipo",
  "statusCode": 400
}
```

### Error 400 - Número Duplicado
```json
{
  "message": "El número \"7\" ya está siendo usado por \"Pedro Sánchez\" en este equipo",
  "statusCode": 400
}
```

## 📱 Generación Automática de QR

**Comportamiento automático:**
- Al agregar un jugador sin QR → Se genera automáticamente
- Formato: nanoid de 12 caracteres
- Único por usuario
- Se puede regenerar con: `PUT /usuario/{id}/generate-qr`

## 🎯 Puntos Clave para Frontend

1. **Capitán Automático**: Al crear equipo, el capitán se agrega automáticamente como jugador
2. **QR Automático**: Los jugadores sin QR obtienen uno automáticamente
3. **Validación de Roles**: Solo capitanes pueden crear equipos (excepto administradores)
4. **Filtrado por Liga**: Siempre filtrar equipos por liga para mejor UX
5. **Estados**: Solo trabajar con equipos `active: true`

## 🔗 Endpoints Relacionados

**Gestión de Equipos:**
- `POST /equipo` - Crear equipo
- `GET /equipo?ligaId={id}` - Listar equipos por liga
- `GET /equipo/{id}` - Obtener equipo específico
- `PATCH /equipo/{id}` - Actualizar equipo
- `DELETE /equipo/{id}` - Eliminar equipo
- `PUT /equipo/{id}/grupo` - Asignar grupo

**Gestión de Jugadores:**
- `POST /equipo/{id}/jugadores` - Agregar jugador
- `GET /equipo/{id}/jugadores` - Ver jugadores del equipo
- `PATCH /equipo/{id}/jugadores/{jugadorId}` - Actualizar datos del jugador
- `DELETE /equipo/{id}/jugadores/{jugadorId}` - Remover jugador

**Gestión de Liga:**
- `POST /liga/{id}/capitanes` - Asignar capitanes
- `GET /liga/{id}/capitanes` - Ver capitanes disponibles

**Gestión de Usuarios:**
- `GET /usuario/by-role/capitan` - Listar todos los capitanes
- `GET /usuario/by-role/jugador` - Listar todos los jugadores
- `PUT /usuario/{id}/generate-qr` - Regenerar QR de usuario

## 📋 Checklist de Implementación

- [ ] Liga creada y en estado `programada`
- [ ] Capitanes asignados a la liga
- [ ] Equipos creados por capitanes
- [ ] Jugadores agregados a equipos
- [ ] Códigos QR generados para todos los jugadores
- [ ] Liga lista para `iniciar` y generar partidos

---

**Siguiente paso:** Una vez completado este flujo, la liga estará lista para:
1. `PUT /liga/{id}/iniciar` - Calcular estadísticas automáticas
2. `POST /partido/generate-fixtures/{ligaId}` - Generar partidos round-robin
