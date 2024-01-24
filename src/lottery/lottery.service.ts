import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetInscriptionsDto } from '../indexer/dto/inscriptions.dto';
import { IndexerService } from '../indexer/indexer.service';
import { DCEns } from 'one-country-sdk';
import axios from 'axios';

@Injectable()
export class LotteryService {
  private readonly logger = new Logger(LotteryService.name);
  private lotteryData = [];
  private lotteryStartTime = 1706040220;
  private lotteryEndTime = this.lotteryStartTime + 24 * 3600;

  constructor(
    private configService: ConfigService,
    private indexerService: IndexerService,
  ) {}

  public start() {
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

  private async registerDomain(domainName: string, ownerAddress: string) {
    const tx = await this.registerDomainDC(domainName, ownerAddress);

    const numberOfAttempts = 5;
    for (let i = 0; i < numberOfAttempts; i++) {
      try {
        this.logger.log(
          `Relayer register ${domainName} attempt ${
            i + 1
          } / ${numberOfAttempts}`,
        );

        const result = await this.registerDomainRelayer(
          domainName,
          ownerAddress,
          tx.txHash,
        );
        if (result) {
          break;
        }
      } catch (e) {
        console.log('Register relater error:', e);
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  private async registerDomainDC(domainName: string, ownerAddress: string) {
    const dc = new DCEns({
      contractAddress: this.configService.get('dc.contractAddress'),
      privateKey: this.configService.get('dc.privateKey'),
    });

    const isAvailable = await dc.isAvailable(domainName);
    if (!isAvailable) {
      throw new Error(`Domain "${domainName}" is not available`);
    }

    const secret = Math.random().toString(26).slice(2);
    const commitment = await dc.makeCommitment(
      domainName,
      ownerAddress,
      secret,
    );
    const commitTx = await dc.commit(commitment);
    // wait for commitment tx mined
    await new Promise((resolve) => setTimeout(resolve, 6000));
    const registerTx = await dc.register(domainName, ownerAddress, secret);
    return registerTx;
  }

  private async registerDomainRelayer(
    domainName: string,
    ownerAddress: string,
    txHash: string,
  ) {
    const { data } = await axios.post(
      'https://1ns-registrar-relayer.hiddenstate.xyz/purchase',
      {
        domain: `${domainName}.country`,
        txHash,
        address: ownerAddress,
        fast: 1,
      },
    );

    return data;
  }
}
