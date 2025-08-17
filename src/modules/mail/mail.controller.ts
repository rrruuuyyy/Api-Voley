import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  async sendTestEmail(@Body() body: { to: string }) {
    return this.mailService.sendTestEmail(body.to);
  }

  @Post('welcome')
  async sendWelcomeEmail(@Body() body: { 
    to: string; 
    userData: { nombre: string; correo: string; password: string; qrCode?: string } 
  }) {
    return this.mailService.sendWelcomeEmail(body.to, body.userData);
  }

  @Post('reset-password')
  async sendPasswordResetEmail(@Body() body: { 
    to: string; 
    resetData: { nombre: string; resetToken: string } 
  }) {
    return this.mailService.sendPasswordResetEmail(body.to, body.resetData);
  }

  @Post('notification')
  async sendNotification(@Body() body: {
    to: string;
    notificationData: {
      asunto: string;
      nombre?: string;
      contenido: string;
      preview?: string;
      accionUrl?: string;
      accionTexto?: string;
      configuracion?: string;
    }
  }) {
    return this.mailService.sendNotification(body.to, body.notificationData);
  }
}
