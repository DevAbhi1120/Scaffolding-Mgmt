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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const file_entity_1 = require("./file.entity");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const role_enum_1 = require("../database/entities/role.enum");
let FilesService = class FilesService {
    constructor(configService, repo) {
        this.configService = configService;
        this.repo = repo;
        this.bucket =
            this.configService.get('S3_BUCKET') || process.env.S3_BUCKET;
        this.region =
            this.configService.get('S3_REGION') ||
                process.env.S3_REGION ||
                'us-east-1';
    }
    buildS3Client() {
        const accessKeyId = this.configService.get('S3_ACCESS_KEY_ID') ||
            process.env.S3_ACCESS_KEY_ID;
        const secretAccessKey = this.configService.get('S3_SECRET_ACCESS_KEY') ||
            process.env.S3_SECRET_ACCESS_KEY;
        const region = this.configService.get('S3_REGION') ||
            process.env.S3_REGION ||
            'us-east-1';
        const config = { region };
        if (accessKeyId && secretAccessKey) {
            config.credentials = { accessKeyId, secretAccessKey };
        }
        return new client_s3_1.S3Client(config);
    }
    async presign(filename, contentType) {
        try {
            const ext = filename.includes('.')
                ? filename.substring(filename.lastIndexOf('.'))
                : '';
            const key = `uploads/${new Date()
                .toISOString()
                .slice(0, 10)}/${(0, uuid_1.v4)()}${ext}`;
            const s3 = this.buildS3Client();
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                ContentType: contentType || 'application/octet-stream',
            });
            const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, command, {
                expiresIn: 60 * 10,
            });
            const fileUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${encodeURIComponent(key)}`;
            return { uploadUrl, key, fileUrl };
        }
        catch (err) {
            throw new common_1.InternalServerErrorException('Failed to create presigned URL');
        }
    }
    async saveMetadata(data) {
        const ent = this.repo.create(data);
        return this.repo.save(ent);
    }
    async getSignedGetUrl(fileId, expiresSeconds = 60) {
        const file = await this.repo.findOne({ where: { id: fileId } });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        const s3 = this.buildS3Client();
        const cmd = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: file.key,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3, cmd, { expiresIn: expiresSeconds });
        return { url, file };
    }
    async listFilesForEntity(entityType, entityId) {
        return this.repo.find({
            where: {
                relatedEntityType: entityType,
                relatedEntityId: entityId,
            },
            order: { createdAt: 'DESC' },
        });
    }
    async deleteFile(fileId, requestingUser) {
        const file = await this.repo.findOne({ where: { id: fileId } });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        const isOwner = file.relatedEntityId && file.relatedEntityId === requestingUser.id;
        const isAdmin = requestingUser?.role === role_enum_1.Role.ADMIN ||
            requestingUser?.role === role_enum_1.Role.SUPER_ADMIN;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('Not allowed to delete this file');
        }
        const s3 = this.buildS3Client();
        try {
            await s3.send(new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucket,
                Key: file.key,
            }));
        }
        catch (err) {
            console.warn('S3 delete failed (continuing anyway):', err?.message ?? err);
        }
        await this.repo.delete(file.id);
        return { ok: true };
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(file_entity_1.FileEntity)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], FilesService);
//# sourceMappingURL=files.service.js.map