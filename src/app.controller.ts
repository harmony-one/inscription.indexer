import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { LotteryService } from './lottery/lottery.service';
import { DomainService } from './domain/domain.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private lotteryService: LotteryService,
    private domainService: DomainService

  ) { }
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

  @Get('/stats')
  getLotteryStats() {
    return this.lotteryService.getLotteryStats();
  }

  @Get('/tweet/:id')
  getTweetByDomain(@Param('id') id: string) {
    return this.lotteryService.getTweetByDomain(id);
  }

  @Get('/domain/:name')
  getMetaByDomain(@Param('name') name: string) {
    return this.domainService.getLatestInscriptionByDomain(name) // ||
      // this.lotteryService.getTweetByDomainFull(name);
  }

  @Get('/domain/:name/:path')
  getMetaByDomainPath(@Param('name') name: string, @Param('path') path: string) {
    return this.domainService.getLatestInscriptionByDomainPath(name, path);
  }

  @Get('/domains/:name')
  getAllMetaByDomain(@Param('name') name: string) {
    return this.domainService.getInscriptionsByDomain(name);
  }
}
