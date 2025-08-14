import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { AddJugadorEquipoDto } from './dto/add-jugador-equipo.dto';
import { Equipo } from './entities/equipo.entity';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { Usuario } from '../user/entities/usuario.entity';
import { Liga } from '../liga/entities/liga.entity';
import { UserRolesEnum } from '../user/usuario.types';
import { nanoid } from 'nanoid';

@Injectable()
export class EquipoService {
  constructor(
    @InjectRepository(Equipo)
    private equipoRepository: Repository<Equipo>,
    @InjectRepository(EquipoJugador)
    private equipoJugadorRepository: Repository<EquipoJugador>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Liga)
    private ligaRepository: Repository<Liga>,
  ) {}

  async create(createEquipoDto: CreateEquipoDto) {
    // Verificar que el capitán existe y tiene el rol correcto
    const capitan = await this.usuarioRepository.findOne({
      where: { id: createEquipoDto.capitanId, active: true }
    });
    
    if (!capitan) {
      throw new HttpException('Capitán no encontrado', HttpStatus.NOT_FOUND);
    }

    if (capitan.rol !== UserRolesEnum.CAPITAN) {
      throw new HttpException('El usuario debe tener rol de capitán', HttpStatus.BAD_REQUEST);
    }

    // Verificar que la liga existe
    const liga = await this.ligaRepository.findOne({
      where: { id: createEquipoDto.ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    const equipo = this.equipoRepository.create(createEquipoDto);
    equipo.capitan = capitan;
    equipo.liga = liga;

    const equipoGuardado = await this.equipoRepository.save(equipo);

    // Agregar al capitán como jugador del equipo automáticamente
    await this.addJugador(equipoGuardado.id, {
      jugadorId: capitan.id,
      numeroJugador: '1',
      posicion: 'Capitán'
    });

    return equipoGuardado;
  }

  async findAll(ligaId?: number) {
    const whereCondition = ligaId 
      ? { active: true, liga: { id: ligaId } }
      : { active: true };

    return await this.equipoRepository.find({
      where: whereCondition,
      relations: ['capitan', 'liga'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number) {
    const equipo = await this.equipoRepository.findOne({
      where: { id, active: true },
      relations: ['capitan', 'liga']
    });
    
    if (!equipo) {
      throw new HttpException('Equipo no encontrado', HttpStatus.NOT_FOUND);
    }
    
    return equipo;
  }

  async findJugadores(equipoId: number) {
    const equipo = await this.findOne(equipoId);
    
    return await this.equipoJugadorRepository.find({
      where: { equipo: { id: equipoId }, active: true },
      relations: ['jugador'],
      order: { createdAt: 'ASC' }
    });
  }

  async addJugador(equipoId: number, addJugadorDto: AddJugadorEquipoDto) {
    const equipo = await this.findOne(equipoId);
    
    const jugador = await this.usuarioRepository.findOne({
      where: { id: addJugadorDto.jugadorId, active: true }
    });

    if (!jugador) {
      throw new HttpException('Jugador no encontrado', HttpStatus.NOT_FOUND);
    }

    // Verificar que el jugador no esté ya en este equipo
    const existeEnEquipo = await this.equipoJugadorRepository.findOne({
      where: { 
        equipo: { id: equipoId }, 
        jugador: { id: jugador.id }, 
        active: true 
      }
    });

    if (existeEnEquipo) {
      throw new HttpException('El jugador ya pertenece a este equipo', HttpStatus.BAD_REQUEST);
    }

    // Si el jugador no tiene QR, generarlo
    if (!jugador.qrCode) {
      jugador.qrCode = nanoid(12);
      await this.usuarioRepository.save(jugador);
    }

    const equipoJugador = this.equipoJugadorRepository.create({
      ...addJugadorDto,
      equipo,
      jugador
    });

    return await this.equipoJugadorRepository.save(equipoJugador);
  }

  async removeJugador(equipoId: number, jugadorId: number) {
    const equipoJugador = await this.equipoJugadorRepository.findOne({
      where: { 
        equipo: { id: equipoId }, 
        jugador: { id: jugadorId }, 
        active: true 
      }
    });

    if (!equipoJugador) {
      throw new HttpException('Jugador no encontrado en este equipo', HttpStatus.NOT_FOUND);
    }

    equipoJugador.active = false;
    await this.equipoJugadorRepository.save(equipoJugador);
    
    return { message: 'Jugador removido del equipo correctamente' };
  }

  async update(id: number, updateEquipoDto: UpdateEquipoDto) {
    const equipo = await this.findOne(id);

    if (updateEquipoDto.capitanId) {
      const capitan = await this.usuarioRepository.findOne({
        where: { id: updateEquipoDto.capitanId, active: true }
      });
      
      if (!capitan || capitan.rol !== UserRolesEnum.CAPITAN) {
        throw new HttpException('Capitán no válido', HttpStatus.BAD_REQUEST);
      }
      
      equipo.capitan = capitan;
    }

    Object.assign(equipo, updateEquipoDto);
    return await this.equipoRepository.save(equipo);
  }

  async remove(id: number) {
    const equipo = await this.findOne(id);
    equipo.active = false;
    await this.equipoRepository.save(equipo);
    
    return { message: 'Equipo eliminado correctamente' };
  }

  async getEquiposByLiga(ligaId: number) {
    return await this.equipoRepository.find({
      where: { liga: { id: ligaId }, active: true },
      relations: ['capitan'],
      order: { grupoNumero: 'ASC', nombre: 'ASC' }
    });
  }

  async assignarGrupo(equipoId: number, grupoNumero: number) {
    const equipo = await this.findOne(equipoId);
    equipo.grupoNumero = grupoNumero;
    return await this.equipoRepository.save(equipo);
  }
}
