// src/users/users.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) { }

  @Post()
  async create(@Body() body: any) {
    return this.svc.create(body);
  }

  
  @Get()
  async list() {
    return this.svc.findAll();
  }
}