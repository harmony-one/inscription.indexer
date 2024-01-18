import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Events } from 'src/typeorm';
import { Repository } from 'typeorm';
import {
  Tx,
  Inscriptions,
  fetchTransactions,
  getBlockNumber,
  sleep,
  processTxs,
} from './utils';

const FETCH_BLOCK_STEP = 100;
const START_BLOCK_NUMBER = 51283000;

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);

  private latestSyncBlock = START_BLOCK_NUMBER;
  private latestNodeBlock = START_BLOCK_NUMBER;

  private txs: Tx[] = [];
  private inscriptions: Inscriptions[] = [];

  constructor(
    private configService: ConfigService, // @InjectRepository(Events) // private eventsRep: Repository<Events>,
  ) {}

  async start() {
    this.syncTransactions();
  }

  syncTransactions = async () => {
    try {
      this.latestNodeBlock = await getBlockNumber();

      const unsyncedBlocks = this.latestNodeBlock - this.latestSyncBlock;

      const startBlock = this.latestSyncBlock;
      const range =
        unsyncedBlocks > FETCH_BLOCK_STEP ? FETCH_BLOCK_STEP : unsyncedBlocks;
      const endBlock = startBlock + range;

      const newTxs = await fetchTransactions({ startBlock, endBlock });
      const newInscriptions = processTxs(newTxs);

      // this.txs = this.txs.concat(newTxs);
      this.inscriptions = this.inscriptions.concat(newInscriptions);

      this.latestSyncBlock = endBlock;

      if (unsyncedBlocks < FETCH_BLOCK_STEP) {
        await sleep(2000);
      }
    } catch (e) {
      this.logger.error('Error syncTransactions', e);
    }

    setTimeout(() => this.syncTransactions(), 100);
  };

  getTxs = () => this.txs;

  getInscriptions = (params?: { domain?: string }) => {
    if (params?.domain) {
      return this.inscriptions.filter((ins) => params?.domain in ins.jsonData);
    }

    return this.inscriptions;
  };

  getProgress = () =>
    (
      100 *
      ((this.latestSyncBlock - START_BLOCK_NUMBER) /
        (this.latestNodeBlock - START_BLOCK_NUMBER))
    ).toFixed(2);

  getInfo = () => {
    return {
      progress: `${this.getProgress()} %`,
      fetchBlockStep: FETCH_BLOCK_STEP,
      // totalTxs: this.txs.length,
      totalInscriptions: this.inscriptions.length,
      latestSyncBlock: this.latestSyncBlock,
      latestNodeBlock: this.latestNodeBlock,
    };
  };
}
