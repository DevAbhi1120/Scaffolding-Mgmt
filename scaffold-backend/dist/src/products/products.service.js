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
const product_entity_1 = require("../database/entities/product.entity");
const category_entity_1 = require("../database/entities/category.entity");
let ProductsService = class ProductsService {
    constructor(repo, categoryRepo) {
        this.repo = repo;
        this.categoryRepo = categoryRepo;
    }
    async create(dto) {
        const cat = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
        if (!cat)
            throw new common_1.BadRequestException('Category not found');
        const product = this.repo.create(dto);
        return this.repo.save(product);
    }
    async findAll(q) {
        const page = q?.page && q.page > 0 ? q.page : 1;
        const limit = q?.limit && q.limit > 0 ? q.limit : 20;
        const where = {};
        if (q?.search)
            where.name = (0, typeorm_2.ILike)(`%${q.search}%`);
        if (q?.categoryId)
            where.categoryId = q.categoryId;
        const [items, total] = await this.repo.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            relations: ['category'],
            order: { createdAt: 'DESC' }
        });
        return { items, total, page, limit };
    }
    async findOne(id) {
        const p = await this.repo.findOne({ where: { id }, relations: ['category'] });
        if (!p)
            throw new common_1.NotFoundException('Product not found');
        return p;
    }
    async update(id, dto) {
        const p = await this.findOne(id);
        if (dto.categoryId) {
            const cat = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
            if (!cat)
                throw new common_1.BadRequestException('Category not found');
        }
        Object.assign(p, dto);
        return this.repo.save(p);
    }
    async remove(id) {
        const p = await this.findOne(id);
        return this.repo.remove(p);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map