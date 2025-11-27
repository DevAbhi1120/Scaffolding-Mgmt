// src/api/axios.ts
import axios from 'axios';
import { BASE_URL } from '../components/BaseUrl/config';
import { getToken, clearAuth } from '../auth/auth';

const api = axios.create({
    baseURL: BASE_URL,
    // you can set common headers here
    headers: { 'Accept': 'application/json' },
    withCredentials: false,
});

// attach token before each request
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// response interceptor to handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        if (status === 401) {
            // clear saved auth and optionally redirect to login
            clearAuth();
            // optionally: window.location.href = '/login';
        }
        return Promise.reject(err);
    },
);

export default api;
