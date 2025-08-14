import { IsNotEmpty, IsEnum } from 'class-validator';
import { UserRolesEnum } from '../usuario.types';

export class ChangeRoleDto {
    @IsNotEmpty()
    @IsEnum(UserRolesEnum)
    newRole: UserRolesEnum;
}
