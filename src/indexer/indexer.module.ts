import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { ConfigModule } from '@nestjs/config';
import { IndexerController } from './indexer.controller';
import { IndexerState, InscriptionEvent } from '../typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([InscriptionEvent]),
    TypeOrmModule.forFeature([IndexerState]),
  ],
  providers: [IndexerService],
  exports: [IndexerService],
  controllers: [IndexerController],
})
export class IndexerModule {}
