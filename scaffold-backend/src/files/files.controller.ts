// src/files/files.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('files')
export class FilesController {
  constructor(private readonly filesSvc: FilesService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('relatedEntityType') relatedEntityType: string,
    @Body('relatedEntityId') relatedEntityId: string,
    @Body('category') category: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const uploadedBy = user?.userId ?? user?.id ?? user?.sub ?? 'unknown';

    if (!relatedEntityType || !relatedEntityId) {
      throw new BadRequestException(
        'relatedEntityType and relatedEntityId are required',
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    return this.filesSvc.uploadFiles(files, {
      relatedEntityType,
      relatedEntityId,
      category,
      uploadedBy,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.filesSvc.listFiles({
      entityType,
      entityId,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  /**
   * GET /api/v1/files/:id?index=0
   * - Streams file at keys[index] (default 0)
   */
  @Get(':id')
  async viewFile(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('index') index: string,
    @Res() res: Response,
  ) {
    const idx = Number.isNaN(Number(index)) ? 0 : Number(index);
    const loc = await this.filesSvc.getFileLocation(id, idx);

    if (loc.type === 's3') {
      return res.redirect(loc.url);
    }

    if (!fs.existsSync(loc.filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    return res.sendFile(path.resolve(loc.filePath));
  }

  /**
   * PUT /api/v1/files/:id
   * - Body:
   *    - keepKeys (JSON/CSV/string[] of paths that should stay)
   *    - relatedEntityType?, relatedEntityId?, category?
   * - Files (optional): any file fields; are appended.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('relatedEntityType') relatedEntityType: string,
    @Body('relatedEntityId') relatedEntityId: string,
    @Body('category') category: string,
    @Body('keepKeys') keepKeysRaw: any,
    @Body('removeKeys') removeKeysRaw: any,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const uploadedBy = user?.userId ?? user?.id ?? user?.sub ?? 'unknown';

    // parse keepKeys (can come as JSON string, CSV, or array)
    let keepKeys: string[] | undefined = undefined;

    if (Array.isArray(keepKeysRaw)) {
      keepKeys = keepKeysRaw;
    } else if (typeof keepKeysRaw === 'string' && keepKeysRaw.trim()) {
      const raw = keepKeysRaw.trim();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          keepKeys = parsed.map((k) => String(k));
        } else {
          keepKeys = [String(parsed)];
        }
      } catch {
        // fallback: CSV
        keepKeys = raw.split(',').map((k) => k.trim()).filter(Boolean);
      }
    }

    // parse removeKeys (same style as keepKeys)
    let removeKeys: string[] | undefined = undefined;

    if (Array.isArray(removeKeysRaw)) {
      removeKeys = removeKeysRaw;
    } else if (typeof removeKeysRaw === 'string' && removeKeysRaw.trim()) {
      const raw = removeKeysRaw.trim();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          removeKeys = parsed.map((k) => String(k));
        } else {
          removeKeys = [String(parsed)];
        }
      } catch {
        // fallback: CSV
        removeKeys = raw.split(',').map((k) => k.trim()).filter(Boolean);
      }
    }

    const safeFiles = files && files.length > 0 ? files : undefined;

    return this.filesSvc.updateFile(id, safeFiles, {
      relatedEntityType,
      relatedEntityId,
      category,
      uploadedBy,
      keepKeys,
      removeKeys,
    });
  }


  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.filesSvc.deleteFile(id);
  }
}
