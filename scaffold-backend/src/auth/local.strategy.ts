import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

/**
 * Note: passport-local expects fields named 'username' and 'password' by default.
 * We set usernameField to 'email' so passport reads req.body.email.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  // passport-local calls this with email and password
  async validate(email: string, password: string): Promise<any> {
    // AuthService.validateUser should throw UnauthorizedException for invalid credentials
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    // return the sanitized user object (without passwordHash) — becomes req.user
    return user;
  }
}
