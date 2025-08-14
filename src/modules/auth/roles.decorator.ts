import { SetMetadata } from '@nestjs/common';
import { UserRolesEnum } from '../user/usuario.types';

export const Roles = (...roles: UserRolesEnum[]) => SetMetadata('roles', roles);
