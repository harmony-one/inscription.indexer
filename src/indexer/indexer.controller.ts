import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IndexerService } from './indexer.service';

@ApiTags()
@Controller()
export class IndexerController {
  constructor(private readonly indexerService: IndexerService) {}

  @Get('/info')
  getInfo() {
    return this.indexerService.getInfo();
  }

  @Get('/txs')
  getTxs() {
    return this.indexerService.getTxs();
  }

  @Get('/inscriptions')
  getInscriptions(@Query() query: any) {
    return this.indexerService.getInscriptions(query);
  }
}
