import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { compareHash, generateHash } from './utils/hash.helper';
import { JwtService } from '@nestjs/jwt';
import { LoginAuthDto } from './dto/login-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRequest } from 'src/core/interfaces/request.interface';
import { ForgotDto } from './dto/forgot.dto';
import { ForgotPassword } from './entities/forgot-password.entity';
import { ResetDto } from './dto/reset.dto';
import { differenceInHours } from 'date-fns';
import { Usuario } from '../user/entities/usuario.entity';
import { nanoid } from 'nanoid'
import { UserRolesEnum } from '../user/usuario.types';
import { LoginSucursalDto } from './dto/login-sucursalo.dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(Usuario)
    private usersRepository: Repository<Usuario>,
    @InjectRepository(ForgotPassword)
    private forgotRepository: Repository<ForgotPassword>,
    private jwtService: JwtService,
  ){

  }


  async login(loginAuthDto: LoginAuthDto) {
    const userFound = await this.usersRepository.findOne({
      where: {
        correo: loginAuthDto.correo,
      }, 
    })
    if (!userFound) throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    if (!userFound.active) throw new HttpException('Usuario inactivo', HttpStatus.FORBIDDEN);
    const isValid = await compareHash(
      loginAuthDto.password,
      userFound.password,
    );
    if (!isValid) throw new HttpException('PASSWORD_INVALID', HttpStatus.BAD_REQUEST);
    const payload = { name: userFound.nombre, id: userFound.id };
    const data = {
      access_token: this.jwtService.sign(payload)
    };
    return { ...data };
  }

  async loginSucursal(loginAuthDto:LoginSucursalDto){
    const { code } = loginAuthDto
    const userFound = await this.usersRepository.createQueryBuilder('user')
    .where('user.code = :code', { code }).getOne()
    if (!userFound) throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    if (!userFound.active) throw new HttpException('Usuario inactivo', HttpStatus.FORBIDDEN);
    const payload = { name: userFound.nombre, id: userFound.id };
    const data = {
      access_token: this.jwtService.sign(payload, { expiresIn: '3600d' })
    };
    return { ...data, user:payload };
  }

  async register(registerAuthDto: RegisterAuthDto) {
    const password = await generateHash(registerAuthDto.u_password)
    const payloadUser:Partial<Usuario> = {
      nombre: registerAuthDto.u_name,
      correo: registerAuthDto.u_email,
      password,
      active: true,
      rol: UserRolesEnum.ADMINISTRADOR
    }
    let createdItem = await this.usersRepository.create(payloadUser);
    await this.usersRepository.save(createdItem)
    const payload = { nombre: createdItem.nombre, id: createdItem.id, rol: createdItem.rol, correo: createdItem.correo };
    const data = {
      access_token: this.jwtService.sign(payload),
      user: createdItem,
    };
    return { ...data };
  }

  async refresh(userIn:UserRequest) {
    // try {
    //   const { id } = userIn;
    //   const user = await this.usersRepository.findOne({
    //     where: { id:id }, 
    //     relations: [ 'permissions.resources', 'permissions.branches.brand', 'permissionsExtra', 'permissions.companies' ]
    //   })
    //   delete user.password
    //   const { branches, brands } = this.getBrandsAndBranches(user)
    //   const payload = { name: user.name, id: user.id };
    //   const user_data = { ...user,
    //     permissions:this.clearPermissions(user.permissions), 
    //     permissionsV2: user.permissions,
    //     branches, 
    //     brands,
    //     companies: this.getCompanies(user.permissions),
    //     positions: user.permissions.map(item => item.position),
    //   }
    //   const data = {
    //     access_token: this.jwtService.sign(payload),
    //     user: user_data,
    //     auth: await this.getAuthUser(user)
    //   };
    //   return { ...data };
    // } catch (e) {
    //   console.log(e)
    //   throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
    // }
  }

  getUserFromToken = async ( token:string ):Promise<any> => new Promise(async(resolve,reject) => {
    const payload = this.jwtService.verify( token );
    if( !payload ){
      throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
    }
    const user = await this.usersRepository.findOneBy({id:parseInt(payload.id)})
    if(!user){
      throw new HttpException('Token inválido - Usuario no encontrado', HttpStatus.UNAUTHORIZED);

    }
    resolve({
        id: user.id,
        correo: user?.correo,
        nombre: user.nombre,
        rol: user.rol,
    })
  })

  async forgot( { email }:ForgotDto ){
    const user = await this.usersRepository.findOneBy({correo:email})
    if( !user ) throw new HttpException('FORGOT_INVALID', HttpStatus.UNPROCESSABLE_ENTITY);
    if(!user.active){
      throw new HttpException('Usuario inactivo', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const uuid = nanoid(10)
    const url = `${process.env.PANEL_URL}/auth/reset/${uuid}`
    const forgot = await this.forgotRepository.create({
      user, uuid
    })
    // this.mailService.sendEmail(
    //   { to:email, subject:'Recuperar contraseña', template:'/forgot-email.mjml' },
    //   { url }
    // )
    await this.forgotRepository.save(forgot)
    return { message: 'ok', intranetUser: false }
  }

  async reset( { token, password }:ResetDto ){
    const forgot = await this.forgotRepository.findOne({  where: { uuid:token }, relations: { user:true } }, )
    if( !forgot ) throw new HttpException('FORGOT_INVALID', HttpStatus.UNPROCESSABLE_ENTITY);
    const horasPasadas = differenceInHours(new Date(forgot.createdAt), new Date());
    // console.log(horasPasadas)
    if( horasPasadas > 2 ){
      await this.forgotRepository.remove(forgot)
      throw new HttpException('FORGOT_INVALID', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const user = await this.usersRepository.findOneBy({ id:forgot.user.id })
    if(!user){
      throw new HttpException('Usuario no encontrado', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    user.password = await generateHash(password)
    await this.usersRepository.save(user)
    await this.forgotRepository.remove(forgot)
    return { message:'ok' }
  }

  async me(user:UserRequest) {
    return user
  }

}
