# Módulo de Mail - VoleyApp

Este módulo proporciona funcionalidades completas para el envío de correos electrónicos usando SMTP, con soporte para plantillas MJML y variables Handlebars.

## Características

- ✅ Envío de correos via SMTP (configurado para Mailtrap)
- ✅ Plantillas MJML para diseños responsivos
- ✅ Variables dinámicas con Handlebars
- ✅ Soporte para archivos adjuntos
- ✅ Plantillas en HTML y texto plano
- ✅ Helpers personalizados de Handlebars
- ✅ Configuración centralizada via variables de entorno

## Configuración

### Variables de Entorno

Agregar al archivo `.env`:

```env
# Email Configuration
EMAIL_SMTP=sandbox.smtp.mailtrap.io
EMAIL_SMTP_PORT=2525
EMAIL_SMTP_USER=your_username
EMAIL_SMTP_PASS=your_password
EMAIL_FROM_NAME=Grupo Daytona
EMAIL_FROM_ADDRESS=noreply@grupodaytona.com
FRONTEND_URL=http://localhost:3000
```

## Uso

### 1. Importar el MailModule

```typescript
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [MailModule],
  // ...
})
export class YourModule {}
```

### 2. Inyectar el MailService

```typescript
import { MailService } from '../mail/mail.service';

@Injectable()
export class YourService {
  constructor(private readonly mailService: MailService) {}

  async someMethod() {
    await this.mailService.sendWelcomeEmail('user@example.com', {
      nombre: 'Juan Pérez',
      correo: 'user@example.com',
      password: 'temporal123',
      qrCode: 'ABC1234'
    });
  }
}
```

## Métodos Disponibles

### sendMail(options: SendMailOptions)

Método principal para enviar correos con opciones completas.

```typescript
await mailService.sendMail({
  to: 'user@example.com',
  subject: 'Mi Asunto',
  template: 'mi-template',
  context: { variable1: 'valor1' },
  attachments: [{ filename: 'file.pdf', content: buffer }]
});
```

### sendWelcomeEmail(to: string, userData)

Envía correo de bienvenida al crear usuario.

```typescript
await mailService.sendWelcomeEmail('user@example.com', {
  nombre: 'Juan Pérez',
  correo: 'user@example.com',
  password: 'temporal123',
  qrCode: 'ABC1234'
});
```

### sendPasswordResetEmail(to: string, resetData)

Envía correo para restablecer contraseña.

```typescript
await mailService.sendPasswordResetEmail('user@example.com', {
  nombre: 'Juan Pérez',
  resetToken: 'abc123token'
});
```

### sendTestEmail(to: string)

Envía correo de prueba simple.

```typescript
await mailService.sendTestEmail('user@example.com');
```

## Plantillas

### Estructura de Archivos

```
src/modules/mail/templates/
├── welcome-user.mjml        # Plantilla HTML de bienvenida
├── welcome-user.txt         # Plantilla texto de bienvenida
├── password-reset.mjml      # Plantilla HTML reset password
└── password-reset.txt       # Plantilla texto reset password
```

### Variables Disponibles en Plantillas

#### welcome-user
- `{{nombre}}` - Nombre del usuario
- `{{correo}}` - Correo electrónico
- `{{password}}` - Contraseña temporal
- `{{qrCode}}` - Código QR (opcional)
- `{{loginUrl}}` - URL para login
- `{{year}}` - Año actual

#### password-reset
- `{{nombre}}` - Nombre del usuario
- `{{resetUrl}}` - URL para restablecer contraseña
- `{{year}}` - Año actual

### Helpers de Handlebars

#### formatDate
Formatea fechas en español:
```handlebars
{{formatDate createdAt}}
```

#### ifEquals
Comparación condicional:
```handlebars
{{#ifEquals rol "administrador"}}
  Contenido para admin
{{/ifEquals}}
```

## Creación de Nuevas Plantillas

### 1. Crear archivo MJML

```bash
touch src/modules/mail/templates/mi-template.mjml
```

### 2. Ejemplo de plantilla MJML

```mjml
<mjml>
  <mj-head>
    <mj-title>{{asunto}}</mj-title>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>Hola {{nombre}},</mj-text>
        <mj-text>{{mensaje}}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

### 3. Crear archivo de texto (opcional)

```bash
touch src/modules/mail/templates/mi-template.txt
```

### 4. Usar la plantilla

```typescript
await mailService.sendMail({
  to: 'user@example.com',
  subject: 'Mi Asunto',
  template: 'mi-template',
  context: {
    asunto: 'Mi Asunto',
    nombre: 'Juan',
    mensaje: 'Este es mi mensaje'
  }
});
```

## API Endpoints (Testing)

### POST /mail/test
Envía correo de prueba
```json
{
  "to": "test@example.com"
}
```

### POST /mail/welcome
Envía correo de bienvenida
```json
{
  "to": "user@example.com",
  "userData": {
    "nombre": "Juan Pérez",
    "correo": "user@example.com",
    "password": "temporal123",
    "qrCode": "ABC1234"
  }
}
```

### POST /mail/reset-password
Envía correo de reset
```json
{
  "to": "user@example.com",
  "resetData": {
    "nombre": "Juan Pérez",
    "resetToken": "abc123token"
  }
}
```

## Arquitectura

```
MailModule
├── MailService          # Servicio principal para envío
├── TemplateService      # Compilación de plantillas MJML/Handlebars
├── MailController       # Endpoints para testing
└── interfaces/
    └── mail.interface.ts # Interfaces TypeScript
```

## Manejo de Errores

- Los errores de envío se logean pero no fallan la operación principal
- Verificación automática de configuración SMTP al iniciar
- Validación de existencia de plantillas
- Fallback a texto plano si falla compilación MJML

## Dependencias

```json
{
  "nodemailer": "^6.x.x",
  "@types/nodemailer": "^6.x.x",
  "mjml": "^4.x.x",
  "handlebars": "^4.x.x"
}
```
