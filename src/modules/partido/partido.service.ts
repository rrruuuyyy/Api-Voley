import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { RegistrarResultadoDto } from './dto/registrar-resultado.dto';
import { CreateJornadaPersonalizadaDto } from './dto/create-jornada-personalizada.dto';
import { Partido } from './entities/partido.entity';
import { Jornada, JornadaStatusEnum, TipoJornadaEnum } from './entities/jornada.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { Liga } from '../liga/entities/liga.entity';
import { Usuario } from '../user/entities/usuario.entity';
import { PartidoStatusEnum } from './partido.types';
import { ScoringSystemEnum } from '../liga/liga.types';

@Injectable()
export class PartidoService {
  constructor(
    @InjectRepository(Partido)
    private partidoRepository: Repository<Partido>,
    @InjectRepository(Jornada)
    private jornadaRepository: Repository<Jornada>,
    @InjectRepository(Equipo)
    private equipoRepository: Repository<Equipo>,
    @InjectRepository(Liga)
    private ligaRepository: Repository<Liga>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createPartidoDto: CreatePartidoDto) {
    // Verificar equipos
    const equipoLocal = await this.equipoRepository.findOne({
      where: { id: createPartidoDto.equipoLocalId, active: true }
    });
    const equipoVisitante = await this.equipoRepository.findOne({
      where: { id: createPartidoDto.equipoVisitanteId, active: true }
    });

    if (!equipoLocal || !equipoVisitante) {
      throw new HttpException('Uno o ambos equipos no encontrados', HttpStatus.NOT_FOUND);
    }

    if (equipoLocal.id === equipoVisitante.id) {
      throw new HttpException('Un equipo no puede jugar contra sí mismo', HttpStatus.BAD_REQUEST);
    }

    // Verificar liga
    const liga = await this.ligaRepository.findOne({
      where: { id: createPartidoDto.ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    const partido = this.partidoRepository.create(createPartidoDto);
    partido.equipoLocal = equipoLocal;
    partido.equipoVisitante = equipoVisitante;
    partido.liga = liga;

    if (createPartidoDto.fechaHora) {
      partido.fechaHora = new Date(createPartidoDto.fechaHora);
    }

    return await this.partidoRepository.save(partido);
  }

  async generateRoundRobinFixtures(ligaId: number, grupoNumero: number = 0) {
    const liga = await this.ligaRepository.findOne({
      where: { id: ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    // Obtener equipos del grupo
    const equipos = await this.equipoRepository.find({
      where: { 
        liga: { id: ligaId }, 
        grupoNumero: grupoNumero, 
        active: true 
      },
      order: { id: 'ASC' }
    });

    if (equipos.length < 2) {
      throw new HttpException('Se necesitan al menos 2 equipos para generar el fixture', HttpStatus.BAD_REQUEST);
    }

    const fixtures: CreatePartidoDto[] = [];
    const n = equipos.length;
    const esImpar = n % 2 === 1;
    
    // Si hay número impar de equipos, agregamos un equipo "bye" temporal
    let equiposAuxiliares = [...equipos];
    if (esImpar) {
      equiposAuxiliares.push({ id: -1 } as Equipo); // Equipo bye temporal
    }

    const totalEquipos = equiposAuxiliares.length;
    const jornadasPorVuelta = totalEquipos - 1;

    for (let vuelta = 1; vuelta <= liga.vueltas; vuelta++) {
      for (let jornada = 1; jornada <= jornadasPorVuelta; jornada++) {
        const jornadaReal = (vuelta - 1) * jornadasPorVuelta + jornada;
        
        for (let i = 0; i < totalEquipos / 2; i++) {
          let local, visitante;

          if (i === 0) {
            local = equiposAuxiliares[0];
            visitante = equiposAuxiliares[totalEquipos - jornada];
          } else {
            const pos1 = (i + jornada - 1) % (totalEquipos - 1) + 1;
            const pos2 = (totalEquipos - 1 - i + jornada - 1) % (totalEquipos - 1) + 1;
            local = equiposAuxiliares[pos1];
            visitante = equiposAuxiliares[pos2];
          }

          // Saltar si alguno es el equipo "bye"
          if (local.id === -1 || visitante.id === -1) {
            continue;
          }

          // En vuelta par, intercambiar local y visitante
          if (vuelta % 2 === 0) {
            [local, visitante] = [visitante, local];
          }

          fixtures.push({
            equipoLocalId: local.id,
            equipoVisitanteId: visitante.id,
            ligaId: ligaId,
            jornada: jornadaReal,
            vuelta: vuelta,
            status: PartidoStatusEnum.PROGRAMADO
          });
        }
      }
    }

    // Crear todos los partidos
    const partidosCreados: Partido[] = [];
    for (const fixture of fixtures) {
      try {
        const partido = await this.create(fixture);
        partidosCreados.push(partido);
      } catch (error) {
        console.log(`Error creando partido: ${error.message}`);
      }
    }

    return {
      totalPartidos: partidosCreados.length,
      partidosPorJornada: Math.floor(totalEquipos / 2),
      totalJornadas: jornadasPorVuelta * liga.vueltas,
      partidos: partidosCreados
    };
  }

  async registrarResultado(partidoId: number, resultado: RegistrarResultadoDto) {
    const partido = await this.partidoRepository.findOne({
      where: { id: partidoId },
      relations: ['equipoLocal', 'equipoVisitante', 'liga']
    });

    if (!partido) {
      throw new HttpException('Partido no encontrado', HttpStatus.NOT_FOUND);
    }

    if (partido.status === PartidoStatusEnum.FINALIZADO) {
      throw new HttpException('El partido ya está finalizado', HttpStatus.BAD_REQUEST);
    }

    // Validar resultado
    if (resultado.setsEquipoLocal < 0 || resultado.setsEquipoVisitante < 0) {
      throw new HttpException('Los sets no pueden ser negativos', HttpStatus.BAD_REQUEST);
    }

    if (resultado.setsEquipoLocal === resultado.setsEquipoVisitante) {
      throw new HttpException('No puede haber empate en sets', HttpStatus.BAD_REQUEST);
    }

    // Calcular puntos según el sistema de la liga
    const { puntosLocal, puntosVisitante } = this.calcularPuntos(
      resultado.setsEquipoLocal,
      resultado.setsEquipoVisitante,
      partido.liga.sistemaPuntos
    );

    // Actualizar partido
    partido.setsEquipoLocal = resultado.setsEquipoLocal;
    partido.setsEquipoVisitante = resultado.setsEquipoVisitante;
    partido.detallesSets = resultado.detallesSets;
    partido.puntosEquipoLocal = puntosLocal;
    partido.puntosEquipoVisitante = puntosVisitante;
    partido.observaciones = resultado.observaciones;
    partido.status = PartidoStatusEnum.FINALIZADO;

    return await this.partidoRepository.save(partido);
  }

  private calcularPuntos(setsLocal: number, setsVisitante: number, sistema: ScoringSystemEnum): {puntosLocal: number, puntosVisitante: number} {
    if (sistema === ScoringSystemEnum.FIVB) {
      // Sistema FIVB: 3-0/3-1 → 3pts/0pts, 3-2 → 2pts/1pt
      if (setsLocal > setsVisitante) {
        return setsLocal === 3 && setsVisitante <= 1 
          ? { puntosLocal: 3, puntosVisitante: 0 }
          : { puntosLocal: 2, puntosVisitante: 1 };
      } else {
        return setsVisitante === 3 && setsLocal <= 1 
          ? { puntosLocal: 0, puntosVisitante: 3 }
          : { puntosLocal: 1, puntosVisitante: 2 };
      }
    } else {
      // Sistema simple: Victoria 3pts, Derrota 0pts
      return setsLocal > setsVisitante
        ? { puntosLocal: 3, puntosVisitante: 0 }
        : { puntosLocal: 0, puntosVisitante: 3 };
    }
  }

  async findByLiga(ligaId: number, jornada?: number) {
    const whereCondition: any = { liga: { id: ligaId } };
    if (jornada) {
      whereCondition.jornada = jornada;
    }

    return await this.partidoRepository.find({
      where: whereCondition,
      relations: ['equipoLocal', 'equipoVisitante', 'liga'],
      order: { jornada: 'ASC', id: 'ASC' }
    });
  }

  async findOne(id: number) {
    const partido = await this.partidoRepository.findOne({
      where: { id },
      relations: ['equipoLocal', 'equipoVisitante', 'liga']
    });

    if (!partido) {
      throw new HttpException('Partido no encontrado', HttpStatus.NOT_FOUND);
    }

    return partido;
  }

  async getTablaLiga(ligaId: number, grupoNumero: number = 0) {
    // Obtener todos los partidos finalizados de la liga/grupo
    const partidos = await this.partidoRepository.find({
      where: { 
        liga: { id: ligaId },
        status: PartidoStatusEnum.FINALIZADO,
        equipoLocal: { grupoNumero },
        equipoVisitante: { grupoNumero }
      },
      relations: ['equipoLocal', 'equipoVisitante']
    });

    // Obtener equipos del grupo
    const equipos = await this.equipoRepository.find({
      where: { liga: { id: ligaId }, grupoNumero, active: true },
      relations: ['capitan']
    });

    // Calcular estadísticas por equipo
    const tabla = equipos.map(equipo => {
      const stats = {
        equipo,
        partidosJugados: 0,
        victorias: 0,
        derrotas: 0,
        setsGanados: 0,
        setsPerdidos: 0,
        puntosAFavor: 0,
        puntosEnContra: 0,
        puntosLiga: 0
      };

      partidos.forEach(partido => {
        if (partido.equipoLocal.id === equipo.id) {
          stats.partidosJugados++;
          stats.setsGanados += partido.setsEquipoLocal;
          stats.setsPerdidos += partido.setsEquipoVisitante;
          stats.puntosLiga += partido.puntosEquipoLocal;
          
          // Sumar puntos del detalle de sets
          if (partido.detallesSets) {
            partido.detallesSets.forEach(set => {
              stats.puntosAFavor += set.local;
              stats.puntosEnContra += set.visitante;
            });
          }

          if (partido.setsEquipoLocal > partido.setsEquipoVisitante) {
            stats.victorias++;
          } else {
            stats.derrotas++;
          }
        } else if (partido.equipoVisitante.id === equipo.id) {
          stats.partidosJugados++;
          stats.setsGanados += partido.setsEquipoVisitante;
          stats.setsPerdidos += partido.setsEquipoLocal;
          stats.puntosLiga += partido.puntosEquipoVisitante;

          // Sumar puntos del detalle de sets
          if (partido.detallesSets) {
            partido.detallesSets.forEach(set => {
              stats.puntosAFavor += set.visitante;
              stats.puntosEnContra += set.local;
            });
          }

          if (partido.setsEquipoVisitante > partido.setsEquipoLocal) {
            stats.victorias++;
          } else {
            stats.derrotas++;
          }
        }
      });

      return {
        ...stats,
        setRatio: stats.setsPerdidos > 0 ? (stats.setsGanados / stats.setsPerdidos) : stats.setsGanados,
        pointRatio: stats.puntosEnContra > 0 ? (stats.puntosAFavor / stats.puntosEnContra) : stats.puntosAFavor
      };
    });

    // Ordenar tabla según criterios de desempate
    tabla.sort((a, b) => {
      // 1. Puntos de liga
      if (a.puntosLiga !== b.puntosLiga) return b.puntosLiga - a.puntosLiga;
      
      // 2. Número de victorias
      if (a.victorias !== b.victorias) return b.victorias - a.victorias;
      
      // 3. Set ratio
      if (a.setRatio !== b.setRatio) return b.setRatio - a.setRatio;
      
      // 4. Point ratio
      return b.pointRatio - a.pointRatio;
    });

    return tabla;
  }

  // ===== MÉTODOS PARA JORNADAS PERSONALIZADAS =====

  async createJornadaPersonalizada(createJornadaDto: CreateJornadaPersonalizadaDto, userId: number) {
    // Verificar liga
    const liga = await this.ligaRepository.findOne({
      where: { id: createJornadaDto.ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    // Verificar usuario
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId, active: true }
    });

    if (!usuario) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    // Calcular siguiente número de jornada
    const ultimaJornada = await this.jornadaRepository.findOne({
      where: { liga: { id: createJornadaDto.ligaId } },
      order: { numero: 'DESC' }
    });

    const siguienteNumero = ultimaJornada ? ultimaJornada.numero + 1 : 1;

    // Validar partidos
    for (const partidoDto of createJornadaDto.partidos) {
      await this.validarPartidoParaJornada(partidoDto, createJornadaDto.ligaId);
    }

    // Crear jornada
    const jornada = new Jornada();
    jornada.numero = siguienteNumero;
    jornada.nombre = createJornadaDto.nombre;
    jornada.descripcion = createJornadaDto.descripcion;
    jornada.tipo = TipoJornadaEnum.PERSONALIZADA;
    jornada.status = JornadaStatusEnum.PROGRAMADA;
    jornada.partidosTotales = createJornadaDto.partidos.length;
    jornada.partidosCompletados = 0;
    jornada.liga = liga;
    jornada.creadoPor = usuario;

    if (createJornadaDto.fechaProgramada) {
      jornada.fechaProgramada = new Date(createJornadaDto.fechaProgramada);
    }
    if (createJornadaDto.horaProgramada) {
      jornada.horaProgramada = createJornadaDto.horaProgramada;
    }

    const jornadaGuardada = await this.jornadaRepository.save(jornada);

    // Crear partidos
    const partidosCreados: Partido[] = [];
    for (const partidoDto of createJornadaDto.partidos) {
      const partidoCompleto: CreatePartidoDto = {
        equipoLocalId: partidoDto.equipoLocalId,
        equipoVisitanteId: partidoDto.equipoVisitanteId,
        ligaId: createJornadaDto.ligaId,
        jornada: jornadaGuardada.numero,
        vuelta: partidoDto.vuelta || 1,
        fechaHora: partidoDto.fechaHora
      };

      const partido = await this.create(partidoCompleto);
      partido.jornadaPersonalizada = jornadaGuardada;
      await this.partidoRepository.save(partido);
      partidosCreados.push(partido);
    }

    // Obtener jornada completa con relaciones
    const jornadaCompleta = await this.jornadaRepository.findOne({
      where: { id: jornadaGuardada.id },
      relations: ['liga', 'creadoPor', 'partidos', 'partidos.equipoLocal', 'partidos.equipoVisitante']
    });

    return {
      message: 'Jornada personalizada creada exitosamente',
      jornada: jornadaCompleta
    };
  }

  async getPartidosPendientesPorEquipo(equipoId: number) {
    const equipo = await this.equipoRepository.findOne({
      where: { id: equipoId, active: true },
      relations: ['capitan', 'liga']
    });

    if (!equipo) {
      throw new HttpException('Equipo no encontrado', HttpStatus.NOT_FOUND);
    }

    // Obtener partidos pendientes
    const partidosPendientes = await this.partidoRepository.find({
      where: [
        { 
          equipoLocal: { id: equipoId }, 
          status: PartidoStatusEnum.PROGRAMADO 
        },
        { 
          equipoVisitante: { id: equipoId }, 
          status: PartidoStatusEnum.PROGRAMADO 
        }
      ],
      relations: ['equipoLocal', 'equipoVisitante', 'jornadaPersonalizada'],
      order: { jornada: 'ASC', fechaHora: 'ASC' }
    });

    // Obtener estadísticas del equipo
    const estadisticas = await this.getEstadisticasEquipo(equipoId);

    const partidosFormateados = partidosPendientes.map(partido => ({
      id: partido.id,
      jornada: partido.jornada,
      vuelta: partido.vuelta,
      fechaHora: partido.fechaHora,
      status: partido.status,
      rivales: {
        id: partido.equipoLocal.id === equipoId ? partido.equipoVisitante.id : partido.equipoLocal.id,
        nombre: partido.equipoLocal.id === equipoId ? partido.equipoVisitante.nombre : partido.equipoLocal.nombre
      },
      esLocal: partido.equipoLocal.id === equipoId,
      jornadaPersonalizada: partido.jornadaPersonalizada ? {
        id: partido.jornadaPersonalizada.id,
        nombre: partido.jornadaPersonalizada.nombre
      } : null
    }));

    return {
      equipo: {
        id: equipo.id,
        nombre: equipo.nombre,
        capitan: {
          id: equipo.capitan.id,
          nombre: equipo.capitan.nombre
        }
      },
      partidosPendientes: {
        total: partidosPendientes.length,
        programados: partidosPendientes.filter(p => p.status === PartidoStatusEnum.PROGRAMADO).length,
        enCurso: partidosPendientes.filter(p => p.status === PartidoStatusEnum.EN_CURSO).length,
        partidos: partidosFormateados
      },
      estatisticas: estadisticas
    };
  }

  async getEstadoGeneralLiga(ligaId: number) {
    const liga = await this.ligaRepository.findOne({
      where: { id: ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    // Obtener equipos y sus estadísticas
    const equipos = await this.equipoRepository.find({
      where: { liga: { id: ligaId }, active: true }
    });

    const totalPartidos = await this.partidoRepository.count({
      where: { liga: { id: ligaId } }
    });

    const partidosCompletados = await this.partidoRepository.count({
      where: { liga: { id: ligaId }, status: PartidoStatusEnum.FINALIZADO }
    });

    const partidosPendientes = totalPartidos - partidosCompletados;

    // Obtener estadísticas por equipo
    const equiposConEstadisticas = await Promise.all(
      equipos.map(async (equipo) => {
        const stats = await this.getEstadisticasEquipo(equipo.id);
        const pendientes = await this.partidoRepository.count({
          where: [
            { equipoLocal: { id: equipo.id }, status: PartidoStatusEnum.PROGRAMADO },
            { equipoVisitante: { id: equipo.id }, status: PartidoStatusEnum.PROGRAMADO }
          ]
        });

        return {
          id: equipo.id,
          nombre: equipo.nombre,
          partidosJugados: stats.partidosJugados,
          partidosPendientes: pendientes,
          puntos: stats.puntosLiga,
          posicion: 0 // Se calculará después
        };
      })
    );

    // Ordenar por puntos para asignar posiciones
    equiposConEstadisticas.sort((a, b) => b.puntos - a.puntos);
    equiposConEstadisticas.forEach((equipo, index) => {
      equipo.posicion = index + 1;
    });

    // Obtener próximas jornadas
    const proximasJornadas = await this.jornadaRepository.find({
      where: { 
        liga: { id: ligaId }, 
        status: JornadaStatusEnum.PROGRAMADA,
        active: true
      },
      order: { numero: 'ASC' },
      take: 5
    });

    const jornadaActual = await this.partidoRepository
      .createQueryBuilder('partido')
      .where('partido.ligaId = :ligaId', { ligaId })
      .orderBy('partido.jornada', 'DESC')
      .getOne();

    return {
      liga: {
        id: liga.id,
        nombre: liga.nombre,
        status: liga.status,
        vueltas: liga.vueltas,
        numeroGrupos: liga.numeroGrupos,
        sistemaPuntos: liga.sistemaPuntos
      },
      resumen: {
        equiposTotal: equipos.length,
        partidosTotales: totalPartidos,
        partidosCompletados,
        partidosPendientes,
        jornadaActual: jornadaActual?.jornada || 0,
        porcentajeCompletado: totalPartidos > 0 ? (partidosCompletados / totalPartidos) * 100 : 0
      },
      equipos: equiposConEstadisticas,
      proximasJornadas: proximasJornadas.map(jornada => ({
        id: jornada.id,
        numero: jornada.numero,
        nombre: jornada.nombre,
        tipo: jornada.tipo,
        fechaProgramada: jornada.fechaProgramada,
        partidosPendientes: jornada.partidosTotales - jornada.partidosCompletados,
        partidosTotales: jornada.partidosTotales
      }))
    };
  }

  async getJornadasPorLiga(ligaId: number, tipo?: TipoJornadaEnum, status?: JornadaStatusEnum) {
    const where: any = { liga: { id: ligaId }, active: true };
    
    if (tipo && tipo !== 'ALL' as any) {
      where.tipo = tipo;
    }
    
    if (status && status !== 'ALL' as any) {
      where.status = status;
    }

    return await this.jornadaRepository.find({
      where,
      relations: ['creadoPor'],
      order: { numero: 'ASC' }
    });
  }

  private async validarPartidoParaJornada(partidoDto: any, ligaId: number) {
    // Verificar que los equipos existan y pertenezcan a la liga
    const equipoLocal = await this.equipoRepository.findOne({
      where: { id: partidoDto.equipoLocalId, liga: { id: ligaId }, active: true }
    });

    const equipoVisitante = await this.equipoRepository.findOne({
      where: { id: partidoDto.equipoVisitanteId, liga: { id: ligaId }, active: true }
    });

    if (!equipoLocal) {
      throw new HttpException(`Equipo local con ID ${partidoDto.equipoLocalId} no encontrado en esta liga`, HttpStatus.NOT_FOUND);
    }

    if (!equipoVisitante) {
      throw new HttpException(`Equipo visitante con ID ${partidoDto.equipoVisitanteId} no encontrado en esta liga`, HttpStatus.NOT_FOUND);
    }

    if (partidoDto.equipoLocalId === partidoDto.equipoVisitanteId) {
      throw new HttpException('Un equipo no puede jugar contra sí mismo', HttpStatus.BAD_REQUEST);
    }

    // AUTO-DETECTAR VUELTA CORRECTA si no se especificó
    if (!partidoDto.vuelta) {
      partidoDto.vuelta = await this.detectarVueltaCorrecta(ligaId, partidoDto.equipoLocalId, partidoDto.equipoVisitanteId);
    }

    // Verificar que no exista ya este enfrentamiento en la misma vuelta
    const partidoExistente = await this.partidoRepository.findOne({
      where: [
        {
          equipoLocal: { id: partidoDto.equipoLocalId },
          equipoVisitante: { id: partidoDto.equipoVisitanteId },
          vuelta: partidoDto.vuelta,
          liga: { id: ligaId }
        },
        {
          equipoLocal: { id: partidoDto.equipoVisitanteId },
          equipoVisitante: { id: partidoDto.equipoLocalId },
          vuelta: partidoDto.vuelta,
          liga: { id: ligaId }
        }
      ]
    });

    if (partidoExistente) {
      throw new HttpException(
        `El enfrentamiento entre ${equipoLocal.nombre} y ${equipoVisitante.nombre} ya existe en la vuelta ${partidoDto.vuelta}`,
        HttpStatus.CONFLICT
      );
    }
  }

  private async getEstadisticasEquipo(equipoId: number) {
    const partidos = await this.partidoRepository.find({
      where: [
        { equipoLocal: { id: equipoId }, status: PartidoStatusEnum.FINALIZADO },
        { equipoVisitante: { id: equipoId }, status: PartidoStatusEnum.FINALIZADO }
      ],
      relations: ['equipoLocal', 'equipoVisitante']
    });

    let partidosJugados = 0;
    let partidosGanados = 0;
    let partidosPerdidos = 0;
    let setsAFavor = 0;
    let setsEnContra = 0;
    let puntosLiga = 0;

    partidos.forEach(partido => {
      partidosJugados++;
      
      if (partido.equipoLocal.id === equipoId) {
        // Equipo jugó como local
        setsAFavor += partido.setsEquipoLocal;
        setsEnContra += partido.setsEquipoVisitante;
        puntosLiga += partido.puntosEquipoLocal;
        
        if (partido.setsEquipoLocal > partido.setsEquipoVisitante) {
          partidosGanados++;
        } else {
          partidosPerdidos++;
        }
      } else {
        // Equipo jugó como visitante
        setsAFavor += partido.setsEquipoVisitante;
        setsEnContra += partido.setsEquipoLocal;
        puntosLiga += partido.puntosEquipoVisitante;
        
        if (partido.setsEquipoVisitante > partido.setsEquipoLocal) {
          partidosGanados++;
        } else {
          partidosPerdidos++;
        }
      }
    });

    return {
      partidosJugados,
      partidosGanados,
      partidosPerdidos,
      setsAFavor,
      setsEnContra,
      puntosLiga
    };
  }

  async getEstadoGeneralDetallado(ligaId: number) {
    const liga = await this.ligaRepository.findOne({
      where: { id: ligaId, active: true },
      relations: ['adminLiga', 'sede']
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    // Obtener equipos
    const equipos = await this.equipoRepository.find({
      where: { liga: { id: ligaId }, active: true },
      relations: ['capitan']
    });

    // Obtener todos los partidos
    const todosPartidos = await this.partidoRepository.find({
      where: { liga: { id: ligaId } },
      relations: ['equipoLocal', 'equipoVisitante'],
      order: { vuelta: 'ASC', jornada: 'ASC' }
    });

    const partidosCompletados = todosPartidos.filter(p => p.status === PartidoStatusEnum.FINALIZADO);
    const partidosPendientes = todosPartidos.filter(p => p.status === PartidoStatusEnum.PROGRAMADO);

    // Agrupar por vueltas
    const vueltas: any[] = [];
    for (let vuelta = 1; vuelta <= liga.vueltas; vuelta++) {
      const partidosVuelta = todosPartidos.filter(p => p.vuelta === vuelta);
      const completadosVuelta = partidosVuelta.filter(p => p.status === PartidoStatusEnum.FINALIZADO);
      const pendientesVuelta = partidosVuelta.filter(p => p.status === PartidoStatusEnum.PROGRAMADO);

      // Calcular tabla de la vuelta
      const tablaVuelta = await this.calcularTablaVuelta(ligaId, vuelta, equipos);

      // Calcular estadísticas de la vuelta
      const jornadasVuelta = [...new Set(partidosVuelta.map(p => p.jornada))].sort((a, b) => a - b);
      const jornadaActual = Math.max(...completadosVuelta.map(p => p.jornada), 0);
      const proximaJornada = jornadasVuelta.find(j => j > jornadaActual) || null;

      vueltas.push({
        numero: vuelta,
        partidosTotales: partidosVuelta.length,
        partidosCompletados: completadosVuelta.length,
        partidosPendientes: pendientesVuelta.length,
        porcentajeCompletado: partidosVuelta.length > 0 ? 
          (completadosVuelta.length / partidosVuelta.length) * 100 : 0,
        jornadaActual,
        proximaJornada,
        totalJornadas: jornadasVuelta.length,
        estado: this.determinarEstadoVuelta(completadosVuelta.length, partidosVuelta.length),
        tabla: tablaVuelta,
        proximosPartidos: pendientesVuelta
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            equipoLocal: { id: p.equipoLocal.id, nombre: p.equipoLocal.nombre },
            equipoVisitante: { id: p.equipoVisitante.id, nombre: p.equipoVisitante.nombre },
            jornada: p.jornada,
            fechaHora: p.fechaHora
          }))
      });
    }

    // Tabla general de toda la liga
    const tablaGeneral = await this.getTablaLiga(ligaId);

    // Estadísticas generales por equipo
    const equiposConEstadisticas = await Promise.all(
      equipos.map(async (equipo) => {
        const estadisticasGenerales = await this.getEstadisticasEquipo(equipo.id);
        
        // Estadísticas por vuelta
        const estadisticasPorVuelta: any[] = [];
        for (let vuelta = 1; vuelta <= liga.vueltas; vuelta++) {
          const statsVuelta = await this.getEstadisticasEquipoVuelta(equipo.id, vuelta);
          estadisticasPorVuelta.push({
            vuelta,
            ...statsVuelta
          });
        }

        const pendientes = await this.partidoRepository.count({
          where: [
            { equipoLocal: { id: equipo.id }, status: PartidoStatusEnum.PROGRAMADO },
            { equipoVisitante: { id: equipo.id }, status: PartidoStatusEnum.PROGRAMADO }
          ]
        });

        return {
          id: equipo.id,
          nombre: equipo.nombre,
          capitan: {
            id: equipo.capitan.id,
            nombre: equipo.capitan.nombre
          },
          grupoNumero: equipo.grupoNumero,
          estadisticasGenerales,
          estadisticasPorVuelta,
          partidosPendientes: pendientes,
          posicionGeneral: tablaGeneral.findIndex(t => t.equipo.id === equipo.id) + 1
        };
      })
    );

    // Próximas jornadas
    const proximasJornadas = await this.jornadaRepository.find({
      where: { 
        liga: { id: ligaId }, 
        status: JornadaStatusEnum.PROGRAMADA,
        active: true
      },
      order: { numero: 'ASC' },
      take: 5
    });

    return {
      liga: {
        id: liga.id,
        nombre: liga.nombre,
        descripcion: liga.descripcion,
        status: liga.status,
        vueltas: liga.vueltas,
        numeroGrupos: liga.numeroGrupos,
        sistemaPuntos: liga.sistemaPuntos,
        fechaInicio: liga.fechaInicio,
        fechaFin: liga.fechaFin,
        adminLiga: {
          id: liga.adminLiga.id,
          nombre: liga.adminLiga.nombre
        },
        sede: {
          id: liga.sede.id,
          nombre: liga.sede.nombre
        }
      },
      resumenGeneral: {
        equiposTotal: equipos.length,
        partidosTotales: todosPartidos.length,
        partidosCompletados: partidosCompletados.length,
        partidosPendientes: partidosPendientes.length,
        porcentajeCompletado: todosPartidos.length > 0 ? 
          (partidosCompletados.length / todosPartidos.length) * 100 : 0,
        vueltas: liga.vueltas,
        jornadaActual: Math.max(...partidosCompletados.map(p => p.jornada), 0)
      },
      vueltas,
      tablaGeneral,
      equipos: equiposConEstadisticas,
      proximasJornadas: proximasJornadas.map(jornada => ({
        id: jornada.id,
        numero: jornada.numero,
        nombre: jornada.nombre,
        tipo: jornada.tipo,
        fechaProgramada: jornada.fechaProgramada,
        partidosPendientes: jornada.partidosTotales - jornada.partidosCompletados,
        partidosTotales: jornada.partidosTotales
      }))
    };
  }

  private async calcularTablaVuelta(ligaId: number, vuelta: number, equipos: Equipo[]) {
    const partidosVuelta = await this.partidoRepository.find({
      where: { 
        liga: { id: ligaId },
        vuelta,
        status: PartidoStatusEnum.FINALIZADO
      },
      relations: ['equipoLocal', 'equipoVisitante']
    });

    const tabla = equipos.map(equipo => {
      const stats = {
        equipo: {
          id: equipo.id,
          nombre: equipo.nombre,
          grupoNumero: equipo.grupoNumero
        },
        partidosJugados: 0,
        victorias: 0,
        derrotas: 0,
        setsGanados: 0,
        setsPerdidos: 0,
        puntosAFavor: 0,
        puntosEnContra: 0,
        puntosLiga: 0
      };

      partidosVuelta.forEach(partido => {
        if (partido.equipoLocal.id === equipo.id) {
          stats.partidosJugados++;
          stats.setsGanados += partido.setsEquipoLocal;
          stats.setsPerdidos += partido.setsEquipoVisitante;
          stats.puntosLiga += partido.puntosEquipoLocal;
          
          if (partido.detallesSets) {
            partido.detallesSets.forEach(set => {
              stats.puntosAFavor += set.local;
              stats.puntosEnContra += set.visitante;
            });
          }

          if (partido.setsEquipoLocal > partido.setsEquipoVisitante) {
            stats.victorias++;
          } else {
            stats.derrotas++;
          }
        } else if (partido.equipoVisitante.id === equipo.id) {
          stats.partidosJugados++;
          stats.setsGanados += partido.setsEquipoVisitante;
          stats.setsPerdidos += partido.setsEquipoLocal;
          stats.puntosLiga += partido.puntosEquipoVisitante;

          if (partido.detallesSets) {
            partido.detallesSets.forEach(set => {
              stats.puntosAFavor += set.visitante;
              stats.puntosEnContra += set.local;
            });
          }

          if (partido.setsEquipoVisitante > partido.setsEquipoLocal) {
            stats.victorias++;
          } else {
            stats.derrotas++;
          }
        }
      });

      return {
        ...stats,
        setRatio: stats.setsPerdidos > 0 ? (stats.setsGanados / stats.setsPerdidos) : stats.setsGanados,
        pointRatio: stats.puntosEnContra > 0 ? (stats.puntosAFavor / stats.puntosEnContra) : stats.puntosAFavor
      };
    });

    // Ordenar tabla
    tabla.sort((a, b) => {
      if (a.puntosLiga !== b.puntosLiga) return b.puntosLiga - a.puntosLiga;
      if (a.victorias !== b.victorias) return b.victorias - a.victorias;
      if (a.setRatio !== b.setRatio) return b.setRatio - a.setRatio;
      return b.pointRatio - a.pointRatio;
    });

    return tabla;
  }

  private async getEstadisticasEquipoVuelta(equipoId: number, vuelta: number) {
    const partidos = await this.partidoRepository.find({
      where: [
        { 
          equipoLocal: { id: equipoId }, 
          vuelta,
          status: PartidoStatusEnum.FINALIZADO 
        },
        { 
          equipoVisitante: { id: equipoId }, 
          vuelta,
          status: PartidoStatusEnum.FINALIZADO 
        }
      ],
      relations: ['equipoLocal', 'equipoVisitante']
    });

    let partidosJugados = 0;
    let partidosGanados = 0;
    let partidosPerdidos = 0;
    let setsAFavor = 0;
    let setsEnContra = 0;
    let puntosLiga = 0;

    partidos.forEach(partido => {
      partidosJugados++;
      
      if (partido.equipoLocal.id === equipoId) {
        setsAFavor += partido.setsEquipoLocal;
        setsEnContra += partido.setsEquipoVisitante;
        puntosLiga += partido.puntosEquipoLocal;
        
        if (partido.setsEquipoLocal > partido.setsEquipoVisitante) {
          partidosGanados++;
        } else {
          partidosPerdidos++;
        }
      } else {
        setsAFavor += partido.setsEquipoVisitante;
        setsEnContra += partido.setsEquipoLocal;
        puntosLiga += partido.puntosEquipoVisitante;
        
        if (partido.setsEquipoVisitante > partido.setsEquipoLocal) {
          partidosGanados++;
        } else {
          partidosPerdidos++;
        }
      }
    });

    return {
      partidosJugados,
      partidosGanados,
      partidosPerdidos,
      setsAFavor,
      setsEnContra,
      puntosLiga
    };
  }

  private determinarEstadoVuelta(completados: number, totales: number): string {
    if (completados === 0) return 'no_iniciada';
    if (completados === totales) return 'completada';
    return 'en_curso';
  }

  private async detectarVueltaCorrecta(ligaId: number, equipoLocalId: number, equipoVisitanteId: number): Promise<number> {
    const liga = await this.ligaRepository.findOne({
      where: { id: ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    // Buscar si este enfrentamiento ya existe en alguna vuelta
    for (let vuelta = 1; vuelta <= liga.vueltas; vuelta++) {
      const partidoExistente = await this.partidoRepository.findOne({
        where: [
          {
            equipoLocal: { id: equipoLocalId },
            equipoVisitante: { id: equipoVisitanteId },
            vuelta,
            liga: { id: ligaId }
          },
          {
            equipoLocal: { id: equipoVisitanteId },
            equipoVisitante: { id: equipoLocalId },
            vuelta,
            liga: { id: ligaId }
          }
        ]
      });

      // Si no existe en esta vuelta, es la vuelta correcta
      if (!partidoExistente) {
        return vuelta;
      }
    }

    // Si ya jugaron en todas las vueltas, error
    throw new HttpException(
      `Los equipos ya se han enfrentado en todas las vueltas disponibles (${liga.vueltas})`,
      HttpStatus.CONFLICT
    );
  }

  async getEstadoVueltasLiga(ligaId: number) {
    const liga = await this.ligaRepository.findOne({
      where: { id: ligaId, active: true }
    });

    if (!liga) {
      throw new HttpException('Liga no encontrada', HttpStatus.NOT_FOUND);
    }

    const vueltas: any[] = [];
    for (let vuelta = 1; vuelta <= liga.vueltas; vuelta++) {
      const partidosVuelta = await this.partidoRepository.find({
        where: { liga: { id: ligaId }, vuelta }
      });

      const completados = partidosVuelta.filter(p => p.status === PartidoStatusEnum.FINALIZADO).length;
      const pendientes = partidosVuelta.filter(p => p.status === PartidoStatusEnum.PROGRAMADO).length;

      const porcentaje = partidosVuelta.length > 0 ? (completados / partidosVuelta.length) * 100 : 0;
      
      vueltas.push({
        numero: vuelta,
        totalPartidos: partidosVuelta.length,
        completados,
        pendientes,
        porcentajeCompletado: porcentaje,
        estado: this.determinarEstadoVuelta(completados, partidosVuelta.length),
        puedeCrearJornada: pendientes > 0 || completados === 0
      });
    }

    // Determinar vuelta actual (última con partidos o primera sin partidos)
    let vueltaActual = 1;
    for (const vuelta of vueltas) {
      if (vuelta.estado === 'en_curso') {
        vueltaActual = vuelta.numero;
        break;
      } else if (vuelta.estado === 'no_iniciada') {
        vueltaActual = vuelta.numero;
        break;
      } else if (vuelta.estado === 'completada') {
        vueltaActual = vuelta.numero + 1 <= liga.vueltas ? vuelta.numero + 1 : vuelta.numero;
      }
    }

    return {
      liga: {
        id: liga.id,
        nombre: liga.nombre,
        vueltas: liga.vueltas
      },
      vueltaActual,
      vueltas,
      resumen: {
        totalVueltas: liga.vueltas,
        vueltasCompletadas: vueltas.filter(v => v.estado === 'completada').length,
        vueltasEnCurso: vueltas.filter(v => v.estado === 'en_curso').length,
        vueltasSinIniciar: vueltas.filter(v => v.estado === 'no_iniciada').length
      }
    };
  }
}
