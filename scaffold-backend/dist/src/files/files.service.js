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
const path = require("path");
const fs = require("fs");
const UPLOAD_ROOT = 'uploads';
let FilesService = class FilesService {
    constructor(configService, repo) {
        this.configService = configService;
        this.repo = repo;
        this.bucket =
            this.configService.get('S3_BUCKET') ||
                process.env.S3_BUCKET ||
                '';
        this.region =
            this.configService.get('S3_REGION') ||
                process.env.S3_REGION ||
                'us-east-1';
        this.accessKeyId =
            this.configService.get('S3_ACCESS_KEY_ID') ||
                process.env.S3_ACCESS_KEY_ID;
        this.secretAccessKey =
            this.configService.get('S3_SECRET_ACCESS_KEY') ||
                process.env.S3_SECRET_ACCESS_KEY;
    }
    isS3Enabled() {
        return !!(this.accessKeyId && this.secretAccessKey && this.bucket);
    }
    buildS3Client() {
        return new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
            },
        });
    }
    resolveFolder(opts) {
        if (opts.category)
            return opts.category.toLowerCase();
        const type = (opts.relatedEntityType || '').toUpperCase();
        if (type === 'PRODUCT' || type === 'PRODUCTS')
            return 'products';
        if (type === 'CATEGORY' || type === 'CATEGORIES')
            return 'categories';
        if (type === 'BUILDER' || type === 'BUILDERS')
            return 'builders';
        return 'misc';
    }
    buildKey(filename, opts) {
        const ext = filename.includes('.') ? filename.split('.').pop() : 'file';
        const folder = this.resolveFolder(opts);
        const date = new Date().toISOString().split('T')[0];
        const id = (0, uuid_1.v4)();
        return `${UPLOAD_ROOT}/${folder}/${date}/${id}.${ext}`;
    }
    getBaseUrl() {
        return (this.configService.get('APP_URL') ||
            process.env.APP_URL ||
            'http://localhost:3000');
    }
    async uploadFiles(files, opts) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('At least one file is required');
        }
        if (!opts.relatedEntityId || !opts.relatedEntityType) {
            throw new common_1.BadRequestException('relatedEntityType and relatedEntityId are required for uploads');
        }
        const baseUrl = this.getBaseUrl();
        const useS3 = this.isS3Enabled();
        const s3 = useS3 ? this.buildS3Client() : null;
        let entity = await this.repo.findOne({
            where: {
                relatedEntityType: opts.relatedEntityType,
                relatedEntityId: opts.relatedEntityId,
            },
        });
        if (!entity) {
            entity = this.repo.create({
                relatedEntityType: opts.relatedEntityType,
                relatedEntityId: opts.relatedEntityId,
                uploadedBy: opts.uploadedBy,
                keys: [],
            });
        }
        const keys = Array.isArray(entity.keys) ? [...entity.keys] : [];
        for (const file of files) {
            const key = this.buildKey(file.originalname, {
                category: opts.category,
                relatedEntityType: opts.relatedEntityType,
            });
            if (useS3 && s3) {
                await s3.send(new client_s3_1.PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }));
            }
            else {
                const filePath = path.join(process.cwd(), key);
                await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
                await fs.promises.writeFile(filePath, file.buffer);
            }
            keys.push(key);
        }
        entity.keys = keys;
        entity.uploadedBy = opts.uploadedBy;
        const saved = await this.repo.save(entity);
        const urls = saved.keys.map((k) => `${baseUrl}/${k}`);
        return { record: saved, keys: saved.keys, urls };
    }
    async listFiles(opts) {
        const page = opts.page && opts.page > 0 ? opts.page : 1;
        const limit = opts.limit && opts.limit > 0 ? opts.limit : 20;
        const where = {};
        if (opts.entityType)
            where.relatedEntityType = opts.entityType;
        if (opts.entityId)
            where.relatedEntityId = opts.entityId;
        const [items, total] = await this.repo.findAndCount({
            where: Object.keys(where).length ? where : undefined,
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        const baseUrl = this.getBaseUrl();
        const data = items.map((f) => ({
            ...f,
            urls: (f.keys || []).map((k) => `${baseUrl}/${k}`),
        }));
        return {
            items: data,
            total,
            page,
            limit,
        };
    }
    async getFileLocation(id, index = 0) {
        const file = await this.repo.findOne({ where: { id } });
        if (!file)
            throw new common_1.NotFoundException('File record not found');
        if (!file.keys || file.keys.length === 0) {
            throw new common_1.NotFoundException('No files stored for this record');
        }
        if (index < 0 || index >= file.keys.length) {
            throw new common_1.NotFoundException(`No file at index ${index}`);
        }
        const key = file.keys[index];
        if (this.isS3Enabled()) {
            const s3 = this.buildS3Client();
            const cmd = new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key });
            const url = await (0, s3_request_presigner_1.getSignedUrl)(s3, cmd, { expiresIn: 300 });
            return { type: 's3', key, file, url };
        }
        const filePath = path.join(process.cwd(), key);
        return { type: 'local', key, file, filePath };
    }
    async updateFile(id, files, opts) {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity)
            throw new common_1.NotFoundException('File record not found');
        const baseUrl = this.getBaseUrl();
        const useS3 = this.isS3Enabled();
        const s3 = useS3 ? this.buildS3Client() : null;
        if (opts.relatedEntityType !== undefined) {
            entity.relatedEntityType = opts.relatedEntityType;
        }
        if (opts.relatedEntityId !== undefined) {
            entity.relatedEntityId = opts.relatedEntityId;
        }
        entity.uploadedBy = opts.uploadedBy;
        const currentKeys = Array.isArray(entity.keys) ? entity.keys : [];
        const keepKeys = Array.isArray(opts.keepKeys)
            ? opts.keepKeys.filter((k) => typeof k === 'string' && k.trim())
            : undefined;
        const removeKeys = Array.isArray(opts.removeKeys)
            ? opts.removeKeys.filter((k) => typeof k === 'string' && k.trim())
            : undefined;
        let keys = [];
        let keysToRemove = [];
        if (keepKeys && keepKeys.length > 0) {
            keysToRemove = currentKeys.filter((k) => !keepKeys.includes(k));
            keys = [...keepKeys];
        }
        else if (removeKeys && removeKeys.length > 0) {
            keysToRemove = currentKeys.filter((k) => removeKeys.includes(k));
            keys = currentKeys.filter((k) => !removeKeys.includes(k));
        }
        else {
            keys = [...currentKeys];
        }
        for (const key of keysToRemove) {
            if (useS3 && s3) {
                try {
                    await s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
                }
                catch {
                }
            }
            else {
                const filePath = path.join(process.cwd(), key);
                try {
                    await fs.promises.unlink(filePath);
                }
                catch {
                }
            }
        }
        if (files && files.length > 0) {
            for (const file of files) {
                const effectiveRelatedType = opts.relatedEntityType ?? (entity.relatedEntityType ?? undefined);
                const key = this.buildKey(file.originalname, {
                    category: opts.category,
                    relatedEntityType: effectiveRelatedType,
                });
                if (useS3 && s3) {
                    await s3.send(new client_s3_1.PutObjectCommand({
                        Bucket: this.bucket,
                        Key: key,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    }));
                }
                else {
                    const filePath = path.join(process.cwd(), key);
                    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
                    await fs.promises.writeFile(filePath, file.buffer);
                }
                keys.push(key);
            }
        }
        entity.keys = keys;
        const saved = await this.repo.save(entity);
        const urls = saved.keys.map((k) => `${baseUrl}/${k}`);
        return { record: saved, keys: saved.keys, urls };
    }
    async deleteFile(id) {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity)
            throw new common_1.NotFoundException('File record not found');
        const useS3 = this.isS3Enabled();
        const s3 = useS3 ? this.buildS3Client() : null;
        const keys = entity.keys || [];
        for (const key of keys) {
            if (useS3 && s3) {
                try {
                    await s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
                }
                catch {
                }
            }
            else {
                const filePath = path.join(process.cwd(), key);
                try {
                    await fs.promises.unlink(filePath);
                }
                catch {
                }
            }
        }
        await this.repo.delete(entity.id);
        return { success: true };
    }
    async deleteFilesForEntity(entityType, entityId) {
        const records = await this.repo.find({
            where: { relatedEntityType: entityType, relatedEntityId: entityId },
        });
        if (!records.length)
            return { deletedCount: 0 };
        const useS3 = this.isS3Enabled();
        const s3 = useS3 ? this.buildS3Client() : null;
        for (const rec of records) {
            const keys = rec.keys || [];
            for (const key of keys) {
                if (useS3 && s3) {
                    try {
                        await s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
                    }
                    catch {
                    }
                }
                else {
                    const filePath = path.join(process.cwd(), key);
                    try {
                        await fs.promises.unlink(filePath);
                    }
                    catch {
                    }
                }
            }
        }
        await this.repo.delete({
            relatedEntityType: entityType,
            relatedEntityId: entityId,
        });
        return { deletedCount: records.length };
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