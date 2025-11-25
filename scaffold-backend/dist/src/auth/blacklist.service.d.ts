export declare class BlacklistService {
    private blacklist;
    add(token: string, expiresIn: number): void;
    isBlacklisted(token: string): boolean;
}
