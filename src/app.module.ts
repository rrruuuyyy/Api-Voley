
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsuarioModule } from './modules/user/usuario.module';
import { SedeModule } from './modules/sede/sede.module';
import { LigaModule } from './modules/liga/liga.module';
import { EquipoModule } from './modules/equipo/equipo.module';
import { PartidoModule } from './modules/partido/partido.module';
import { DatabaseSeeder } from './database/database.seeder';
import { Usuario } from './modules/user/entities/usuario.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: parseInt(config.get('DATABASE_PORT', '5432'), 10),
        username: config.get('DATABASE_USERNAME'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: true, // Cambia a false en producción
      }),
    }),
    TypeOrmModule.forFeature([Usuario]),
    AuthModule,
    UsuarioModule,
    SedeModule,
    LigaModule,
    EquipoModule,
    PartidoModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseSeeder],
})
export class AppModule {}
