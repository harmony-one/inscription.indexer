import { Injectable } from '@nestjs/common';
import { IndexerService } from './indexer/indexer.service';
import { LotteryService } from './lottery/lottery.service';

@Injectable()
export class AppService {
  constructor(
    private indexerService: IndexerService,
    private lotteryService: LotteryService,
  ) {
    indexerService.start();
    lotteryService.start();
  }
}
