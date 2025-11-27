"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuth = setAuth;
exports.getToken = getToken;
exports.getUser = getUser;
exports.clearAuth = clearAuth;
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
function setAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}
function getUser() {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
}
function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}
//# sourceMappingURL=auth.js.map