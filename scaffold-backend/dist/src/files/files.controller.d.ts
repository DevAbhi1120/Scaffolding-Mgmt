import { FilesService } from './files.service';
import { Request } from 'express';
export declare class FilesController {
    private readonly filesSvc;
    constructor(filesSvc: FilesService);
    list(entityType: string, entityId: string): Promise<import("./file.entity").FileEntity[]>;
    signedUrl(id: string, expires?: string): Promise<{
        url: string;
        file: import("./file.entity").FileEntity;
    }>;
    delete(id: string, req: Request): Promise<{
        ok: boolean;
    }>;
}
