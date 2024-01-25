import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { LotteryService } from './lottery/lottery.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private lotteryService: LotteryService,
  ) {}
  @Get('/version')
  getVersion() {
    return this.configService.get('version');
  }

  @Get('/status')
  getStatus() {
    return 'OK';
  }

  @Get('/config')
  getConfig() {
    return {};
  }

  @Get('/lottery')
  getLotteryInfo() {
    return this.lotteryService.getLotteryInfo();
  }

  @Get('/tweet/:id')
  getTweetByDomain(@Param('id') id: string) {
    return this.lotteryService.getTweetByDomain(id);
  }
}
