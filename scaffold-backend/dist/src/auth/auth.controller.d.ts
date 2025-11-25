import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: any;
    }>;
    register(body: {
        name: string;
        email: string;
        password: string;
        role?: string;
    }): Promise<import("../database/entities/user.entity").User>;
}
