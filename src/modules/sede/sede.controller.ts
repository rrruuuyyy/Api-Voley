import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SedeService } from './sede.service';
import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRolesEnum } from '../user/usuario.types';

@Controller('sede')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SedeController {
  constructor(private readonly sedeService: SedeService) {}

  @Post()
  @Roles(UserRolesEnum.ADMINISTRADOR)
  create(@Body() createSedeDto: CreateSedeDto) {
    return this.sedeService.create(createSedeDto);
  }

  @Get()
  findAll() {
    return this.sedeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sedeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSedeDto: UpdateSedeDto) {
    return this.sedeService.update(+id, updateSedeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sedeService.remove(+id);
  }
}
