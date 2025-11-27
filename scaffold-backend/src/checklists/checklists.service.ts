// src/checklists/checklists.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SafetyChecklist } from '../database/entities/safety-checklist.entity';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { NotificationsService } from '../notifications/notification.service';
import { Order } from '../database/entities/order.entity';

@Injectable()
export class ChecklistsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SafetyChecklist) private repo: Repository<SafetyChecklist>,
    private notificationsSvc: NotificationsService,
  ) { }

  // CREATE (unchanged)
  async create(dto: CreateChecklistDto) {
    if (!dto || !dto.checklistData) throw new BadRequestException('checklistData is required');
    const date = new Date(dto.dateOfCheck);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid dateOfCheck');

    const entity = this.repo.create({
      orderId: dto.orderId ?? null,
      submittedBy: dto.submittedBy ?? null,
      checklistData: dto.checklistData,
      dateOfCheck: date,
      attachments: dto.attachments ?? [],
      preserved: true,
    } as any);

    const savedRaw = await this.repo.save(entity);
    const saved = Array.isArray(savedRaw) ? savedRaw[0] : savedRaw;

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const subject = `Safety checklist submitted${dto.orderId ? ` for order ${dto.orderId}` : ''}`;
      const text = `A safety checklist was submitted${dto.orderId ? ` for order ${dto.orderId}` : ''} on ${dto.dateOfCheck}. Checklist ID: ${saved.id}.`;
      try {
        await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, text, 'safety_checklist', saved.id);
      } catch (e) {
        console.warn('Failed to enqueue admin notification for checklist:', (e as any)?.message ?? e);
      }
    }
    return saved;
  }

  // NEW: UPDATE METHOD
  async update(
    id: string,
    dto: Partial<CreateChecklistDto> & { existingAttachments?: string[] }
  ) {
    const checklist = await this.repo.findOne({ where: { id } });
    if (!checklist) throw new NotFoundException('Checklist not found');

    const date = dto.dateOfCheck ? new Date(dto.dateOfCheck) : checklist.dateOfCheck;
    if (dto.dateOfCheck && Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid dateOfCheck');
    }

    const preservedAttachments = Array.isArray(dto.existingAttachments)
      ? dto.existingAttachments
      : checklist.attachments ?? [];

    const finalAttachments = dto.attachments
      ? [...preservedAttachments, ...(dto.attachments || [])]
      : preservedAttachments;

    const updated = await this.repo.save({
      ...checklist,
      orderId: dto.orderId !== undefined ? dto.orderId : checklist.orderId,
      submittedBy: dto.submittedBy || checklist.submittedBy,
      checklistData: dto.checklistData || checklist.checklistData,
      dateOfCheck: date,
      attachments: finalAttachments,
      preserved: dto.preserved ?? checklist.preserved,
    });

    return updated;
  }

  async findByOrder(orderId: string) {
    const qb = this.repo.createQueryBuilder('c')
      .leftJoinAndSelect(
        Order,
        'o',
        `CONVERT(o.id USING utf8mb4) COLLATE utf8mb4_0900_ai_ci = CONVERT(c.orderId USING utf8mb4) COLLATE utf8mb4_0900_ai_ci`
      )
      .where('c.orderId = :orderId', { orderId })
      .orderBy('c.createdAt', 'DESC');
    return qb.getMany();
  }

  async get(id: string) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Checklist not found');
    return ent;
  }

  async search(filters: { orderId?: string; builderId?: string; from?: string; to?: string; search?: string }) {
    const qb = this.repo.createQueryBuilder('c')
      .leftJoinAndSelect(
        Order,
        'o',
        `CONVERT(o.id USING utf8mb4) COLLATE utf8mb4_0900_ai_ci = CONVERT(c.orderId USING utf8mb4) COLLATE utf8mb4_0900_ai_ci`
      );

    if (filters.orderId) qb.andWhere('c.orderId = :orderId', { orderId: filters.orderId });
    if (filters.from) qb.andWhere('c.dateOfCheck >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('c.dateOfCheck <= :to', { to: filters.to });
    if (filters.builderId) qb.andWhere('o.builderId = :builderId', { builderId: filters.builderId });
    if (filters.search) {
      qb.andWhere('(JSON_EXTRACT(c.checklistData, "$") LIKE :s OR c.id LIKE :s)', { s: `%${filters.search}%` });
    }
    qb.orderBy('c.createdAt', 'DESC');
    return qb.getMany();
  }

  async delete(id: string) {
    const checklist = await this.repo.findOne({ where: { id } });
    if (!checklist) throw new NotFoundException('Checklist not found');

    if (Array.isArray(checklist.attachments) && checklist.attachments.length > 0) {
      for (const file of checklist.attachments) {
        try {
          if (process.env.AWS_ACCESS_KEY_ID) {
            // await this.filesSvc.deleteFromS3(file);
          } else {
            const fs = await import('fs');
            const path = `./uploads/checklists/${file}`;
            if (fs.existsSync(path)) fs.unlinkSync(path);
          }
        } catch (e) {
          console.warn('Failed to delete file:', file, (e as any)?.message ?? e);
        }
      }
    }
    await this.repo.remove(checklist);
    return { success: true, message: 'Checklist deleted successfully' };
  }
}