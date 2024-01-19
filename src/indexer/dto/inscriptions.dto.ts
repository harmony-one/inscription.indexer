import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetInscriptionsDto {
  @ApiProperty({ type: Number, required: false, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  offset = 0;

  @ApiProperty({ type: Number, required: false, default: 100, maximum: 1000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit = 100;
}
