import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsNumber } from 'class-validator';
import { UserRolesEnum } from '../usuario.types';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsEmail()
  correo: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsEnum(UserRolesEnum)
  rol: UserRolesEnum;

  @IsOptional()
  @IsNumber()
  sucursalId?: number;
}
