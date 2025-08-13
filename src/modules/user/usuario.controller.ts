import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as requestInterface from 'src/core/interfaces/request.interface';
import { PageOptionsDto } from 'src/core/interfaces/pageOptions.dto';

@Controller('usuario')
@UseGuards(JwtAuthGuard)
export class UsuarioController {
  constructor(private readonly userService: UsuarioService) {}

  @Post()
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
}
