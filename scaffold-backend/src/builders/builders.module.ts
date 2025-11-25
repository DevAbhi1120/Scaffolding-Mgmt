import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Builder } from '../database/entities/builder.entity';
import { BuildersService } from './builders.service';
import { BuildersController } from './builders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Builder])],
  providers: [BuildersService],
  controllers: [BuildersController],
  exports: [BuildersService],
})
export class BuildersModule {}