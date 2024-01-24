import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { ConfigModule } from '@nestjs/config';
import { IndexerController } from './indexer.controller';
import { IndexerState, InscriptionEvent } from '../typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotteryService } from '../lottery/lottery.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([InscriptionEvent]),
    TypeOrmModule.forFeature([IndexerState]),
  ],
  providers: [IndexerService, LotteryService],
  exports: [IndexerService],
  controllers: [IndexerController],
})
export class IndexerModule {}
