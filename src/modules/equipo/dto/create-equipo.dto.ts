import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateEquipoDto {
    @IsNotEmpty()
    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsInt()
    grupoNumero?: number = 0;

    @IsNotEmpty()
    @IsInt()
    capitanId: number;

    @IsNotEmpty()
    @IsInt()
    ligaId: number;
}
