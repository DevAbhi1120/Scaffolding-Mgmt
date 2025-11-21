import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
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
