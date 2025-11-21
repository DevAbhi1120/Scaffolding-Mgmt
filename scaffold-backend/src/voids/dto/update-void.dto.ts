import { PartialType } from '@nestjs/mapped-types';
import { CreateVoidDto } from './create-void.dto';


export class UpdateVoidDto extends PartialType(CreateVoidDto) { }