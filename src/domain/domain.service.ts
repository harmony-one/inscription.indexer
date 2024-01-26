import { Injectable, Logger } from '@nestjs/common';
import { GetInscriptionsDto } from '../indexer/dto/inscriptions.dto';
import { IndexerService } from '../indexer/indexer.service';
import { InscriptionEvent } from 'src/typeorm';
import { ConfigService } from '@nestjs/config';

export interface Domain {
  domain: string;
  type: string;
  url: string;
  year: string;
  gasPrice: number;
  inscription: InscriptionEvent;
}

@Injectable()
export class DomainService {
  private readonly logger = new Logger(DomainService.name);

  private domainsData: Domain[] = [];
  private startTime = 1706126400;

  constructor(
    private indexerService: IndexerService,
    private configService: ConfigService,
  ) {}

  public start() {
    this.syncDomains(true);
  }

  syncDomains = async (first = false) => {
    const restrictedDomains = this.configService.get('domains.restrictedList');
    try {
      const data = await this.indexerService.getInscriptions({
        timestampFrom: this.startTime,
        limit: first ? 100 : 10000,
      } as GetInscriptionsDto);

      const domainsData: Domain[] = [];

      data.forEach((value) => {
        if (
          !this.domainsData.find(
            (d) => d.inscription.transactionHash === value.transactionHash,
          )
        ) {
          try {
            //@ts-ignore
            const inscriptionString = value.payload?.value;
            const [domainYear = '', url = ''] = inscriptionString.split(',');
            let [domain, year] = domainYear.split('/');

            domain = domain.replace('www.', '');

            let type;

            if (url.includes('twitter.com') || url.includes('x.com')) {
              type = 'twitter';
            }

            if (url.includes('notion.com') || url.includes('notion.site')) {
              type = 'notion';
            }

            if (url.includes('substack.com')) {
              type = 'substack';
            }

            if (domain && type && url && !restrictedDomains.includes(domain)) {
              domainsData.push({
                domain,
                type,
                url,
                year,
                gasPrice: value.gasPrice,
                inscription: value,
              });
            }
          } catch (e) {
            console.error('syncDomains', e);
          }
        }
      });

      // Access-control for 1-letter domains
      this.domainsData = domainsData.filter((item, _, arr) => {
        const { domain, inscription } = item;

        if (domain.length === 1) {
          const allRecords = arr
            .filter((item) => item.domain === domain)
            .sort((a, b) => {
              return a.inscription.blockNumber - b.inscription.blockNumber
            });
          if (allRecords.length > 0) {
            const isOwner = allRecords[0].inscription.from === inscription.from;
            return isOwner;
          }
        }
        return true;
      });
    } catch (e) {
      this.logger.error('syncDomains', e);
    }

    setTimeout(() => this.syncDomains(), 10000);
  };

  getInscriptionsByDomain = (domain: string) => {
    return this.domainsData.filter((d) => d.domain === domain);
  };

  getLatestInscriptionByDomain = (domain: string) => {
    const inscriptions = this.domainsData.filter((d) => d.domain === domain);

    inscriptions.sort((a, b) =>
      Number(a.gasPrice) > Number(b.gasPrice) ? -1 : 1,
    );

    return inscriptions[0];
  };
}
