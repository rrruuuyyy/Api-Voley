import { IsNotEmpty, IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class RegistroConQrDto {
    @IsNotEmpty()
    @IsString()
    qrCode: string;

    @IsNotEmpty()
    @IsEmail()
    correo: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(20)
    password: string;
}
