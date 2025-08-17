import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigaService } from './liga.service';
import { LigaController } from './liga.controller';
import { Liga } from './entities/liga.entity';
import { LigaCapitan } from './entities/liga-capitan.entity';
import { Usuario } from '../user/entities/usuario.entity';
import { Sede } from '../sede/entities/sede.entity';
import { Equipo } from '../equipo/entities/equipo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Liga, LigaCapitan, Usuario, Sede, Equipo])],
  controllers: [LigaController],
  providers: [LigaService],
  exports: [LigaService],
})
export class LigaModule {}
