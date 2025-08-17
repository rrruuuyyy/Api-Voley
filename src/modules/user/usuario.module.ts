import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  controllers: [UsuarioController],
  providers: [UsuarioService],
  exports: [UsuarioService],
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    MailModule,
  ],
})
export class UsuarioModule {}
