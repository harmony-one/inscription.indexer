import { Injectable } from '@nestjs/common';
import { IndexerService } from './indexer/indexer.service';
import { LotteryService } from './lottery/lottery.service';
import { DomainService } from './domain/domain.service';

@Injectable()
export class AppService {
  constructor(
    private indexerService: IndexerService,
    private lotteryService: LotteryService,
    private domainService: DomainService,
  ) {
    indexerService.start();
    lotteryService.start();
    domainService.start();
  }
}
