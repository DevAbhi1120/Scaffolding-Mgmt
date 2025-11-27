import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: any;
    }>;
    register(body: {
        name: string;
        email: string;
        password: string;
        role?: string;
    }): Promise<any>;
}
