import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { EquipoService } from './equipo.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { AddJugadorEquipoDto } from './dto/add-jugador-equipo.dto';
import { UpdateJugadorEquipoDto } from './dto/update-jugador-equipo.dto';
import { AsignarGruposDto, AsignarGruposAutomaticoDto, UpdateGrupoEquipoDto } from './dto/asignar-grupos.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRolesEnum } from '../user/usuario.types';

@Controller('equipo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  @Post()
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA, UserRolesEnum.JUGADOR)
  create(@Body() createEquipoDto: CreateEquipoDto) {
    return this.equipoService.create(createEquipoDto);
  }

  @Get()
  findAll(
    @Query('ligaId') ligaId?: string,
    @Query('grupo') grupo?: string
  ) {
    return this.equipoService.findAll(
      ligaId ? +ligaId : undefined, 
      grupo ? +grupo : undefined
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipoService.findOne(+id);
  }

  @Get(':id/jugadores')
  getJugadores(@Param('id') id: string) {
    return this.equipoService.findJugadores(+id);
  }

  @Post(':id/jugadores')
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA, UserRolesEnum.CAPITAN)
  addJugador(@Param('id') id: string, @Body() addJugadorDto: AddJugadorEquipoDto) {
    return this.equipoService.addJugador(+id, addJugadorDto);
  }

  @Delete(':id/jugadores/:jugadorId')
  removeJugador(@Param('id') id: string, @Param('jugadorId') jugadorId: string) {
    return this.equipoService.removeJugador(+id, +jugadorId);
  }

  @Patch(':id/jugadores/:jugadorId')
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA, UserRolesEnum.CAPITAN)
  updateJugadorEquipo(
    @Param('id') id: string, 
    @Param('jugadorId') jugadorId: string, 
    @Body() updateJugadorEquipoDto: UpdateJugadorEquipoDto
  ) {
    return this.equipoService.updateJugadorEquipo(+id, +jugadorId, updateJugadorEquipoDto);
  }

  @Put(':id/grupo')
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA)
  assignarGrupo(@Param('id') id: string, @Body() updateGrupoDto: UpdateGrupoEquipoDto) {
    return this.equipoService.assignarGrupo(+id, updateGrupoDto.grupoNumero);
  }

  // ===== GESTIÓN AVANZADA DE GRUPOS =====

  @Post('grupos/asignar-masivo')
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA)
  asignarGruposMasivo(@Body() asignarGruposDto: AsignarGruposDto) {
    return this.equipoService.asignarGruposMasivo(asignarGruposDto);
  }

  @Post('grupos/asignar-automatico')
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA)
  asignarGruposAutomatico(@Body() asignarAutomaticoDto: AsignarGruposAutomaticoDto) {
    return this.equipoService.asignarGruposAutomatico(asignarAutomaticoDto);
  }

  @Get('grupos/liga/:ligaId')
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA)
  getEquiposPorGrupo(@Param('ligaId') ligaId: string) {
    return this.equipoService.getEquiposPorGrupo(+ligaId);
  }

  @Get('grupos/validar/:ligaId')
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA)
  validarConfiguracionGrupos(@Param('ligaId') ligaId: string) {
    return this.equipoService.validarConfiguracionGrupos(+ligaId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEquipoDto: UpdateEquipoDto) {
    return this.equipoService.update(+id, updateEquipoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipoService.remove(+id);
  }
}
