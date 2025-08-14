# API de Liga de Voleibol - Documentación para Desarrolladores Frontend

## Introducción

Esta API implementa un sistema completo de gestión de ligas de voleibol con formato round-robin (todos contra todos). El sistema maneja roles de usuarios, equipos, partidos y estadísticas automatizadas.

## Conceptos Básicos del Sistema Round-Robin

### Fórmulas Implementadas
- **Partidos por equipo**: `(n - 1) × k` donde n = equipos, k = vueltas
- **Partidos totales**: `n × (n - 1) / 2 × k`
- **Jornadas**: `k × (n - 1)` si n es par, `k × n` si n es impar
- **Partidos por jornada**: `n/2` si n es par, `(n-1)/2` si n es impar

## Roles de Usuario

- **ADMINISTRADOR**: Gestiona usuarios, sedes y puede cambiar roles
- **ADMIN_LIGA**: Crea y gestiona ligas, asigna capitanes
- **CAPITAN**: Crea equipos y gestiona jugadores
- **JUGADOR**: Participa en equipos

## Autenticación

Todas las rutas excepto login/register requieren el header:
```
Authorization: Bearer {token}
```

## Endpoints

### 🔐 Autenticación (`/auth`)

#### POST `/auth/register`
Registra un nuevo usuario administrador
```json
{
  "u_name": "Nombre Admin",
  "u_email": "admin@example.com",
  "u_password": "password123"
}
```

#### POST `/auth/login`
Inicia sesión con email y password
```json
{
  "correo": "admin@example.com",
  "password": "password123"
}
```

#### POST `/auth/login-sucursal`
Inicia sesión con código QR
```json
{
  "code": "ABC123"
}
```

#### GET `/auth/me`
Obtiene información del usuario autenticado

---

### 👥 Usuarios (`/usuario`)

#### POST `/usuario/jugador`
Crea un nuevo jugador (genera QR automáticamente)
```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@example.com",
  "password": "password123",
  "rol": "jugador"
}
```

#### PUT `/usuario/{id}/role`
Cambia el rol de un usuario (solo ADMINISTRADOR)
```json
{
  "newRole": "capitan"
}
```

#### GET `/usuario/by-role/{role}`
Obtiene usuarios por rol
- Roles disponibles: `administrador`, `admin_liga`, `capitan`, `jugador`

#### GET `/usuario/qr/{qrCode}`
Busca usuario por código QR

#### PUT `/usuario/{id}/generate-qr`
Genera nuevo código QR para un usuario

---

### 🏢 Sedes (`/sede`)

#### POST `/sede`
Crea una nueva sede (solo ADMINISTRADOR)
```json
{
  "nombre": "Polideportivo Central",
  "direccion": "Av. Principal 123",
  "telefono": "555-0123",
  "numeroCancha": 2
}
```

#### GET `/sede`
Lista todas las sedes activas

#### GET `/sede/{id}`
Obtiene detalles de una sede

#### PATCH `/sede/{id}`
Actualiza una sede

#### DELETE `/sede/{id}`
Desactiva una sede

---

### 🏆 Ligas (`/liga`)

#### POST `/liga`
Crea una nueva liga (ADMIN_LIGA)
```json
{
  "nombre": "Liga Juvenil 2024",
  "descripcion": "Liga para categoría juvenil",
  "vueltas": 2,
  "numeroGrupos": 1,
  "sistemaPuntos": "fivb",
  "criteriosDesempate": ["puntos", "victorias", "set_ratio", "point_ratio"],
  "maxPartidosPorDia": 2,
  "duracionEstimadaPartido": 90,
  "descansoMinimo": 30,
  "fechaInicio": "2024-03-01",
  "fechaFin": "2024-05-30",
  "adminLigaId": 2,
  "sedeId": 1
}
```

**Parámetros importantes:**
- `sistemaPuntos`: `"fivb"` (3-0/3-1→3pts, 3-2→2pts/1pt) o `"simple"` (3pts/0pts)
- `criteriosDesempate`: Array ordenado de criterios de desempate
- `vueltas`: Número de veces que se enfrentan los equipos

#### PUT `/liga/{id}/iniciar`
Inicia una liga (cambia status a "en_curso")

#### PUT `/liga/{id}/finalizar`
Finaliza una liga (cambia status a "finalizada")

#### GET `/liga`
Lista todas las ligas

#### GET `/liga/{id}/estadisticas`
Obtiene funciones de cálculo para estadísticas de la liga

---

### ⚽ Equipos (`/equipo`)

#### POST `/equipo`
Crea un equipo (CAPITAN)
```json
{
  "nombre": "Los Tigres",
  "color": "#FF5722",
  "descripcion": "Equipo juvenil competitivo",
  "grupoNumero": 1,
  "capitanId": 3,
  "ligaId": 1
}
```

