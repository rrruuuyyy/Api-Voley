export interface MailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  path?: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
  attachments?: MailAttachment[];
  from?: {
    name: string;
    address: string;
  };
}

export interface TemplateContext {
  [key: string]: any;
}
