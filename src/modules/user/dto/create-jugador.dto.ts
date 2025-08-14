import { IsNotEmpty, IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { UserRolesEnum } from '../usuario.types';

export class CreateJugadorDto {
    @IsNotEmpty()
    @IsString()
    nombre: string;

    @IsNotEmpty()
    @IsEmail()
    correo: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsOptional()
    @IsEnum(UserRolesEnum)
    rol?: UserRolesEnum = UserRolesEnum.JUGADOR;
}
