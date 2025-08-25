import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipoService } from './equipo.service';
import { EquipoController } from './equipo.controller';
import { Equipo } from './entities/equipo.entity';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { Usuario } from '../user/entities/usuario.entity';
import { Liga } from '../liga/entities/liga.entity';
import { LigaCapitan } from '../liga/entities/liga-capitan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Equipo, EquipoJugador, Usuario, Liga, LigaCapitan])],
  controllers: [EquipoController],
  providers: [EquipoService],
  exports: [EquipoService],
})
export class EquipoModule {}
