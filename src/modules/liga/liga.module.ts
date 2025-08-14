import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigaService } from './liga.service';
import { LigaController } from './liga.controller';
import { Liga } from './entities/liga.entity';
import { Usuario } from '../user/entities/usuario.entity';
import { Sede } from '../sede/entities/sede.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Liga, Usuario, Sede])],
  controllers: [LigaController],
  providers: [LigaService],
  exports: [LigaService],
})
export class LigaModule {}
