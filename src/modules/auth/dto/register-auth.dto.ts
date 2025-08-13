import { IsEmail, IsString, Length } from "class-validator";

export class RegisterAuthDto {
    @IsString({message: 'El nombre debe ser una cadena de texto'})
    c_name: string;
    @IsString({message: 'El RFC debe ser una cadena de texto'})
    c_rfc: string;
    @IsString({message: 'El nombre de usuario debe ser una cadena de texto'})
    u_name: string;
    @IsEmail({}, {message: 'El correo electrónico debe ser válido'})
    u_email: string;
    @IsString({message: 'La contraseña debe ser una cadena de texto'})
    @Length(6, 20, {message: 'La contraseña debe tener entre 6 y 20 caracteres'})
    u_password: string;

}