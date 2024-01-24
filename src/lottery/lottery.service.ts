import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetInscriptionsDto } from '../indexer/dto/inscriptions.dto';
import { IndexerService } from '../indexer/indexer.service';
import { DCEns } from 'one-country-sdk';
import axios from 'axios';
import { PurchaseDomainDto } from '../indexer/dto/domain.dto';

@Injectable()
export class LotteryService {
  private readonly logger = new Logger(LotteryService.name);
  private lotteryData = [];
  private lotteryStartTime = 1706040220;
  private lotteryEndTime = this.lotteryStartTime + 24 * 3600;

  private relayerURL = 'https://1ns-registrar-relayer.hiddenstate.xyz';

  constructor(
    private configService: ConfigService,
    private indexerService: IndexerService,
  ) {}

  public start() {
    this.syncLottery();

    // this.registerDomain({
    //   domainName: 'anylongname123456789',
    //   ownerAddress: '0x95D02e967Dd2D2B1839347e0B84E59136b11A073',
    // });
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

  public async registerDomain(dto: PurchaseDomainDto) {
    const { domainName, ownerAddress } = dto;

    this.logger.log(
      `Start purchasing domain: ${domainName}, owner: ${ownerAddress}...`,
    );

    const { transactionHash } = await this.registerDomainDC(
      domainName,
      ownerAddress,
    );
    this.logger.log(`Register domain web3 tx hash: ${transactionHash}`);

    await new Promise((resolve) => setTimeout(resolve, 5000));

    this.logger.log(
      `Start registering web2 domain... ${domainName} ${ownerAddress} ${transactionHash}`,
    );
    for (let i = 0; i < 5; i++) {
      try {
        const resultRegisterDomain = await this.registerDomainRelayer(
          domainName,
          ownerAddress,
          transactionHash,
        );
        break;
      } catch (e) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    this.logger.log(`Web2 domain registered!`);

    this.logger.log('Start generating NFT...');
    const resultNFT = await this.generateNFT(domainName);
    this.logger.log(`NFT generated:`, resultNFT);

    this.logger.log('Starting generating cert...');
    const resultCert = await this.createCert(domainName, ownerAddress);
    this.logger.log(`Cert generated:`, resultCert);
    this.logger.log(`Check domain: https://${resultCert.sld}.country`);

    return {
      domain: `https://${resultCert.sld}.country`,
    };
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
    const { data } = await axios.post(`${this.relayerURL}/purchase`, {
      domain: `${domainName}.country`,
      txHash,
      address: ownerAddress,
      fast: 1,
    });

    return data;
  }

  private async generateNFT(domainName: string) {
    const { data } = await axios.post(`${this.relayerURL}/gen`, {
      domain: `${domainName}.country`,
    });
    return data as { generated: boolean; metadata: any };
  }

  private async createCert(domainName: string, address: string, async = true) {
    const {
      data: { success, sld, mcJobId, nakedJobId, error },
    } = await axios.post(`${this.relayerURL}/cert`, {
      domain: `${domainName}.country`,
      address,
      async,
    });
    return {
      success,
      sld,
      mcJobId,
      nakedJobId,
      error,
    };
  }
}
