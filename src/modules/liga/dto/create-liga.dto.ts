import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsEnum, IsArray, IsDateString } from 'class-validator';
import { LigaStatusEnum, ScoringSystemEnum, TiebreakCriteriaEnum } from '../liga.types';

export class CreateLigaDto {
    @IsNotEmpty()
    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsEnum(LigaStatusEnum)
    status?: LigaStatusEnum = LigaStatusEnum.PROGRAMADA;

    @IsOptional()
    @IsInt()
    @Min(1)
    vueltas?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    numeroGrupos?: number = 1;

    @IsOptional()
    @IsEnum(ScoringSystemEnum)
    sistemaPuntos?: ScoringSystemEnum = ScoringSystemEnum.FIVB;

    @IsOptional()
    @IsArray()
    @IsEnum(TiebreakCriteriaEnum, { each: true })
    criteriosDesempate?: TiebreakCriteriaEnum[] = [
        TiebreakCriteriaEnum.PUNTOS,
        TiebreakCriteriaEnum.VICTORIAS,
        TiebreakCriteriaEnum.SET_RATIO,
        TiebreakCriteriaEnum.POINT_RATIO,
        TiebreakCriteriaEnum.HEAD_TO_HEAD
    ];

    @IsOptional()
    @IsInt()
    @Min(1)
    maxPartidosPorDia?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(15)
    duracionEstimadaPartido?: number = 60;

    @IsOptional()
    @IsInt()
    @Min(0)
    descansoMinimo?: number = 30;

    @IsNotEmpty()
    @IsDateString()
    fechaInicio: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;

    @IsNotEmpty()
    @IsInt()
    adminLigaId: number;

    @IsNotEmpty()
    @IsInt()
    sedeId: number;
}
