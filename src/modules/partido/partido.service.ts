import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { RegistrarResultadoDto } from './dto/registrar-resultado.dto';
import { Partido } from './entities/partido.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { Liga } from '../liga/entities/liga.entity';
import { PartidoStatusEnum } from './partido.types';
import { ScoringSystemEnum } from '../liga/liga.types';

@Injectable()
export class PartidoService {
  constructor(
    @InjectRepository(Partido)
    private partidoRepository: Repository<Partido>,
    @InjectRepository(Equipo)
    private equipoRepository: Repository<Equipo>,
    @InjectRepository(Liga)
    private ligaRepository: Repository<Liga>,
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
}
