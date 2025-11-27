import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  /**
   * Validates credentials and returns the user (without passwordHash) on success.
   * Returns null only if credentials are invalid.
   * Throws UnauthorizedException for disabled accounts.
   */
  async validateUser(email: string, password: string): Promise<any> {
    // Make sure usersService.findByEmail returns the DB user object (including passwordHash)
    const user = await this.usersService.findByEmail(email);

    // generic invalid message — avoid leaking whether email exists
    const invalidMsg = 'Invalid email or password';

    if (!user) {
      // Do not reveal whether email exists
      throw new UnauthorizedException(invalidMsg);
    }

    // Optional account status check (adjust if you use other status codes)
    // treat status 1 as active; any other value -> disabled
    // If your UsersService stores status differently adjust this check
    if (typeof (user as any).status !== 'undefined' && (user as any).status !== 1) {
      throw new UnauthorizedException('Account is disabled');
    }

    // ensure passwordHash exists on returned user
    const passwordHash = (user as any).passwordHash;
    if (!passwordHash) {
      throw new UnauthorizedException(invalidMsg);
    }

    const matches = await bcrypt.compare(password, passwordHash);
    if (!matches) {
      throw new UnauthorizedException(invalidMsg);
    }

    // remove passwordHash before returning user object
    const { passwordHash: _ph, ...safe } = user as any;
    return safe;
  }

  /**
   * Returns JWT token and the sanitized user.
   */
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);
    // optionally remove sensitive fields in case controller passes full user
    const { passwordHash: _ph, ...safeUser } = user as any;
    return {
      access_token,
      user: safeUser,
    };
  }

  async register(data: any) {

    return this.usersService.create(data);
  }
}
