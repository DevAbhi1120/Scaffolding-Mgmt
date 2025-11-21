// src/voids/void.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VoidProtection, VoidStatus } from './void.entity';
import { CreateVoidDto } from './dto/create-void.dto';
import { UpdateVoidDto } from './dto/update-void.dto';
import { NotificationsService } from '../notifications/notification.service';

@Injectable()
export class VoidsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(VoidProtection) private repo: Repository<VoidProtection>,
    private notificationsSvc: NotificationsService
  ) {}

  async create(dto: CreateVoidDto) {
    if (!dto || !dto.type) {
      throw new BadRequestException('type is required');
    }

    const ent = this.repo.create({
      orderId: dto.orderId ?? null,
      type: dto.type,
      installer: dto.installer ?? null,
      installedOn: dto.installedOn ? new Date(dto.installedOn) : null,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      notes: dto.notes ?? null,
      attachments: dto.attachments ?? [],
      status: VoidStatus.OPEN
    } as any);

    const savedRaw = await this.repo.save(ent);

    // normalize saved result (could be entity or array)
    const saved: VoidProtection = Array.isArray(savedRaw) ? (savedRaw[0] as VoidProtection) : (savedRaw as VoidProtection);

    // If expiryDate is set, optionally enqueue a notification for the admin
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const subject = `VOID ${dto.type} recorded${dto.orderId ? ' for order ' + dto.orderId : ''}`;
      const text =
        `A VOID protection (${dto.type}) was recorded. ID: ${saved.id}.` +
        (dto.expiryDate ? ` Expiry: ${dto.expiryDate}` : '');
      try {
        await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, text, 'void', saved.id);
      } catch (e) {
        // don't fail creation if notification enqueue fails
        console.warn('Failed to enqueue VOID admin notification', (e as any)?.message ?? e);
      }
    }

    return saved;
  }

  async get(id: string) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Void protection not found');
    return ent;
  }

  async findByOrder(orderId: string) {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } as any });
  }

  async update(id: string, dto: UpdateVoidDto) {
    const existing = await this.get(id);

    // Apply allowed updates
    if (dto.installer !== undefined) existing.installer = dto.installer ?? existing.installer;
    if (dto.installedOn !== undefined) existing.installedOn = dto.installedOn ? new Date(dto.installedOn) : existing.installedOn;
    if (dto.expiryDate !== undefined) existing.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : existing.expiryDate;
    if (dto.notes !== undefined) existing.notes = dto.notes ?? existing.notes;
    if (dto.attachments !== undefined) existing.attachments = dto.attachments ?? existing.attachments;
    // allow status update if provided (dto may include it)
    if ((dto as any).status !== undefined) existing.status = (dto as any).status ?? existing.status;

    return this.repo.save(existing);
  }

  // find void protections whose expiryDate is within the next `days` days (including past due)
  async findExpiring(days = 14) {
    const today = new Date();
    const target = new Date(today);
    target.setDate(today.getDate() + days);
    const targetStr = target.toISOString().slice(0, 10);
    const res = await this.repo
      .createQueryBuilder('v')
      .where('v.expiryDate IS NOT NULL')
      .andWhere('DATE(v.expiryDate) <= :target', { target: targetStr })
      .orderBy('v.expiryDate', 'ASC')
      .getMany();
    return res;
  }
}
