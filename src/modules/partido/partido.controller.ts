import { Controller, Get, Post, Body, Param, UseGuards, Query, Put } from '@nestjs/common';
import { PartidoService } from './partido.service';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { RegistrarResultadoDto } from './dto/registrar-resultado.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRolesEnum } from '../user/usuario.types';

@Controller('partido')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartidoController {
  constructor(private readonly partidoService: PartidoService) {}

  @Post()
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA)
  create(@Body() createPartidoDto: CreatePartidoDto) {
    return this.partidoService.create(createPartidoDto);
  }

  @Post('generate-fixtures/:ligaId')
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA)
  generateFixtures(
    @Param('ligaId') ligaId: string,
    @Query('grupo') grupo: string = '0'
  ) {
    return this.partidoService.generateRoundRobinFixtures(+ligaId, +grupo);
  }

  @Get('liga/:ligaId')
  findByLiga(
    @Param('ligaId') ligaId: string,
    @Query('jornada') jornada?: string
  ) {
    return this.partidoService.findByLiga(+ligaId, jornada ? +jornada : undefined);
  }

  @Get('tabla/:ligaId')
  getTabla(
    @Param('ligaId') ligaId: string,
    @Query('grupo') grupo: string = '0'
  ) {
    return this.partidoService.getTablaLiga(+ligaId, +grupo);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partidoService.findOne(+id);
  }

  @Put(':id/resultado')
  registrarResultado(
    @Param('id') id: string,
    @Body() resultado: RegistrarResultadoDto
  ) {
    return this.partidoService.registrarResultado(+id, resultado);
  }
}
