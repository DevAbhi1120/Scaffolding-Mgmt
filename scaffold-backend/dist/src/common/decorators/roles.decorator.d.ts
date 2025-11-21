export declare const ROLES_KEY = "roles";
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_MEMBER';
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
