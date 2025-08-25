import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigaService } from './liga.service';
import { LigaController } from './liga.controller';
import { Liga } from './entities/liga.entity';
import { LigaCapitan } from './entities/liga-capitan.entity';
import { Usuario } from '../user/entities/usuario.entity';
import { Sede } from '../sede/entities/sede.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { EquipoJugador } from '../equipo/entities/equipo-jugador.entity';
import { PartidoModule } from '../partido/partido.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Liga, LigaCapitan, Usuario, Sede, Equipo, EquipoJugador]),
    PartidoModule
  ],
  controllers: [LigaController],
  providers: [LigaService],
  exports: [LigaService],
})
export class LigaModule {}
