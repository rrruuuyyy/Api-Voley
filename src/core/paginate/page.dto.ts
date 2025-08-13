import { IsArray } from "class-validator";
import { PageMetaDto } from "./meta.dto";

export class PageDto<T> {
  @IsArray()
  readonly items: T[];

  readonly meta: PageMetaDto;

  constructor(data: T[], meta: PageMetaDto) {
    this.items = data;
    this.meta = meta;
  }
}