import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export enum Order {
    ASC = "ASC",
    DESC = "DESC",
  }

export class PageOptionsDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  @IsEnum(Order)
  readonly order?: Order = Order.ASC;

  @IsOptional()
  @IsString()
  orderBy:string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly limit: number = 10;

  @IsOptional()
  @IsString()
  fields:string

  @IsOptional()
  @IsString()
  filter:string

  @IsOptional()
  @Transform(({ value }) => (value === "true") ? true : false)
  @IsBoolean()
  whitDeleted:boolean

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  @IsOptional()
  @IsString()
  queryAnd:string

  @IsOptional()
  @IsString()
  queryDate:string
  
}