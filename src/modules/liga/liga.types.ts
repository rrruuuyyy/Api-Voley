export enum LigaStatusEnum {
    PROGRAMADA = 'programada',
    EN_CURSO = 'en_curso',
    FINALIZADA = 'finalizada',
    CANCELADA = 'cancelada'
}

export enum ScoringSystemEnum {
    FIVB = 'fivb', // 3-0/3-1 → 3pts/0pts, 3-2 → 2pts/1pt
    SIMPLE = 'simple' // Victoria 3pts, Derrota 0pts
}

export enum TiebreakCriteriaEnum {
    PUNTOS = 'puntos',
    VICTORIAS = 'victorias',
    SET_RATIO = 'set_ratio',
    POINT_RATIO = 'point_ratio',
    HEAD_TO_HEAD = 'head_to_head'
}
