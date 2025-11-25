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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("../database/entities/category.entity");
const config_1 = require("@nestjs/config");
const fs_1 = require("fs");
const path_1 = require("path");
const client_s3_1 = require("@aws-sdk/client-s3");
let CategoriesService = class CategoriesService {
    constructor(repo, config) {
        this.repo = repo;
        this.config = config;
        this.s3 = null;
        const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
        const region = this.config.get('AWS_REGION');
        if (accessKeyId && secretAccessKey && region) {
            this.s3 = new client_s3_1.S3Client({
                region,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });
        }
    }
    async uploadImage(file) {
        if (!file)
            return undefined;
        const bucket = this.config.get('AWS_S3_BUCKET');
        const hasAws = this.s3 &&
            bucket &&
            this.config.get('AWS_ACCESS_KEY_ID') &&
            this.config.get('AWS_SECRET_ACCESS_KEY');
        const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        if (hasAws) {
            await this.s3.send(new client_s3_1.PutObjectCommand({
                Bucket: bucket,
                Key: `categories/${filename}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            const region = this.config.get('AWS_REGION');
            const url = `https://${bucket}.s3.${region}.amazonaws.com/categories/${filename}`;
            return url;
        }
        else {
            const uploadDir = (0, path_1.join)(process.cwd(), 'uploads', 'categories');
            await fs_1.promises.mkdir(uploadDir, { recursive: true });
            const filePath = (0, path_1.join)(uploadDir, filename);
            await fs_1.promises.writeFile(filePath, file.buffer);
            const publicPath = `/uploads/categories/${filename}`;
            return publicPath;
        }
    }
    async create(dto, file) {
        const existing = await this.repo.findOne({ where: { name: dto.name } });
        if (existing)
            throw new common_1.ConflictException('Category with this name already exists');
        let thumbnailImage;
        if (file) {
            thumbnailImage = await this.uploadImage(file);
        }
        const entity = this.repo.create({
            ...dto,
            thumbnailImage,
        });
        return this.repo.save(entity);
    }
    async findAll(q) {
        const page = q?.page && q.page > 0 ? q.page : 1;
        const limit = q?.limit && q.limit > 0 ? q.limit : 20;
        const where = q?.search ? { name: (0, typeorm_2.ILike)(`%${q.search}%`) } : {};
        const [items, total] = await this.repo.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            order: { name: 'ASC' },
        });
        return { items, total, page, limit };
    }
    async findOne(id) {
        const cat = await this.repo.findOne({ where: { id } });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        return cat;
    }
    async update(id, dto, file) {
        const cat = await this.findOne(id);
        if (dto.name && dto.name !== cat.name) {
            const existing = await this.repo.findOne({ where: { name: dto.name } });
            if (existing)
                throw new common_1.ConflictException('Category with this name already exists');
        }
        let thumbnailImage;
        if (file) {
            thumbnailImage = await this.uploadImage(file);
        }
        Object.assign(cat, dto);
        if (thumbnailImage) {
            cat.thumbnailImage = thumbnailImage;
        }
        return this.repo.save(cat);
    }
    async remove(id) {
        const cat = await this.findOne(id);
        return this.repo.remove(cat);
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map