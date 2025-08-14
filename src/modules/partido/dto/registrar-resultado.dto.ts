import { IsNotEmpty, IsInt, IsArray, IsOptional, IsString } from 'class-validator';

export class RegistrarResultadoDto {
    @IsNotEmpty()
    @IsInt()
    setsEquipoLocal: number;

    @IsNotEmpty()
    @IsInt()
    setsEquipoVisitante: number;

    @IsNotEmpty()
    @IsArray()
    detallesSets: { local: number, visitante: number }[];

    @IsOptional()
    @IsString()
    observaciones?: string;
}
