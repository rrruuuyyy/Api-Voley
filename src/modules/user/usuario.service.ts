import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Repository } from 'typeorm';
import { UserRequest } from 'src/core/interfaces/request.interface';
import { PageOptionsDto } from 'src/core/interfaces/pageOptions.dto';
import { paginate } from 'src/core/paginate/paginate';
import * as bcrypt from 'bcryptjs';
import { UsuarioActionsEnum } from './usuario.types';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

  ) {}

  async create(createUserDto: CreateUserDto, user: UserRequest) {
    const existingByCorreo = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .where('LOWER(usuario.correo) = LOWER(:correo)', { correo: createUserDto.correo })
      .getOne();

    if (existingByCorreo) {
      throw new ConflictException('Ya existe un usuario con ese correo electrónico');
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);
    const usuario = this.usuarioRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUsuario = await this.usuarioRepository.save(usuario);
    return savedUsuario
  } 

  async findAll(pageOptionsDto: PageOptionsDto, user: UserRequest) {
    const query = this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.sucursal', 'sucursal')
      .select([
        'usuario.id',
        'usuario.nombre',
        'usuario.correo',
        'usuario.rol',
        'usuario.active',
        'sucursal.id',
        'sucursal.nombre'
      ]);
    return await paginate(query, pageOptionsDto);
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.sucursal', 'sucursal')
      .select([
        'usuario.id',
        'usuario.nombre',
        'usuario.correo',
        'usuario.rol',
        'usuario.active',
        'sucursal.id',
        'sucursal.nombre'
      ])
      .where('usuario.id = :id', { id })
      .getOne();
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async update(id: number, updateUserDto: UpdateUserDto, user: UserRequest) {
    if (updateUserDto.correo) {
      const existingByCorreo = await this.usuarioRepository
        .createQueryBuilder('usuario')
        .where('LOWER(usuario.correo) = LOWER(:correo)', { correo: updateUserDto.correo })
        .andWhere('usuario.id != :id', { id })
        .getOne();
      if (existingByCorreo) {
        throw new ConflictException('Ya existe un usuario con ese correo electrónico');
      }
    }
    let updateData: any = { ...updateUserDto };
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }
    if (updateUserDto.sucursalId !== undefined) {
      updateData.sucursal = updateUserDto.sucursalId ? { id: updateUserDto.sucursalId } : null;
      delete updateData.sucursalId;
    }
    const result = await this.usuarioRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return await this.findOne(id);
  }

  async toggleStatus(id: number, user: UserRequest) {
    const usuario = await this.findOne(id);
    if (usuario.rol !== 'administrador') {
      throw new ConflictException('No tienes permisos para cambiar el estado de usuarios');
    }
    if(id === user.id) {
      throw new ConflictException('No puedes cambiar el estado de tu propio usuario');
    }
    usuario.active = !usuario.active;
    await this.usuarioRepository.save(usuario);
    return { message: `Usuario ${usuario.active ? 'activado' : 'desactivado'} correctamente`, usuario };
  }

  async remove(id: number, user:UserRequest) {
    const usuario = await this.findOne(id);
    if(usuario.rol != 'administrador'){
      throw new ConflictException('No tienes permisos para eliminar usuarios');
    }
    if(id === user.id) {
      throw new ConflictException('No puedes eliminar tu propio usuario');
    }
    const result = await this.usuarioRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return { message: 'Usuario eliminado correctamente' };
  }
  async findByEmail(correo: string): Promise<Usuario | null> {
    return await this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.sucursal', 'sucursal')
      .where('LOWER(usuario.correo) = LOWER(:correo)', { correo })
      .getOne();
  }
}
