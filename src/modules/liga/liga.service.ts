import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLigaDto } from './dto/create-liga.dto';
import { UpdateLigaDto } from './dto/update-liga.dto';
import { Liga } from './entities/liga.entity';
import { Usuario } from '../user/entities/usuario.entity';
import { Sede } from '../sede/entities/sede.entity';
import { UserRolesEnum } from '../user/usuario.types';
import { LigaStatusEnum } from './liga.types';

@Injectable()
export class LigaService {
  constructor(
    @InjectRepository(Liga)
    private ligaRepository: Repository<Liga>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Sede)
    private sedeRepository: Repository<Sede>,
  ) {}

  async create(createLigaDto: CreateLigaDto) {
    // Verificar que el adminLiga existe y tiene el rol correcto
    const adminLiga = await this.usuarioRepository.findOne({
      where: { id: createLigaDto.adminLigaId, active: true }
    });
    
    if (!adminLiga) {
      throw new HttpException('Admin de liga no encontrado', HttpStatus.NOT_FOUND);
    }

    if (adminLiga.rol !== UserRolesEnum.ADMIN_LIGA) {
      throw new HttpException('El usuario debe tener rol de admin de liga', HttpStatus.BAD_REQUEST);
    }

    // Verificar que la sede existe
    const sede = await this.sedeRepository.findOne({
      where: { id: createLigaDto.sedeId, active: true }
    });

    if (!sede) {
      throw new HttpException('Sede no encontrada', HttpStatus.NOT_FOUND);
    }

    const liga = this.ligaRepository.create(createLigaDto);
    liga.adminLiga = adminLiga;
    liga.sede = sede;
    liga.fechaInicio = new Date(createLigaDto.fechaInicio);
    liga.fechaFin = createLigaDto.fechaFin ? new Date(createLigaDto.fechaFin) : undefined;

    return await this.ligaRepository.save(liga);
  }

  async findAll() {
    return await this.ligaRepository.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
      relations: ['adminLiga', 'sede']
    });
  }

  async findOne(id: number) {
    const liga = await this.ligaRepository.findOne({
      where: { id, active: true },
      relations: ['adminLiga', 'sede']
    });
    
    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }
    
    return liga;
  }

  async update(id: number, updateLigaDto: UpdateLigaDto) {
    const liga = await this.findOne(id);
    
    if (liga.status === LigaStatusEnum.FINALIZADA) {
      throw new HttpException('No se puede modificar una liga finalizada', HttpStatus.BAD_REQUEST);
    }

    if (updateLigaDto.adminLigaId) {
      const adminLiga = await this.usuarioRepository.findOne({
        where: { id: updateLigaDto.adminLigaId, active: true }
      });
      
      if (!adminLiga || adminLiga.rol !== UserRolesEnum.ADMIN_LIGA) {
        throw new HttpException('Admin de liga no válido', HttpStatus.BAD_REQUEST);
      }
      
      liga.adminLiga = adminLiga;
    }

    if (updateLigaDto.sedeId) {
      const sede = await this.sedeRepository.findOne({
        where: { id: updateLigaDto.sedeId, active: true }
      });
      
      if (!sede) {
        throw new HttpException('Sede no encontrada', HttpStatus.NOT_FOUND);
      }
      
      liga.sede = sede;
    }

    Object.assign(liga, updateLigaDto);
    
    if (updateLigaDto.fechaInicio) {
      liga.fechaInicio = new Date(updateLigaDto.fechaInicio);
    }
    
    if (updateLigaDto.fechaFin) {
      liga.fechaFin = new Date(updateLigaDto.fechaFin);
    }

    return await this.ligaRepository.save(liga);
  }

  async remove(id: number) {
    const liga = await this.findOne(id);
    
    if (liga.status === LigaStatusEnum.EN_CURSO) {
      throw new HttpException('No se puede eliminar una liga en curso', HttpStatus.BAD_REQUEST);
    }
    
    liga.active = false;
    await this.ligaRepository.save(liga);
    
    return { message: 'Liga eliminada correctamente' };
  }

  async iniciarLiga(id: number) {
    const liga = await this.findOne(id);
    
    if (liga.status !== LigaStatusEnum.PROGRAMADA) {
      throw new HttpException('Solo se puede iniciar una liga programada', HttpStatus.BAD_REQUEST);
    }

    liga.status = LigaStatusEnum.EN_CURSO;
    return await this.ligaRepository.save(liga);
  }

  async finalizarLiga(id: number) {
    const liga = await this.findOne(id);
    
    if (liga.status !== LigaStatusEnum.EN_CURSO) {
      throw new HttpException('Solo se puede finalizar una liga en curso', HttpStatus.BAD_REQUEST);
    }

    liga.status = LigaStatusEnum.FINALIZADA;
    return await this.ligaRepository.save(liga);
  }

  // Métodos auxiliares para cálculos de round-robin
  calcularPartidosPorEquipo(numeroEquipos: number, vueltas: number): number {
    return (numeroEquipos - 1) * vueltas;
  }

  calcularPartidosTotales(numeroEquipos: number, vueltas: number): number {
    return (numeroEquipos * (numeroEquipos - 1) / 2) * vueltas;
  }

  calcularJornadas(numeroEquipos: number, vueltas: number): number {
    const jornadasPorVuelta = numeroEquipos % 2 === 0 ? numeroEquipos - 1 : numeroEquipos;
    return jornadasPorVuelta * vueltas;
  }

  calcularPartidosPorJornada(numeroEquipos: number): number {
    return numeroEquipos % 2 === 0 ? numeroEquipos / 2 : (numeroEquipos - 1) / 2;
  }
}
