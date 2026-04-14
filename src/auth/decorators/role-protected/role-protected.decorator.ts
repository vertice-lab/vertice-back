import { SetMetadata } from '@nestjs/common';

export enum ValidRoles {
  client = 'client',
  assessor = 'assessor',
  admin = 'admin',
  manager = 'manager',
}

export const ROLES_KEY = 'roles';
export const RoleProtected = (...roles: ValidRoles[]) =>
  SetMetadata(ROLES_KEY, roles);
