import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartidoService } from './partido.service';
import { PartidoController } from './partido.controller';
import { Partido } from './entities/partido.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { Liga } from '../liga/entities/liga.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Partido, Equipo, Liga])],
  controllers: [PartidoController],
  providers: [PartidoService],
  exports: [PartidoService],
})
export class PartidoModule {}
