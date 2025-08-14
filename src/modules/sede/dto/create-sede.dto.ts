import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateSedeDto {
    @IsNotEmpty()
    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    direccion?: string;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    numeroCancha?: number = 1;
}
