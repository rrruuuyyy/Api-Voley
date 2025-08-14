import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SedeService } from './sede.service';
import { SedeController } from './sede.controller';
import { Sede } from './entities/sede.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sede])],
  controllers: [SedeController],
  providers: [SedeService],
  exports: [SedeService],
})
export class SedeModule {}
