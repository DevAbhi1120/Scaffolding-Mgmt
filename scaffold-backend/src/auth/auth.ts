// src/auth/auth.ts
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function setAuth(token: string, user: any) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): any | null {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}
