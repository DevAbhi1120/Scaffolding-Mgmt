import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoidProtection } from './void.entity';
import { VoidsService } from './void.service';
import { VoidsController } from './void.controller';
import { NotificationsModule } from '../notifications/notifications.module';


@Module({
    imports: [TypeOrmModule.forFeature([VoidProtection]), NotificationsModule],
    providers: [VoidsService],
    controllers: [VoidsController],
    exports: [VoidsService]
})
export class VoidsModule { }