import { UsersService } from './users.service';
export declare class UsersController {
    private svc;
    constructor(svc: UsersService);
    create(body: any): Promise<import("../database/entities/user.entity").User>;
    list(): Promise<import("../database/entities/user.entity").User[]>;
}
