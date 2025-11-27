import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private svc;
    constructor(svc: UsersService);
    create(body: CreateUserDto): Promise<any>;
    list(): Promise<any[]>;
    getOne(id: string): Promise<{
        user: any;
    }>;
    updateJson(id: string, body: UpdateUserDto): Promise<any>;
    updateWithFile(id: string, file: Express.Multer.File, body: UpdateUserDto): Promise<any>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
}
