import { IsOptional, IsString } from "class-validator";

export class QueryAnd {
    @IsOptional()
    @IsString()
    queryAnd:string
}