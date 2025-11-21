import { PartialType } from '@nestjs/mapped-types';
import { CreateSwmsDto } from './create-swms.dto';

export class UpdateSwmsDto extends PartialType(CreateSwmsDto) {}
