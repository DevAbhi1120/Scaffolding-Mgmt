import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Simple wrapper guard for the 'local' passport strategy.
 * Use it on the login route: @UseGuards(LocalAuthGuard)
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
