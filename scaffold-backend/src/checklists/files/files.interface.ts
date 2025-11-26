export interface UploadResult {
  key: string;          // key (S3 key or relative path)
  url?: string;         // optional public url (S3 signed url or public path)
  originalName?: string;
  mime?: string;
  size?: number;
}

export interface IFilesService {
  uploadMany(files: Express.Multer.File[] | { buffer: Buffer; originalname: string; mimetype: string; size: number }[]): Promise<UploadResult[]>;
  getDownloadUrl?(key: string, expiresSeconds?: number): Promise<string>;
  streamFile?(key: string): Promise<NodeJS.ReadableStream>;
  delete?(key: string): Promise<void>;
}
