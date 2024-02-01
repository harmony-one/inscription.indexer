import { Injectable, Logger } from '@nestjs/common';
import { GetInscriptionsDto } from '../indexer/dto/inscriptions.dto';
import { IndexerService } from '../indexer/indexer.service';
import { InscriptionEvent } from 'src/typeorm';
import { ConfigService } from '@nestjs/config';
import { URL_TYPE, getTypeByUrl } from './helpers';

export interface Domain {
  domain: string;
  path: string;
  url: string;
  type: URL_TYPE;
  blockNumber: number;
  inscription: InscriptionEvent;
  payload?: any;
}

@Injectable()
export class DomainService {
  private readonly logger = new Logger(DomainService.name);

  private domainsData: Domain[] = [];
  private startTime = 1706126400;

  constructor(
    private indexerService: IndexerService,
    private configService: ConfigService,
  ) { }

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
            const payload: any = value.payload;

            if (payload?.value) {
              const inscriptionString = payload.value;

              const [domainWithPath = '', url = ''] = inscriptionString.split(',');
              let [domain, path] = domainWithPath.split('/');

              // domain = domain.replace('www.', '');

              if (domain && url && !restrictedDomains.includes(domain)) {
                domainsData.push({
                  domain,
                  url,
                  type: getTypeByUrl(url),
                  path,
                  blockNumber: value.blockNumber,
                  inscription: value,
                });
              }
            } else if (payload?.type === 'image') {
              domainsData.push({
                url: '',
                path: '',
                type: URL_TYPE.IMAGE,  
                payload,
                domain: value.transactionHash.slice(-2),
                blockNumber: value.blockNumber,
                inscription: value,
              });
            }
          } catch (e) {
            console.error('syncDomains', e);
          }
        }
      });

      // Access-control for 1-letter domains
      this.domainsData = this.domainsData.concat(domainsData.filter((item, _, arr) => {
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
      }));
    } catch (e) {
      this.logger.error('syncDomains', e);
    }

    setTimeout(() => this.syncDomains(), 10000);
  };

  getInscriptionsByDomain = (domain: string) => {
    return this.domainsData.filter((d) => d.domain === domain);
  };

  getLatestInscriptionByDomain = (domain: string) => {
    const inscriptions = this.domainsData.filter(
      d => d.domain === domain && !d.path && (domain.includes('.') || d.type)
    );

    inscriptions.sort((a, b) =>
      Number(a.blockNumber) > Number(b.blockNumber) ? -1 : 1,
    );

    return inscriptions[0];
  };

  getLatestInscriptionByDomainPath = (domain: string, path: string) => {
    const inscriptions = this.domainsData.filter((d) => d.domain === domain && d.path === path);

    inscriptions.sort((a, b) =>
      Number(a.blockNumber) > Number(b.blockNumber) ? -1 : 1,
    );

    return inscriptions[0];
  };
}
