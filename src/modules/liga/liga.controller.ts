import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put, Query, Req } from '@nestjs/common';
import { LigaService } from './liga.service';
import { PartidoService } from '../partido/partido.service';
import { CreateLigaDto } from './dto/create-liga.dto';
import { UpdateLigaDto } from './dto/update-liga.dto';
import { AsignarCapitanesDto } from './dto/asignar-capitanes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRolesEnum } from '../user/usuario.types';
import { PageOptionsDto } from 'src/core/interfaces/pageOptions.dto';
import * as requestInterface from 'src/core/interfaces/request.interface';

@Controller('liga')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LigaController {
  constructor(
    private readonly ligaService: LigaService,
    private readonly partidoService: PartidoService
  ) {}

  @Post()
  @Roles(UserRolesEnum.ADMIN_LIGA, UserRolesEnum.ADMINISTRADOR)
  create(@Body() createLigaDto: CreateLigaDto, @Req() { user }: requestInterface.ExtendedRequest) {
    return this.ligaService.create(createLigaDto, user);
  }

  @Post(':id/capitanes')
  @Roles(UserRolesEnum.ADMIN_LIGA, UserRolesEnum.ADMINISTRADOR)
  asignarCapitanes(@Param('id') id: string, @Body() asignarCapitanesDto: AsignarCapitanesDto) {
    return this.ligaService.asignarCapitanes(+id, asignarCapitanesDto);
  }

  @Delete(':id/capitanes/:capitanId')
  @Roles(UserRolesEnum.ADMIN_LIGA, UserRolesEnum.ADMINISTRADOR)
  removerCapitan(@Param('id') id: string, @Param('capitanId') capitanId: string) {
    return this.ligaService.removerCapitan(+id, +capitanId);
  }

  @Get(':id/capitanes')
  getCapitanes(@Param('id') id: string) {
    return this.ligaService.getCapitanes(+id);
  }

  @Get()
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.ligaService.findAll(pageOptionsDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ligaService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRolesEnum.ADMIN_LIGA, UserRolesEnum.ADMINISTRADOR)
  update(@Param('id') id: string, @Body() updateLigaDto: UpdateLigaDto) {
    return this.ligaService.update(+id, updateLigaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ligaService.remove(+id);
  }

  @Put(':id/iniciar')
  iniciar(@Param('id') id: string) {
    return this.ligaService.iniciarLiga(+id);
  }

  @Put(':id/finalizar')
  finalizar(@Param('id') id: string) {
    return this.ligaService.finalizarLiga(+id);
  }

  @Get(':id/estadisticas')
  getEstadisticas(@Param('id') id: string) {
    return this.ligaService.getEstadisticasLiga(+id);
  }

  @Get(':id/equipos')
  getEquiposLiga(@Param('id') id: string, @Query('grupo') grupo?: string) {
    return this.ligaService.getEquiposLiga(+id, grupo ? +grupo : undefined);
  }

  @Get(':id/equipos/jornadas')
  getEquiposParaJornadas(@Param('id') id: string) {
    return this.ligaService.getEquiposParaJornadas(+id);
  }

  @Get(':id/calculos')
  getCalculos(@Param('id') id: string) {
    const ligaId = +id;
    return {
      partidosPorEquipo: (numeroEquipos: number, vueltas: number) => 
        this.ligaService.calcularPartidosPorEquipo(numeroEquipos, vueltas),
      partidosTotales: (numeroEquipos: number, vueltas: number) => 
        this.ligaService.calcularPartidosTotales(numeroEquipos, vueltas),
      jornadas: (numeroEquipos: number, vueltas: number) => 
        this.ligaService.calcularJornadas(numeroEquipos, vueltas),
      partidosPorJornada: (numeroEquipos: number) => 
        this.ligaService.calcularPartidosPorJornada(numeroEquipos)
    };
  }

  @Get(':id/estado-general')
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA)
  getEstadoGeneral(@Param('id') id: string) {
    return this.partidoService.getEstadoGeneralDetallado(+id);
  }
}
