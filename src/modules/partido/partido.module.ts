import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartidoService } from './partido.service';
import { PartidoController } from './partido.controller';
import { Partido } from './entities/partido.entity';
import { Jornada } from './entities/jornada.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { Liga } from '../liga/entities/liga.entity';
import { Usuario } from '../user/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Partido, Jornada, Equipo, Liga, Usuario])],
  controllers: [PartidoController],
  providers: [PartidoService],
  exports: [PartidoService],
})
export class PartidoModule {}
