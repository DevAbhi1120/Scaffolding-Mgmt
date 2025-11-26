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
exports.S3FilesService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
let S3FilesService = class S3FilesService {
    constructor() {
        const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
        this.bucket = process.env.AWS_S3_BUCKET;
        this.prefix = process.env.AWS_S3_PREFIX ?? 'checklists';
        this.client = new client_s3_1.S3Client({
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    getKey(filename) {
        const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '';
        return `${this.prefix}/${(0, uuid_1.v4)()}${ext}`;
    }
    async uploadMany(files) {
        const results = [];
        for (const f of files) {
            const originalName = f.originalname ?? f.filename ?? 'file';
            const key = this.getKey(originalName);
            const body = f.buffer ? f.buffer : (f.path ? require('fs').createReadStream(f.path) : f);
            await this.client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: f.mimetype ?? 'application/octet-stream',
            }));
            results.push({
                key,
                url: `s3://${this.bucket}/${key}`,
                originalName,
                mime: f.mimetype,
                size: f.size,
            });
        }
        return results;
    }
    async getDownloadUrl(key, expiresSeconds = 60 * 10) {
        const cmd = new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, cmd, { expiresIn: expiresSeconds });
    }
    async streamFile(key) {
        const res = await this.client.send(new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }));
        return res.Body;
    }
    async delete(key) {
        await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    }
};
exports.S3FilesService = S3FilesService;
exports.S3FilesService = S3FilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], S3FilesService);
//# sourceMappingURL=s3-files.service.js.map