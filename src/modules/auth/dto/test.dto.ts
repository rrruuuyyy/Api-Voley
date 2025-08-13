import { IsString } from "class-validator";

export class TestAuthDto {
    @IsString()
    saludo:string
}