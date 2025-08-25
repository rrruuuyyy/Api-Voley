import { IsOptional, IsString } from 'class-validator';

export class UpdateJugadorEquipoDto {
    @IsOptional()
    @IsString()
    numeroJugador?: string;

    @IsOptional()
    @IsString()
    posicion?: string;
}
