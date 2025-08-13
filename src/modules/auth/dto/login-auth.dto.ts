import { IsEmail, IsString, Length } from 'class-validator';

export class LoginAuthDto {
  @IsEmail()
  correo: string;
  @Length(6, 20)
  password: string;
  
}