#### POST `/equipo/{id}/jugadores`
Agrega un jugador al equipo (CAPITAN del equipo)
```json
{
  "jugadorId": 5,
  "numeroJugador": "10",
  "posicion": "Atacante"
}
```

#### GET `/equipo/{id}/jugadores`
Lista jugadores de un equipo

#### DELETE `/equipo/{id}/jugadores/{jugadorId}`
Remueve jugador del equipo

#### PUT `/equipo/{id}/grupo`
Asigna equipo a un grupo (ADMIN_LIGA)
```json
{
  "grupoNumero": 2
}
```

#### GET `/equipo?ligaId={ligaId}`
Lista equipos de una liga específica

---

### 🏐 Partidos (`/partido`)

#### POST `/partido/generate-fixtures/{ligaId}?grupo={grupo}`
Genera automáticamente todos los partidos round-robin para una liga/grupo
- Retorna: número total de partidos, jornadas y calendario completo

#### GET `/partido/liga/{ligaId}?jornada={jornada}`
Lista partidos de una liga (opcionalmente filtrado por jornada)

#### PUT `/partido/{id}/resultado`
Registra resultado de un partido
```json
{
  "setsEquipoLocal": 3,
  "setsEquipoVisitante": 1,
  "detallesSets": [
    {"local": 25, "visitante": 23},
    {"local": 25, "visitante": 20},
    {"local": 23, "visitante": 25},
    {"local": 25, "visitante": 22}
  ],
  "observaciones": "Partido muy reñido"
}
```

#### GET `/partido/tabla/{ligaId}?grupo={grupo}`
Obtiene tabla de posiciones con estadísticas completas
```json
[
  {
    "equipo": {...},
    "partidosJugados": 6,
    "victorias": 5,
    "derrotas": 1,
    "setsGanados": 16,
    "setsPerdidos": 5,
    "puntosAFavor": 450,
    "puntosEnContra": 380,
    "puntosLiga": 14,
    "setRatio": 3.2,
    "pointRatio": 1.18
  }
]
```

---

## Sistema de Puntos

### FIVB (Federación Internacional)
- Victoria 3-0 o 3-1: **Ganador 3pts, Perdedor 0pts**
- Victoria 3-2: **Ganador 2pts, Perdedor 1pt**

### Simple
- Victoria: **3pts**
- Derrota: **0pts**

## Criterios de Desempate (en orden)
1. **puntos**: Puntos totales de liga
2. **victorias**: Número de partidos ganados
3. **set_ratio**: Sets ganados / sets perdidos
4. **point_ratio**: Puntos a favor / puntos en contra
5. **head_to_head**: Resultado directo entre equipos

## Estados de Entidades

### Liga
- `programada`: Liga creada, esperando inicio
- `en_curso`: Liga activa con partidos en juego
- `finalizada`: Liga completada
- `cancelada`: Liga cancelada

### Partido
- `programado`: Partido creado, esperando jugarse
- `en_curso`: Partido en desarrollo
- `finalizado`: Partido completado con resultado
- `cancelado`: Partido cancelado
- `aplazado`: Partido pospuesto

## Flujo de Trabajo Típico

1. **Administrador** crea sedes y asigna roles de `admin_liga`
2. **Admin Liga** crea liga y asigna `capitanes`
3. **Capitanes** crean equipos y agregan `jugadores`
4. **Admin Liga** genera fixture automático: `POST /partido/generate-fixtures/{ligaId}`
5. **Admin Liga** inicia liga: `PUT /liga/{id}/iniciar`
6. **Se registran resultados**: `PUT /partido/{id}/resultado`
7. **Se consulta tabla**: `GET /partido/tabla/{ligaId}`

## Códigos QR

Cada usuario tiene un código QR único (`qrCode`) de 12 caracteres:
- Se genera automáticamente al crear jugador
- Permite login rápido: `POST /auth/login-sucursal`
- Se puede regenerar: `PUT /usuario/{id}/generate-qr`

## Manejo de Grupos

Para ligas con múltiples grupos:
- Asignar `grupoNumero` a cada equipo
- Generar fixtures por grupo: `?grupo={numero}`
- Ver tabla por grupo: `GET /partido/tabla/{ligaId}?grupo={numero}`

## Respuestas de Error

```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "error": "Bad Request"
}
```

Códigos de estado comunes:
- `400`: Datos inválidos
- `401`: No autenticado
- `403`: Sin permisos
- `404`: Recurso no encontrado
- `409`: Conflicto (duplicado)

---

Esta API está diseñada para ser intuitiva y seguir las reglas estándar del voleibol. Para cualquier duda sobre la implementación del algoritmo round-robin o sistema de puntos, consultar la documentación técnica del código.
