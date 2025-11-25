import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.get('db.host'),
        port: +cfg.get('db.port'),
        username: cfg.get('db.username'),
        password: cfg.get('db.password'),
        database: cfg.get('db.database'),
        entities: [User, Product, Category, __dirname + '/entities/*.ts'],
        autoLoadEntities: true,
        synchronize: false,
        logging: false,
      }),
      inject: [ConfigService]
    }),
    TypeOrmModule.forFeature([User, Product, Category])
  ],
  exports: [TypeOrmModule]
})
export class DatabaseModule { }
