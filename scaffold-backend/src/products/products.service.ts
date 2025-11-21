import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from '../database/entities/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>
  ) {}

  async create(dto: CreateProductDto) {
    // validate category exists
    const cat = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!cat) throw new BadRequestException('Category not found');
    const product = this.repo.create(dto as any);
    return this.repo.save(product);
  }

  async findAll(q?: { search?: string; categoryId?: string; page?: number; limit?: number }) {
    const page = q?.page && q.page > 0 ? q.page : 1;
    const limit = q?.limit && q.limit > 0 ? q.limit : 20;
    const where: any = {};
    if (q?.search) where.name = ILike(`%${q.search}%`);
    if (q?.categoryId) where.categoryId = q.categoryId;
    const [items, total] = await this.repo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['category'],
      order: { createdAt: 'DESC' }
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id }, relations: ['category'] });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async update(id: string, dto: UpdateProductDto) {
    const p = await this.findOne(id);
    if (dto.categoryId) {
      const cat = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!cat) throw new BadRequestException('Category not found');
    }
    Object.assign(p, dto);
    return this.repo.save(p);
  }

  async remove(id: string) {
    const p = await this.findOne(id);
    return this.repo.remove(p);
  }
}
