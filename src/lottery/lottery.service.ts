import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetInscriptionsDto } from '../indexer/dto/inscriptions.dto';
import { IndexerService } from '../indexer/indexer.service';
import * as _ from 'lodash';

@Injectable()
export class LotteryService {
  private readonly logger = new Logger(LotteryService.name);
  private lotteryData = [];
  private lotteryStartTime = 1706814000;
  private lotteryEndTime = 1706900400;

  constructor(
    private configService: ConfigService,
    private indexerService: IndexerService,
  ) { }

  public start() {
    this.syncLottery();
  }

  syncLottery = async () => {
    try {
      this.lotteryData = await this.indexerService.getInscriptions({
        // to: '0x3abf101D3C31Aec5489C78E8efc86CaA3DF7B053',
        timestampFrom: this.lotteryStartTime,
        timestampTo: this.lotteryEndTime,
        limit: 10000,
      } as GetInscriptionsDto);
    } catch (e) {
      this.logger.error('syncLottery', e);
    }

    setTimeout(() => this.syncLottery(), 10000);
  };

  getTweetByDomain = async (domain: string) => {
    const data = this.lotteryData.find(
      d => d.transactionHash.slice(-(domain.length)).toLowerCase() === domain.toLowerCase()
    )

    return data?.payload?.value
  };

  getTweetByDomainFull = async (domain: string) => {
    const data = this.lotteryData.find(
      d => d.transactionHash.slice(-(domain.length)).toLowerCase() === domain.toLowerCase()
    )

    if (data?.length > 1) {
      data.sort((a, b) => b.timestamp - a.timestamp);
    }

    return data && {
      domain,
      url: data.payload?.value,
      type: 'twitter',
      blockNumber: data.blockNumber,
      inscription: data
    }
  };

  getDiff = (d, firstDomain, digit) => {
    const curDomain = Number(`0x${d.transactionHash.slice(-digit)}`);
    return firstDomain > curDomain
      ? firstDomain - curDomain
      : curDomain - firstDomain;
  }

  getWinner = (data, digit = 2) => {
    if (data.length === 0) {
      return {
        winner: undefined,
        winners: [],
      };
    }

    const firstDomain = Number(`0x${data[0].transactionHash.slice(-digit)}`);
    let diffMap = data.slice(1).map(d => this.getDiff(d, firstDomain, digit));

    diffMap = _.uniq(diffMap);

    diffMap.sort((a, b) => Math.abs(a) > Math.abs(b) ? 1 : -1);

    let winners = [];
    let i = 0;

    while (winners.length < 6 && i < diffMap.length) {
      const minDiff = diffMap[i];
      i++;

      const newTxs = data.slice(1).filter(d => this.getDiff(d, firstDomain, digit) === minDiff)
      winners = winners.concat(newTxs);
    }

    // if (winners.length > 1) {
    //   winners.sort((a, b) => b.timestamp - a.timestamp); // most recent tx is the winner
    // }

    return {
      winner: winners[0],
      winners: winners
    };
  };

  getLotteryStats = async () => {
    // const data = this.lotteryData.filter((d) =>
    //   ['x.com', 'twitter.com'].some((sub) => d.payload?.value?.includes(sub)) &&
    //   d.timestamp > this.lotteryStartTime
    // );
    const data = this.lotteryData.filter((d) => d.payload?.type === 'image');

    data.reverse();

    let inscriptionsByWallet = data.reduce((acc, d) => {
      acc[d.from] = (acc[d.from] || 0) + 1;
      return acc;
    }, {})

    // sort
    inscriptionsByWallet = Object.entries(inscriptionsByWallet)
      .sort(([, a], [, b]) => a > b ? -1 : 1)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

    let inscriptionsByUser = data.reduce((acc, d) => {
      acc[d.payload?.username] = (acc[d.payload?.username] || 0) + 1;
      return acc;
    }, {})

    // sort
    inscriptionsByUser = Object.entries(inscriptionsByUser)
      .sort(([, a], [, b]) => a > b ? -1 : 1)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

    const uniqueWallets = Object.keys(inscriptionsByWallet).length;

    const { winners } = this.getWinner(data);

    return {
      totalInscriptions: this.lotteryData.length,
      totalValidInscriptions: data.length,
      uniqueWallets,
      inscriptionsByWallet,
      inscriptionsByUser,
      winners: winners.map(w => ({
        hash: w.transactionHash,
        username: w.payload?.username,
      }))
    }
  }

  getLotteryInfo = async () => {
    const data = this.lotteryData.filter((d) => d.payload?.type === 'image');

    data.reverse();

    const { winner, winners } = this.getWinner(data);
    let winnerDomain = '';
    let winnerTx = '';
    let winnerLink = '';
    if (winner) {
      winnerDomain = winner.transactionHash.slice(-2);
      winnerTx = winner.transactionHash;
      winnerLink = winner.payload.value;
    }

    return {
      startTime: this.lotteryStartTime,
      endTime: this.lotteryEndTime,
      firstTx: data[0]?.transactionHash,
      winnerTx: winnerTx,
      winnerDomain: winnerDomain,
      winnerLink: winnerLink,
      totalTxs: data.length,
      winners: winners.map(w => w.transactionHash),
    };
  };
}
