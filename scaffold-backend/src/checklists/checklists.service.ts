import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SafetyChecklist } from './safety_checklist.entity';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { NotificationsService } from '../notifications/notification.service';

@Injectable()
export class ChecklistsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SafetyChecklist) private repo: Repository<SafetyChecklist>,
    private notificationsSvc: NotificationsService
  ) { }

  // create checklist and notify admin
  async create(dto: CreateChecklistDto) {
    if (!dto || !dto.checklistData) throw new BadRequestException('checklistData is required');
    // validate date
    const date = new Date(dto.dateOfCheck);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid dateOfCheck');

    const entity = this.repo.create({
      orderId: dto.orderId ?? null,
      submittedBy: dto.submittedBy ?? null,
      checklistData: dto.checklistData,
      dateOfCheck: date,
      attachments: dto.attachments ?? [],
      preserved: true
    } as any);

    const savedRaw = await this.repo.save(entity);
    const saved = Array.isArray(savedRaw) ? savedRaw[0] : savedRaw;

    // notify admin that a checklist was submitted
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const subject = `Safety checklist submitted${dto.orderId ? ` for order ${dto.orderId}` : ''}`;
      const text = `A safety checklist was submitted${dto.orderId ? ` for order ${dto.orderId}` : ''} on ${dto.dateOfCheck}. Checklist ID: ${saved.id}.`;
      try {
        await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, text, 'safety_checklist', saved.id);
      } catch (e) {
        // log and continue — do not fail creation
        console.warn('Failed to enqueue admin notification for checklist:', (e as any)?.message ?? e);
      }
    }

    return saved;
  }

  // find by order
  async findByOrder(orderId: string) {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } as any });
  }

  // get single checklist
  async get(id: string) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Checklist not found');
    return ent;
  }

  // search list by filters (orderId, builderId, date range)
  async search(filters: { orderId?: string; builderId?: string; from?: string; to?: string; search?: string }) {
    const qb = this.repo.createQueryBuilder('c').leftJoinAndSelect('c.order', 'o');

    if (filters.orderId) qb.andWhere('c.orderId = :orderId', { orderId: filters.orderId });
    if (filters.from) qb.andWhere('c.dateOfCheck >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('c.dateOfCheck <= :to', { to: filters.to });

    if (filters.builderId) {
      qb.andWhere('o.builderId = :builderId', { builderId: filters.builderId });
    }

    if (filters.search) {
      qb.andWhere('(JSON_EXTRACT(c.checklistData, "$") LIKE :s OR c.id LIKE :s)', { s: `%${filters.search}%` });
    }

    qb.orderBy('c.createdAt', 'DESC');

    return qb.getMany();
  }
}
