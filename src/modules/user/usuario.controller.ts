import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, Put } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as requestInterface from 'src/core/interfaces/request.interface';
import { PageOptionsDto } from 'src/core/interfaces/pageOptions.dto';
import { UserRolesEnum } from './usuario.types';

@Controller('usuario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuarioController {
  constructor(private readonly userService: UsuarioService) {}

  @Post()
  @Roles(UserRolesEnum.ADMINISTRADOR)
  create(@Body() createUserDto: CreateUserDto, @Req() { user }: requestInterface.ExtendedRequest) {
    return this.userService.create(createUserDto, user);
  }

  @Get()
  findAll(@Query() pageOptionsDto: PageOptionsDto, @Req() { user }: requestInterface.ExtendedRequest) {
    return this.userService.findAll(pageOptionsDto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() { user }: requestInterface.ExtendedRequest) {
    return this.userService.update(+id, updateUserDto, user);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string, @Req() { user }: requestInterface.ExtendedRequest) {
    return this.userService.toggleStatus(+id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() { user }: requestInterface.ExtendedRequest) {
    return this.userService.remove(+id,  user);
  }

  @Post('jugador')
  @Roles(UserRolesEnum.ADMINISTRADOR, UserRolesEnum.ADMIN_LIGA, UserRolesEnum.CAPITAN)
  createJugador(@Body() createJugadorDto: CreateJugadorDto) {
    return this.userService.createJugador(createJugadorDto);
  }

  @Put(':id/role')
  changeRole(
    @Param('id') id: string, 
    @Body() changeRoleDto: ChangeRoleDto,
    @Req() { user }: requestInterface.ExtendedRequest
  ) {
    return this.userService.changeRole(+id, changeRoleDto, user);
  }

  @Get('by-role/:role')
  findByRole(@Param('role') role: UserRolesEnum) {
    return this.userService.findByRole(role);
  }

  @Get('qr/:qrCode')
  findByQrCode(@Param('qrCode') qrCode: string) {
    return this.userService.findByQrCode(qrCode);
  }

  @Put(':id/generate-qr')
  generateNewQrCode(@Param('id') id: string) {
    return this.userService.generateNewQrCode(+id);
  }
}
