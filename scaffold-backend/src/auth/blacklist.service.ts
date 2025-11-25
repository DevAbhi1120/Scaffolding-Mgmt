// src/auth/blacklist.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class BlacklistService {
  private blacklist = new Set<string>();

  add(token: string, expiresIn: number) {
    this.blacklist.add(token);
    // Auto cleanup when token would have expired
    setTimeout(() => this.blacklist.delete(token), expiresIn * 1000);
  }

  isBlacklisted(token: string): boolean {
    return this.blacklist.has(token);
  }
}