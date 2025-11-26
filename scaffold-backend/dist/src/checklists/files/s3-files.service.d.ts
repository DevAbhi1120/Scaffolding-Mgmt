import { IFilesService, UploadResult } from './files.interface';
export declare class S3FilesService implements IFilesService {
    private client;
    private bucket;
    private prefix;
    constructor();
    private getKey;
    uploadMany(files: any[]): Promise<UploadResult[]>;
    getDownloadUrl(key: string, expiresSeconds?: number): Promise<string>;
    streamFile(key: string): Promise<any>;
    delete(key: string): Promise<void>;
}
