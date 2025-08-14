import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRequest } from 'src/core/interfaces/request.interface';
import * as _ from 'lodash'
import { Usuario } from '../user/entities/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private usersRepository: Repository<Usuario>,
    
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'MyUltraSecurePassWordIWontForgetToChange',
    });
  }

  async foundUser(id:number){
    const user = await this.usersRepository.createQueryBuilder('user')
    .where('user.id = :id', { id }).getOne()
    return user
  }

  async validate(payload: any):Promise<Partial<UserRequest>>{
    console.log('Payload JWT', payload)
    const user = await this.foundUser(payload.id)
    console.log('User Validate', user)
    if( !user ) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
    if( !user.active ) throw new HttpException('Forbidden-Reset', HttpStatus.FORBIDDEN)
    return {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      qrCode: user.qrCode,
    };
  }
}
