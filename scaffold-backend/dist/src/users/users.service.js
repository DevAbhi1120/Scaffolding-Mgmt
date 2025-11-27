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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const user_entity_1 = require("../database/entities/user.entity");
const role_enum_1 = require("../database/entities/role.enum");
const bcrypt = require("bcrypt");
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
let UsersService = class UsersService {
    constructor(usersRepo) {
        this.usersRepo = usersRepo;
    }
    sanitize(user) {
        if (!user)
            return user;
        const { passwordHash, ...rest } = user;
        return rest;
    }
    async create(data) {
        if (!data.password) {
            throw new common_1.BadRequestException('Password is required');
        }
        if (!PASSWORD_REGEX.test(data.password)) {
            throw new common_1.BadRequestException('Password must be 8+ chars and include uppercase, lowercase, number and special character');
        }
        if (!data.email) {
            throw new common_1.BadRequestException('Email is required');
        }
        const existing = await this.usersRepo.findOne({ where: { email: data.email } });
        if (existing)
            throw new common_1.BadRequestException('Email is already in use');
        const passwordHash = await bcrypt.hash(data.password, parseInt(process.env.SALT_ROUNDS || '10', 10));
        const user = this.usersRepo.create({
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role ?? role_enum_1.Role.TEAM_MEMBER,
            phone: data.phone,
            profileImage: data.profileImage,
            socialFacebook: data.socialFacebook,
            socialX: data.socialX,
            socialLinkedin: data.socialLinkedin,
            socialInstagram: data.socialInstagram,
            country: data.country,
            cityState: data.cityState,
            postalCode: data.postalCode,
            taxId: data.taxId,
        });
        const saved = await this.usersRepo.save(user);
        return this.sanitize(saved);
    }
    async findByEmail(email) {
        return this.usersRepo.findOne({ where: { email } });
    }
    async findAll() {
        const users = await this.usersRepo.find();
        return users.map(u => this.sanitize(u));
    }
    async findOne(id) {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        return this.sanitize(user);
    }
    async update(id, data) {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        if (data.email && data.email !== user.email) {
            const existing = await this.usersRepo.findOne({ where: { email: data.email } });
            if (existing)
                throw new common_1.BadRequestException('Email is already in use');
            user.email = data.email;
        }
        if (data.password) {
            if (!PASSWORD_REGEX.test(data.password)) {
                throw new common_1.BadRequestException('Password must be 8+ chars and include uppercase, lowercase, number and special character');
            }
            user.passwordHash = await bcrypt.hash(data.password, parseInt(process.env.SALT_ROUNDS || '10', 10));
        }
        if (typeof data.name === 'string')
            user.name = data.name;
        if (typeof data.role !== 'undefined')
            user.role = data.role;
        if (typeof data.phone === 'string')
            user.phone = data.phone;
        if (typeof data.profileImage === 'string')
            user.profileImage = data.profileImage;
        if (data.profileImageFile)
            user.profileImage = data.profileImageFile;
        if (typeof data.socialFacebook === 'string')
            user.socialFacebook = data.socialFacebook;
        if (typeof data.socialX === 'string')
            user.socialX = data.socialX;
        if (typeof data.socialLinkedin === 'string')
            user.socialLinkedin = data.socialLinkedin;
        if (typeof data.socialInstagram === 'string')
            user.socialInstagram = data.socialInstagram;
        if (typeof data.country === 'string')
            user.country = data.country;
        if (typeof data.cityState === 'string')
            user.cityState = data.cityState;
        if (typeof data.postalCode === 'string')
            user.postalCode = data.postalCode;
        if (typeof data.taxId === 'string')
            user.taxId = data.taxId;
        if (typeof data.status === 'number')
            user.status = data.status;
        const saved = await this.usersRepo.save(user);
        return this.sanitize(saved);
    }
    async remove(id) {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.usersRepo.remove(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map