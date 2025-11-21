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
let CategoriesService = class CategoriesService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto) {
        const existing = await this.repo.findOne({ where: { name: dto.name } });
        if (existing)
            throw new common_1.ConflictException('Category with this name already exists');
        const entity = this.repo.create(dto);
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
            order: { name: 'ASC' }
        });
        return { items, total, page, limit };
    }
    async findOne(id) {
        const cat = await this.repo.findOne({ where: { id } });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        return cat;
    }
    async update(id, dto) {
        const cat = await this.findOne(id);
        Object.assign(cat, dto);
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
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map