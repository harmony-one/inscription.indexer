import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IndexerService } from './indexer.service';
import { GetInscriptionsDto } from './dto/inscriptions.dto';
import { InscriptionEvent } from '../typeorm';
import { LotteryService } from '../lottery/lottery.service';
import { PurchaseDomainDto } from './dto/domain.dto';

@ApiTags()
@Controller()
export class IndexerController {
  constructor(
    private readonly indexerService: IndexerService,
    private lotteryService: LotteryService,
  ) {}

  @Get('/info')
  getInfo() {
    return this.indexerService.getInfo();
  }

  @Get('/lottery')
  getLotteryInfo() {
    return this.lotteryService.getLotteryInfo();
  }

  @Get('/register-domain')
  purchaseDomain(@Query() dto: PurchaseDomainDto) {
    return this.lotteryService.registerDomain(dto);
  }

  // @Get('/txs')
  // getTxs() {
  //   return this.indexerService.getTxs();
  // }

  @Get('/inscriptions')
  @ApiOkResponse({
    type: InscriptionEvent,
    isArray: true,
  })
  getInscriptions(@Query() dto: GetInscriptionsDto) {
    return this.indexerService.getInscriptions(dto);
  }
}
