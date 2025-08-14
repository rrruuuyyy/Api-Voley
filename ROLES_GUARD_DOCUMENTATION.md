# Implementación de Guards de Roles para Endpoints POST

## Archivos Creados

### 1. `src/modules/auth/roles.guard.ts`
Guard personalizado que valida si el usuario autenticado tiene los roles necesarios para acceder a un endpoint específico.

**Características:**
- Implementa la interfaz `CanActivate`
- Utiliza el `Reflector` para obtener los roles requeridos desde los metadatos
- Lanza `ForbiddenException` si el usuario no tiene los permisos necesarios
- Solo se ejecuta después del `JwtAuthGuard`, por lo que el usuario ya está autenticado

### 2. `src/modules/auth/roles.decorator.ts`
Decorador personalizado para definir qué roles pueden acceder a cada endpoint.

**Uso:**
```typescript
@Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA)
@Post()
createEndpoint() { ... }
```

## Controladores Actualizados

### 1. `UsuarioController`
- **Endpoint:** `POST /usuario` - Solo **ADMINISTRADOR**
- **Endpoint:** `POST /usuario/jugador` - **ADMINISTRADOR**, **ADMIN_LIGA**, **CAPITAN**

### 2. `EquipoController`
- **Endpoint:** `POST /equipo` - **ADMINISTRADOR**, **ADMIN_LIGA**
- **Endpoint:** `POST /equipo/:id/jugadores` - **ADMINISTRADOR**, **ADMIN_LIGA**, **CAPITAN**

### 3. `LigaController`
- **Endpoint:** `POST /liga` - Solo **ADMINISTRADOR**

### 4. `PartidoController`
- **Endpoint:** `POST /partido` - **ADMINISTRADOR**, **ADMIN_LIGA**
- **Endpoint:** `POST /partido/generate-fixtures/:ligaId` - **ADMINISTRADOR**, **ADMIN_LIGA**

### 5. `SedeController`
- **Endpoint:** `POST /sede` - Solo **ADMINISTRADOR**

## Jerarquía de Permisos Implementada

1. **ADMINISTRADOR**: Acceso completo a todas las operaciones POST
2. **ADMIN_LIGA**: Puede crear equipos, partidos y generar fixtures
3. **CAPITAN**: Puede crear jugadores y agregarlos a equipos
4. **JUGADOR**: Sin permisos para operaciones POST (solo consultas)

## Cómo Funciona

1. **JwtAuthGuard**: Primer guard que valida el token JWT y extrae la información del usuario
2. **RolesGuard**: Segundo guard que verifica si el usuario tiene los roles necesarios
3. **@Roles()**: Decorador que define qué roles pueden acceder al endpoint

## Respuesta de Error

Si un usuario no tiene permisos, recibirá:
```json
{
  "message": "Acceso denegado. Se requiere uno de los siguientes roles: administrador, admin_liga",
  "error": "Forbidden",
  "statusCode": 403
}
```

## Consideraciones

- El controlador de autenticación (`AuthController`) no fue modificado porque debe permitir acceso público a endpoints como login, register, forgot y reset
- Todos los controladores ahora usan ambos guards: `@UseGuards(JwtAuthGuard, RolesGuard)`
- Los roles están definidos en el enum `UserRolesEnum` en `usuario.types.ts`
