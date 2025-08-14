import { PartialType } from '@nestjs/mapped-types';
import { CreateLigaDto } from './create-liga.dto';

export class UpdateLigaDto extends PartialType(CreateLigaDto) {}
