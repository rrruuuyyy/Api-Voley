import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { AddJugadorEquipoDto } from './dto/add-jugador-equipo.dto';
import { UpdateJugadorEquipoDto } from './dto/update-jugador-equipo.dto';
import { AsignarGruposDto, AsignarGruposAutomaticoDto, UpdateGrupoEquipoDto } from './dto/asignar-grupos.dto';
import { Equipo } from './entities/equipo.entity';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { Usuario } from '../user/entities/usuario.entity';
import { Liga } from '../liga/entities/liga.entity';
import { LigaCapitan } from '../liga/entities/liga-capitan.entity';
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
    @InjectRepository(LigaCapitan)
    private ligaCapitanRepository: Repository<LigaCapitan>,
  ) {}

  async create(createEquipoDto: CreateEquipoDto) {
    // Verificar que el capitán existe y tiene el rol correcto
    const capitan = await this.usuarioRepository.findOne({
      where: { id: createEquipoDto.capitanId, active: true }
    });
    
    if (!capitan) {
      throw new HttpException('Capitán no encontrado', HttpStatus.NOT_FOUND);
    }

    // Verificar que la liga existe
    const liga = await this.ligaRepository.findOne({
      where: { id: createEquipoDto.ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    const equipoLigaExistente = await this.equipoRepository.createQueryBuilder('equipo')
      .where('equipo.ligaId = :ligaId', { ligaId: createEquipoDto.ligaId })
      .andWhere('equipo.capitanId = :capitanId', { capitanId: createEquipoDto.capitanId })
      .getOne();

    if (equipoLigaExistente) {
      throw new HttpException('El capitán ya tiene un equipo en esta liga', HttpStatus.BAD_REQUEST);
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

  async findAll(ligaId?: number, grupo?: number) {
    const whereCondition: any = { active: true };

    if (ligaId) {
      whereCondition.liga = { id: ligaId };
    }

    if (grupo !== undefined) {
      whereCondition.grupoNumero = grupo;
    }

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
      throw new HttpException(
        `El jugador "${jugador.nombre}" ya pertenece a este equipo`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Verificar que el jugador no esté en otro equipo de la misma liga
    const existeEnOtroEquipoLiga = await this.equipoJugadorRepository
      .createQueryBuilder('equipoJugador')
      .innerJoin('equipoJugador.equipo', 'equipo')
      .where('equipoJugador.jugadorId = :jugadorId', { jugadorId: jugador.id })
      .andWhere('equipo.ligaId = :ligaId', { ligaId: equipo.liga.id })
      .andWhere('equipoJugador.active = :active', { active: true })
      .andWhere('equipo.active = :equipoActive', { equipoActive: true })
      .leftJoinAndSelect('equipoJugador.equipo', 'equipoInfo')
      .getOne();

    if (existeEnOtroEquipoLiga) {
      const equipoExistente = await this.equipoRepository.findOne({
        where: { id: existeEnOtroEquipoLiga.equipo.id },
        relations: ['liga']
      });
      
      const nombreEquipo = equipoExistente?.nombre || 'un equipo';
      throw new HttpException(
        `El jugador "${jugador.nombre}" ya pertenece al equipo "${nombreEquipo}" en esta liga`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Verificar que no se esté intentando agregar a otro capitán de la liga
    if (jugador.rol === UserRolesEnum.CAPITAN) {
      // Verificar si este capitán está asignado a la misma liga
      const esCapitanDeLaLiga = await this.ligaCapitanRepository.findOne({
        where: { 
          liga: { id: equipo.liga.id }, 
          capitan: { id: jugador.id }, 
          active: true 
        }
      });

      // Solo bloquear si es capitán de la liga Y NO es el capitán del equipo actual
      if (esCapitanDeLaLiga && jugador.id !== equipo.capitan.id) {
        throw new HttpException(
          `No se puede agregar a "${jugador.nombre}" porque es capitán asignado a esta liga y debe crear su propio equipo`,
          HttpStatus.BAD_REQUEST
        );
      }
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
    const equipo = await this.findOne(equipoId);
    
    // Verificar que no se esté intentando remover al capitán del equipo
    if (equipo.capitan.id === jugadorId) {
      throw new HttpException(
        `No se puede remover a "${equipo.capitan.nombre}" porque es el capitán del equipo`,
        HttpStatus.BAD_REQUEST
      );
    }

    const equipoJugador = await this.equipoJugadorRepository.findOne({
      where: { 
        equipo: { id: equipoId }, 
        jugador: { id: jugadorId }, 
        active: true 
      },
      relations: ['jugador']
    });

    if (!equipoJugador) {
      throw new HttpException('Jugador no encontrado en este equipo', HttpStatus.NOT_FOUND);
    }

    equipoJugador.active = false;
    await this.equipoJugadorRepository.save(equipoJugador);
    
    return { 
      message: `Jugador "${equipoJugador.jugador.nombre}" removido del equipo correctamente` 
    };
  }

  async updateJugadorEquipo(equipoId: number, jugadorId: number, updateJugadorEquipoDto: UpdateJugadorEquipoDto) {
    const equipo = await this.findOne(equipoId);

    const equipoJugador = await this.equipoJugadorRepository.findOne({
      where: { 
        equipo: { id: equipoId }, 
        jugador: { id: jugadorId }, 
        active: true 
      },
      relations: ['jugador']
    });

    if (!equipoJugador) {
      throw new HttpException('Jugador no encontrado en este equipo', HttpStatus.NOT_FOUND);
    }

    // Verificar que el número no esté siendo usado por otro jugador del mismo equipo
    if (updateJugadorEquipoDto.numeroJugador) {
      const numeroExistente = await this.equipoJugadorRepository.findOne({
        where: { 
          equipo: { id: equipoId }, 
          numeroJugador: updateJugadorEquipoDto.numeroJugador,
          active: true 
        },
        relations: ['jugador']
      });

      if (numeroExistente && numeroExistente.jugador.id !== jugadorId) {
        throw new HttpException(
          `El número "${updateJugadorEquipoDto.numeroJugador}" ya está siendo usado por "${numeroExistente.jugador.nombre}" en este equipo`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Actualizar los datos
    Object.assign(equipoJugador, updateJugadorEquipoDto);
    
    const jugadorActualizado = await this.equipoJugadorRepository.save(equipoJugador);

    return {
      message: `Datos de "${equipoJugador.jugador.nombre}" actualizados correctamente`,
      jugador: {
        id: jugadorActualizado.jugador.id,
        nombre: jugadorActualizado.jugador.nombre,
        numeroJugador: jugadorActualizado.numeroJugador,
        posicion: jugadorActualizado.posicion
      }
    };
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
    
    // Validar que el grupo no exceda el número de grupos de la liga
    const liga = await this.ligaRepository.findOne({
      where: { id: equipo.liga.id }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    if (grupoNumero > liga.numeroGrupos) {
      throw new HttpException(
        `El grupo ${grupoNumero} no es válido. La liga "${liga.nombre}" solo tiene ${liga.numeroGrupos} grupos`,
        HttpStatus.BAD_REQUEST
      );
    }

    if (grupoNumero < 1) {
      throw new HttpException('El número de grupo debe ser mayor a 0', HttpStatus.BAD_REQUEST);
    }

    equipo.grupoNumero = grupoNumero;
    return await this.equipoRepository.save(equipo);
  }

  // ===== GESTIÓN AVANZADA DE GRUPOS =====

  async asignarGruposMasivo(asignarGruposDto: AsignarGruposDto) {
    const resultados: any[] = [];
    const errores: any[] = [];

    for (const asignacion of asignarGruposDto.asignaciones) {
      try {
        const equipo = await this.assignarGrupo(asignacion.equipoId, asignacion.grupoNumero);
        resultados.push({
          equipoId: asignacion.equipoId,
          equipoNombre: equipo.nombre,
          grupoAnterior: equipo.grupoNumero,
          grupoNuevo: asignacion.grupoNumero,
          status: 'exitoso'
        });
      } catch (error) {
        errores.push({
          equipoId: asignacion.equipoId,
          grupoNumero: asignacion.grupoNumero,
          error: error.message,
          status: 'error'
        });
      }
    }

    return {
      message: `Asignación masiva completada: ${resultados.length} exitosos, ${errores.length} errores`,
      exitosos: resultados,
      errores: errores,
      resumen: {
        total: asignarGruposDto.asignaciones.length,
        exitosos: resultados.length,
        errores: errores.length
      }
    };
  }

  async asignarGruposAutomatico(asignarAutomaticoDto: AsignarGruposAutomaticoDto) {
    const liga = await this.ligaRepository.findOne({
      where: { id: asignarAutomaticoDto.ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    const equipos = await this.equipoRepository.find({
      where: { liga: { id: asignarAutomaticoDto.ligaId }, active: true },
      relations: ['capitan']
    });

    if (equipos.length === 0) {
      throw new HttpException('No hay equipos en esta liga', HttpStatus.BAD_REQUEST);
    }

    const numeroGrupos = liga.numeroGrupos;
    const equiposPorGrupo = Math.ceil(equipos.length / numeroGrupos);

    let equiposOrdenados = [...equipos];

    // Aplicar método de ordenación
    switch (asignarAutomaticoDto.metodo) {
      case 'ALEATORIO':
        equiposOrdenados = this.shuffleArray(equipos);
        break;
      case 'POR_RANKING':
        // Aquí podrías ordenar por estadísticas si las tienes
        equiposOrdenados = equipos.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'BALANCEADO':
      default:
        // Ordenar alfabéticamente para distribución balanceada
        equiposOrdenados = equipos.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
    }

    // Asignar grupos
    const asignaciones: any[] = [];
    equiposOrdenados.forEach((equipo, index) => {
      const grupoNumero = (index % numeroGrupos) + 1;
      equipo.grupoNumero = grupoNumero;
      asignaciones.push({
        equipoId: equipo.id,
        equipoNombre: equipo.nombre,
        grupoAsignado: grupoNumero
      });
    });

    // Guardar todos los cambios
    await this.equipoRepository.save(equiposOrdenados);

    // Generar resumen por grupo
    const resumenGrupos: any[] = [];
    for (let i = 1; i <= numeroGrupos; i++) {
      const equiposEnGrupo = asignaciones.filter(a => a.grupoAsignado === i);
      resumenGrupos.push({
        grupoNumero: i,
        cantidadEquipos: equiposEnGrupo.length,
        equipos: equiposEnGrupo.map(e => ({ id: e.equipoId, nombre: e.equipoNombre }))
      });
    }

    return {
      message: `Grupos asignados automáticamente usando método "${asignarAutomaticoDto.metodo}"`,
      liga: {
        id: liga.id,
        nombre: liga.nombre,
        numeroGrupos: numeroGrupos
      },
      metodoUsado: asignarAutomaticoDto.metodo,
      totalEquipos: equipos.length,
      equiposPorGrupo: equiposPorGrupo,
      asignaciones: asignaciones,
      resumenGrupos: resumenGrupos
    };
  }

  async getEquiposPorGrupo(ligaId: number) {
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
    const grupos: any = {};
    const equiposSinGrupo: any[] = [];

    equipos.forEach(equipo => {
      if (equipo.grupoNumero === 0) {
        equiposSinGrupo.push({
          id: equipo.id,
          nombre: equipo.nombre,
          capitan: {
            id: equipo.capitan.id,
            nombre: equipo.capitan.nombre
          },
          color: equipo.color,
          descripcion: equipo.descripcion
        });
      } else {
        if (!grupos[equipo.grupoNumero]) {
          grupos[equipo.grupoNumero] = [];
        }
        grupos[equipo.grupoNumero].push({
          id: equipo.id,
          nombre: equipo.nombre,
          capitan: {
            id: equipo.capitan.id,
            nombre: equipo.capitan.nombre
          },
          color: equipo.color,
          descripcion: equipo.descripcion
        });
      }
    });

    // Convertir a array ordenado
    const gruposArray: any[] = [];
    for (let i = 1; i <= liga.numeroGrupos; i++) {
      gruposArray.push({
        grupoNumero: i,
        cantidadEquipos: grupos[i]?.length || 0,
        equipos: grupos[i] || []
      });
    }

    return {
      liga: {
        id: liga.id,
        nombre: liga.nombre,
        numeroGrupos: liga.numeroGrupos
      },
      totalEquipos: equipos.length,
      equiposAsignados: equipos.length - equiposSinGrupo.length,
      equiposSinAsignar: equiposSinGrupo.length,
      grupos: gruposArray,
      equiposSinGrupo: equiposSinGrupo
    };
  }

  async validarConfiguracionGrupos(ligaId: number) {
    const resultado = await this.getEquiposPorGrupo(ligaId);
    const problemas: string[] = [];
    const recomendaciones: string[] = [];

    // Validar que todos los equipos tengan grupo asignado
    if (resultado.equiposSinAsignar > 0) {
      problemas.push(`${resultado.equiposSinAsignar} equipos sin grupo asignado`);
      recomendaciones.push('Usar asignación automática o asignar manualmente');
    }

    // Validar balance entre grupos
    const equiposPorGrupo = resultado.grupos.map((g: any) => g.cantidadEquipos);
    const min = Math.min(...equiposPorGrupo);
    const max = Math.max(...equiposPorGrupo);
    
    if (max - min > 1) {
      problemas.push(`Grupos desbalanceados: min ${min} equipos, max ${max} equipos`);
      recomendaciones.push('Redistribuir equipos para mejor balance');
    }

    // Validar mínimo de equipos por grupo
    const gruposVacios = resultado.grupos.filter((g: any) => g.cantidadEquipos < 2);
    if (gruposVacios.length > 0) {
      problemas.push(`${gruposVacios.length} grupos con menos de 2 equipos`);
      recomendaciones.push('Mínimo 2 equipos por grupo para competición válida');
    }

    return {
      ...resultado,
      validacion: {
        esValida: problemas.length === 0,
        problemas: problemas,
        recomendaciones: recomendaciones,
        puedeIniciarLiga: problemas.length === 0 || (problemas.length === 1 && problemas[0].includes('desbalanceados'))
      }
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
