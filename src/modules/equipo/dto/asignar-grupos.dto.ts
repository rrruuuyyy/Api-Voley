import { IsNotEmpty, IsInt, IsArray, Min, Max, IsOptional } from 'class-validator';

export class AsignarGruposDto {
    @IsNotEmpty()
    @IsArray()
    asignaciones: AsignacionGrupoDto[];
}

export class AsignacionGrupoDto {
    @IsNotEmpty()
    @IsInt()
    equipoId: number;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    grupoNumero: number;
}

export class AsignarGruposAutomaticoDto {
    @IsNotEmpty()
    @IsInt()
    ligaId: number;

    @IsOptional()
    metodo?: 'BALANCEADO' | 'ALEATORIO' | 'POR_RANKING' = 'BALANCEADO';
}

export class UpdateGrupoEquipoDto {
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    grupoNumero: number;
}
