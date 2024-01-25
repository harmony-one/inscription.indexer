import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetInscriptionsDto {
  @ApiProperty({ type: String, required: false, default: '' })
  @Type(() => String)
  @IsString()
  @IsOptional()
  transactionHash = '';

  @ApiProperty({ type: String, required: false, default: '' })
  @Type(() => String)
  @IsString()
  @IsOptional()
  from = '';

  @ApiProperty({ type: String, required: false, default: '' })
  @Type(() => String)
  @IsString()
  @IsOptional()
  to = '';

  @ApiProperty({ type: Number, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  timestampFrom: number;

  @ApiProperty({ type: Number, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  timestampTo: number;

  @ApiProperty({ type: Number, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  blockNumberFrom: number;

  @ApiProperty({ type: Number, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  blockNumberTo: number;

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
