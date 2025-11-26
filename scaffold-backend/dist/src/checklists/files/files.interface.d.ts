export interface UploadResult {
    key: string;
    url?: string;
    originalName?: string;
    mime?: string;
    size?: number;
}
export interface IFilesService {
    uploadMany(files: Express.Multer.File[] | {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
    }[]): Promise<UploadResult[]>;
    getDownloadUrl?(key: string, expiresSeconds?: number): Promise<string>;
    streamFile?(key: string): Promise<NodeJS.ReadableStream>;
    delete?(key: string): Promise<void>;
}
