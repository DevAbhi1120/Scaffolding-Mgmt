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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFilesService = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const uuid_1 = require("uuid");
const fs = require("fs/promises");
let LocalFilesService = class LocalFilesService {
    constructor() {
        this.basePath = (0, path_1.join)(process.cwd(), 'uploads', 'checklists');
        this.publicPrefix = '/uploads/checklists';
        fs.mkdir(this.basePath, { recursive: true }).catch(() => { });
    }
    async uploadMany(files) {
        const results = [];
        for (const f of files) {
            if (f.path) {
                const filename = f.filename ?? f.originalname;
                results.push({
                    key: `${this.publicPrefix}/${filename}`,
                    url: `${this.publicPrefix}/${filename}`,
                    originalName: f.originalname,
                    mime: f.mimetype,
                    size: f.size,
                });
            }
            else if (f.buffer) {
                const ext = f.originalname.includes('.') ? f.originalname.substring(f.originalname.lastIndexOf('.')) : '';
                const filename = `${(0, uuid_1.v4)()}${ext}`;
                const filePath = (0, path_1.join)(this.basePath, filename);
                await fs.writeFile(filePath, f.buffer);
                results.push({
                    key: `${this.publicPrefix}/${filename}`,
                    url: `${this.publicPrefix}/${filename}`,
                    originalName: f.originalname,
                    mime: f.mimetype,
                    size: f.size,
                });
            }
            else {
                const filename = f.filename ?? f.originalname ?? `${(0, uuid_1.v4)()}`;
                results.push({
                    key: `${this.publicPrefix}/${filename}`,
                    url: `${this.publicPrefix}/${filename}`,
                    originalName: f.originalname ?? filename,
                    mime: f.mimetype ?? undefined,
                    size: f.size ?? undefined,
                });
            }
        }
        return results;
    }
    async getDownloadUrl(key) {
        return key;
    }
    async streamFile(key) {
        const rel = key.startsWith('/') ? key.substring(1) : key;
        const path = (0, path_1.join)(process.cwd(), rel);
        return (0, fs_1.createReadStream)(path);
    }
    async delete(key) {
        const rel = key.startsWith('/') ? key.substring(1) : key;
        const path = (0, path_1.join)(process.cwd(), rel);
        await fs.unlink(path).catch(() => { });
    }
};
exports.LocalFilesService = LocalFilesService;
exports.LocalFilesService = LocalFilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LocalFilesService);
const fs_1 = require("fs");
//# sourceMappingURL=local-files.service.js.map