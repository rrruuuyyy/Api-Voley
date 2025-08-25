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
import { EquipoJugador } from '../equipo/entities/equipo-jugador.entity';
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
    @InjectRepository(EquipoJugador)
    private equipoJugadorRepository: Repository<EquipoJugador>,
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
      relations: ['adminLiga', 'sede', 'equipos']
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

    // Verificar qué capitanes ya están asignados a esta liga
    const capitanesYaAsignados = await this.ligaCapitanRepository
      .createQueryBuilder('ligaCapitan')
      .leftJoinAndSelect('ligaCapitan.capitan', 'capitan')
      .where('ligaCapitan.ligaId = :ligaId', { ligaId })
      .andWhere('ligaCapitan.active = :active', { active: true })
      .andWhere('capitan.id IN (:...capitanesIds)', { capitanesIds: asignarCapitanesDto.capitanesIds })
      .getMany();

    const idsYaAsignados = capitanesYaAsignados.map(lc => lc.capitan.id);
    const capitanesNuevos = capitanes.filter(c => !idsYaAsignados.includes(c.id));

    // Verificar si algún capitán nuevo ya tiene un equipo en esta liga
    if (capitanesNuevos.length > 0) {
      const capitanesConEquipo = await this.equipoRepository
        .createQueryBuilder('equipo')
        .leftJoinAndSelect('equipo.capitan', 'capitan')
        .where('equipo.ligaId = :ligaId', { ligaId })
        .andWhere('equipo.capitanId IN (:...capitanesIds)', { capitanesIds: capitanesNuevos.map(c => c.id) })
        .andWhere('equipo.active = :active', { active: true })
        .getMany();

      if (capitanesConEquipo.length > 0) {
        const equiposExistentes = capitanesConEquipo.map(e => 
          `"${e.capitan.nombre}" ya tiene el equipo "${e.nombre}"`
        ).join(', ');
        throw new HttpException(
          `No se pueden asignar capitanes que ya tienen equipos en esta liga: ${equiposExistentes}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Solo crear asignaciones para capitanes nuevos
    if (capitanesNuevos.length > 0) {
      const ligaCapitanes = capitanesNuevos.map(capitan => {
        const ligaCapitan = new LigaCapitan();
        ligaCapitan.liga = liga;
        ligaCapitan.capitan = capitan;
        return ligaCapitan;
      });

      await this.ligaCapitanRepository.save(ligaCapitanes);
    }

    // Obtener todos los capitanes actualmente asignados
    const totalCapitanesAsignados = await this.ligaCapitanRepository.find({
      where: { liga: { id: ligaId }, active: true },
      relations: ['capitan']
    });

    const yaExistian = capitanesYaAsignados.map(lc => lc.capitan.nombre);
    const nuevosAgregados = capitanesNuevos.map(c => c.nombre);

    let mensaje = '';
    if (capitanesNuevos.length > 0 && yaExistian.length > 0) {
      mensaje = `${capitanesNuevos.length} capitanes nuevos asignados. Ya existían: ${yaExistian.join(', ')}`;
    } else if (capitanesNuevos.length > 0) {
      mensaje = `${capitanesNuevos.length} capitanes asignados correctamente a la liga`;
    } else {
      mensaje = `Todos los capitanes ya estaban asignados a la liga`;
    }

    return {
      message: mensaje,
      totalCapitanes: totalCapitanesAsignados.length,
      nuevosAsignados: nuevosAgregados,
      yaExistian: yaExistian,
      capitanes: totalCapitanesAsignados.map(lc => ({ 
        id: lc.capitan.id, 
        nombre: lc.capitan.nombre, 
        correo: lc.capitan.correo 
      }))
    };
  }

  async getCapitanes(ligaId: number) {
    await this.findOne(ligaId); // Verificar que la liga existe

    const ligaCapitanes = await this.ligaCapitanRepository.find({
      where: { liga: { id: ligaId }, active: true },
      relations: ['capitan']
    });

    const capitanesConEquipo = await Promise.all(
      ligaCapitanes.map(async (lc) => {
        const equipo = await this.equipoRepository.createQueryBuilder('equipo')
          .where('equipo.ligaId = :ligaId', { ligaId })
          .andWhere('equipo.capitanId = :capitanId', { capitanId: lc.capitan.id })
          .getOne();

        return {
          id: lc.capitan.id,
          nombre: lc.capitan.nombre,
          correo: lc.capitan.correo,
          fechaAsignacion: lc.fechaAsignacion,
          equipo: equipo
        };
      })
    );

    return {
      total: ligaCapitanes.length,
      capitanes: capitanesConEquipo
    };
  }

  async removerCapitan(ligaId: number, capitanId: number) {
    const liga = await this.findOne(ligaId);
    
    if (liga.status !== LigaStatusEnum.PROGRAMADA) {
      throw new HttpException('Solo se pueden remover capitanes de una liga programada', HttpStatus.BAD_REQUEST);
    }

    // Verificar que el capitán esté asignado a la liga
    const ligaCapitan = await this.ligaCapitanRepository.findOne({
      where: { 
        liga: { id: ligaId }, 
        capitan: { id: capitanId }, 
        active: true 
      },
      relations: ['capitan']
    });

    if (!ligaCapitan) {
      throw new HttpException('El capitán no está asignado a esta liga', HttpStatus.NOT_FOUND);
    }

    // Verificar si el capitán tiene un equipo en la liga
    const equipo = await this.equipoRepository.findOne({
      where: { 
        liga: { id: ligaId }, 
        capitan: { id: capitanId }, 
        active: true 
      },
      relations: ['capitan']
    });

    if (equipo) {
      // Desactivar todos los jugadores del equipo
      await this.equipoJugadorRepository.update(
        { equipo: { id: equipo.id }, active: true },
        { active: false }
      );

      // Desactivar el equipo
      equipo.active = false;
      await this.equipoRepository.save(equipo);
    }

    // Desactivar la asignación del capitán
    ligaCapitan.active = false;
    await this.ligaCapitanRepository.save(ligaCapitan);

    const mensaje = equipo 
      ? `Capitán "${ligaCapitan.capitan.nombre}" removido de la liga. Su equipo "${equipo.nombre}" y sus jugadores han sido eliminados`
      : `Capitán "${ligaCapitan.capitan.nombre}" removido de la liga`;

    return {
      message: mensaje,
      equipoEliminado: equipo ? {
        id: equipo.id,
        nombre: equipo.nombre
      } : null
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

  // Métodos para obtener equipos de la liga
  async getEquiposLiga(ligaId: number, grupo?: number) {
    // Verificar que la liga existe
    const liga = await this.ligaRepository.findOne({
      where: { id: ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    // Construir la condición WHERE
    const whereCondition: any = {
      liga: { id: ligaId },
      active: true
    };

    // Si se especifica grupo, agregarlo a la condición
    if (grupo !== undefined) {
      whereCondition.grupoNumero = grupo;
    }

    const equipos = await this.equipoRepository.find({
      where: whereCondition,
      relations: ['capitan', 'liga'],
      order: { grupoNumero: 'ASC', nombre: 'ASC' }
    });

    return {
      liga: {
        id: liga.id,
        nombre: liga.nombre,
        numeroGrupos: liga.numeroGrupos,
        status: liga.status
      },
      grupo: grupo || null,
      totalEquipos: equipos.length,
      equipos: equipos.map(equipo => ({
        id: equipo.id,
        nombre: equipo.nombre,
        grupoNumero: equipo.grupoNumero,
        color: equipo.color,
        descripcion: equipo.descripcion,
        capitan: {
          id: equipo.capitan.id,
          nombre: equipo.capitan.nombre,
          correo: equipo.capitan.correo
        }
      }))
    };
  }

  async getEquiposParaJornadas(ligaId: number) {
    // Verificar que la liga existe
    const liga = await this.ligaRepository.findOne({
      where: { id: ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    const equipos = await this.equipoRepository.find({
      where: { liga: { id: ligaId }, active: true },
      relations: ['capitan'],
      order: { grupoNumero: 'ASC', nombre: 'ASC' }
    });

    // Agrupar equipos por grupo
    const equiposPorGrupo: { [key: number]: any[] } = {};
    const equiposSinGrupo: any[] = [];

    equipos.forEach(equipo => {
      const equipoInfo = {
        id: equipo.id,
        nombre: equipo.nombre,
        grupoNumero: equipo.grupoNumero,
        color: equipo.color,
        capitan: {
          id: equipo.capitan.id,
          nombre: equipo.capitan.nombre
        }
      };

      if (equipo.grupoNumero && equipo.grupoNumero > 0) {
        if (!equiposPorGrupo[equipo.grupoNumero]) {
          equiposPorGrupo[equipo.grupoNumero] = [];
        }
        equiposPorGrupo[equipo.grupoNumero].push(equipoInfo);
      } else {
        equiposSinGrupo.push(equipoInfo);
      }
    });

    // Preparar información para generación de jornadas
    const grupos = Object.keys(equiposPorGrupo).map(grupoNumero => {
      const equiposGrupo = equiposPorGrupo[+grupoNumero];
      const numeroEquipos = equiposGrupo.length;
      
      return {
        grupoNumero: +grupoNumero,
        cantidadEquipos: numeroEquipos,
        equipos: equiposGrupo,
        puedeGenerarJornadas: numeroEquipos >= 2,
        calculos: {
          partidosPorEquipo: this.calcularPartidosPorEquipo(numeroEquipos, liga.vueltas),
          partidosTotales: this.calcularPartidosTotales(numeroEquipos, liga.vueltas),
          jornadas: this.calcularJornadas(numeroEquipos, liga.vueltas),
          partidosPorJornada: this.calcularPartidosPorJornada(numeroEquipos)
        }
      };
    });

    return {
      liga: {
        id: liga.id,
        nombre: liga.nombre,
        numeroGrupos: liga.numeroGrupos,
        vueltas: liga.vueltas,
        status: liga.status
      },
      totalEquipos: equipos.length,
      equiposAsignados: equipos.filter(e => e.grupoNumero && e.grupoNumero > 0).length,
      equiposSinAsignar: equiposSinGrupo.length,
      grupos,
      equiposSinGrupo,
      resumen: {
        gruposConfigurados: grupos.length,
        gruposListosParaJornadas: grupos.filter(g => g.puedeGenerarJornadas).length,
        totalCalculos: {
          partidosTotalesLiga: grupos.reduce((total, grupo) => total + grupo.calculos.partidosTotales, 0),
          jornadasMaximas: Math.max(...grupos.map(g => g.calculos.jornadas), 0)
        }
      }
    };
  }
}
