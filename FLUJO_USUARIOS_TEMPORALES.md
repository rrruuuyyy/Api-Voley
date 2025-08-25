# Flujo de Usuarios Temporales

## Introducción

El sistema de usuarios temporales permite crear usuarios sin credenciales (correo/contraseña) para facilitar la gestión de equipos. Estos usuarios reciben un código QR único que pueden usar posteriormente para completar su registro.

## Flujo de Trabajo

### 1. Creación de Usuario Temporal
- **Quién**: ADMINISTRADOR o ADMIN_LIGA
- **Cuándo**: Al necesitar agregar jugadores/capitanes sin tener sus datos de contacto
- **Qué**: Se crea un usuario con nombre y rol, sin credenciales

### 2. Asignación a Equipos
- El usuario temporal puede ser asignado a equipos inmediatamente
- Funciona igual que un usuario completo para propósitos de equipos/ligas

### 3. Registro Posterior
- **Quién**: El usuario temporal
- **Cuándo**: Cuando decida completar su registro
- **Qué**: Convierte su cuenta temporal en una cuenta completa con credenciales

## Endpoints del API

### 1. Crear Usuario Temporal

**POST** `/api/usuario/temporal`

**Permisos**: ADMINISTRADOR, ADMIN_LIGA

**Body**:
```json
{
  "nombre": "Juan Pérez",
  "rol": "JUGADOR",
  "descripcion": "Jugador recomendado por María"
}
```

**Respuesta Exitosa**:
```json
{
  "message": "Usuario temporal \"Juan Pérez\" creado exitosamente",
  "usuario": {
    "id": 15,
    "nombre": "Juan Pérez",
    "rol": "JUGADOR",
    "qrCode": "ABC12345",
    "esUsuarioTemporal": true,
    "active": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "qrCode": "ABC12345",
  "urlRegistro": "http://localhost:3000/registro-qr/ABC12345"
}
```

### 2. Obtener Información de Usuario por QR

**GET** `/api/usuario/qr-info/{qrCode}`

**Permisos**: Público (no requiere autenticación)

**Ejemplo**: `GET /api/usuario/qr-info/ABC12345`

**Respuesta**:
```json
{
  "id": 15,
  "nombre": "Juan Pérez",
  "rol": "JUGADOR",
  "esUsuarioTemporal": true,
  "qrCode": "ABC12345",
  "tieneCorreo": false
}
```

### 3. Registro con Código QR

**POST** `/api/usuario/registro-qr`

**Permisos**: Público (no requiere autenticación)

**Body**:
```json
{
  "qrCode": "ABC12345",
  "correo": "juan.perez@email.com",
  "password": "miPassword123"
}
```

**Respuesta Exitosa**:
```json
{
  "message": "¡Registro completado exitosamente! Bienvenido Juan Pérez",
  "usuario": {
    "id": 15,
    "nombre": "Juan Pérez",
    "correo": "juan.perez@email.com",
    "rol": "JUGADOR",
    "qrCode": "ABC12345",
    "esUsuarioTemporal": false,
    "active": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Listar Usuarios Temporales

**GET** `/api/usuario/temporales`

**Permisos**: ADMINISTRADOR, ADMIN_LIGA

**Query Parameters**: Paginación opcional
- `page`: Número de página (opcional)
- `limit`: Elementos por página (opcional)

**Respuesta**:
```json
{
  "data": [
    {
      "id": 15,
      "nombre": "Juan Pérez",
      "rol": "JUGADOR",
      "qrCode": "ABC12345",
      "esUsuarioTemporal": true,
      "active": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
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

## Casos de Error

### 1. Usuario Temporal Duplicado
**Endpoint**: `POST /api/usuario/temporal`
```json
{
  "statusCode": 409,
  "message": "Ya existe un usuario temporal con el nombre \"Juan Pérez\"",
  "error": "Conflict"
}
```

### 2. Código QR No Válido
**Endpoint**: `POST /api/usuario/registro-qr`
```json
{
  "statusCode": 404,
  "message": "Código QR no válido o usuario temporal no encontrado",
  "error": "Not Found"
}
```

### 3. Correo Ya en Uso
**Endpoint**: `POST /api/usuario/registro-qr`
```json
{
  "statusCode": 409,
  "message": "El correo electrónico ya está en uso",
  "error": "Conflict"
}
```

### 4. Usuario No Encontrado por QR
**Endpoint**: `GET /api/usuario/qr-info/{qrCode}`
```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado con este código QR",
  "error": "Not Found"
}
```

## Flujo de Ejemplo Completo

### Paso 1: Admin crea usuario temporal
```bash
curl -X POST http://localhost:3000/api/usuario/temporal \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos López",
    "rol": "CAPITAN"
  }'
```

### Paso 2: Admin obtiene QR y comparte URL
```
Respuesta incluye: urlRegistro: "http://localhost:3000/registro-qr/XYZ98765"
```

### Paso 3: Usuario visita URL y obtiene información
```bash
curl -X GET http://localhost:3000/api/usuario/qr-info/XYZ98765
```

### Paso 4: Usuario completa registro
```bash
curl -X POST http://localhost:3000/api/usuario/registro-qr \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "XYZ98765",
    "correo": "carlos.lopez@email.com",
    "password": "miPassword456"
  }'
```

### Paso 5: Usuario puede hacer login normalmente
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "carlos.lopez@email.com",
    "password": "miPassword456"
  }'
```

## Validaciones Implementadas

1. **Nombres únicos**: No se pueden crear usuarios temporales con nombres duplicados
2. **QR únicos**: Cada usuario temporal tiene un código QR único
3. **Correos únicos**: Al completar registro, verifica que el correo no esté en uso
4. **QR válidos**: Solo códigos QR de usuarios temporales activos son aceptados
5. **Encriptación**: Las contraseñas se encriptan con bcrypt al completar el registro

## Integración con Sistema Existente

### Equipos y Ligas
- Los usuarios temporales pueden ser asignados a equipos inmediatamente
- Todas las validaciones existentes (capitanes, jugadores, etc.) funcionan igual
- No hay diferencia funcional entre usuario temporal y completo para gestión de equipos

### Autenticación
- Usuarios temporales NO pueden hacer login hasta completar registro
- Una vez completado el registro, funcionan como usuarios normales
- El campo `esUsuarioTemporal` se actualiza a `false` tras el registro

### Roles y Permisos
- Los usuarios temporales mantienen sus roles asignados
- Pueden ser asignados como JUGADOR o CAPITAN
- Solo ADMINISTRADOR y ADMIN_LIGA pueden crear usuarios temporales

## Frontend - Páginas Sugeridas

### Página de Información QR
**URL**: `/registro-qr/{qrCode}`
- Muestra información del usuario temporal
- Formulario para completar registro
- Validación de contraseña
- Manejo de errores

### Dashboard Admin
- Lista de usuarios temporales
- Botón para crear nuevos usuarios temporales
- Enlaces QR para compartir
- Estado de cada usuario (temporal/completo)

## Variables de Entorno

```bash
# URL del frontend para generar enlaces de registro
FRONTEND_URL=http://localhost:3000
```
