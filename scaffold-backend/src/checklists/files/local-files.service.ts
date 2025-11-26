import { Injectable } from '@nestjs/common';
import { IFilesService, UploadResult } from './files.interface';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';

@Injectable()
export class LocalFilesService implements IFilesService {
  private basePath = join(process.cwd(), 'uploads', 'checklists'); // ./uploads/checklists
  private publicPrefix = '/uploads/checklists'; // URL path served by ServeStatic

  constructor() {
    // ensure directory exists
    fs.mkdir(this.basePath, { recursive: true }).catch(() => { /* ignore */ });
  }

  async uploadMany(files: Express.Multer.File[] | any[]) {
    const results: UploadResult[] = [];

    for (const f of files) {
      // multer diskStorage gives file.path and filename. When using memoryStorage,
      // callers may pass { buffer, originalname } objects.
      if ((f as any).path) {
        // already saved by multer diskStorage
        const filename = (f as any).filename ?? (f as any).originalname;
        results.push({
          key: `${this.publicPrefix}/${filename}`,
          url: `${this.publicPrefix}/${filename}`,
          originalName: (f as any).originalname,
          mime: (f as any).mimetype,
          size: (f as any).size,
        });
      } else if ((f as any).buffer) {
        const ext = f.originalname.includes('.') ? f.originalname.substring(f.originalname.lastIndexOf('.')) : '';
        const filename = `${uuidv4()}${ext}`;
        const filePath = join(this.basePath, filename);
        await fs.writeFile(filePath, (f as any).buffer);
        results.push({
          key: `${this.publicPrefix}/${filename}`,
          url: `${this.publicPrefix}/${filename}`,
          originalName: f.originalname,
          mime: f.mimetype,
          size: f.size,
        });
      } else {
        // unknown shape - fallback
        const filename = f.filename ?? f.originalname ?? `${uuidv4()}`;
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

  async getDownloadUrl(key: string) {
    // key stored is already '/uploads/checklists/xxx'
    return key;
  }

  async streamFile(key: string) {
    const rel = key.startsWith('/') ? key.substring(1) : key;
    const path = join(process.cwd(), rel);
    return createReadStream(path);
  }

  async delete(key: string) {
    const rel = key.startsWith('/') ? key.substring(1) : key;
    const path = join(process.cwd(), rel);
    await fs.unlink(path).catch(() => {});
  }
  
}

import { createReadStream } from 'fs';
