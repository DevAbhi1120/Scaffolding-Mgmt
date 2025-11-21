"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv = require("dotenv");
dotenv.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'Admin@1120',
    database: process.env.DB_DATABASE || 'scaffolddb',
    entities: [__dirname + '/src/database/entities/*.ts'],
    migrations: [__dirname + '/migrations/*.ts'],
    synchronize: false,
    logging: false,
});
//# sourceMappingURL=ormconfig.js.map