import { IFilesService, UploadResult } from './files.interface';
export declare class LocalFilesService implements IFilesService {
    private basePath;
    private publicPrefix;
    constructor();
    uploadMany(files: Express.Multer.File[] | any[]): Promise<UploadResult[]>;
    getDownloadUrl(key: string): Promise<string>;
    streamFile(key: string): Promise<import("fs").ReadStream>;
    delete(key: string): Promise<void>;
}
