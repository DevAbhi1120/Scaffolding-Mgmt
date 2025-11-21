// src/files/files.controller.ts
import { Controller, Get, Query, Param, UseGuards, Req, BadRequestException, Delete } from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Request } from 'express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesSvc: FilesService) {}

  // GET /files?entityType=swms&entityId=<id>
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    if (!entityType || !entityId) {
      throw new BadRequestException('entityType and entityId are required');
    }
    return this.filesSvc.listFilesForEntity(entityType, entityId);
  }

  // GET /files/:id/signed-url?expires=60
  @Get(':id/signed-url')
  @UseGuards(JwtAuthGuard)
  async signedUrl(@Param('id') id: string, @Query('expires') expires?: string) {
    const seconds = expires ? Number(expires) : 60;
    return this.filesSvc.getSignedGetUrl(id, seconds);
  }

  // DELETE /files/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: string, @Req() req: Request) {
    // req.user should be populated by JwtAuthGuard
    const user = req.user as any;
    if (!user) throw new BadRequestException('No user in request');
    return this.filesSvc.deleteFile(id, { id: user.userId ?? user.id, role: user.role });
  }
}
