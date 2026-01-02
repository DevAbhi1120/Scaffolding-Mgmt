"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwmsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const swms_entity_1 = require("../database/entities/swms.entity");
const typeorm_2 = require("typeorm");
const notification_service_1 = require("../notifications/notification.service");
const uuid_1 = require("uuid");
const path_1 = require("path");
const fs_1 = require("fs");
const client_s3_1 = require("@aws-sdk/client-s3");
let SwmsService = class SwmsService {
    constructor(repo, notificationsSvc) {
        this.repo = repo;
        this.notificationsSvc = notificationsSvc;
        this.s3 = null;
        this.bucket = null;
        this.isS3Enabled = false;
        const accessKey = process.env.AWS_ACCESS_KEY_ID?.trim() || null;
        const secretKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() || null;
        const region = process.env.AWS_REGION?.trim() || null;
        const bucket = process.env.AWS_S3_BUCKET?.trim() || null;
        if (accessKey && secretKey && region && bucket) {
            this.s3 = new client_s3_1.S3Client({
                region,
                credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
            });
            this.bucket = bucket;
            this.isS3Enabled = true;
            console.log('SWMS: S3 uploads enabled →', this.bucket);
        }
        else {
            this.bucket = null;
            console.log('SWMS: No AWS credentials → using local /uploads folder');
            this.ensureUploadsFolder();
        }
    }
    async ensureUploadsFolder() {
        const dir = (0, path_1.join)(process.cwd(), 'uploads');
        await fs_1.promises.mkdir(dir, { recursive: true });
    }
    async uploadFile(file) {
        const ext = (0, path_1.extname)(file.originalname);
        const filename = `${(0, uuid_1.v4)()}${ext}`;
        const key = `swms/${filename}`;
        if (this.isS3Enabled && this.s3 && this.bucket) {
            try {
                await this.s3.send(new client_s3_1.PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }));
                return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            }
            catch (err) {
                console.error('S3 upload failed, falling back to local', err);
            }
        }
        const filepath = (0, path_1.join)(process.cwd(), 'uploads', filename);
        await fs_1.promises.writeFile(filepath, file.buffer);
        return `/uploads/${filename}`;
    }
    async deleteFile(url) {
        if (!url)
            return;
        if (this.isS3Enabled && url.includes('amazonaws.com') && this.bucket) {
            try {
                const key = url.split('.com/')[1];
                await this.s3.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }));
                console.log('Deleted from S3:', key);
            }
            catch (err) {
                console.warn('Failed to delete from S3:', url);
            }
        }
        else if (url.startsWith('/uploads/')) {
            try {
                const filepath = (0, path_1.join)(process.cwd(), url);
                await fs_1.promises.unlink(filepath);
                console.log('Deleted local file:', filepath);
            }
            catch (err) {
                console.warn('Local file not found (already deleted):', url);
            }
        }
    }
    async create(dto) {
        if (!dto.formData)
            throw new common_1.BadRequestException('formData is required');
        if (!dto.tasks || !Array.isArray(dto.tasks))
            throw new common_1.BadRequestException('tasks must be an array');
        const uploadedUrls = [];
        if (dto.files && dto.files.length > 0) {
            for (const file of dto.files) {
                const url = await this.uploadFile(file);
                uploadedUrls.push(url);
            }
        }
        const ent = this.repo.create({
            orderId: dto.orderId ?? null,
            submittedBy: dto.submittedBy ?? null,
            swmsData: dto.formData,
            highRiskTasks: dto.tasks,
            attachments: [...(dto.attachments || []), ...uploadedUrls],
            editableByAdmin: true,
        });
        const saved = await this.repo.save(ent);
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            const subject = `SWMS submitted (Order: ${dto.orderId ?? 'N/A'})`;
            const text = `SWMS id: ${saved.id}`;
            try {
                await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, text, 'swms', saved.id);
            }
            catch (e) {
                console.warn('Notification failed:', e);
            }
        }
        return saved;
    }
    async update(id, dto, isAdmin = false) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('SWMS not found');
        if (!existing.editableByAdmin && !isAdmin)
            throw new common_1.ForbiddenException('Only admin can edit');
        const newUrls = [];
        if (dto.newFiles && dto.newFiles.length > 0) {
            for (const file of dto.newFiles) {
                const url = await this.uploadFile(file);
                newUrls.push(url);
            }
        }
        const finalAttachments = [
            ...(dto.attachments || existing.attachments || []),
            ...newUrls,
        ];
        if (dto.orderId !== undefined)
            existing.orderId = dto.orderId || null;
        if (dto.submittedBy !== undefined)
            existing.submittedBy = dto.submittedBy || null;
        if (dto.formData !== undefined) {
            existing.swmsData = { ...existing.swmsData, ...dto.formData };
        }
        if (dto.tasks !== undefined) {
            existing.highRiskTasks = dto.tasks;
        }
        existing.attachments = finalAttachments;
        existing.editableByAdmin = true;
        return await this.repo.save(existing);
    }
    async get(id) {
        const ent = await this.repo.findOne({ where: { id } });
        if (!ent)
            throw new common_1.NotFoundException('SWMS not found');
        return ent;
    }
    async listAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    async findByOrder(orderId) {
        return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
    }
    async delete(id) {
        const ent = await this.get(id);
        if (ent.attachments && ent.attachments.length > 0) {
            for (const url of ent.attachments) {
                await this.deleteFile(url);
            }
        }
        await this.repo.remove(ent);
        return { message: 'SWMS and all attachments deleted successfully' };
    }
};
exports.SwmsService = SwmsService;
exports.SwmsService = SwmsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(swms_entity_1.Swms)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notification_service_1.NotificationsService])
], SwmsService);
//# sourceMappingURL=swms.service.js.map