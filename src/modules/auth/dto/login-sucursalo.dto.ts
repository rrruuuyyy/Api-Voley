import { IsString } from "class-validator";
import { LoginAuthDto } from "./login-auth.dto";

export class LoginSucursalDto {
  @IsString()
  code: string;
}