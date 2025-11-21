import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { FileEntity } from './file.entity';
export declare class FilesService {
    private configService;
    private repo;
    private bucket;
    private region;
    constructor(configService: ConfigService, repo: Repository<FileEntity>);
    private buildS3Client;
    presign(filename: string, contentType?: string): Promise<{
        uploadUrl: string;
        key: string;
        fileUrl: string;
    }>;
    saveMetadata(data: {
        key: string;
        filename: string;
        originalName?: string;
        mimeType?: string;
        size?: number;
        relatedEntityType?: string;
        relatedEntityId?: string;
        uploadedBy?: string;
    }): Promise<FileEntity[]>;
    getSignedGetUrl(fileId: string, expiresSeconds?: number): Promise<{
        url: string;
        file: FileEntity;
    }>;
    listFilesForEntity(entityType: string, entityId: string): Promise<FileEntity[]>;
    deleteFile(fileId: string, requestingUser: {
        id: string;
        role?: string;
    }): Promise<{
        ok: boolean;
    }>;
}
