import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Swms } from '../database/entities/swms.entity';
import { Repository } from 'typeorm';
import { CreateSwmsDto } from './dto/create-swms.dto';
import { UpdateSwmsDto } from './dto/update-swms.dto';
import { NotificationsService } from '../notifications/notification.service';

@Injectable()
export class SwmsService {
  constructor(
    @InjectRepository(Swms) private repo: Repository<Swms>,
    private notificationsSvc: NotificationsService
  ) {}

  async create(dto: CreateSwmsDto) {
    if (!dto.swmsData || !dto.highRiskTasks) throw new BadRequestException('swmsData and highRiskTasks are required');
    const ent = this.repo.create({
      orderId: dto.orderId ?? null,
      submittedBy: dto.submittedBy ?? null,
      swmsData: dto.swmsData,
      highRiskTasks: dto.highRiskTasks,
      attachments: dto.attachments ?? [],
      editableByAdmin: true
    });
    const saved = await this.repo.save(ent);

    // Notify admin
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const subject = `SWMS submitted (Order: ${dto.orderId ?? 'N/A'})`;
      const text = `A SWMS was submitted${dto.orderId ? ` for order ${dto.orderId}` : ''}. SWMS id: ${saved.id}.`;
      try {
        await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, text, 'swms', saved.id);
      } catch (e) {
        console.warn('Failed to enqueue admin notification for SWMS:', (e as any)?.message ?? e);
      }
    }

    return saved;
  }

  async findByOrder(orderId: string) {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } as any });
  }

  async get(id: string) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('SWMS not found');
    return ent;
  }

  // Update — only Admin (enforcement via guard, but method also checks editable flag)
  async update(id: string, dto: UpdateSwmsDto, isAdmin = false) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('SWMS not found');
    if (!existing.editableByAdmin && !isAdmin) {
      throw new ForbiddenException('Only admin can edit this SWMS');
    }
    Object.assign(existing, dto);
    // Ensure admin edits remain allowed
    existing.editableByAdmin = true;
    return this.repo.save(existing);
  }
}
