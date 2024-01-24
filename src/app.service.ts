import { Injectable } from '@nestjs/common';
import { IndexerService } from './indexer/indexer.service';

@Injectable()
export class AppService {
  constructor(private indexerService: IndexerService) {
    indexerService.start();
  }
}
