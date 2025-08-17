import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLigaDto } from './dto/create-liga.dto';
import { UpdateLigaDto } from './dto/update-liga.dto';
import { AsignarCapitanesDto } from './dto/asignar-capitanes.dto';
import { Liga } from './entities/liga.entity';
import { LigaCapitan } from './entities/liga-capitan.entity';
import { Usuario } from '../user/entities/usuario.entity';
import { Sede } from '../sede/entities/sede.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { UserRolesEnum } from '../user/usuario.types';
import { LigaStatusEnum } from './liga.types';
import { PageOptionsDto } from 'src/core/interfaces/pageOptions.dto';
import { paginate } from 'src/core/paginate/paginate';
import { UserRequest } from 'src/core/interfaces/request.interface';

@Injectable()
export class LigaService {
  constructor(
    @InjectRepository(Liga)
    private ligaRepository: Repository<Liga>,
    @InjectRepository(LigaCapitan)
    private ligaCapitanRepository: Repository<LigaCapitan>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Sede)
    private sedeRepository: Repository<Sede>,
    @InjectRepository(Equipo)
    private equipoRepository: Repository<Equipo>,
  ) {}

  async create(createLigaDto: CreateLigaDto, user: UserRequest) {
    // Verificar que el adminLiga existe y tiene el rol correcto
    const adminLiga = await this.usuarioRepository.findOne({
      where: { id: user.id }
    });
    
    if (!adminLiga) {
      throw new HttpException('Admin de liga no encontrado', HttpStatus.NOT_FOUND);
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

  async findAll(pageOptionsDto: PageOptionsDto) {
    const query = this.ligaRepository
      .createQueryBuilder('liga')
      .leftJoinAndSelect('liga.adminLiga', 'adminLiga')
      .leftJoinAndSelect('liga.sede', 'sede')
      .where('liga.active = :active', { active: true })
      .orderBy('liga.createdAt', 'DESC');
    
    return await paginate(query, pageOptionsDto);
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

    // Calcular automáticamente los números de juegos basado en equipos existentes
    await this.calcularNumerosJuegos(id);

    liga.status = LigaStatusEnum.EN_CURSO;
    return await this.ligaRepository.save(liga);
  }

  async asignarCapitanes(ligaId: number, asignarCapitanesDto: AsignarCapitanesDto) {
    const liga = await this.findOne(ligaId);
    
    if (liga.status !== LigaStatusEnum.PROGRAMADA) {
      throw new HttpException('Solo se pueden asignar capitanes a una liga programada', HttpStatus.BAD_REQUEST);
    }

    // Verificar que todos los usuarios existen y son capitanes
    const capitanes = await this.usuarioRepository.createQueryBuilder('usuario')
      .where('usuario.id IN (:...capitanesIds)', { capitanesIds: asignarCapitanesDto.capitanesIds })
      .andWhere('usuario.active = :active', { active: true })
      .getMany();

    if (capitanes.length !== asignarCapitanesDto.capitanesIds.length) {
      throw new HttpException('Algunos capitanes no fueron encontrados', HttpStatus.NOT_FOUND);
    }

    // const capitanesInvalidos = capitanes.filter(capitan => capitan.rol !== UserRolesEnum.CAPITAN);
    // if (capitanesInvalidos.length > 0) {
    //   throw new HttpException('Todos los usuarios deben tener rol de CAPITAN', HttpStatus.BAD_REQUEST);
    // }
    // Eliminar asignaciones anteriores
    await this.ligaCapitanRepository.update(
      { liga: { id: ligaId } },
      { active: false }
    );

    // Crear nuevas asignaciones
    const ligaCapitanes = asignarCapitanesDto.capitanesIds.map(capitanId => {
      const ligaCapitan = new LigaCapitan();
      ligaCapitan.liga = liga;
      const capitan = capitanes.find(c => c.id === capitanId);
      if (!capitan) {
        throw new HttpException(`Capitán con ID ${capitanId} no encontrado`, HttpStatus.NOT_FOUND);
      }
      ligaCapitan.capitan = capitan;
      return ligaCapitan;
    });

    await this.ligaCapitanRepository.save(ligaCapitanes);

    return {
      message: `${capitanes.length} capitanes asignados correctamente a la liga`,
      capitanes: capitanes.map(c => ({ id: c.id, nombre: c.nombre, correo: c.correo }))
    };
  }

  async getCapitanes(ligaId: number) {
    await this.findOne(ligaId); // Verificar que la liga existe

    const ligaCapitanes = await this.ligaCapitanRepository.find({
      where: { liga: { id: ligaId }, active: true },
      relations: ['capitan']
    });

    return {
      total: ligaCapitanes.length,
      capitanes: ligaCapitanes.map(lc => ({
        id: lc.capitan.id,
        nombre: lc.capitan.nombre,
        correo: lc.capitan.correo,
        fechaAsignacion: lc.fechaAsignacion
      }))
    };
  }

  async calcularNumerosJuegos(ligaId: number) {
    const liga = await this.findOne(ligaId);
    
    // Contar equipos reales en la liga
    const numeroEquipos = await this.equipoRepository.count({
      where: { liga: { id: ligaId }, active: true }
    });

    if (numeroEquipos < 2) {
      throw new HttpException('Se necesitan al menos 2 equipos para calcular los juegos', HttpStatus.BAD_REQUEST);
    }

    // Calcular todos los números usando las fórmulas round-robin
    const partidosPorEquipo = this.calcularPartidosPorEquipo(numeroEquipos, liga.vueltas);
    const partidosTotales = this.calcularPartidosTotales(numeroEquipos, liga.vueltas);
    const totalJornadas = this.calcularJornadas(numeroEquipos, liga.vueltas);
    const partidosPorJornada = this.calcularPartidosPorJornada(numeroEquipos);

    // Actualizar la liga con los valores calculados
    liga.numeroEquipos = numeroEquipos;
    liga.partidosPorEquipo = partidosPorEquipo;
    liga.partidosTotales = partidosTotales;
    liga.totalJornadas = totalJornadas;
    liga.partidosPorJornada = partidosPorJornada;

    await this.ligaRepository.save(liga);

    return {
      numeroEquipos,
      partidosPorEquipo,
      partidosTotales,
      totalJornadas,
      partidosPorJornada,
      vueltas: liga.vueltas
    };
  }

  async getEstadisticasLiga(ligaId: number) {
    const liga = await this.findOne(ligaId);
    
    return {
      id: liga.id,
      nombre: liga.nombre,
      status: liga.status,
      vueltas: liga.vueltas,
      numeroEquipos: liga.numeroEquipos,
      partidosPorEquipo: liga.partidosPorEquipo,
      partidosTotales: liga.partidosTotales,
      totalJornadas: liga.totalJornadas,
      partidosPorJornada: liga.partidosPorJornada,
      calculado: liga.numeroEquipos !== null
    };
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
