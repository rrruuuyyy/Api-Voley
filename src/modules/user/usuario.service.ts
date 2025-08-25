import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { CreateUsuarioTemporalDto } from './dto/create-usuario-temporal.dto';
import { RegistroConQrDto } from './dto/registro-con-qr.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Repository } from 'typeorm';
import { UserRequest } from 'src/core/interfaces/request.interface';
import { PageOptionsDto } from 'src/core/interfaces/pageOptions.dto';
import { paginate } from 'src/core/paginate/paginate';
import * as bcrypt from 'bcryptjs';
import { UsuarioActionsEnum, UserRolesEnum } from './usuario.types';
import { nanoid } from 'nanoid';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly mailService: MailService,
  ) {}

  private removePassword(usuario: Usuario): Omit<Usuario, 'password'> {
    const { password, ...userWithoutPassword } = usuario;
    return userWithoutPassword;
  }

  private generateQrCode(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let qrCode = '';
    
    // Generar 4 letras aleatorias
    for (let i = 0; i < 4; i++) {
      qrCode += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generar 4 números aleatorios
    for (let i = 0; i < 4; i++) {
      qrCode += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return qrCode;
  }

  private async generateUniqueQrCode(): Promise<string> {
    let qrCode = '';
    let exists = true;
    
    // Intentar hasta encontrar un código único
    while (exists) {
      qrCode = this.generateQrCode();
      const existingUser = await this.usuarioRepository.findOne({
        where: { qrCode },
        select: ['id']
      });
      exists = !!existingUser;
    }
    
    return qrCode;
  }

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
    const qrCode = await this.generateUniqueQrCode();
    
    const usuario = this.usuarioRepository.create({
      ...createUserDto,
      password: hashedPassword,
      qrCode,
    });
    
    const savedUsuario = await this.usuarioRepository.save(usuario);
    
    // Enviar correo de bienvenida
    try {
      await this.mailService.sendWelcomeEmail(savedUsuario.correo, {
        nombre: savedUsuario.nombre,
        correo: savedUsuario.correo,
        password: createUserDto.password, // Enviamos la contraseña original antes del hash
        qrCode: savedUsuario.qrCode
      });
    } catch (error) {
      // Log del error pero no fallar la creación del usuario
      console.error('Error enviando correo de bienvenida:', error);
    }
    
    return this.removePassword(savedUsuario);
  } 

  async findAll(pageOptionsDto: PageOptionsDto, user: UserRequest) {
    const query = this.usuarioRepository
      .createQueryBuilder('usuario')
      .select([
        'usuario.id',
        'usuario.nombre',
        'usuario.correo',
        'usuario.rol',
        'usuario.active',
        'usuario.createdAt',
      ]);
    return await paginate(query, pageOptionsDto);
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .select([
        'usuario.id',
        'usuario.nombre',
        'usuario.correo',
        'usuario.rol',
        'usuario.active',
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
      .where('LOWER(usuario.correo) = LOWER(:correo)', { correo })
      .getOne();
  }

  async createJugador(createJugadorDto: CreateJugadorDto) {
    const existingByCorreo = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .where('LOWER(usuario.correo) = LOWER(:correo)', { correo: createJugadorDto.correo })
      .getOne();

    if (existingByCorreo) {
      throw new ConflictException('Ya existe un usuario con ese correo electrónico');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createJugadorDto.password, saltRounds);
    const qrCode = await this.generateUniqueQrCode();
    
    const usuario = this.usuarioRepository.create({
      ...createJugadorDto,
      password: hashedPassword,
      qrCode,
      active: true
    });

    const savedUsuario = await this.usuarioRepository.save(usuario);
    
    // Enviar correo de bienvenida
    try {
      await this.mailService.sendWelcomeEmail(savedUsuario.correo, {
        nombre: savedUsuario.nombre,
        correo: savedUsuario.correo,
        password: createJugadorDto.password, // Enviamos la contraseña original antes del hash
        qrCode: savedUsuario.qrCode
      });
    } catch (error) {
      // Log del error pero no fallar la creación del usuario
      console.error('Error enviando correo de bienvenida:', error);
    }
    
    return this.removePassword(savedUsuario);
  }

  async changeRole(userId: number, changeRoleDto: ChangeRoleDto, adminUser: UserRequest) {
    // Verificar que el usuario que hace la petición es admin
    if (adminUser.rol !== UserRolesEnum.ADMINISTRADOR) {
      throw new HttpException('No tienes permisos para cambiar roles', HttpStatus.FORBIDDEN);
    }

    const usuario = await this.findOne(userId);
    
    // No permitir que el admin se cambie su propio rol
    if (userId === adminUser.id) {
      throw new HttpException('No puedes cambiar tu propio rol', HttpStatus.BAD_REQUEST);
    }

    usuario.rol = changeRoleDto.newRole;
    const updatedUsuario = await this.usuarioRepository.save(usuario);
    
    return this.removePassword(updatedUsuario);
  }

  async findByRole(role: UserRolesEnum) {
    return await this.usuarioRepository.find({
      where: { rol: role, active: true },
      select: ['id', 'nombre', 'correo', 'rol', 'qrCode', 'createdAt']
    });
  }

  async findByQrCode(qrCode: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { qrCode, active: true },
      select: ['id', 'nombre', 'correo', 'rol', 'qrCode']
    });

    if (!usuario) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    return usuario;
  }

  async generateNewQrCode(userId: number) {
    const usuario = await this.findOne(userId);
    usuario.qrCode = await this.generateUniqueQrCode();
    const updatedUsuario = await this.usuarioRepository.save(usuario);
    return this.removePassword(updatedUsuario);
  }

  async createUsuarioTemporal(createUsuarioTemporalDto: CreateUsuarioTemporalDto) {
    // Verificar que no existe un usuario temporal con el mismo nombre
    const existingUser = await this.usuarioRepository.findOne({
      where: { nombre: createUsuarioTemporalDto.nombre, esUsuarioTemporal: true, active: true }
    });

    if (existingUser) {
      throw new ConflictException(`Ya existe un usuario temporal con el nombre "${createUsuarioTemporalDto.nombre}"`);
    }

    // Generar QR único
    const qrCode = await this.generateUniqueQrCode();

    const usuario = new Usuario();
    usuario.nombre = createUsuarioTemporalDto.nombre;
    usuario.rol = createUsuarioTemporalDto.rol;
    usuario.qrCode = qrCode;
    usuario.esUsuarioTemporal = true;
    usuario.active = true;

    const savedUsuario = await this.usuarioRepository.save(usuario);
    
    return {
      message: `Usuario temporal "${savedUsuario.nombre}" creado exitosamente`,
      usuario: this.removePassword(savedUsuario),
      qrCode: savedUsuario.qrCode,
      urlRegistro: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/registro-qr/${savedUsuario.qrCode}`
    };
  }

  async registroConQr(registroConQrDto: RegistroConQrDto) {
    // Buscar usuario temporal por QR
    const usuario = await this.usuarioRepository.findOne({
      where: { 
        qrCode: registroConQrDto.qrCode, 
        esUsuarioTemporal: true, 
        active: true 
      }
    });

    if (!usuario) {
      throw new NotFoundException('Código QR no válido o usuario temporal no encontrado');
    }

    // Verificar que el correo no esté en uso
    const existingUserWithEmail = await this.usuarioRepository.findOne({
      where: { correo: registroConQrDto.correo, active: true }
    });

    if (existingUserWithEmail) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(registroConQrDto.password, 10);

    // Actualizar usuario temporal a usuario completo
    usuario.correo = registroConQrDto.correo;
    usuario.password = hashedPassword;
    usuario.esUsuarioTemporal = false;

    const updatedUsuario = await this.usuarioRepository.save(usuario);

    return {
      message: `¡Registro completado exitosamente! Bienvenido ${updatedUsuario.nombre}`,
      usuario: this.removePassword(updatedUsuario)
    };
  }

  async getUsuarioByQr(qrCode: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { qrCode, active: true }
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado con este código QR');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      esUsuarioTemporal: usuario.esUsuarioTemporal,
      qrCode: usuario.qrCode,
      tieneCorreo: !!usuario.correo
    };
  }

  async getUsuariosTemporales(pageOptionsDto?: PageOptionsDto) {
    const query = this.usuarioRepository
      .createQueryBuilder('usuario')
      .where('usuario.esUsuarioTemporal = :esUsuarioTemporal', { esUsuarioTemporal: true })
      .andWhere('usuario.active = :active', { active: true })
      .orderBy('usuario.createdAt', 'DESC');

    if (pageOptionsDto) {
      return await paginate(query, pageOptionsDto);
    } else {
      const usuarios = await query.getMany();
      return usuarios.map(u => this.removePassword(u));
    }
  }
}
