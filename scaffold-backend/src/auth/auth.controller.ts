// src/auth/auth.controller.ts
import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
// import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body);
    }

    @Post('register')
    async register(@Body() body: { name: string; email: string; password: string; role?: string }) {
        return this.authService.register(body);
    }
}