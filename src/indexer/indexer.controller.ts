import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IndexerService } from './indexer.service';
import { GetInscriptionsDto } from './dto/inscriptions.dto';
import { InscriptionEvent } from '../typeorm';
import { LotteryService } from '../lottery/lottery.service';

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
