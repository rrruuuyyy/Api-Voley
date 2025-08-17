import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { TemplateService } from './template.service';
import { MailController } from './mail.controller';

@Module({
  imports: [ConfigModule],
  controllers: [MailController],
  providers: [MailService, TemplateService],
  exports: [MailService, TemplateService],
})
export class MailModule {}
