import { IsNotEmpty, IsString, IsOptional, IsInt, IsArray, IsDateString, IsEnum, Matches } from 'class-validator';
import { TipoJornadaEnum } from '../entities/jornada.entity';

export class CreateJornadaPersonalizadaDto {
    @IsNotEmpty()
    @IsString()
    nombre: string; // Ej: "Jornada de Recuperación", "Fecha Especial"

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsNotEmpty()
    @IsInt()
    ligaId: number;

    @IsOptional()
    @IsDateString()
    fechaProgramada?: string; // YYYY-MM-DD

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'La hora debe tener formato HH:MM' })
    horaProgramada?: string; // HH:MM

    @IsNotEmpty()
    @IsArray()
    partidos: CreatePartidoEnJornadaDto[]; // Partidos a incluir en esta jornada
}

export class CreatePartidoEnJornadaDto {
    @IsNotEmpty()
    @IsInt()
    equipoLocalId: number;

    @IsNotEmpty()
    @IsInt()
    equipoVisitanteId: number;

    @IsOptional()
    @IsInt()
    vuelta?: number = 1;

    @IsOptional()
    @IsDateString()
    fechaHora?: string; // Fecha/hora específica del partido (opcional)
}

export class UpdateJornadaDto {
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsDateString()
    fechaProgramada?: string;

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'La hora debe tener formato HH:MM' })
    horaProgramada?: string;
}
