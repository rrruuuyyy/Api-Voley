import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { EquipoService } from './equipo.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { AddJugadorEquipoDto } from './dto/add-jugador-equipo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRolesEnum } from '../user/usuario.types';

@Controller('equipo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  @Post()
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA)
  create(@Body() createEquipoDto: CreateEquipoDto) {
    return this.equipoService.create(createEquipoDto);
  }

  @Get()
  findAll(@Query('ligaId') ligaId?: string) {
    return this.equipoService.findAll(ligaId ? +ligaId : undefined);
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

  @Put(':id/grupo')
  assignarGrupo(@Param('id') id: string, @Body('grupoNumero') grupoNumero: number) {
    return this.equipoService.assignarGrupo(+id, grupoNumero);
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
