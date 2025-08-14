import { IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';

export class AddJugadorEquipoDto {
    @IsNotEmpty()
    @IsInt()
    jugadorId: number;

    @IsOptional()
    @IsString()
    numeroJugador?: string;

    @IsOptional()
    @IsString()
    posicion?: string;
}
