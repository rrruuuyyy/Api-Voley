import { IsNotEmpty, IsInt, IsOptional, IsDateString, IsEnum, IsArray } from 'class-validator';
import { PartidoStatusEnum } from '../partido.types';

export class CreatePartidoDto {
    @IsNotEmpty()
    @IsInt()
    equipoLocalId: number;

    @IsNotEmpty()
    @IsInt()
    equipoVisitanteId: number;

    @IsNotEmpty()
    @IsInt()
    ligaId: number;

    @IsNotEmpty()
    @IsInt()
    jornada: number;

    @IsOptional()
    @IsInt()
    vuelta?: number = 1;

    @IsOptional()
    @IsDateString()
    fechaHora?: string;

    @IsOptional()
    @IsEnum(PartidoStatusEnum)
    status?: PartidoStatusEnum = PartidoStatusEnum.PROGRAMADO;
}
