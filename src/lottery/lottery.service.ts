import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InscriptionEvent } from '../typeorm';
import { Repository } from 'typeorm';
import { GetInscriptionsDto } from '../indexer/dto/inscriptions.dto';
import { IndexerService } from '../indexer/indexer.service';

@Injectable()
export class LotteryService {
  private readonly logger = new Logger(LotteryService.name);
  private lotteryData = [];
  private lotteryStartTime = 1706040220;
  private lotteryEndTime = this.lotteryStartTime + 24 * 3600;

  constructor(
    private configService: ConfigService,
    private indexerService: IndexerService,
  ) {
    this.start();
  }

  private start() {
    this.syncLottery();
  }

  syncLottery = async () => {
    try {
      this.lotteryData = await this.indexerService.getInscriptions({
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
