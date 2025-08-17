import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
const mjml = require('mjml');
import * as fs from 'fs';
import * as path from 'path';
import { TemplateContext } from './interfaces/mail.interface';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templatesPath = path.join(process.cwd(), 'src', 'modules', 'mail', 'templates');

  constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Helper para formatear fechas
    Handlebars.registerHelper('formatDate', (date: Date) => {
      if (!date) return '';
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(date));
    });

    // Helper para condicionales
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
  }

  async compileTemplate(templateName: string, context: TemplateContext): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.mjml`);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template ${templateName} no encontrado en ${templatePath}`);
      }

      // Leer el archivo MJML
      const mjmlTemplate = fs.readFileSync(templatePath, 'utf8');
      
      // Compilar con Handlebars primero para reemplazar variables
      const handlebarsTemplate = Handlebars.compile(mjmlTemplate);
      const mjmlWithVariables = handlebarsTemplate(context);
      
      // Compilar MJML a HTML
      const { html, errors } = mjml(mjmlWithVariables, {
        validationLevel: 'soft',
        filePath: this.templatesPath
      });

      if (errors && errors.length > 0) {
        this.logger.warn(`MJML warnings for template ${templateName}:`, errors);
      }

      return html;
    } catch (error) {
      this.logger.error(`Error compiling template ${templateName}:`, error);
      throw new Error(`Failed to compile template: ${error.message}`);
    }
  }

  async compileTextTemplate(templateName: string, context: TemplateContext): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.txt`);
      
      if (!fs.existsSync(templatePath)) {
        // Si no existe template de texto, crear uno básico
        return this.createBasicTextFromContext(context);
      }

      const textTemplate = fs.readFileSync(templatePath, 'utf8');
      const handlebarsTemplate = Handlebars.compile(textTemplate);
      
      return handlebarsTemplate(context);
    } catch (error) {
      this.logger.error(`Error compiling text template ${templateName}:`, error);
      // Fallback a texto básico
      return this.createBasicTextFromContext(context);
    }
  }

  private createBasicTextFromContext(context: TemplateContext): string {
    return Object.entries(context)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  templateExists(templateName: string): boolean {
    const templatePath = path.join(this.templatesPath, `${templateName}.mjml`);
    return fs.existsSync(templatePath);
  }
}
