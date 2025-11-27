import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UsersService } from './users.service';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) { }

  @Post()
  async create(@Body() body: CreateUserDto) {
    return this.svc.create(body);
  }

  @Get()
  async list() {
    return this.svc.findAll();
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.svc.findOne(id);
    return { user };
  }

  // Accept JSON update
  @Patch(':id')
  async updateJson(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateUserDto) {
    // Patch stays for JSON updates
    return this.svc.update(id, body);
  }

  // Accept multipart/form-data (PUT) for profile image + other fields
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('profile_image', {
      storage: diskStorage({
        destination: './uploads/profile-images', // ensure this folder exists and is served statically
        filename: (_req, file, callback) => {
          // create a unique filename
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, callback) => {
        // basic mime type check
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new BadRequestException('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async updateWithFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UpdateUserDto,
  ) {
    // if file present, attach filename so service stores it
    if (file) {
      // you can store just filename or a full URL: e.g. `${process.env.BASE_URL}/uploads/profile-images/${file.filename}`
      (body as any).profileImageFile = file.filename;
    }
    return this.svc.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.remove(id);
    return { success: true };
  }
}
