import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseDomainDto {
  @ApiProperty({ type: String, required: true, default: '' })
  @Type(() => String)
  @IsString()
  domainName = '';

  @ApiProperty({ type: String, required: true, default: '' })
  @Type(() => String)
  @IsString()
  ownerAddress = '';
}
