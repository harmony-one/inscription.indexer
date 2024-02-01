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
  private lotteryStartTime = 1706641200;
  private lotteryEndTime = 1706727600;

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
        to: '0x3abf101D3C31Aec5489C78E8efc86CaA3DF7B053',
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

  getWinner = (data, digit = 2) => {
    if (data.length === 0) {
      return {
        winner: undefined,
        winners: [],
      };
    }

    const firstDomain = Number(`0x${data[0].transactionHash.slice(-digit)}`);
    const diffMap = data.slice(1).map((d) => {
      const curDomain = Number(`0x${d.transactionHash.slice(-digit)}`);
      return firstDomain > curDomain
        ? firstDomain - curDomain
        : curDomain - firstDomain;
    });

    const minDiff = Math.min(...diffMap);

    const winners = [];

    diffMap.forEach((value, idx) => {
      if (value === minDiff) {
        winners.push(data[idx + 1])
      }
    })

    if (winners.length > 1) {
      winners.sort((a, b) => b.timestamp - a.timestamp); // most recent tx is the winner
    }

    return {
      winner: winners[0],
      winners: winners
    };
  };

  getLotteryStats = async () => {
    const data = this.lotteryData.filter((d) =>
      ['x.com', 'twitter.com'].some((sub) => d.payload?.value?.includes(sub)) &&
      d.timestamp > this.lotteryStartTime
    );

    let inscriptionsByWallet = data.reduce((acc, d) => {
      acc[d.from] = (acc[d.from] || 0) + 1;
      return acc;
    }, {})

    // sort
    inscriptionsByWallet = Object.entries(inscriptionsByWallet)
      .sort(([, a], [, b]) => a > b ? -1 : 1)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

    const uniqueWallets = Object.keys(inscriptionsByWallet).length;

    return {
      totalInscriptions: this.lotteryData.length,
      totalValidInscriptions: data.length,
      uniqueWallets,
      inscriptionsByWallet
    }
  }

  getLotteryInfo = async () => {
    const data = this.lotteryData.filter((d) =>
      ['x.com', 'twitter.com'].some((sub) => d.payload?.value?.includes(sub)) &&
      d.timestamp > this.lotteryStartTime
    );

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

  private async registerDomain(domainName: string, ownerAddress: string) {
    const tx = await this.registerDomainDC(domainName, ownerAddress);

    const numberOfAttempts = 5;
    for (let i = 0; i < numberOfAttempts; i++) {
      try {
        this.logger.log(
          `Relayer register ${domainName} attempt ${i + 1
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
