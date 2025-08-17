# Ejemplos de Uso del Módulo de Mail

## Probar el envío de correos

### 1. Iniciar el servidor
```bash
npm run start:dev
```

### 2. Probar correo simple
```bash
curl -X POST http://localhost:3000/mail/test \
  -H "Content-Type: application/json" \
  -d '{"to": "tu-email@example.com"}'
```

### 3. Probar correo de bienvenida
```bash
curl -X POST http://localhost:3000/mail/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "to": "nuevo-usuario@example.com",
    "userData": {
      "nombre": "Juan Pérez",
      "correo": "nuevo-usuario@example.com",
      "password": "temporal123",
      "qrCode": "ABC1234"
    }
  }'
```

### 4. Probar correo de reset de contraseña
```bash
curl -X POST http://localhost:3000/mail/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "to": "usuario@example.com",
    "resetData": {
      "nombre": "Juan Pérez",
      "resetToken": "reset-token-123"
    }
  }'
```

## Integración Automática

El envío de correos ya está integrado en:

### Creación de Usuario (Admin)
Cuando un administrador crea un usuario via POST `/usuarios`, automáticamente se envía un correo de bienvenida.

### Registro de Jugador
Cuando se registra un jugador via POST `/usuarios/jugador`, automáticamente se envía un correo de bienvenida.

## Configuración de Mailtrap

1. Ve a [Mailtrap.io](https://mailtrap.io)
2. Crea una cuenta gratuita
3. Ve a "Email Testing" > "Inboxes"
4. Selecciona tu inbox
5. Ve a la pestaña "SMTP Settings"
6. Copia las credenciales a tu archivo `.env`

## Ejemplos de Variables de Entorno

```env
# Para desarrollo con Mailtrap
EMAIL_SMTP=sandbox.smtp.mailtrap.io
EMAIL_SMTP_PORT=2525
EMAIL_SMTP_USER=tu_username_mailtrap
EMAIL_SMTP_PASS=tu_password_mailtrap
EMAIL_FROM_NAME=Grupo Daytona
EMAIL_FROM_ADDRESS=noreply@grupodaytona.com
FRONTEND_URL=http://localhost:3000

# Para producción con Gmail
EMAIL_SMTP=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=tu-email@gmail.com
EMAIL_SMTP_PASS=tu-app-password
EMAIL_FROM_NAME=Grupo Daytona
EMAIL_FROM_ADDRESS=tu-email@gmail.com
FRONTEND_URL=https://tu-dominio.com
```

## Testing Automático

```typescript
// En cualquier servicio
constructor(private readonly mailService: MailService) {}

async testEmail() {
  try {
    await this.mailService.sendTestEmail('test@example.com');
    console.log('✅ Correo enviado exitosamente');
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
  }
}
```
