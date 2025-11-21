import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usersSvc: UsersService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersSvc.findByEmail(email);

    if (!user) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (ok) {
      const { passwordHash, ...rest } = user as any;
      return rest;
    }

    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    return {
      accessToken: this.jwt.sign(payload),
    };
  }
}
