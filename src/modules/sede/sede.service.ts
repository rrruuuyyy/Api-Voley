import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';
import { Sede } from './entities/sede.entity';

@Injectable()
export class SedeService {
  constructor(
    @InjectRepository(Sede)
    private sedeRepository: Repository<Sede>,
  ) {}

  async create(createSedeDto: CreateSedeDto) {
    const sede = this.sedeRepository.create(createSedeDto);
    return await this.sedeRepository.save(sede);
  }

  async findAll() {
    return await this.sedeRepository.find({
      where: { active: true },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number) {
    const sede = await this.sedeRepository.findOne({
      where: { id, active: true }
    });
    if (!sede) {
      throw new HttpException('Sede no encontrada', HttpStatus.NOT_FOUND);
    }
    return sede;
  }

  async update(id: number, updateSedeDto: UpdateSedeDto) {
    const sede = await this.findOne(id);
    Object.assign(sede, updateSedeDto);
    return await this.sedeRepository.save(sede);
  }

  async remove(id: number) {
    const sede = await this.findOne(id);
    sede.active = false;
    await this.sedeRepository.save(sede);
    return { message: 'Sede eliminada correctamente' };
  }
}
