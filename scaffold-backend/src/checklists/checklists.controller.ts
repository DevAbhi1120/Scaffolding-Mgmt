// src/checklists/checklists.controller.ts
import {
  Controller,
  Post,
  Put,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Get,
  Param,
  Query,
  Inject,
  Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';

@Controller('checklists')
export class ChecklistsController {
  constructor(
    private readonly svc: ChecklistsService,
    @Inject('FilesService') private readonly filesService: any,
  ) { }

  @Post()
  @UseInterceptors(
    FilesInterceptor('attachments', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => cb(null, './uploads/checklists'),
        filename: (req, file, cb) => {
          const id = uuidv4();
          const ext = extname(file.originalname) || '';
          cb(null, `${id}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|pdf/;
        const ok = allowed.test(file.mimetype);
        cb(ok ? null : new BadRequestException('Only images/pdf allowed'), ok);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async create(@Body() body: any, @UploadedFiles() files?: Express.Multer.File[]) {
    let checklistData: any;
    try {
      checklistData = typeof body.checklistData === 'string' ? JSON.parse(body.checklistData) : body.checklistData;
    } catch (e) {
      throw new BadRequestException('Invalid checklistData JSON');
    }

    const dto: CreateChecklistDto = {
      orderId: body.orderId ?? null,
      submittedBy: body.submittedBy ?? null,
      checklistData,
      dateOfCheck: body.dateOfCheck ?? body.check_date ?? body.checkDate,
      attachments: [],
      preserved: body.preserved === 'false' ? false : body.preserved === 'true' ? true : body.preserved ?? true,
    };

    if (files && files.length > 0) {
      const uploaded = await this.filesService.uploadMany(files);
      dto.attachments = uploaded.map((u: any) => u.key || u.url || String(u));
    }

    return this.svc.create(dto);
  }

  // NEW: UPDATE ROUTE
  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('attachments', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => cb(null, './uploads/checklists'),
        filename: (req, file, cb) => {
          const id = uuidv4();
          const ext = extname(file.originalname) || '';
          cb(null, `${id}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|pdf/;
        const ok = allowed.test(file.mimetype);
        cb(ok ? null : new BadRequestException('Only images/pdf allowed'), ok);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    let checklistData: any;
    try {
      checklistData = typeof body.checklistData === 'string'
        ? JSON.parse(body.checklistData)
        : body.checklistData;
    } catch (e) {
      throw new BadRequestException('Invalid checklistData JSON');
    }

    let existingAttachments: string[] = [];
    try {
      existingAttachments = body.existingAttachments
        ? JSON.parse(body.existingAttachments)
        : [];
    } catch (e) {
      existingAttachments = [];
    }

    const dto: any = {
      orderId: body.orderId ?? null,
      submittedBy: body.submittedBy ?? null,
      checklistData,
      dateOfCheck: body.dateOfCheck,
      existingAttachments,
      preserved: body.preserved,
    };

    if (files && files.length > 0) {
      const uploaded = await this.filesService.uploadMany(files);
      dto.attachments = uploaded.map((u: any) => u.key || u.url || String(u));
    }

    return this.svc.update(id, dto);
  }

  @Get()
  async list(@Query() q: any) {
    const filters: any = {};
    if (q.orderId) filters.orderId = q.orderId;
    if (q.builderId) filters.builderId = q.builderId;
    if (q.from) filters.from = q.from;
    if (q.to) filters.to = q.to;
    if (q.search) filters.search = q.search;
    return this.svc.search(filters);
  }

  @Get('order/:orderId')
  async byOrder(@Param('orderId') orderId: string) {
    return this.svc.findByOrder(orderId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}