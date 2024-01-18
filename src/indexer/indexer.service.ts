import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InscriptionEvent, IndexerState } from 'src/typeorm';
import { Repository } from 'typeorm';
import { fetchTransactions, getBlockNumber, sleep, processTxs } from './utils';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);

  private latestSyncBlock = this.configService.get('startBlockNumber');
  private latestNodeBlock = this.configService.get('startBlockNumber');
  private fetchBlockStep = this.configService.get('fetchBlockStep');

  constructor(
    private configService: ConfigService,
    @InjectRepository(InscriptionEvent)
    private eventsRep: Repository<InscriptionEvent>,
    @InjectRepository(IndexerState)
    private indexerStateRep: Repository<IndexerState>,
  ) {}

  async start() {
    this.syncTransactions();
  }

  // async bootstrap() {
  //   const indexerState = await this.indexerStateRep.findOne({});
  //   this.logger.log(
  //     `Bootstrap: indexer state ${
  //       indexerState ? JSON.stringify(indexerState) : null
  //     }`,
  //   );
  //   if (indexerState) {
  //     this.latestSyncBlock = indexerState.last_synced_block;
  //   } else {
  //     await this.indexerStateRep.insert({
  //       last_synced_block: this.configService.get('startBlockNumber'),
  //     });
  //   }
  // }

  async getLatestSyncedBlockFromDB() {
    const indexerState = await this.indexerStateRep.find({
      where: {
        indexer_name: 'inscriptions_indexer',
      },
    });
    return indexerState.length ? indexerState[0].last_synced_block : null;
  }

  async setLatestSyncedBlock(blockNumber: number) {
    await this.indexerStateRep.upsert(
      {
        last_synced_block: blockNumber,
        indexer_name: 'inscriptions_indexer',
      },
      ['indexer_name'],
    );
  }

  syncTransactions = async () => {
    try {
      this.latestNodeBlock = await getBlockNumber();
      this.latestSyncBlock =
        (await this.getLatestSyncedBlockFromDB()) ||
        this.configService.get('startBlockNumber');

      const startBlock = this.latestSyncBlock + 1;
      const unsyncedBlocks = this.latestNodeBlock - startBlock;

      const range =
        unsyncedBlocks >= this.fetchBlockStep - 1
          ? this.fetchBlockStep - 1
          : unsyncedBlocks;
      const endBlock = startBlock + range;

      const newTxs = await fetchTransactions({ startBlock, endBlock });
      const newInscriptions = processTxs(newTxs);

      for (const inscriptionTx of newInscriptions) {
        await this.eventsRep.upsert(
          {
            transactionHash: inscriptionTx.hash,
            address: inscriptionTx.from,
            name: '',
            chain: '',
            blockNumber: inscriptionTx.blockNumber,
            timestamp: inscriptionTx.timestamp,
            payload: inscriptionTx.jsonData,
          },
          ['transactionHash'],
        );
      }

      await this.setLatestSyncedBlock(endBlock);
      this.latestSyncBlock = endBlock;

      this.logger.log(
        `[${startBlock} - ${endBlock}] ${range + 1} blocks synced, added ${
          newInscriptions.length
        } inscriptions`,
      );

      if (unsyncedBlocks < this.fetchBlockStep) {
        await sleep(2000);
      }
    } catch (e) {
      this.logger.error('Error syncTransactions', e);
    }

    setTimeout(() => this.syncTransactions(), 100);
  };

  getTxs = () => {
    return [];
  };

  getInscriptions = (params?: { domain?: string }) => {
    return [];
  };

  getProgress = () =>
    (
      100 *
      ((this.latestSyncBlock - this.fetchBlockStep) /
        (this.latestNodeBlock - this.fetchBlockStep))
    ).toFixed(2);

  getInfo = () => {
    return {
      progress: `${this.getProgress()} %`,
      fetchBlockStep: this.fetchBlockStep,
      totalInscriptions: 0,
      latestSyncBlock: this.latestSyncBlock,
      latestNodeBlock: this.latestNodeBlock,
    };
  };
}
