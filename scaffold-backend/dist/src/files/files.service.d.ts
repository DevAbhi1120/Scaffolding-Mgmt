import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { FileEntity } from './file.entity';
interface UploadOptions {
    relatedEntityType?: string;
    relatedEntityId?: string;
    uploadedBy: string;
    category?: string;
}
interface UpdateOptions {
    relatedEntityType?: string;
    relatedEntityId?: string;
    category?: string;
    uploadedBy: string;
    keepKeys?: string[];
    removeKeys?: string[];
}
export declare class FilesService {
    private configService;
    private repo;
    private bucket;
    private region;
    private accessKeyId?;
    private secretAccessKey?;
    constructor(configService: ConfigService, repo: Repository<FileEntity>);
    private isS3Enabled;
    private buildS3Client;
    private resolveFolder;
    private buildKey;
    private getBaseUrl;
    uploadFiles(files: Express.Multer.File[], opts: UploadOptions): Promise<{
        record: FileEntity;
        keys: string[];
        urls: string[];
    }>;
    listFiles(opts: {
        page?: number;
        limit?: number;
        entityType?: string;
        entityId?: string;
    }): Promise<{
        items: {
            urls: string[];
            id: string;
            keys: string[];
            relatedEntityType?: string | null;
            relatedEntityId?: string | null;
            uploadedBy?: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getFileLocation(id: string, index?: number): Promise<{
        type: 'local';
        key: string;
        file: FileEntity;
        filePath: string;
    } | {
        type: 's3';
        key: string;
        file: FileEntity;
        url: string;
    }>;
    updateFile(id: string, files: Express.Multer.File[] | undefined, opts: UpdateOptions): Promise<{
        record: FileEntity;
        keys: string[];
        urls: string[];
    }>;
    deleteFile(id: string): Promise<{
        success: true;
    }>;
    deleteFilesForEntity(entityType: string, entityId: string): Promise<{
        deletedCount: number;
    }>;
}
export {};
