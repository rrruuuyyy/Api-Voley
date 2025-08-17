import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { SendMailOptions } from './interfaces/mail.interface';
import { TemplateService } from './template.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    this.createTransporter();
  }

  private createTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_SMTP'),
      port: this.configService.get<number>('EMAIL_SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('EMAIL_SMTP_USER'),
        pass: this.configService.get<string>('EMAIL_SMTP_PASS'),
      },
    });

    // Verificar la configuración
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Error en la configuración del transportador de correo:', error);
      } else {
        this.logger.log('Servidor de correo listo para enviar mensajes');
      }
    });
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    try {
      let html = options.html;
      let text = options.text;

      // Si se especifica un template, compilarlo
      if (options.template) {
        if (!this.templateService.templateExists(options.template)) {
          throw new Error(`Template ${options.template} no encontrado`);
        }

        html = await this.templateService.compileTemplate(options.template, options.context || {});
        text = await this.templateService.compileTextTemplate(options.template, options.context || {});
      }

      const fromName = options.from?.name || this.configService.get<string>('EMAIL_FROM_NAME');
      const fromAddress = options.from?.address || this.configService.get<string>('EMAIL_FROM_ADDRESS');

      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Correo enviado exitosamente a ${options.to}. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando correo a ${options.to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(to: string, userData: { nombre: string; correo: string; password: string; qrCode?: string }): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Bienvenido a VoleyApp - Tus credenciales de acceso',
      template: 'welcome-user',
      context: {
        nombre: userData.nombre,
        correo: userData.correo,
        password: userData.password,
        qrCode: userData.qrCode,
        year: new Date().getFullYear(),
        loginUrl: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/login`
      }
    });
  }

  async sendPasswordResetEmail(to: string, resetData: { nombre: string; resetToken: string }): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Restablecer contraseña - VoleyApp',
      template: 'password-reset',
      context: {
        nombre: resetData.nombre,
        resetUrl: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/reset-password/${resetData.resetToken}`,
        year: new Date().getFullYear()
      }
    });
  }

  async sendTestEmail(to: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Correo de prueba - VoleyApp',
      html: '<h1>¡Correo de prueba!</h1><p>Si recibes este correo, la configuración está funcionando correctamente.</p>',
      text: 'Correo de prueba! Si recibes este correo, la configuración está funcionando correctamente.'
    });
  }

  async sendNotification(to: string, notificationData: {
    asunto: string;
    nombre?: string;
    contenido: string;
    preview?: string;
    accionUrl?: string;
    accionTexto?: string;
    configuracion?: string;
  }): Promise<boolean> {
    return this.sendMail({
      to,
      subject: notificationData.asunto,
      template: 'notification',
      context: {
        ...notificationData,
        year: new Date().getFullYear()
      }
    });
  }
}
