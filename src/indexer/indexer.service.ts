import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InscriptionEvent, IndexerState } from 'src/typeorm';
import { Repository } from 'typeorm';
import { fetchTransactions, getBlockNumber, sleep, processTxs } from './utils';
import { GetInscriptionsDto } from './dto/inscriptions.dto';
import { toChecksumAddress } from '@harmony-js/crypto';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);

  private latestSyncBlock = this.configService.get('indexer.startBlockNumber');
  private latestNodeBlock = this.configService.get('indexer.startBlockNumber');
  private fetchBlockStep = this.configService.get('indexer.fetchBlockStep');

  constructor(
    private configService: ConfigService,
    @InjectRepository(InscriptionEvent)
    private inscriptionsRep: Repository<InscriptionEvent>,
    @InjectRepository(IndexerState)
    private indexerStateRep: Repository<IndexerState>,
  ) {}

  async start() {
    if (this.configService.get('indexer.isEnabled')) {
      this.syncTransactions();
      this.syncLottery();
    } else {
      this.logger.warn(
        'Inscriptions indexer is disabled in config. Set [INDEXER_IS_ENABLED=1] to enable.',
      );
    }
  }

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
        this.configService.get('indexer.startBlockNumber');

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
        await this.inscriptionsRep.upsert(
          {
            chain: '',
            blockNumber: inscriptionTx.blockNumber,
            transactionHash: inscriptionTx.hash,
            from: toChecksumAddress(inscriptionTx.from),
            to: toChecksumAddress(inscriptionTx.to),
            value: inscriptionTx.value,
            gas: inscriptionTx.gas,
            gasPrice: inscriptionTx.gasPrice,
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

  getInscriptions = async (dto: GetInscriptionsDto) => {
    const {
      transactionHash,
      timestampFrom,
      timestampTo,
      from,
      to,
      blockNumberFrom,
      blockNumberTo,
      offset,
      limit,
    } = dto;

    const cb = this.inscriptionsRep.createQueryBuilder();
    if (timestampFrom) {
      cb.andWhere('timestamp >= :timestampFrom', { timestampFrom });
    }
    if (timestampTo) {
      cb.andWhere('timestamp <= :timestampTo', { timestampTo });
    }

    if (transactionHash) {
      cb.andWhere('"transactionHash" = :transactionHash', { transactionHash });
    }

    if (from) {
      cb.andWhere('"from" = :from', { from });
    }
    if (to) {
      cb.andWhere('"to" = :to', { to });
    }

    if (blockNumberFrom) {
      cb.andWhere('"blockNumber" >= :blockNumberFrom', { blockNumberFrom });
    }
    if (blockNumberTo) {
      cb.andWhere('"blockNumber" <= :blockNumberTo', { blockNumberTo });
    }

    cb.offset(offset).take(limit);
    cb.orderBy('"blockNumber"', 'DESC');

    return await cb.getMany();

    // return await this.inscriptionsRep.find({
    //   where: {
    //     transactionHash,
    //     blockNumber,
    //     from,
    //     to,
    //   },
    //   skip: offset,
    //   take: limit,
    //   order: {
    //     blockNumber: 'desc',
    //   },
    // });
  };

  getProgress = () =>
    (
      100 *
      ((this.latestSyncBlock - this.fetchBlockStep) /
        (this.latestNodeBlock - this.fetchBlockStep))
    ).toFixed(2);

  getInfo = async () => {
    const totalInscriptions = await this.inscriptionsRep.count({});

    return {
      indexerEnabled: this.configService.get('indexer.isEnabled'),
      progress: `${this.getProgress()} %`,
      fetchBlockStep: this.fetchBlockStep,
      totalInscriptions,
      latestSyncBlock: this.latestSyncBlock,
      latestNodeBlock: this.latestNodeBlock,
    };
  };

  private lotteryData = [];
  private lotteryStartTime = 1706040220;
  private lotteryEndTime = this.lotteryStartTime + 24 * 3600;

  syncLottery = async () => {
    try {
      this.lotteryData = await this.getInscriptions({
        to: '0x3abf101D3C31Aec5489C78E8efc86CaA3DF7B053',
        timestampFrom: this.lotteryStartTime,
        timestampTo: this.lotteryEndTime,
        limit: 1000,
      } as GetInscriptionsDto);
    } catch (e) {
      this.logger.error('syncLottery', e);
    }

    setTimeout(() => this.syncLottery(), 10000);
  };

  getWinner = (data) => {
    const firstDomain = Number(`0x${data[0].transactionHash.slice(-2)}`);
    const diffMap = data.slice(1).map((d) => {
      const curDomain = Number(`0x${d.transactionHash.slice(-2)}`);
      return firstDomain > curDomain
        ? firstDomain - curDomain
        : curDomain - firstDomain;
    });

    const winner = data[diffMap.indexOf(Math.min(...diffMap)) + 1];

    return winner;
  };

  getLotteryInfo = async () => {
    const data = this.lotteryData.filter((d) =>
      ['x.com', 'twitter.com'].some((sub) => d.payload?.value?.includes(sub)),
    );

    data.reverse();

    const winner = this.getWinner(data);

    const winnerDomain = winner.transactionHash.slice(-2);

    return {
      startTime: this.lotteryStartTime,
      endTime: this.lotteryEndTime,
      firstTx: data[0]?.transactionHash,
      winnerTx: winner.transactionHash,
      winnerDomain,
      winnerLink: winner.payload.value,
      totalTxs: data.length,
    };
  };
}
