import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { UserRolesEnum } from '../usuario.types';

export class CreateUsuarioTemporalDto {
    @IsNotEmpty()
    @IsString()
    nombre: string;

    @IsEnum(UserRolesEnum)
    rol: UserRolesEnum;

    @IsOptional()
    @IsString()
    descripcion?: string; // Para agregar notas sobre el usuario temporal
}
