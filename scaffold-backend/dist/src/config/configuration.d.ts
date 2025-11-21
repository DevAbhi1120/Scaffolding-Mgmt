declare const _default: () => {
    port: number;
    jwt: {
        secret: string | undefined;
        expiresIn: string;
    };
    db: {
        host: string | undefined;
        port: number;
        username: string | undefined;
        password: string | undefined;
        database: string | undefined;
    };
    redis: {
        host: string | undefined;
        port: number;
    };
};
export default _default;
