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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const fs_1 = require("fs");
const path_1 = require("path");
const client_s3_1 = require("@aws-sdk/client-s3");
const product_entity_1 = require("../database/entities/product.entity");
let ProductsService = class ProductsService {
    constructor(productRepo, config) {
        this.productRepo = productRepo;
        this.config = config;
        this.s3 = null;
        const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
        const region = this.config.get('AWS_REGION');
        if (accessKeyId && secretAccessKey && region) {
            this.s3 = new client_s3_1.S3Client({
                region,
                credentials: { accessKeyId, secretAccessKey },
            });
        }
    }
    async uploadImage(file) {
        const bucket = this.config.get('AWS_S3_BUCKET');
        const hasAws = this.s3 &&
            bucket &&
            this.config.get('AWS_ACCESS_KEY_ID') &&
            this.config.get('AWS_SECRET_ACCESS_KEY');
        const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        if (hasAws) {
            await this.s3.send(new client_s3_1.PutObjectCommand({
                Bucket: bucket,
                Key: `products/${filename}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            const region = this.config.get('AWS_REGION');
            return `https://${bucket}.s3.${region}.amazonaws.com/products/${filename}`;
        }
        else {
            const uploadDir = (0, path_1.join)(process.cwd(), 'uploads', 'products');
            await fs_1.promises.mkdir(uploadDir, { recursive: true });
            const filePath = (0, path_1.join)(uploadDir, filename);
            await fs_1.promises.writeFile(filePath, file.buffer);
            return `/uploads/products/${filename}`;
        }
    }
    async create(dto, files) {
        if (!dto.categoryId || !dto.productTypeId) {
            throw new common_1.BadRequestException('categoryId and productTypeId are required');
        }
        const product = this.productRepo.create({
            ...dto,
            images: [],
        });
        if (files && files.length > 0) {
            const urls = [];
            for (const file of files) {
                const url = await this.uploadImage(file);
                urls.push(url);
            }
            product.images = urls;
        }
        return this.productRepo.save(product);
    }
    async findAll(q) {
        const page = q?.page && q.page > 0 ? q.page : 1;
        const limit = q?.limit && q.limit > 0 ? q.limit : 20;
        const where = q?.search ? { name: (0, typeorm_2.ILike)(`%${q.search}%`) } : {};
        const [items, total] = await this.productRepo.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            order: { name: 'ASC' },
        });
        return { items, total, page, limit };
    }
    async findOne(id) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async update(id, dto, files) {
        const product = await this.findOne(id);
        if (dto.categoryId) {
            product.categoryId = dto.categoryId;
        }
        if (dto.productTypeId) {
            product.productTypeId = dto.productTypeId;
        }
        Object.assign(product, {
            name: dto.name ?? product.name,
            unit: dto.unit ?? product.unit,
            stockQuantity: dto.stockQuantity !== undefined
                ? dto.stockQuantity
                : product.stockQuantity,
            price: dto.price !== undefined ? dto.price : product.price,
            status: dto.status !== undefined ? dto.status : product.status,
            sku: dto.sku ?? product.sku,
            description: dto.description ?? product.description,
            extra: dto.extra ?? product.extra,
        });
        if (files && files.length > 0) {
            const newUrls = [];
            for (const file of files) {
                const url = await this.uploadImage(file);
                newUrls.push(url);
            }
            product.images = [...(product.images || []), ...newUrls];
        }
        return this.productRepo.save(product);
    }
    async remove(id) {
        const product = await this.findOne(id);
        return this.productRepo.remove(product);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], ProductsService);
//# sourceMappingURL=products.service.js.map