import { FilesService } from './files.service';
import { Request, Response } from 'express';
export declare class FilesController {
    private readonly filesSvc;
    constructor(filesSvc: FilesService);
    upload(files: Express.Multer.File[], relatedEntityType: string, relatedEntityId: string, category: string, req: Request): Promise<{
        record: import("./file.entity").FileEntity;
        keys: string[];
        urls: string[];
    }>;
    list(entityType?: string, entityId?: string, page?: string, limit?: string): Promise<{
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
    viewFile(id: string, index: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
    update(id: string, files: Express.Multer.File[], relatedEntityType: string, relatedEntityId: string, category: string, keepKeysRaw: any, removeKeysRaw: any, req: Request): Promise<{
        record: import("./file.entity").FileEntity;
        keys: string[];
        urls: string[];
    }>;
    delete(id: string): Promise<{
        success: true;
    }>;
}
