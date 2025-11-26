// src/checklists/checklists.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SafetyChecklist } from '../database/entities/safety-checklist.entity';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { NotificationsService } from '../notifications/notification.service';
import { Order } from '../database/entities/order.entity'; // ensure this path is correct

@Injectable()
export class ChecklistsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SafetyChecklist) private repo: Repository<SafetyChecklist>,
    private notificationsSvc: NotificationsService,
  ) { }

  // ---- create (unchanged) ----
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

  // ---- findByOrder: explicit join with collation-converted ON clause ----
  async findByOrder(orderId: string) {
    // Use explicit join to avoid collation mismatch errors when comparing text UUIDs
    const qb = this.repo.createQueryBuilder('c')
      // manual left join using the Order entity and explicit ON clause
      .leftJoinAndSelect(
        Order,
        'o',
        // ensure both sides are compared using the same charset+collation
        `CONVERT(o.id USING utf8mb4) COLLATE utf8mb4_0900_ai_ci = CONVERT(c.orderId USING utf8mb4) COLLATE utf8mb4_0900_ai_ci`
      )
      .where('c.orderId = :orderId', { orderId })
      .orderBy('c.createdAt', 'DESC');

    return qb.getMany();
  }

  // ---- get single checklist (unchanged except defensive error handling) ----
  async get(id: string) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Checklist not found');
    return ent;
  }

  // ---- search with optional filters (explicit join to avoid collation mismatch) ----
  async search(filters: { orderId?: string; builderId?: string; from?: string; to?: string; search?: string }) {
    const qb = this.repo.createQueryBuilder('c')
      // explicit join to Order entity using converted/collated comparison
      .leftJoinAndSelect(
        Order,
        'o',
        `CONVERT(o.id USING utf8mb4) COLLATE utf8mb4_0900_ai_ci = CONVERT(c.orderId USING utf8mb4) COLLATE utf8mb4_0900_ai_ci`
      );

    if (filters.orderId) qb.andWhere('c.orderId = :orderId', { orderId: filters.orderId });
    if (filters.from) qb.andWhere('c.dateOfCheck >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('c.dateOfCheck <= :to', { to: filters.to });

    if (filters.builderId) {
      // builderId is in orders table, so the explicit join above provides 'o'
      qb.andWhere('o.builderId = :builderId', { builderId: filters.builderId });
    }

    if (filters.search) {
      qb.andWhere('(JSON_EXTRACT(c.checklistData, "$") LIKE :s OR c.id LIKE :s)', { s: `%${filters.search}%` });
    }

    qb.orderBy('c.createdAt', 'DESC');

    return qb.getMany();
  }

  async delete(id: string) {
    const checklist = await this.repo.findOne({ where: { id } });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    // If attachment exists, optionally delete file from local or S3
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
