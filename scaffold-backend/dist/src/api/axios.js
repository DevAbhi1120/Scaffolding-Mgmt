"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const config_1 = require("../components/BaseUrl/config");
const auth_1 = require("../auth/auth");
const api = axios_1.default.create({
    baseURL: config_1.BASE_URL,
    headers: { 'Accept': 'application/json' },
    withCredentials: false,
});
api.interceptors.request.use((config) => {
    const token = (0, auth_1.getToken)();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
api.interceptors.response.use((res) => res, (err) => {
    const status = err?.response?.status;
    if (status === 401) {
        (0, auth_1.clearAuth)();
    }
    return Promise.reject(err);
});
exports.default = api;
//# sourceMappingURL=axios.js.map